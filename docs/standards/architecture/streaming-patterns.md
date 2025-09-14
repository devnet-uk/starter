# Streaming Patterns

This document defines comprehensive patterns for implementing real-time streaming functionality including WebSockets, Server-Sent Events (SSE), and AI chat streaming following Clean Architecture principles.

## Overview

Streaming patterns enable real-time communication between client and server, supporting use cases like live chat, real-time updates, collaborative editing, and AI response streaming.

## Core Streaming Patterns

### 1. WebSocket Connection Management

#### Domain Model for Connection Management
```typescript
// Connection Value Object
class ConnectionId extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value })
  }

  public static create(value?: string): ConnectionId {
    return new ConnectionId(value || crypto.randomUUID())
  }

  get value(): string {
    return this.props.value
  }
}

// Connection Entity
class Connection extends Entity<ConnectionProps> {
  private constructor(props: ConnectionProps, id?: UniqueEntityID) {
    super(props, id)
  }

  public static create(props: CreateConnectionProps): Result<Connection> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: props.userId, argumentName: 'userId' },
      { argument: props.tenantId, argumentName: 'tenantId' },
      { argument: props.connectionType, argumentName: 'connectionType' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new Connection({
      userId: props.userId,
      tenantId: props.tenantId,
      connectionType: props.connectionType,
      status: ConnectionStatus.CONNECTED,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
      metadata: props.metadata || {}
    }))
  }

  public updateHeartbeat(): void {
    this.props.lastHeartbeat = new Date()
  }

  public disconnect(): void {
    this.props.status = ConnectionStatus.DISCONNECTED
    this.props.disconnectedAt = new Date()
  }

  public isExpired(timeoutMs: number = 30000): boolean {
    const now = new Date()
    const lastHeartbeat = this.props.lastHeartbeat
    return now.getTime() - lastHeartbeat.getTime() > timeoutMs
  }

  get userId(): UserId {
    return this.props.userId
  }

  get tenantId(): TenantId {
    return this.props.tenantId
  }

  get status(): ConnectionStatus {
    return this.props.status
  }

  get connectionType(): ConnectionType {
    return this.props.connectionType
  }
}
```

#### Connection Repository Pattern
```typescript
interface IConnectionRepository {
  save(connection: Connection): Promise<void>
  findById(id: string): Promise<Connection | null>
  findByUserId(userId: UserId): Promise<Connection[]>
  findByTenant(tenantId: TenantId): Promise<Connection[]>
  findActiveConnections(): Promise<Connection[]>
  removeExpired(timeoutMs: number): Promise<void>
  delete(id: string): Promise<void>
}

// In-memory implementation for testing
class InMemoryConnectionRepository implements IConnectionRepository {
  private connections = new Map<string, Connection>()

  async save(connection: Connection): Promise<void> {
    this.connections.set(connection.id.toString(), connection)
  }

  async findByUserId(userId: UserId): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId.equals(userId) && conn.status === ConnectionStatus.CONNECTED)
  }

  async findByTenant(tenantId: TenantId): Promise<Connection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.tenantId.equals(tenantId) && conn.status === ConnectionStatus.CONNECTED)
  }

  async removeExpired(timeoutMs: number): Promise<void> {
    const expired = Array.from(this.connections.values())
      .filter(conn => conn.isExpired(timeoutMs))
    
    for (const connection of expired) {
      connection.disconnect()
      this.connections.delete(connection.id.toString())
    }
  }
}
```

### 2. Real-time Event System

#### Domain Events for Streaming
```typescript
// Base Streaming Event
abstract class StreamingEvent extends DomainEvent {
  protected constructor(
    public readonly tenantId: TenantId,
    public readonly timestamp: Date = new Date()
  ) {
    super()
  }

  abstract getEventType(): string
  abstract getTargetConnections(): ConnectionFilter
}

// Specific Events
class MessageSentEvent extends StreamingEvent {
  constructor(
    public readonly messageId: MessageId,
    public readonly conversationId: ConversationId,
    public readonly senderId: UserId,
    tenantId: TenantId
  ) {
    super(tenantId)
  }

  getEventType(): string {
    return 'message.sent'
  }

  getTargetConnections(): ConnectionFilter {
    return {
      tenantId: this.tenantId,
      conversationId: this.conversationId
    }
  }
}

class AIResponseStreamEvent extends StreamingEvent {
  constructor(
    public readonly conversationId: ConversationId,
    public readonly chunk: string,
    public readonly isComplete: boolean,
    public readonly tokenUsage?: TokenUsage,
    tenantId: TenantId
  ) {
    super(tenantId)
  }

  getEventType(): string {
    return 'ai.response.stream'
  }

  getTargetConnections(): ConnectionFilter {
    return {
      tenantId: this.tenantId,
      conversationId: this.conversationId
    }
  }
}
```

#### Event Broadcasting Service
```typescript
interface IStreamingEventBus {
  broadcast<T extends StreamingEvent>(event: T): Promise<void>
  broadcastToConnection(connectionId: ConnectionId, event: StreamingEvent): Promise<void>
  broadcastToUser(userId: UserId, tenantId: TenantId, event: StreamingEvent): Promise<void>
  broadcastToTenant(tenantId: TenantId, event: StreamingEvent): Promise<void>
}

class StreamingEventBus implements IStreamingEventBus {
  constructor(
    private connectionRepository: IConnectionRepository,
    private webSocketManager: IWebSocketManager,
    private sseManager: ISSEManager
  ) {}

  async broadcast<T extends StreamingEvent>(event: T): Promise<void> {
    const targetFilter = event.getTargetConnections()
    const connections = await this.findTargetConnections(targetFilter)

    const broadcastPromises = connections.map(connection => 
      this.sendToConnection(connection, event)
    )

    await Promise.allSettled(broadcastPromises)
  }

  async broadcastToUser(userId: UserId, tenantId: TenantId, event: StreamingEvent): Promise<void> {
    const connections = await this.connectionRepository.findByUserId(userId)
    const tenantConnections = connections.filter(conn => conn.tenantId.equals(tenantId))

    const promises = tenantConnections.map(connection => 
      this.sendToConnection(connection, event)
    )

    await Promise.allSettled(promises)
  }

  private async sendToConnection(connection: Connection, event: StreamingEvent): Promise<void> {
    try {
      switch (connection.connectionType) {
        case ConnectionType.WEBSOCKET:
          await this.webSocketManager.send(connection.id, event)
          break
        case ConnectionType.SSE:
          await this.sseManager.send(connection.id, event)
          break
      }
    } catch (error) {
      // Handle failed connection - mark as disconnected
      connection.disconnect()
      await this.connectionRepository.save(connection)
    }
  }
}
```

### 3. AI Chat Streaming Implementation

#### Chat Conversation Aggregate
```typescript
class Conversation extends TenantAwareEntity {
  private _messages: Message[]
  private _participants: UserId[]
  private _status: ConversationStatus
  private _metadata: ConversationMetadata

  public static create(props: CreateConversationProps, tenantId: TenantId): Result<Conversation> {
    const conversation = new Conversation({
      title: props.title || 'New Conversation',
      messages: [],
      participants: [props.createdBy],
      status: ConversationStatus.ACTIVE,
      metadata: {
        aiProvider: props.aiProvider || 'openai',
        model: props.model || 'gpt-4',
        systemPrompt: props.systemPrompt
      },
      createdBy: props.createdBy,
      createdAt: new Date()
    }, undefined, tenantId)

    return Result.ok(conversation)
  }

  public addMessage(content: string, senderId: UserId, messageType: MessageType = MessageType.USER): Result<Message> {
    const messageResult = Message.create({
      conversationId: this.id,
      content,
      senderId,
      type: messageType,
      tenantId: this.tenantId
    })

    if (messageResult.isFailure) {
      return Result.fail(messageResult.error)
    }

    const message = messageResult.getValue()
    this._messages.push(message)

    // Domain event
    this.addDomainEvent(new MessageAddedEvent(message, this.tenantId))

    return Result.ok(message)
  }

  public startAIResponse(aiProvider: string, model: string): Result<Message> {
    // Create placeholder for streaming AI response
    const aiMessageResult = Message.create({
      conversationId: this.id,
      content: '',
      senderId: UserId.createSystem(),
      type: MessageType.AI_ASSISTANT,
      tenantId: this.tenantId,
      metadata: {
        aiProvider,
        model,
        isStreaming: true,
        startedAt: new Date()
      }
    })

    if (aiMessageResult.isFailure) {
      return Result.fail(aiMessageResult.error)
    }

    const aiMessage = aiMessageResult.getValue()
    this._messages.push(aiMessage)

    return Result.ok(aiMessage)
  }

  public updateStreamingMessage(messageId: MessageId, chunk: string, isComplete: boolean, tokenUsage?: TokenUsage): Result<void> {
    const message = this._messages.find(m => m.id.equals(messageId))
    
    if (!message) {
      return Result.fail('Message not found')
    }

    message.appendChunk(chunk)

    if (isComplete) {
      message.completeStreaming(tokenUsage)
    }

    // Domain event for real-time update
    this.addDomainEvent(new MessageStreamUpdateEvent(
      message,
      chunk,
      isComplete,
      tokenUsage,
      this.tenantId
    ))

    return Result.ok()
  }

  get messages(): Message[] {
    return [...this._messages]
  }

  get participants(): UserId[] {
    return [...this._participants]
  }
}
```

#### AI Streaming Use Case
```typescript
class StreamAIResponseUseCase {
  constructor(
    private conversationRepository: IConversationRepository,
    private aiService: IAIService,
    private streamingEventBus: IStreamingEventBus,
    private tokenTracker: ITokenTracker
  ) {}

  async execute(command: StreamAIResponseCommand): Promise<Result<void>> {
    const conversation = await this.conversationRepository.findById(
      command.conversationId.toString(),
      command.tenantId
    )

    if (!conversation) {
      return Result.fail('Conversation not found')
    }

    // Start AI response
    const aiMessageResult = conversation.startAIResponse(
      command.aiProvider,
      command.model
    )

    if (aiMessageResult.isFailure) {
      return Result.fail(aiMessageResult.error)
    }

    const aiMessage = aiMessageResult.getValue()
    await this.conversationRepository.save(conversation)

    try {
      // Stream AI response
      const stream = await this.aiService.streamResponse({
        messages: conversation.messages.map(m => ({
          role: m.type === MessageType.USER ? 'user' : 'assistant',
          content: m.content
        })),
        model: command.model,
        temperature: command.temperature || 0.7
      })

      let fullContent = ''
      let totalTokens = 0

      for await (const chunk of stream) {
        fullContent += chunk.content
        totalTokens += chunk.tokens || 0

        // Update conversation
        conversation.updateStreamingMessage(
          aiMessage.id,
          chunk.content,
          false,
          { tokens: chunk.tokens }
        )

        // Broadcast to connected clients
        await this.streamingEventBus.broadcast(
          new AIResponseStreamEvent(
            conversation.id,
            chunk.content,
            false,
            { tokens: chunk.tokens },
            command.tenantId
          )
        )

        // Save intermediate state
        await this.conversationRepository.save(conversation)
      }

      // Complete the message
      const finalTokenUsage: TokenUsage = {
        promptTokens: totalTokens,
        completionTokens: totalTokens,
        totalTokens: totalTokens * 2
      }

      conversation.updateStreamingMessage(
        aiMessage.id,
        '',
        true,
        finalTokenUsage
      )

      // Track token usage for billing
      await this.tokenTracker.recordUsage({
        tenantId: command.tenantId,
        userId: command.userId,
        conversationId: command.conversationId,
        tokensUsed: finalTokenUsage,
        aiProvider: command.aiProvider,
        model: command.model
      })

      // Final broadcast
      await this.streamingEventBus.broadcast(
        new AIResponseStreamEvent(
          conversation.id,
          '',
          true,
          finalTokenUsage,
          command.tenantId
        )
      )

      await this.conversationRepository.save(conversation)

      return Result.ok()
    } catch (error) {
      // Handle streaming error
      conversation.updateStreamingMessage(
        aiMessage.id,
        `\n\n[Error: ${error.message}]`,
        true
      )

      await this.conversationRepository.save(conversation)
      return Result.fail(`AI streaming failed: ${error.message}`)
    }
  }
}
```

### 4. Server-Sent Events (SSE) Pattern

#### SSE Connection Management
```typescript
interface ISSEManager {
  createConnection(userId: UserId, tenantId: TenantId, response: Response): Promise<ConnectionId>
  send(connectionId: ConnectionId, event: StreamingEvent): Promise<void>
  closeConnection(connectionId: ConnectionId): Promise<void>
  sendKeepAlive(): Promise<void>
}

class SSEManager implements ISSEManager {
  private connections = new Map<string, SSEConnection>()

  async createConnection(
    userId: UserId, 
    tenantId: TenantId, 
    response: Response
  ): Promise<ConnectionId> {
    const connectionId = ConnectionId.create()
    
    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    const sseConnection: SSEConnection = {
      id: connectionId,
      userId,
      tenantId,
      response,
      lastHeartbeat: new Date()
    }

    this.connections.set(connectionId.value, sseConnection)

    // Set up cleanup on client disconnect
    response.on('close', () => {
      this.connections.delete(connectionId.value)
    })

    // Send initial connection confirmation
    this.sendSSEMessage(response, {
      type: 'connection.established',
      data: { connectionId: connectionId.value }
    })

    return connectionId
  }

  async send(connectionId: ConnectionId, event: StreamingEvent): Promise<void> {
    const connection = this.connections.get(connectionId.value)
    
    if (!connection) {
      throw new Error('Connection not found')
    }

    const sseMessage = {
      type: event.getEventType(),
      data: event,
      id: crypto.randomUUID()
    }

    this.sendSSEMessage(connection.response, sseMessage)
  }

  private sendSSEMessage(response: Response, message: any): void {
    response.write(`event: ${message.type}\n`)
    response.write(`data: ${JSON.stringify(message.data)}\n`)
    if (message.id) {
      response.write(`id: ${message.id}\n`)
    }
    response.write('\n')
  }

  async sendKeepAlive(): Promise<void> {
    const keepAliveMessage = {
      type: 'ping',
      data: { timestamp: new Date().toISOString() }
    }

    for (const connection of this.connections.values()) {
      try {
        this.sendSSEMessage(connection.response, keepAliveMessage)
        connection.lastHeartbeat = new Date()
      } catch (error) {
        // Remove dead connection
        this.connections.delete(connection.id.value)
      }
    }
  }
}
```

### 5. WebSocket Pattern with Hono

#### WebSocket Handler
```typescript
// Hono WebSocket route
app.get('/ws', async (c) => {
  const upgrade = c.req.header('upgrade')
  
  if (upgrade !== 'websocket') {
    return c.text('Expected websocket upgrade', 400)
  }

  // Extract authentication and tenant info
  const token = c.req.header('authorization')?.replace('Bearer ', '')
  if (!token) {
    return c.text('Authentication required', 401)
  }

  const authResult = await validateToken(token)
  if (!authResult.isValid) {
    return c.text('Invalid token', 403)
  }

  const { userId, tenantId } = authResult

  // Upgrade to WebSocket
  const { response, socket } = Deno.upgradeWebSocket(c.req.raw)

  socket.onopen = async () => {
    const connectionId = await webSocketManager.createConnection(
      UserId.create(userId),
      TenantId.create(tenantId),
      socket
    )
    
    console.log(`WebSocket connection established: ${connectionId.value}`)
  }

  socket.onmessage = async (event) => {
    await webSocketManager.handleMessage(socket, event.data)
  }

  socket.onclose = () => {
    webSocketManager.removeConnection(socket)
  }

  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
    webSocketManager.removeConnection(socket)
  }

  return response
})

// WebSocket Manager Implementation
class WebSocketManager implements IWebSocketManager {
  private connections = new Map<string, WSConnection>()

  async createConnection(
    userId: UserId,
    tenantId: TenantId,
    socket: WebSocket
  ): Promise<ConnectionId> {
    const connectionId = ConnectionId.create()
    
    const wsConnection: WSConnection = {
      id: connectionId,
      userId,
      tenantId,
      socket,
      lastHeartbeat: new Date()
    }

    this.connections.set(connectionId.value, wsConnection)

    // Send connection confirmation
    this.send(connectionId, {
      type: 'connection.established',
      connectionId: connectionId.value
    })

    return connectionId
  }

  async send(connectionId: ConnectionId, event: any): Promise<void> {
    const connection = this.connections.get(connectionId.value)
    
    if (!connection) {
      throw new Error('Connection not found')
    }

    if (connection.socket.readyState === WebSocket.OPEN) {
      connection.socket.send(JSON.stringify(event))
      connection.lastHeartbeat = new Date()
    } else {
      this.connections.delete(connectionId.value)
    }
  }

  async handleMessage(socket: WebSocket, data: string): Promise<void> {
    try {
      const message = JSON.parse(data)
      
      switch (message.type) {
        case 'ping':
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          break
        case 'message.send':
          await this.handleChatMessage(socket, message)
          break
        // Handle other message types
      }
    } catch (error) {
      socket.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }))
    }
  }
}
```

## Verification Standards

<verification-block context-check="streaming-patterns-verification">
  <verification_definitions>
    <test name="connection_management">
      TEST: grep -r "Connection.*Entity\|IConnectionRepository" packages/core/src/domain/ | head -3
      REQUIRED: true
      ERROR: "Connection management must be implemented with proper domain entities and repositories."
      DESCRIPTION: "Ensures domain-driven connection modeling with repositories for lifecycle management."
    </test>
    <test name="streaming_events">
      TEST: grep -r "StreamingEvent\|DomainEvent.*Stream" packages/core/src/domain/events/ | head -3
      REQUIRED: true
      ERROR: "Streaming events must extend DomainEvent for proper event handling."
      DESCRIPTION: "Requires event-sourced streaming via domain events for consistency and auditability."
    </test>
    <test name="websocket_integration">
      TEST: grep -r "WebSocket\|ws.*upgrade" packages/api/src/ | head -3
      REQUIRED: true
      ERROR: "WebSocket integration must be implemented in the API layer."
      DESCRIPTION: "Validates WebSocket integration at the API boundary, not in domain/use-cases."
    </test>
    <test name="sse_implementation">
      TEST: grep -r "Server.*Sent.*Events\|text/event-stream" packages/api/src/ | head -3
      REQUIRED: false
      ERROR: "Consider implementing Server-Sent Events for one-way streaming."
      DESCRIPTION: "Suggests SSE for simpler one-way streaming scenarios when appropriate."
    </test>
    <test name="ai_streaming">
      TEST: grep -r "AI.*Stream\|streamResponse\|StreamAI" packages/core/src/use-cases/ | head -3
      REQUIRED: true
      ERROR: "AI streaming use cases must be implemented for chat functionality."
      DESCRIPTION: "Confirms presence of AI streaming use cases to support real-time chat."
    </test>
    <test name="token_tracking">
      TEST: grep -r "TokenUsage\|ITokenTracker" packages/core/src/ | head -3
      REQUIRED: true
      ERROR: "Token usage tracking must be implemented for AI streaming billing."
      DESCRIPTION: "Enforces token usage tracking for billing/observability during streaming."
    </test>
    <test name="real_time_auth">
      TEST: grep -r "websocket.*auth\|sse.*auth\|streaming.*auth" packages/api/src/ | head -3
      REQUIRED: true
      ERROR: "Real-time connections must implement proper authentication."
      DESCRIPTION: "Ensures real-time transport endpoints enforce authentication."
    </test>
    <test name="connection_cleanup">
      TEST: grep -r "removeExpired\|cleanup.*connection\|heartbeat" packages/infrastructure/src/ | head -3
      REQUIRED: true
      ERROR: "Connection cleanup mechanisms must be implemented to prevent memory leaks."
      DESCRIPTION: "Checks for cleanup/heartbeat mechanisms to maintain healthy connection pools."
    </test>
  </verification_definitions>
</verification-block>

## Implementation Guidelines

### 1. Connection Management
- Implement proper connection lifecycle management
- Use heartbeat/ping-pong for connection health checks
- Clean up expired connections automatically
- Track connection metadata for debugging

### 2. Event Broadcasting
- Use domain events for real-time updates
- Implement proper event filtering and targeting
- Handle connection failures gracefully
- Support both WebSocket and SSE protocols

### 3. AI Chat Streaming
- Stream responses in real-time for better UX
- Track token usage for billing purposes
- Handle streaming errors gracefully
- Implement proper conversation state management

### 4. Security Considerations
- Authenticate all streaming connections
- Implement proper tenant isolation
- Validate message content and structure
- Rate limit streaming operations

### 5. Performance Optimization
- Use connection pooling where appropriate
- Implement message queuing for reliability
- Monitor connection counts and performance
- Use horizontal scaling for high-traffic scenarios

### 6. Error Handling
- Implement graceful degradation strategies
- Handle network interruptions properly
- Provide clear error messages to clients
- Log streaming errors for monitoring

This streaming patterns standard ensures scalable, secure real-time communication while maintaining Clean Architecture principles.
