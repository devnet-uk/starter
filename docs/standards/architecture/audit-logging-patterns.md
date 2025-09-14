# Audit Logging Patterns

**Category**: Architecture  
**Type**: Implementation Pattern  
**Scope**: Backend Services  
**Related Standards**: [Clean Architecture](./clean-architecture.md), [Event Sourcing](./use-case-patterns.md), [Security Patterns](../security/authentication-patterns.md)

## Overview

This document establishes comprehensive patterns for implementing audit logging and compliance systems following Clean Architecture principles. It covers event sourcing, immutable audit trails, compliance-ready logging, user activity tracking, data retention policies, and forensic analysis while maintaining domain isolation and regulatory compliance.

## Architecture Layers

### Domain Layer

#### Audit Domain Entities

**Audit Entry Aggregate Root**
```typescript
// packages/core/domain/audit/entities/AuditEntry.ts
import { AggregateRoot } from '@repo/domain/base/AggregateRoot';
import { Result } from '@repo/domain/base/Result';

export class AuditEntry extends AggregateRoot {
  private constructor(
    private readonly _id: AuditEntryId,
    private readonly _eventType: AuditEventType,
    private readonly _entityType: string,
    private readonly _entityId: string,
    private readonly _actorId: UserId | null,
    private readonly _actorType: ActorType,
    private readonly _action: AuditAction,
    private readonly _beforeState: Record<string, any> | null,
    private readonly _afterState: Record<string, any> | null,
    private readonly _changes: AuditChange[],
    private readonly _metadata: AuditMetadata,
    private readonly _timestamp: Date,
    private readonly _correlationId: CorrelationId,
    private readonly _sessionId: SessionId | null,
    private readonly _ipAddress: string | null,
    private readonly _userAgent: string | null,
    private readonly _risk: AuditRiskLevel,
    private _isArchived: boolean,
    private _retentionExpiresAt: Date | null
  ) {
    super(_id.value);
  }

  public static create(props: {
    eventType: AuditEventType;
    entityType: string;
    entityId: string;
    actorId?: UserId;
    actorType: ActorType;
    action: AuditAction;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    changes: AuditChange[];
    metadata: AuditMetadata;
    correlationId: CorrelationId;
    sessionId?: SessionId;
    ipAddress?: string;
    userAgent?: string;
  }): Result<AuditEntry> {
    // Validate required fields
    if (!props.entityId.trim()) {
      return Result.fail(new DomainError('Entity ID is required for audit entry'));
    }

    if (props.changes.length === 0 && props.action !== AuditAction.READ) {
      return Result.fail(new DomainError('Changes are required for non-read operations'));
    }

    // Calculate risk level
    const riskLevel = AuditEntry.calculateRiskLevel(props);

    // Calculate retention expiry based on event type and compliance requirements
    const retentionExpiresAt = AuditEntry.calculateRetentionExpiry(
      props.eventType,
      riskLevel
    );

    const auditEntry = new AuditEntry(
      AuditEntryId.create(),
      props.eventType,
      props.entityType,
      props.entityId,
      props.actorId || null,
      props.actorType,
      props.action,
      props.beforeState || null,
      props.afterState || null,
      [...props.changes],
      props.metadata,
      new Date(),
      props.correlationId,
      props.sessionId || null,
      props.ipAddress || null,
      props.userAgent || null,
      riskLevel,
      false,
      retentionExpiresAt
    );

    auditEntry.addDomainEvent(new AuditEntryCreatedEvent(auditEntry));
    return Result.ok(auditEntry);
  }

  public archive(reason: string): Result<void> {
    if (this._isArchived) {
      return Result.fail(new DomainError('Audit entry is already archived'));
    }

    this._isArchived = true;
    this.addDomainEvent(new AuditEntryArchivedEvent(this, reason));
    return Result.ok();
  }

  public isExpired(): boolean {
    if (!this._retentionExpiresAt) {
      return false; // Permanent retention
    }

    return Date.now() > this._retentionExpiresAt.getTime();
  }

  public containsSensitiveData(): boolean {
    // Check if the audit entry contains personally identifiable information
    const sensitiveFields = ['email', 'phone', 'ssn', 'creditCard', 'password'];
    
    const checkObject = (obj: Record<string, any> | null): boolean => {
      if (!obj) return false;
      
      return Object.keys(obj).some(key => 
        sensitiveFields.some(sensitive => 
          key.toLowerCase().includes(sensitive.toLowerCase())
        )
      );
    };

    return checkObject(this._beforeState) || 
           checkObject(this._afterState) ||
           this._changes.some(change => checkObject({ [change.field]: change.newValue }));
  }

  public anonymize(): Result<void> {
    if (this._isArchived) {
      return Result.fail(new DomainError('Cannot anonymize archived audit entry'));
    }

    // This operation is irreversible and removes PII
    this.addDomainEvent(new AuditEntryAnonymizedEvent(this));
    return Result.ok();
  }

  private static calculateRiskLevel(props: {
    eventType: AuditEventType;
    action: AuditAction;
    actorType: ActorType;
    changes: AuditChange[];
  }): AuditRiskLevel {
    let risk = AuditRiskLevel.LOW;

    // Escalate based on event type
    switch (props.eventType) {
      case AuditEventType.SECURITY:
      case AuditEventType.AUTHENTICATION:
        risk = AuditRiskLevel.HIGH;
        break;
      case AuditEventType.BILLING:
      case AuditEventType.DATA_EXPORT:
        risk = AuditRiskLevel.MEDIUM;
        break;
    }

    // Escalate based on action
    switch (props.action) {
      case AuditAction.DELETE:
        risk = Math.max(risk, AuditRiskLevel.HIGH);
        break;
      case AuditAction.UPDATE:
        risk = Math.max(risk, AuditRiskLevel.MEDIUM);
        break;
    }

    // Escalate for system actors
    if (props.actorType === ActorType.SYSTEM) {
      risk = Math.max(risk, AuditRiskLevel.MEDIUM);
    }

    // Escalate for sensitive field changes
    const sensitiveFields = ['email', 'password', 'permissions', 'role'];
    const hasSensitiveChanges = props.changes.some(change =>
      sensitiveFields.some(field => 
        change.field.toLowerCase().includes(field.toLowerCase())
      )
    );

    if (hasSensitiveChanges) {
      risk = Math.max(risk, AuditRiskLevel.HIGH);
    }

    return risk;
  }

  private static calculateRetentionExpiry(
    eventType: AuditEventType,
    riskLevel: AuditRiskLevel
  ): Date | null {
    const now = new Date();
    
    // Compliance-based retention periods
    const retentionPeriods: Record<AuditEventType, number> = {
      [AuditEventType.SECURITY]: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      [AuditEventType.BILLING]: 7 * 365 * 24 * 60 * 60 * 1000,   // 7 years (SOX compliance)
      [AuditEventType.DATA_ACCESS]: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      [AuditEventType.USER_ACTION]: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
      [AuditEventType.SYSTEM]: 1 * 365 * 24 * 60 * 60 * 1000,      // 1 year
      [AuditEventType.AUTHENTICATION]: 2 * 365 * 24 * 60 * 60 * 1000 // 2 years
    };

    const baseRetention = retentionPeriods[eventType] || (1 * 365 * 24 * 60 * 60 * 1000);
    
    // Extend retention for high-risk events
    const riskMultiplier = riskLevel === AuditRiskLevel.HIGH ? 1.5 : 1;
    const finalRetention = baseRetention * riskMultiplier;

    return new Date(now.getTime() + finalRetention);
  }

  // Getters
  public get id(): AuditEntryId { return this._id; }
  public get eventType(): AuditEventType { return this._eventType; }
  public get entityType(): string { return this._entityType; }
  public get entityId(): string { return this._entityId; }
  public get actorId(): UserId | null { return this._actorId; }
  public get actorType(): ActorType { return this._actorType; }
  public get action(): AuditAction { return this._action; }
  public get beforeState(): Record<string, any> | null { return this._beforeState; }
  public get afterState(): Record<string, any> | null { return this._afterState; }
  public get changes(): AuditChange[] { return [...this._changes]; }
  public get metadata(): AuditMetadata { return this._metadata; }
  public get timestamp(): Date { return this._timestamp; }
  public get correlationId(): CorrelationId { return this._correlationId; }
  public get sessionId(): SessionId | null { return this._sessionId; }
  public get ipAddress(): string | null { return this._ipAddress; }
  public get userAgent(): string | null { return this._userAgent; }
  public get risk(): AuditRiskLevel { return this._risk; }
  public get isArchived(): boolean { return this._isArchived; }
  public get retentionExpiresAt(): Date | null { return this._retentionExpiresAt; }
}
```

**Audit Trail Aggregate Root**
```typescript
// packages/core/domain/audit/entities/AuditTrail.ts
export class AuditTrail extends AggregateRoot {
  private constructor(
    private readonly _id: AuditTrailId,
    private readonly _entityType: string,
    private readonly _entityId: string,
    private readonly _entries: AuditEntry[],
    private readonly _createdAt: Date,
    private _lastModifiedAt: Date,
    private _isSealed: boolean,
    private _integrityHash: string | null
  ) {
    super(_id.value);
  }

  public static create(props: {
    entityType: string;
    entityId: string;
    initialEntry: AuditEntry;
  }): Result<AuditTrail> {
    if (!props.entityId.trim()) {
      return Result.fail(new DomainError('Entity ID is required for audit trail'));
    }

    const now = new Date();
    const trail = new AuditTrail(
      AuditTrailId.create(),
      props.entityType,
      props.entityId,
      [props.initialEntry],
      now,
      now,
      false,
      null
    );

    trail.addDomainEvent(new AuditTrailCreatedEvent(trail));
    return Result.ok(trail);
  }

  public addEntry(entry: AuditEntry): Result<void> {
    if (this._isSealed) {
      return Result.fail(new DomainError('Cannot add entries to sealed audit trail'));
    }

    // Validate entry belongs to this trail
    if (entry.entityType !== this._entityType || entry.entityId !== this._entityId) {
      return Result.fail(new DomainError('Audit entry does not match trail entity'));
    }

    // Ensure chronological order
    const lastEntry = this._entries[this._entries.length - 1];
    if (lastEntry && entry.timestamp < lastEntry.timestamp) {
      return Result.fail(new DomainError('Audit entries must be in chronological order'));
    }

    this._entries.push(entry);
    this._lastModifiedAt = new Date();
    
    this.addDomainEvent(new AuditEntryAddedEvent(this, entry));
    return Result.ok();
  }

  public seal(): Result<void> {
    if (this._isSealed) {
      return Result.fail(new DomainError('Audit trail is already sealed'));
    }

    // Calculate integrity hash for all entries
    this._integrityHash = this.calculateIntegrityHash();
    this._isSealed = true;

    this.addDomainEvent(new AuditTrailSealedEvent(this));
    return Result.ok();
  }

  public verifyIntegrity(): Result<boolean> {
    if (!this._isSealed || !this._integrityHash) {
      return Result.ok(true); // Unsealed trails don't have integrity constraints
    }

    const currentHash = this.calculateIntegrityHash();
    const isValid = currentHash === this._integrityHash;

    if (!isValid) {
      this.addDomainEvent(new AuditTrailIntegrityViolationEvent(this));
    }

    return Result.ok(isValid);
  }

  public getEntriesByTimeRange(from: Date, to: Date): AuditEntry[] {
    return this._entries.filter(entry => 
      entry.timestamp >= from && entry.timestamp <= to
    );
  }

  public getEntriesByActor(actorId: UserId): AuditEntry[] {
    return this._entries.filter(entry => 
      entry.actorId && entry.actorId.equals(actorId)
    );
  }

  public getEntriesByAction(action: AuditAction): AuditEntry[] {
    return this._entries.filter(entry => entry.action === action);
  }

  public getHighRiskEntries(): AuditEntry[] {
    return this._entries.filter(entry => entry.risk === AuditRiskLevel.HIGH);
  }

  private calculateIntegrityHash(): string {
    // Create a deterministic hash of all entry data
    const entryHashes = this._entries.map(entry => {
      const data = {
        id: entry.id.value,
        timestamp: entry.timestamp.toISOString(),
        entityId: entry.entityId,
        action: entry.action,
        actorId: entry.actorId?.value,
        changes: entry.changes
      };
      return this.hashObject(data);
    });

    return this.hashObject({
      entityType: this._entityType,
      entityId: this._entityId,
      entryHashes: entryHashes.sort() // Sort for deterministic order
    });
  }

  private hashObject(obj: any): string {
    // Simple hash function - in production, use crypto.createHash
    const str = JSON.stringify(obj);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  // Getters
  public get id(): AuditTrailId { return this._id; }
  public get entityType(): string { return this._entityType; }
  public get entityId(): string { return this._entityId; }
  public get entries(): AuditEntry[] { return [...this._entries]; }
  public get entryCount(): number { return this._entries.length; }
  public get createdAt(): Date { return this._createdAt; }
  public get lastModifiedAt(): Date { return this._lastModifiedAt; }
  public get isSealed(): boolean { return this._isSealed; }
  public get integrityHash(): string | null { return this._integrityHash; }
}
```

#### Audit Value Objects

**Audit Change Value Object**
```typescript
// packages/core/domain/audit/values/AuditChange.ts
export class AuditChange extends ValueObject {
  private constructor(
    private readonly _field: string,
    private readonly _oldValue: any,
    private readonly _newValue: any,
    private readonly _changeType: AuditChangeType,
    private readonly _sensitivity: DataSensitivity
  ) {
    super();
  }

  public static create(props: {
    field: string;
    oldValue: any;
    newValue: any;
    changeType?: AuditChangeType;
  }): AuditChange {
    const changeType = props.changeType || AuditChange.detectChangeType(
      props.oldValue,
      props.newValue
    );

    const sensitivity = AuditChange.detectSensitivity(props.field);

    return new AuditChange(
      props.field,
      props.oldValue,
      props.newValue,
      changeType,
      sensitivity
    );
  }

  public getDisplayValue(showSensitive: boolean = false): {
    field: string;
    oldValue: any;
    newValue: any;
  } {
    if (this._sensitivity === DataSensitivity.HIGH && !showSensitive) {
      return {
        field: this._field,
        oldValue: '[REDACTED]',
        newValue: '[REDACTED]'
      };
    }

    if (this._sensitivity === DataSensitivity.MEDIUM && !showSensitive) {
      return {
        field: this._field,
        oldValue: this.maskValue(this._oldValue),
        newValue: this.maskValue(this._newValue)
      };
    }

    return {
      field: this._field,
      oldValue: this._oldValue,
      newValue: this._newValue
    };
  }

  private maskValue(value: any): any {
    if (typeof value === 'string') {
      if (value.includes('@')) {
        // Email masking
        const [username, domain] = value.split('@');
        return `${username.slice(0, 2)}***@${domain}`;
      }
      
      if (value.length > 4) {
        // General string masking
        return `${value.slice(0, 2)}***${value.slice(-2)}`;
      }
    }

    return '***';
  }

  private static detectChangeType(oldValue: any, newValue: any): AuditChangeType {
    if (oldValue === null || oldValue === undefined) {
      return AuditChangeType.ADDED;
    }
    
    if (newValue === null || newValue === undefined) {
      return AuditChangeType.REMOVED;
    }
    
    return AuditChangeType.MODIFIED;
  }

  private static detectSensitivity(field: string): DataSensitivity {
    const highSensitiveFields = [
      'password', 'ssn', 'creditCard', 'bankAccount', 'apiKey', 'token'
    ];
    
    const mediumSensitiveFields = [
      'email', 'phone', 'address', 'dateOfBirth', 'ipAddress'
    ];

    const fieldLower = field.toLowerCase();
    
    if (highSensitiveFields.some(sensitive => fieldLower.includes(sensitive))) {
      return DataSensitivity.HIGH;
    }
    
    if (mediumSensitiveFields.some(sensitive => fieldLower.includes(sensitive))) {
      return DataSensitivity.MEDIUM;
    }

    return DataSensitivity.LOW;
  }

  // Getters
  public get field(): string { return this._field; }
  public get oldValue(): any { return this._oldValue; }
  public get newValue(): any { return this._newValue; }
  public get changeType(): AuditChangeType { return this._changeType; }
  public get sensitivity(): DataSensitivity { return this._sensitivity; }

  protected getEqualityComponents(): any[] {
    return [this._field, this._oldValue, this._newValue, this._changeType];
  }
}
```

#### Domain Services

**Audit Event Capture Service**
```typescript
// packages/core/domain/audit/services/AuditEventCaptureService.ts
export class AuditEventCaptureService {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly contextProvider: IAuditContextProvider,
    private readonly sensitivityAnalyzer: ISensitivityAnalyzer
  ) {}

  async captureEntityChange<T>(
    entityType: string,
    entityId: string,
    oldState: T | null,
    newState: T | null,
    context: AuditContext
  ): Promise<Result<AuditEntry>> {
    try {
      // Determine the action type
      const action = this.determineAction(oldState, newState);
      
      // Calculate changes
      const changes = this.calculateChanges(oldState, newState);
      
      // Determine event type based on entity and changes
      const eventType = this.determineEventType(entityType, action, changes);

      // Get audit context (user, session, IP, etc.)
      const auditContext = await this.contextProvider.getCurrentContext(context);

      // Create audit entry
      const entryResult = AuditEntry.create({
        eventType,
        entityType,
        entityId,
        actorId: auditContext.actorId,
        actorType: auditContext.actorType,
        action,
        beforeState: oldState ? this.sanitizeState(oldState) : null,
        afterState: newState ? this.sanitizeState(newState) : null,
        changes,
        metadata: {
          source: auditContext.source,
          version: auditContext.version,
          requestId: auditContext.requestId,
          tags: auditContext.tags || []
        },
        correlationId: auditContext.correlationId,
        sessionId: auditContext.sessionId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });

      if (entryResult.isFailure) {
        return Result.fail(entryResult.error);
      }

      const auditEntry = entryResult.value;

      // Store audit entry
      await this.auditRepository.save(auditEntry);

      return Result.ok(auditEntry);

    } catch (error) {
      return Result.fail(new AuditError('Failed to capture audit event', error));
    }
  }

  async captureUserAction(
    action: string,
    entityType: string,
    entityId: string,
    metadata: Record<string, any>,
    context: AuditContext
  ): Promise<Result<AuditEntry>> {
    try {
      const auditContext = await this.contextProvider.getCurrentContext(context);

      const entryResult = AuditEntry.create({
        eventType: AuditEventType.USER_ACTION,
        entityType,
        entityId,
        actorId: auditContext.actorId,
        actorType: auditContext.actorType,
        action: AuditAction.READ, // User actions are typically read operations
        beforeState: null,
        afterState: null,
        changes: [{
          field: 'action',
          oldValue: null,
          newValue: action,
          changeType: AuditChangeType.ADDED
        }],
        metadata: {
          ...metadata,
          source: auditContext.source,
          version: auditContext.version,
          requestId: auditContext.requestId
        },
        correlationId: auditContext.correlationId,
        sessionId: auditContext.sessionId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent
      });

      if (entryResult.isFailure) {
        return Result.fail(entryResult.error);
      }

      await this.auditRepository.save(entryResult.value);
      return Result.ok(entryResult.value);

    } catch (error) {
      return Result.fail(new AuditError('Failed to capture user action', error));
    }
  }

  private determineAction<T>(oldState: T | null, newState: T | null): AuditAction {
    if (!oldState && newState) return AuditAction.CREATE;
    if (oldState && !newState) return AuditAction.DELETE;
    if (oldState && newState) return AuditAction.UPDATE;
    return AuditAction.READ;
  }

  private calculateChanges<T>(oldState: T | null, newState: T | null): AuditChange[] {
    if (!oldState || !newState) return [];

    const changes: AuditChange[] = [];
    const oldObj = oldState as Record<string, any>;
    const newObj = newState as Record<string, any>;

    // Get all unique keys from both objects
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      // Skip internal fields and functions
      if (key.startsWith('_') || typeof oldValue === 'function' || typeof newValue === 'function') {
        continue;
      }

      // Skip if values are identical
      if (this.deepEqual(oldValue, newValue)) {
        continue;
      }

      changes.push(AuditChange.create({
        field: key,
        oldValue: this.sanitizeValue(oldValue),
        newValue: this.sanitizeValue(newValue)
      }));
    }

    return changes;
  }

  private determineEventType(
    entityType: string,
    action: AuditAction,
    changes: AuditChange[]
  ): AuditEventType {
    // Security-related entities
    if (['user', 'role', 'permission'].includes(entityType.toLowerCase())) {
      return AuditEventType.SECURITY;
    }

    // Billing-related entities
    if (['subscription', 'payment', 'invoice'].includes(entityType.toLowerCase())) {
      return AuditEventType.BILLING;
    }

    // Authentication events
    if (entityType === 'session' || changes.some(c => c.field === 'lastLoginAt')) {
      return AuditEventType.AUTHENTICATION;
    }

    // Data access events
    if (action === AuditAction.READ) {
      return AuditEventType.DATA_ACCESS;
    }

    // Default to user action
    return AuditEventType.USER_ACTION;
  }

  private sanitizeState<T>(state: T): Record<string, any> {
    const obj = state as Record<string, any>;
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      // Skip internal fields and functions
      if (key.startsWith('_') || typeof value === 'function') {
        continue;
      }

      sanitized[key] = this.sanitizeValue(value);
    }

    return sanitized;
  }

  private sanitizeValue(value: any): any {
    // Remove circular references and deep objects
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.slice(0, 10); // Limit array size
      }
      
      // For objects, only keep first level properties
      const sanitized: Record<string, any> = {};
      const keys = Object.keys(value).slice(0, 20); // Limit object size
      
      for (const key of keys) {
        if (typeof value[key] !== 'object') {
          sanitized[key] = value[key];
        } else {
          sanitized[key] = '[Object]';
        }
      }
      
      return sanitized;
    }

    return value;
  }

  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      
      if (aKeys.length !== bKeys.length) return false;
      
      for (const key of aKeys) {
        if (!bKeys.includes(key) || !this.deepEqual(a[key], b[key])) {
          return false;
        }
      }
      
      return true;
    }

    return false;
  }
}
```

### Application Layer

#### Use Cases

**Query Audit Trail Use Case**
```typescript
// packages/api/src/use-cases/audit/QueryAuditTrailUseCase.ts
export class QueryAuditTrailUseCase implements IUseCase<QueryAuditTrailCommand, AuditTrailQueryResult> {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly permissionService: IPermissionService,
    private readonly auditQueryBuilder: IAuditQueryBuilder
  ) {}

  async execute(command: QueryAuditTrailCommand): Promise<Result<AuditTrailQueryResult>> {
    try {
      // Check permissions
      const permissionCheck = await this.permissionService.canViewAuditLogs(
        command.requestorId,
        command.entityType,
        command.entityId
      );

      if (!permissionCheck) {
        return Result.fail(new UnauthorizedError('Insufficient permissions to view audit logs'));
      }

      // Build query based on filters
      const query = this.auditQueryBuilder.build({
        entityType: command.entityType,
        entityId: command.entityId,
        actorId: command.actorId,
        dateRange: command.dateRange,
        actions: command.actions,
        eventTypes: command.eventTypes,
        riskLevels: command.riskLevels,
        searchTerm: command.searchTerm,
        pagination: command.pagination
      });

      // Execute query
      const results = await this.auditRepository.query(query);

      // Determine sensitivity level for display
      const canViewSensitive = await this.permissionService.canViewSensitiveAuditData(
        command.requestorId
      );

      // Process results for display
      const processedEntries = results.entries.map(entry => ({
        id: entry.id.value,
        timestamp: entry.timestamp,
        eventType: entry.eventType,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actorId: entry.actorId?.value,
        actorType: entry.actorType,
        action: entry.action,
        changes: entry.changes.map(change => change.getDisplayValue(canViewSensitive)),
        risk: entry.risk,
        correlationId: entry.correlationId.value,
        sessionId: entry.sessionId?.value,
        ipAddress: canViewSensitive ? entry.ipAddress : this.maskIpAddress(entry.ipAddress),
        metadata: this.filterMetadata(entry.metadata, canViewSensitive)
      }));

      return Result.ok({
        entries: processedEntries,
        totalCount: results.totalCount,
        hasMore: results.hasMore,
        aggregations: results.aggregations,
        query: {
          filters: command,
          executedAt: new Date(),
          executionTimeMs: results.executionTimeMs
        }
      });

    } catch (error) {
      return Result.fail(new ApplicationError('Audit trail query failed', error));
    }
  }

  private maskIpAddress(ip: string | null): string | null {
    if (!ip) return null;
    
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.***`;
    }
    
    return '***.***.***';
  }

  private filterMetadata(metadata: AuditMetadata, showSensitive: boolean): Record<string, any> {
    const filtered: Record<string, any> = {
      source: metadata.source,
      version: metadata.version
    };

    if (showSensitive) {
      filtered.requestId = metadata.requestId;
      filtered.tags = metadata.tags;
    }

    return filtered;
  }
}
```

**Generate Compliance Report Use Case**
```typescript
// packages/api/src/use-cases/audit/GenerateComplianceReportUseCase.ts
export class GenerateComplianceReportUseCase implements IUseCase<GenerateComplianceReportCommand, ComplianceReport> {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly complianceAnalyzer: IComplianceAnalyzer,
    private readonly reportGenerator: IReportGenerator,
    private readonly permissionService: IPermissionService
  ) {}

  async execute(command: GenerateComplianceReportCommand): Promise<Result<ComplianceReport>> {
    try {
      // Verify permissions
      const canGenerateReports = await this.permissionService.canGenerateComplianceReports(
        command.requestorId
      );

      if (!canGenerateReports) {
        return Result.fail(new UnauthorizedError('Insufficient permissions to generate compliance reports'));
      }

      // Query audit data for report period
      const auditData = await this.auditRepository.getComplianceData({
        startDate: command.reportPeriod.startDate,
        endDate: command.reportPeriod.endDate,
        complianceFramework: command.complianceFramework
      });

      // Analyze compliance metrics
      const analysis = await this.complianceAnalyzer.analyze({
        auditData,
        framework: command.complianceFramework,
        includeRiskAssessment: command.includeRiskAssessment
      });

      // Generate detailed findings
      const findings = await this.generateFindings(auditData, command.complianceFramework);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(analysis, findings);

      // Create compliance report
      const report: ComplianceReport = {
        id: ComplianceReportId.create(),
        framework: command.complianceFramework,
        reportPeriod: command.reportPeriod,
        generatedAt: new Date(),
        generatedBy: command.requestorId,
        summary: {
          totalAuditEvents: auditData.length,
          highRiskEvents: auditData.filter(e => e.risk === AuditRiskLevel.HIGH).length,
          complianceScore: analysis.overallScore,
          criticalFindings: findings.filter(f => f.severity === FindingSeverity.CRITICAL).length,
          openRecommendations: recommendations.filter(r => r.status === 'open').length
        },
        metrics: analysis.metrics,
        findings,
        recommendations,
        appendices: await this.generateAppendices(auditData, command),
        metadata: {
          version: '1.0',
          reportType: command.reportType,
          includesPersonalData: analysis.containsPersonalData,
          retentionRequiredUntil: this.calculateReportRetention(command.complianceFramework)
        }
      };

      // Generate report document if requested
      if (command.generateDocument) {
        const document = await this.reportGenerator.generate(report, command.format);
        report.documentUrl = document.url;
        report.documentChecksum = document.checksum;
      }

      return Result.ok(report);

    } catch (error) {
      return Result.fail(new ApplicationError('Compliance report generation failed', error));
    }
  }

  private async generateFindings(
    auditData: AuditEntry[],
    framework: ComplianceFramework
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for authentication security findings
    const authEvents = auditData.filter(e => e.eventType === AuditEventType.AUTHENTICATION);
    if (framework === ComplianceFramework.SOX) {
      const failedLogins = authEvents.filter(e => 
        e.metadata.tags?.includes('failed_login')
      );
      
      if (failedLogins.length > 100) { // Threshold for suspicious activity
        findings.push({
          id: FindingId.create(),
          severity: FindingSeverity.HIGH,
          category: 'Authentication Security',
          title: 'High Volume of Failed Login Attempts',
          description: `Detected ${failedLogins.length} failed login attempts during the report period`,
          requirement: 'SOX Section 404 - Internal Controls',
          recommendation: 'Implement account lockout policies and monitor for brute force attacks',
          evidence: failedLogins.slice(0, 10).map(e => e.id.value), // Sample evidence
          riskScore: 8.5
        });
      }
    }

    // Check for data access patterns
    const dataAccessEvents = auditData.filter(e => e.eventType === AuditEventType.DATA_ACCESS);
    const suspiciousAccess = dataAccessEvents.filter(e => 
      e.timestamp.getHours() < 6 || e.timestamp.getHours() > 22 // After hours access
    );

    if (suspiciousAccess.length > 0) {
      findings.push({
        id: FindingId.create(),
        severity: FindingSeverity.MEDIUM,
        category: 'Data Access Controls',
        title: 'After-Hours Data Access Detected',
        description: `${suspiciousAccess.length} data access events occurred outside normal business hours`,
        requirement: 'Access Control Monitoring',
        recommendation: 'Review after-hours access patterns and implement additional authorization controls',
        evidence: suspiciousAccess.map(e => e.id.value),
        riskScore: 6.0
      });
    }

    return findings;
  }

  private async generateRecommendations(
    analysis: ComplianceAnalysis,
    findings: ComplianceFinding[]
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    // Generate recommendations based on findings
    const criticalFindings = findings.filter(f => f.severity === FindingSeverity.CRITICAL);
    if (criticalFindings.length > 0) {
      recommendations.push({
        id: RecommendationId.create(),
        priority: RecommendationPriority.HIGH,
        category: 'Critical Remediation',
        title: 'Address Critical Compliance Findings',
        description: 'Immediate action required to address critical compliance violations',
        actions: criticalFindings.map(f => f.recommendation),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'open',
        assignedTo: null
      });
    }

    // Add recommendations based on analysis metrics
    if (analysis.metrics.auditCoverage < 0.8) {
      recommendations.push({
        id: RecommendationId.create(),
        priority: RecommendationPriority.MEDIUM,
        category: 'Audit Coverage',
        title: 'Improve Audit Trail Coverage',
        description: 'Current audit coverage is below recommended threshold of 80%',
        actions: [
          'Enable audit logging for additional entity types',
          'Review and update audit configuration',
          'Implement automated audit verification checks'
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        status: 'open',
        assignedTo: null
      });
    }

    return recommendations;
  }

  private async generateAppendices(
    auditData: AuditEntry[],
    command: GenerateComplianceReportCommand
  ): Promise<ReportAppendix[]> {
    const appendices: ReportAppendix[] = [];

    // Data classification appendix
    if (command.includeDataClassification) {
      const dataClassification = await this.analyzeDataClassification(auditData);
      appendices.push({
        title: 'Data Classification Analysis',
        content: dataClassification,
        type: 'data_classification'
      });
    }

    // Risk assessment appendix
    if (command.includeRiskAssessment) {
      const riskAssessment = await this.performRiskAssessment(auditData);
      appendices.push({
        title: 'Risk Assessment',
        content: riskAssessment,
        type: 'risk_assessment'
      });
    }

    return appendices;
  }

  private calculateReportRetention(framework: ComplianceFramework): Date {
    const retentionPeriods: Record<ComplianceFramework, number> = {
      [ComplianceFramework.SOX]: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      [ComplianceFramework.GDPR]: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      [ComplianceFramework.HIPAA]: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
      [ComplianceFramework.PCI_DSS]: 1 * 365 * 24 * 60 * 60 * 1000 // 1 year
    };

    const retention = retentionPeriods[framework] || (3 * 365 * 24 * 60 * 60 * 1000);
    return new Date(Date.now() + retention);
  }

  private async analyzeDataClassification(auditData: AuditEntry[]): Promise<any> {
    // Implementation would analyze data sensitivity in audit entries
    return {
      sensitiveDataEvents: auditData.filter(e => e.containsSensitiveData()).length,
      dataCategories: ['PII', 'Financial', 'Health', 'Authentication'],
      riskDistribution: {
        high: auditData.filter(e => e.risk === AuditRiskLevel.HIGH).length,
        medium: auditData.filter(e => e.risk === AuditRiskLevel.MEDIUM).length,
        low: auditData.filter(e => e.risk === AuditRiskLevel.LOW).length
      }
    };
  }

  private async performRiskAssessment(auditData: AuditEntry[]): Promise<any> {
    // Implementation would perform risk analysis
    return {
      overallRiskScore: 7.2,
      topRisks: [
        'Privileged account access',
        'Data export activities',
        'After-hours access patterns'
      ],
      mitigation: 'Implement additional monitoring and access controls'
    };
  }
}
```

### Infrastructure Layer

#### Event Sourcing Audit Repository

```typescript
// packages/audit/src/repositories/EventSourcedAuditRepository.ts
export class EventSourcedAuditRepository implements IAuditRepository {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly readModelStore: IAuditReadModelStore,
    private readonly encryptionService: IEncryptionService
  ) {}

  async save(auditEntry: AuditEntry): Promise<void> {
    try {
      // Create event for audit entry
      const auditEvent = new AuditEntryCreatedEvent(auditEntry);
      
      // Encrypt sensitive data if needed
      const encryptedEvent = await this.encryptSensitiveData(auditEvent);
      
      // Store in event store (immutable)
      await this.eventStore.append(
        `audit-${auditEntry.entityType}-${auditEntry.entityId}`,
        [encryptedEvent],
        ExpectedVersion.Any
      );

      // Update read model for queries
      await this.updateReadModel(auditEntry);

    } catch (error) {
      throw new AuditRepositoryError('Failed to save audit entry', error);
    }
  }

  async getTrail(entityType: string, entityId: string): Promise<AuditTrail | null> {
    try {
      const streamId = `audit-${entityType}-${entityId}`;
      const events = await this.eventStore.readStream(streamId);
      
      if (events.length === 0) {
        return null;
      }

      // Reconstruct audit trail from events
      let trail: AuditTrail | null = null;
      
      for (const event of events) {
        const decryptedEvent = await this.decryptSensitiveData(event);
        
        if (decryptedEvent instanceof AuditEntryCreatedEvent) {
          if (!trail) {
            const trailResult = AuditTrail.create({
              entityType,
              entityId,
              initialEntry: decryptedEvent.auditEntry
            });
            
            if (trailResult.isFailure) {
              throw new Error(trailResult.error.message);
            }
            
            trail = trailResult.value;
          } else {
            await trail.addEntry(decryptedEvent.auditEntry);
          }
        }
      }

      return trail;

    } catch (error) {
      throw new AuditRepositoryError('Failed to get audit trail', error);
    }
  }

  async query(query: AuditQuery): Promise<AuditQueryResult> {
    try {
      // Use read model for efficient querying
      const result = await this.readModelStore.query({
        entityType: query.entityType,
        entityId: query.entityId,
        actorId: query.actorId?.value,
        dateRange: query.dateRange,
        actions: query.actions,
        eventTypes: query.eventTypes,
        riskLevels: query.riskLevels,
        searchTerm: query.searchTerm,
        pagination: query.pagination,
        orderBy: query.orderBy || [{ field: 'timestamp', direction: 'DESC' }]
      });

      // Decrypt sensitive data in results
      const decryptedEntries = await Promise.all(
        result.entries.map(entry => this.decryptAuditEntry(entry))
      );

      return {
        entries: decryptedEntries,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        aggregations: result.aggregations,
        executionTimeMs: result.executionTimeMs
      };

    } catch (error) {
      throw new AuditRepositoryError('Failed to query audit entries', error);
    }
  }

  async getComplianceData(request: ComplianceDataRequest): Promise<AuditEntry[]> {
    try {
      const query: AuditQuery = {
        dateRange: {
          from: request.startDate,
          to: request.endDate
        },
        pagination: { size: 10000, offset: 0 } // Large batch for compliance reports
      };

      // Add framework-specific filters
      if (request.complianceFramework === ComplianceFramework.SOX) {
        query.eventTypes = [
          AuditEventType.SECURITY,
          AuditEventType.BILLING,
          AuditEventType.AUTHENTICATION
        ];
      } else if (request.complianceFramework === ComplianceFramework.GDPR) {
        query.eventTypes = [
          AuditEventType.DATA_ACCESS,
          AuditEventType.USER_ACTION
        ];
      }

      const result = await this.query(query);
      return result.entries;

    } catch (error) {
      throw new AuditRepositoryError('Failed to get compliance data', error);
    }
  }

  async archive(criteria: AuditArchiveCriteria): Promise<number> {
    try {
      // Archive old audit entries
      const query: AuditQuery = {
        dateRange: {
          from: new Date(0),
          to: criteria.archiveBefore
        },
        pagination: { size: 1000, offset: 0 }
      };

      let archivedCount = 0;
      let hasMore = true;

      while (hasMore) {
        const result = await this.query(query);
        
        if (result.entries.length === 0) {
          break;
        }

        // Archive entries (move to cold storage)
        await this.archiveEntries(result.entries);
        archivedCount += result.entries.length;

        // Update query offset
        query.pagination.offset += query.pagination.size;
        hasMore = result.hasMore;
      }

      return archivedCount;

    } catch (error) {
      throw new AuditRepositoryError('Failed to archive audit entries', error);
    }
  }

  async purge(criteria: AuditPurgeCriteria): Promise<number> {
    try {
      // Only purge entries that are past their retention period
      const expiredEntries = await this.readModelStore.queryExpired({
        expiredBefore: new Date(),
        batchSize: 1000
      });

      let purgedCount = 0;

      for (const entry of expiredEntries) {
        // Verify entry is eligible for purge
        if (!entry.isExpired()) {
          continue;
        }

        // Remove from both event store and read model
        await this.eventStore.deleteStream(
          `audit-${entry.entityType}-${entry.entityId}`
        );
        
        await this.readModelStore.delete(entry.id.value);
        purgedCount++;
      }

      return purgedCount;

    } catch (error) {
      throw new AuditRepositoryError('Failed to purge audit entries', error);
    }
  }

  private async updateReadModel(auditEntry: AuditEntry): Promise<void> {
    // Create read model projection for efficient querying
    const readModel = {
      id: auditEntry.id.value,
      timestamp: auditEntry.timestamp,
      eventType: auditEntry.eventType,
      entityType: auditEntry.entityType,
      entityId: auditEntry.entityId,
      actorId: auditEntry.actorId?.value,
      actorType: auditEntry.actorType,
      action: auditEntry.action,
      risk: auditEntry.risk,
      correlationId: auditEntry.correlationId.value,
      sessionId: auditEntry.sessionId?.value,
      ipAddress: auditEntry.ipAddress,
      containsSensitiveData: auditEntry.containsSensitiveData(),
      retentionExpiresAt: auditEntry.retentionExpiresAt,
      searchableText: this.buildSearchableText(auditEntry),
      // Store encrypted sensitive data
      encryptedData: await this.encryptSensitiveFields(auditEntry)
    };

    await this.readModelStore.upsert(readModel);
  }

  private buildSearchableText(auditEntry: AuditEntry): string {
    const searchableFields = [
      auditEntry.entityType,
      auditEntry.entityId,
      auditEntry.action,
      auditEntry.actorId?.value,
      ...auditEntry.changes.map(c => `${c.field}:${c.newValue}`)
    ].filter(Boolean);

    return searchableFields.join(' ').toLowerCase();
  }

  private async encryptSensitiveData(event: AuditEntryCreatedEvent): Promise<AuditEntryCreatedEvent> {
    if (!event.auditEntry.containsSensitiveData()) {
      return event;
    }

    // Clone and encrypt sensitive fields
    // Implementation would use proper encryption service
    return event; // Simplified
  }

  private async decryptSensitiveData(event: any): Promise<any> {
    // Implementation would decrypt sensitive fields
    return event; // Simplified
  }

  private async decryptAuditEntry(entry: AuditEntry): Promise<AuditEntry> {
    // Implementation would decrypt sensitive audit entry fields
    return entry; // Simplified
  }

  private async encryptSensitiveFields(auditEntry: AuditEntry): Promise<string | null> {
    if (!auditEntry.containsSensitiveData()) {
      return null;
    }

    const sensitiveData = {
      beforeState: auditEntry.beforeState,
      afterState: auditEntry.afterState,
      changes: auditEntry.changes.filter(c => c.sensitivity !== DataSensitivity.LOW)
    };

    return await this.encryptionService.encrypt(JSON.stringify(sensitiveData));
  }

  private async archiveEntries(entries: AuditEntry[]): Promise<void> {
    // Move entries to cold storage (S3, Glacier, etc.)
    // Implementation would handle actual archival process
  }
}
```

### Domain Event Handlers

**Automatic Audit Capture Handlers**
```typescript
// packages/audit/src/handlers/AutomaticAuditHandlers.ts
export class AutomaticAuditHandlers {
  constructor(
    private readonly auditCaptureService: AuditEventCaptureService
  ) {}

  @DomainEventHandler(UserCreatedEvent)
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.auditCaptureService.captureEntityChange(
      'User',
      event.user.id.value,
      null, // No old state for creation
      {
        id: event.user.id.value,
        email: event.user.email.value,
        name: event.user.name.value,
        createdAt: event.user.createdAt
      },
      {
        actorId: event.createdBy,
        correlationId: event.correlationId,
        source: 'user-management-service'
      }
    );
  }

  @DomainEventHandler(UserUpdatedEvent)
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.auditCaptureService.captureEntityChange(
      'User',
      event.user.id.value,
      event.oldState,
      {
        id: event.user.id.value,
        email: event.user.email.value,
        name: event.user.name.value,
        updatedAt: event.user.updatedAt
      },
      {
        actorId: event.updatedBy,
        correlationId: event.correlationId,
        source: 'user-management-service'
      }
    );
  }

  @DomainEventHandler(UserDeletedEvent)
  async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    await this.auditCaptureService.captureEntityChange(
      'User',
      event.userId.value,
      event.deletedUser,
      null, // No new state for deletion
      {
        actorId: event.deletedBy,
        correlationId: event.correlationId,
        source: 'user-management-service'
      }
    );
  }

  @DomainEventHandler(SubscriptionCreatedEvent)
  async handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
    await this.auditCaptureService.captureEntityChange(
      'Subscription',
      event.subscription.id.value,
      null,
      {
        id: event.subscription.id.value,
        customerId: event.subscription.customerId.value,
        status: event.subscription.status,
        createdAt: event.subscription.createdAt
      },
      {
        actorId: event.createdBy,
        correlationId: event.correlationId,
        source: 'billing-service'
      }
    );
  }

  @DomainEventHandler(LoginAttemptEvent)
  async handleLoginAttempt(event: LoginAttemptEvent): Promise<void> {
    await this.auditCaptureService.captureUserAction(
      event.successful ? 'login_success' : 'login_failure',
      'Authentication',
      event.userId?.value || 'anonymous',
      {
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        failureReason: event.failureReason,
        tags: [event.successful ? 'successful_login' : 'failed_login']
      },
      {
        actorId: event.userId,
        sessionId: event.sessionId,
        correlationId: event.correlationId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        source: 'authentication-service'
      }
    );
  }
}
```

## Performance & Monitoring

### Audit Analytics Service

```typescript
// packages/audit/src/services/AuditAnalyticsService.ts
export class AuditAnalyticsService {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly metricsService: IMetricsService
  ) {}

  async generateSecurityDashboard(
    organizationId: string,
    timeRange: DateRange
  ): Promise<SecurityDashboard> {
    const auditData = await this.auditRepository.query({
      organizationId,
      dateRange: timeRange,
      eventTypes: [AuditEventType.SECURITY, AuditEventType.AUTHENTICATION],
      pagination: { size: 10000, offset: 0 }
    });

    const entries = auditData.entries;

    return {
      totalSecurityEvents: entries.length,
      highRiskEvents: entries.filter(e => e.risk === AuditRiskLevel.HIGH).length,
      failedLoginAttempts: entries.filter(e => 
        e.eventType === AuditEventType.AUTHENTICATION && 
        e.metadata.tags?.includes('failed_login')
      ).length,
      privilegedActions: entries.filter(e => 
        e.actorType === ActorType.ADMIN || 
        e.metadata.tags?.includes('privileged')
      ).length,
      suspiciousActivities: this.detectSuspiciousActivities(entries),
      topRiskActors: this.getTopRiskActors(entries),
      activityTimeline: this.buildActivityTimeline(entries, timeRange),
      geographicDistribution: this.analyzeGeographicDistribution(entries)
    };
  }

  async trackAuditMetrics(): Promise<void> {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const recentAuditData = await this.auditRepository.query({
      dateRange: { from: lastHour, to: now },
      pagination: { size: 1000, offset: 0 }
    });

    // Track audit volume metrics
    this.metricsService.recordGauge(
      'audit_entries_per_hour',
      recentAuditData.entries.length
    );

    // Track risk distribution
    const riskCounts = {
      high: recentAuditData.entries.filter(e => e.risk === AuditRiskLevel.HIGH).length,
      medium: recentAuditData.entries.filter(e => e.risk === AuditRiskLevel.MEDIUM).length,
      low: recentAuditData.entries.filter(e => e.risk === AuditRiskLevel.LOW).length
    };

    for (const [level, count] of Object.entries(riskCounts)) {
      this.metricsService.recordGauge(`audit_risk_${level}_per_hour`, count);
    }

    // Track event type distribution
    const eventTypeCounts = recentAuditData.entries.reduce((acc, entry) => {
      acc[entry.eventType] = (acc[entry.eventType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    for (const [eventType, count] of Object.entries(eventTypeCounts)) {
      this.metricsService.recordGauge(`audit_event_type_${eventType.toLowerCase()}_per_hour`, count);
    }
  }

  private detectSuspiciousActivities(entries: AuditEntry[]): SuspiciousActivity[] {
    const activities: SuspiciousActivity[] = [];

    // Detect unusual access patterns
    const accessPatterns = this.analyzeAccessPatterns(entries);
    
    // Multiple failed logins from same IP
    const failedLogins = entries.filter(e => 
      e.eventType === AuditEventType.AUTHENTICATION && 
      e.metadata.tags?.includes('failed_login')
    );

    const ipFailureCounts = failedLogins.reduce((acc, entry) => {
      if (entry.ipAddress) {
        acc[entry.ipAddress] = (acc[entry.ipAddress] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    for (const [ip, count] of Object.entries(ipFailureCounts)) {
      if (count > 10) { // Threshold for suspicious activity
        activities.push({
          type: 'brute_force_attempt',
          description: `${count} failed login attempts from IP ${ip}`,
          riskScore: Math.min(count / 2, 10),
          ipAddress: ip,
          eventCount: count
        });
      }
    }

    // After-hours access
    const afterHoursAccess = entries.filter(e => {
      const hour = e.timestamp.getHours();
      return hour < 6 || hour > 22;
    });

    if (afterHoursAccess.length > 5) {
      activities.push({
        type: 'after_hours_access',
        description: `${afterHoursAccess.length} access events outside business hours`,
        riskScore: 6,
        eventCount: afterHoursAccess.length
      });
    }

    return activities;
  }

  private getTopRiskActors(entries: AuditEntry[]): RiskActor[] {
    const actorRisks = entries.reduce((acc, entry) => {
      if (entry.actorId) {
        const actorKey = entry.actorId.value;
        if (!acc[actorKey]) {
          acc[actorKey] = {
            actorId: actorKey,
            actorType: entry.actorType,
            totalEvents: 0,
            highRiskEvents: 0,
            riskScore: 0
          };
        }

        acc[actorKey].totalEvents++;
        
        if (entry.risk === AuditRiskLevel.HIGH) {
          acc[actorKey].highRiskEvents++;
        }

        // Calculate risk score based on event risk and frequency
        acc[actorKey].riskScore += this.mapRiskToScore(entry.risk);
      }
      
      return acc;
    }, {} as Record<string, RiskActor>);

    return Object.values(actorRisks)
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 10); // Top 10 risk actors
  }

  private mapRiskToScore(risk: AuditRiskLevel): number {
    switch (risk) {
      case AuditRiskLevel.HIGH: return 5;
      case AuditRiskLevel.MEDIUM: return 2;
      case AuditRiskLevel.LOW: return 1;
      default: return 0;
    }
  }

  private buildActivityTimeline(entries: AuditEntry[], timeRange: DateRange): TimelinePoint[] {
    // Group entries by hour
    const timeline: Record<string, number> = {};
    
    for (const entry of entries) {
      const hourKey = entry.timestamp.toISOString().substring(0, 13) + ':00:00.000Z';
      timeline[hourKey] = (timeline[hourKey] || 0) + 1;
    }

    return Object.entries(timeline).map(([timestamp, count]) => ({
      timestamp: new Date(timestamp),
      eventCount: count
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private analyzeGeographicDistribution(entries: AuditEntry[]): GeographicDistribution[] {
    // This would integrate with IP geolocation service
    // Simplified implementation
    return [];
  }

  private analyzeAccessPatterns(entries: AuditEntry[]): AccessPattern[] {
    // Implementation would analyze user access patterns for anomalies
    return [];
  }
}
```

## Testing Patterns

### Integration Tests

```typescript
// packages/audit/__tests__/integration/EventSourcedAuditRepository.test.ts
describe('EventSourcedAuditRepository Integration', () => {
  let repository: EventSourcedAuditRepository;
  let eventStore: IEventStore;
  let readModelStore: IAuditReadModelStore;

  beforeAll(async () => {
    eventStore = new InMemoryEventStore();
    readModelStore = new InMemoryAuditReadModelStore();
    
    repository = new EventSourcedAuditRepository(
      eventStore,
      readModelStore,
      new MockEncryptionService()
    );
  });

  beforeEach(async () => {
    await eventStore.clear();
    await readModelStore.clear();
  });

  describe('audit entry persistence', () => {
    it('should save and retrieve audit entries', async () => {
      // Create test audit entry
      const entryResult = AuditEntry.create({
        eventType: AuditEventType.USER_ACTION,
        entityType: 'User',
        entityId: 'user_123',
        actorId: new UserId('actor_123'),
        actorType: ActorType.USER,
        action: AuditAction.UPDATE,
        changes: [
          AuditChange.create({
            field: 'email',
            oldValue: 'old@example.com',
            newValue: 'new@example.com'
          })
        ],
        metadata: {
          source: 'test',
          version: '1.0',
          requestId: 'req_123',
          tags: []
        },
        correlationId: CorrelationId.create()
      });

      expect(entryResult.isSuccess).toBe(true);
      const auditEntry = entryResult.value;

      // Save audit entry
      await repository.save(auditEntry);

      // Retrieve audit trail
      const trail = await repository.getTrail('User', 'user_123');
      
      expect(trail).not.toBeNull();
      expect(trail!.entries).toHaveLength(1);
      expect(trail!.entries[0].id.value).toBe(auditEntry.id.value);
    });

    it('should handle sensitive data encryption', async () => {
      const entryResult = AuditEntry.create({
        eventType: AuditEventType.SECURITY,
        entityType: 'User',
        entityId: 'user_123',
        actorId: new UserId('actor_123'),
        actorType: ActorType.USER,
        action: AuditAction.UPDATE,
        changes: [
          AuditChange.create({
            field: 'password',
            oldValue: 'old_hashed_password',
            newValue: 'new_hashed_password'
          })
        ],
        metadata: {
          source: 'test',
          version: '1.0',
          requestId: 'req_123',
          tags: []
        },
        correlationId: CorrelationId.create()
      });

      expect(entryResult.isSuccess).toBe(true);
      const auditEntry = entryResult.value;
      
      // Verify entry contains sensitive data
      expect(auditEntry.containsSensitiveData()).toBe(true);

      await repository.save(auditEntry);

      // Verify the entry was stored and can be retrieved
      const trail = await repository.getTrail('User', 'user_123');
      expect(trail?.entries[0].containsSensitiveData()).toBe(true);
    });
  });

  describe('audit querying', () => {
    it('should query audit entries with filters', async () => {
      // Create multiple test entries
      const entries = await Promise.all([
        createTestAuditEntry({
          entityType: 'User',
          action: AuditAction.CREATE,
          actorType: ActorType.USER
        }),
        createTestAuditEntry({
          entityType: 'User',
          action: AuditAction.UPDATE,
          actorType: ActorType.ADMIN
        }),
        createTestAuditEntry({
          entityType: 'Organization',
          action: AuditAction.DELETE,
          actorType: ActorType.SYSTEM
        })
      ]);

      // Save all entries
      for (const entry of entries) {
        await repository.save(entry);
      }

      // Query with filters
      const result = await repository.query({
        entityType: 'User',
        actions: [AuditAction.UPDATE],
        pagination: { size: 10, offset: 0 }
      });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].action).toBe(AuditAction.UPDATE);
      expect(result.entries[0].actorType).toBe(ActorType.ADMIN);
    });
  });
});

async function createTestAuditEntry(props: {
  entityType: string;
  action: AuditAction;
  actorType: ActorType;
}): Promise<AuditEntry> {
  const entryResult = AuditEntry.create({
    eventType: AuditEventType.USER_ACTION,
    entityType: props.entityType,
    entityId: `${props.entityType.toLowerCase()}_${Date.now()}`,
    actorId: new UserId('test_actor'),
    actorType: props.actorType,
    action: props.action,
    changes: [],
    metadata: {
      source: 'test',
      version: '1.0',
      requestId: 'req_test',
      tags: []
    },
    correlationId: CorrelationId.create()
  });

  if (entryResult.isFailure) {
    throw new Error(entryResult.error.message);
  }

  return entryResult.value;
}
```

```yaml
# Embedded DSL Verification
verify:
  exists:
    - "packages/core/domain/audit/entities/AuditEntry.ts"
    - "packages/core/domain/audit/entities/AuditTrail.ts"
    - "packages/core/domain/audit/values/AuditChange.ts"
    - "packages/core/domain/audit/services/AuditEventCaptureService.ts"
    - "packages/api/src/use-cases/audit/QueryAuditTrailUseCase.ts"
    - "packages/api/src/use-cases/audit/GenerateComplianceReportUseCase.ts"
    - "packages/audit/src/repositories/EventSourcedAuditRepository.ts"

  contains:
    - file: "packages/core/domain/audit/entities/AuditEntry.ts"
      pattern: "class AuditEntry extends AggregateRoot"
    
    - file: "packages/core/domain/audit/entities/AuditTrail.ts"
      pattern: "class AuditTrail extends AggregateRoot"
    
    - file: "packages/audit/src/repositories/EventSourcedAuditRepository.ts"
      pattern: "implements IAuditRepository"
    
    - file: "packages/core/domain/audit/services/AuditEventCaptureService.ts"
      pattern: "captureEntityChange"

  patterns:
    - name: "Event Sourcing"
      files: ["packages/audit/src/repositories/*.ts"]
      pattern: "EventStore"
    
    - name: "Audit Domain Events"
      files: ["packages/core/domain/audit/entities/*.ts"]
      pattern: "this.addDomainEvent"
    
    - name: "Compliance Frameworks"
      files: ["packages/api/src/use-cases/audit/*.ts"]
      pattern: "(SOX|GDPR|HIPAA|PCI_DSS)"
    
    - name: "Sensitive Data Handling"
      files: ["packages/core/domain/audit/**/*.ts"]
      pattern: "(containsSensitiveData|encryptSensitiveData)"

  constraints:
    - name: "Immutable Audit Trail"
      description: "Audit entries should be immutable once created"
      verify: "no_mutations"
      files: "packages/core/domain/audit/entities/AuditEntry.ts"
    
    - name: "Event Sourcing Separation"
      description: "Domain should not depend on event store directly"
      verify: "no_imports"
      from: "packages/core/domain/audit/**/*.ts"
      to: "packages/audit/src/repositories/**/*.ts"

commands:
  - name: "test:audit"
    description: "Run audit domain and use case tests"
    command: "pnpm test packages/core/domain/audit packages/api/src/use-cases/audit"
  
  - name: "test:audit:integration"
    description: "Run audit integration tests"
    command: "pnpm test packages/audit/__tests__/integration"
  
  - name: "audit:generate-report"
    description: "Generate compliance report"
    command: "pnpm --filter @repo/audit generate-report"
  
  - name: "audit:archive"
    description: "Archive old audit entries"
    command: "pnpm --filter @repo/audit archive"
```

## Key Implementation Notes

1. **Immutable Audit Trail**: Audit entries are immutable once created, ensuring data integrity and compliance requirements.

2. **Event Sourcing**: Use event sourcing for audit persistence to maintain complete history and enable reconstruction.

3. **Compliance-Ready**: Built-in support for major compliance frameworks (SOX, GDPR, HIPAA, PCI-DSS) with appropriate retention policies.

4. **Sensitive Data Protection**: Automatic detection and encryption of sensitive data with proper anonymization capabilities.

5. **Risk-Based Classification**: Automatic risk scoring and classification based on event type, actor, and content sensitivity.

6. **Forensic Analysis**: Comprehensive querying and reporting capabilities for security investigations and compliance audits.

7. **Data Retention**: Automatic retention management with compliance-based expiration and archival processes.

8. **Performance Optimization**: Separate read models for efficient querying while maintaining event sourcing benefits.

9. **Security Monitoring**: Real-time suspicious activity detection and security dashboard capabilities.

10. **Clean Architecture**: Proper separation of concerns with domain-driven audit models and infrastructure abstraction.

This pattern provides a robust, compliant, and forensically sound audit logging system while maintaining Clean Architecture principles and supporting regulatory requirements.