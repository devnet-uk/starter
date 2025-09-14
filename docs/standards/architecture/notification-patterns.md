# Notification Patterns

**Category**: Architecture  
**Type**: Implementation Pattern  
**Scope**: Backend Services  
**Related Standards**: [Clean Architecture](./clean-architecture.md), [Background Job Patterns](./background-job-patterns.md), [Multi-tenancy Patterns](./multi-tenancy-patterns.md)

## Overview

This document establishes comprehensive patterns for implementing multi-channel notification systems following Clean Architecture principles. It covers email, SMS, push notifications, in-app notifications, template management, user preferences, delivery tracking, and queue integration while maintaining domain isolation and high reliability.

## Architecture Layers

### Domain Layer

#### Notification Domain Entities

**Notification Aggregate Root**
```typescript
// packages/core/domain/notifications/entities/Notification.ts
import { AggregateRoot } from '@repo/domain/base/AggregateRoot';
import { Result } from '@repo/domain/base/Result';

export class Notification extends AggregateRoot {
  private constructor(
    private readonly _id: NotificationId,
    private readonly _recipientId: UserId,
    private readonly _type: NotificationType,
    private readonly _channels: NotificationChannel[],
    private readonly _templateId: TemplateId,
    private readonly _variables: Record<string, any>,
    private _status: NotificationStatus,
    private _attempts: Map<NotificationChannel, number>,
    private _deliveryResults: Map<NotificationChannel, DeliveryResult>,
    private _scheduledFor: Date | null,
    private readonly _createdAt: Date,
    private _sentAt: Date | null
  ) {
    super(_id.value);
  }

  public static create(props: {
    recipientId: UserId;
    type: NotificationType;
    channels: NotificationChannel[];
    templateId: TemplateId;
    variables: Record<string, any>;
    scheduledFor?: Date;
  }): Result<Notification> {
    if (props.channels.length === 0) {
      return Result.fail(new DomainError('At least one notification channel must be specified'));
    }

    const notification = new Notification(
      NotificationId.create(),
      props.recipientId,
      props.type,
      props.channels,
      props.templateId,
      props.variables,
      props.scheduledFor ? NotificationStatus.SCHEDULED : NotificationStatus.PENDING,
      new Map(),
      new Map(),
      props.scheduledFor || null,
      new Date(),
      null
    );

    notification.addDomainEvent(new NotificationCreatedEvent(notification));
    return Result.ok(notification);
  }

  public markAsSending(channel: NotificationChannel): Result<void> {
    if (this._status === NotificationStatus.CANCELED) {
      return Result.fail(new DomainError('Cannot send canceled notification'));
    }

    const currentAttempts = this._attempts.get(channel) || 0;
    this._attempts.set(channel, currentAttempts + 1);

    if (!this._sentAt) {
      this._sentAt = new Date();
      this._status = NotificationStatus.SENDING;
    }

    this.addDomainEvent(new NotificationSendingEvent(this, channel, currentAttempts + 1));
    return Result.ok();
  }

  public markChannelAsDelivered(
    channel: NotificationChannel,
    externalId: string,
    deliveredAt: Date
  ): Result<void> {
    const result: DeliveryResult = {
      status: DeliveryStatus.DELIVERED,
      externalId,
      deliveredAt,
      error: null
    };

    this._deliveryResults.set(channel, result);
    this.updateOverallStatus();

    this.addDomainEvent(new NotificationDeliveredEvent(this, channel, result));
    return Result.ok();
  }

  public markChannelAsFailed(
    channel: NotificationChannel,
    error: NotificationError,
    canRetry: boolean = true
  ): Result<void> {
    const attempts = this._attempts.get(channel) || 0;
    const maxAttempts = this.getMaxAttemptsForChannel(channel);

    const result: DeliveryResult = {
      status: canRetry && attempts < maxAttempts 
        ? DeliveryStatus.RETRYING 
        : DeliveryStatus.FAILED,
      externalId: null,
      deliveredAt: null,
      error: error.message
    };

    this._deliveryResults.set(channel, result);
    this.updateOverallStatus();

    if (result.status === DeliveryStatus.FAILED) {
      this.addDomainEvent(new NotificationChannelFailedEvent(this, channel, error));
    } else {
      this.addDomainEvent(new NotificationChannelRetryingEvent(this, channel, attempts + 1));
    }

    return Result.ok();
  }

  public cancel(reason: string): Result<void> {
    if (this._status === NotificationStatus.DELIVERED) {
      return Result.fail(new DomainError('Cannot cancel already delivered notification'));
    }

    this._status = NotificationStatus.CANCELED;
    this.addDomainEvent(new NotificationCanceledEvent(this, reason));
    return Result.ok();
  }

  public canRetryChannel(channel: NotificationChannel): boolean {
    const attempts = this._attempts.get(channel) || 0;
    const maxAttempts = this.getMaxAttemptsForChannel(channel);
    const result = this._deliveryResults.get(channel);

    return attempts < maxAttempts && 
           (!result || result.status === DeliveryStatus.RETRYING);
  }

  private updateOverallStatus(): void {
    const results = Array.from(this._deliveryResults.values());
    
    if (results.length === 0) {
      return;
    }

    const hasDelivered = results.some(r => r.status === DeliveryStatus.DELIVERED);
    const hasRetrying = results.some(r => r.status === DeliveryStatus.RETRYING);
    const allFailed = results.length === this._channels.length && 
                     results.every(r => r.status === DeliveryStatus.FAILED);

    if (hasDelivered && !hasRetrying) {
      this._status = NotificationStatus.DELIVERED;
    } else if (allFailed) {
      this._status = NotificationStatus.FAILED;
    } else if (hasRetrying) {
      this._status = NotificationStatus.RETRYING;
    }
  }

  private getMaxAttemptsForChannel(channel: NotificationChannel): number {
    switch (channel) {
      case NotificationChannel.EMAIL: return 3;
      case NotificationChannel.SMS: return 2;
      case NotificationChannel.PUSH: return 1;
      case NotificationChannel.IN_APP: return 1;
      default: return 1;
    }
  }

  // Getters
  public get id(): NotificationId { return this._id; }
  public get recipientId(): UserId { return this._recipientId; }
  public get type(): NotificationType { return this._type; }
  public get channels(): NotificationChannel[] { return [...this._channels]; }
  public get templateId(): TemplateId { return this._templateId; }
  public get variables(): Record<string, any> { return { ...this._variables }; }
  public get status(): NotificationStatus { return this._status; }
  public get isDelivered(): boolean { return this._status === NotificationStatus.DELIVERED; }
  public get isFailed(): boolean { return this._status === NotificationStatus.FAILED; }
  public get scheduledFor(): Date | null { return this._scheduledFor; }
}
```

**Notification Template Entity**
```typescript
// packages/core/domain/notifications/entities/NotificationTemplate.ts
export class NotificationTemplate extends Entity<TemplateId> {
  private constructor(
    id: TemplateId,
    private readonly _name: string,
    private readonly _type: NotificationType,
    private readonly _channels: Map<NotificationChannel, ChannelTemplate>,
    private readonly _variables: TemplateVariable[],
    private _isActive: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(id);
  }

  public static create(props: {
    name: string;
    type: NotificationType;
    channels: Map<NotificationChannel, ChannelTemplate>;
    variables: TemplateVariable[];
  }): Result<NotificationTemplate> {
    if (props.channels.size === 0) {
      return Result.fail(new DomainError('Template must have at least one channel'));
    }

    const now = new Date();
    return Result.ok(new NotificationTemplate(
      TemplateId.create(),
      props.name,
      props.type,
      new Map(props.channels),
      [...props.variables],
      true,
      now,
      now
    ));
  }

  public updateChannelTemplate(
    channel: NotificationChannel,
    template: ChannelTemplate
  ): Result<void> {
    this._channels.set(channel, template);
    this._updatedAt = new Date();
    return Result.ok();
  }

  public removeChannel(channel: NotificationChannel): Result<void> {
    if (this._channels.size <= 1) {
      return Result.fail(new DomainError('Template must have at least one channel'));
    }

    this._channels.delete(channel);
    this._updatedAt = new Date();
    return Result.ok();
  }

  public validateVariables(variables: Record<string, any>): Result<void> {
    const requiredVariables = this._variables
      .filter(v => v.required)
      .map(v => v.name);

    const missing = requiredVariables.filter(name => 
      variables[name] === undefined || variables[name] === null
    );

    if (missing.length > 0) {
      return Result.fail(new DomainError(`Missing required variables: ${missing.join(', ')}`));
    }

    return Result.ok();
  }

  public getChannelTemplate(channel: NotificationChannel): ChannelTemplate | null {
    return this._channels.get(channel) || null;
  }

  // Getters
  public get name(): string { return this._name; }
  public get type(): NotificationType { return this._type; }
  public get channels(): NotificationChannel[] { return Array.from(this._channels.keys()); }
  public get variables(): TemplateVariable[] { return [...this._variables]; }
  public get isActive(): boolean { return this._isActive; }
}
```

**User Notification Preferences Entity**
```typescript
// packages/core/domain/notifications/entities/NotificationPreferences.ts
export class NotificationPreferences extends Entity<UserId> {
  private constructor(
    userId: UserId,
    private _preferences: Map<NotificationType, ChannelPreferences>,
    private _globalOptOut: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(userId);
  }

  public static create(userId: UserId): NotificationPreferences {
    return new NotificationPreferences(
      userId,
      new Map(),
      false,
      new Date(),
      new Date()
    );
  }

  public updatePreference(
    type: NotificationType,
    preferences: ChannelPreferences
  ): Result<void> {
    if (this._globalOptOut && preferences.enabled) {
      return Result.fail(new DomainError('Cannot enable notifications when globally opted out'));
    }

    this._preferences.set(type, { ...preferences });
    this._updatedAt = new Date();
    return Result.ok();
  }

  public setGlobalOptOut(optOut: boolean): Result<void> {
    this._globalOptOut = optOut;
    this._updatedAt = new Date();

    if (optOut) {
      // Disable all notification types
      for (const [type, prefs] of this._preferences) {
        this._preferences.set(type, { ...prefs, enabled: false });
      }
    }

    return Result.ok();
  }

  public getEnabledChannelsForType(type: NotificationType): NotificationChannel[] {
    if (this._globalOptOut) {
      return [];
    }

    const preferences = this._preferences.get(type);
    if (!preferences || !preferences.enabled) {
      return [];
    }

    return preferences.channels.filter(channel => 
      preferences.channelSettings[channel]?.enabled !== false
    );
  }

  public canReceiveNotification(
    type: NotificationType,
    channel: NotificationChannel
  ): boolean {
    if (this._globalOptOut) {
      return false;
    }

    const preferences = this._preferences.get(type);
    if (!preferences || !preferences.enabled) {
      return false;
    }

    if (!preferences.channels.includes(channel)) {
      return false;
    }

    const channelSetting = preferences.channelSettings[channel];
    return channelSetting?.enabled !== false;
  }

  // Getters
  public get userId(): UserId { return this.id; }
  public get globalOptOut(): boolean { return this._globalOptOut; }
}
```

#### Domain Services

**Notification Routing Service**
```typescript
// packages/core/domain/notifications/services/NotificationRoutingService.ts
export class NotificationRoutingService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly preferencesRepository: INotificationPreferencesRepository,
    private readonly templateRepository: INotificationTemplateRepository
  ) {}

  async determineDeliveryChannels(command: {
    recipientId: UserId;
    type: NotificationType;
    urgency: NotificationUrgency;
  }): Promise<Result<NotificationChannel[]>> {
    // Get user preferences
    const preferences = await this.preferencesRepository.findByUserId(command.recipientId);
    if (!preferences) {
      // Default channels for new users
      return Result.ok(this.getDefaultChannels(command.type, command.urgency));
    }

    // Check user preferences
    const enabledChannels = preferences.getEnabledChannelsForType(command.type);
    
    // Override preferences for urgent notifications
    if (command.urgency === NotificationUrgency.URGENT && enabledChannels.length === 0) {
      return Result.ok([NotificationChannel.EMAIL]); // Always allow urgent via email
    }

    return Result.ok(enabledChannels);
  }

  async validateTemplate(
    templateId: TemplateId,
    channels: NotificationChannel[],
    variables: Record<string, any>
  ): Promise<Result<void>> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      return Result.fail(new DomainError('Template not found'));
    }

    if (!template.isActive) {
      return Result.fail(new DomainError('Template is not active'));
    }

    // Validate all required channels are available in template
    const missingChannels = channels.filter(channel => 
      !template.channels.includes(channel)
    );

    if (missingChannels.length > 0) {
      return Result.fail(new DomainError(
        `Template does not support channels: ${missingChannels.join(', ')}`
      ));
    }

    // Validate required variables
    const variableValidation = template.validateVariables(variables);
    if (variableValidation.isFailure) {
      return Result.fail(variableValidation.error);
    }

    return Result.ok();
  }

  private getDefaultChannels(
    type: NotificationType,
    urgency: NotificationUrgency
  ): NotificationChannel[] {
    const defaultChannels = [NotificationChannel.EMAIL, NotificationChannel.IN_APP];
    
    if (urgency === NotificationUrgency.URGENT) {
      defaultChannels.push(NotificationChannel.SMS);
    }

    return defaultChannels;
  }
}
```

### Application Layer

#### Notification Channel Interfaces

**Core Channel Interface**
```typescript
// packages/core/interfaces/notifications/INotificationChannel.ts
export interface INotificationChannel {
  readonly name: NotificationChannel;
  readonly supportedTypes: NotificationType[];

  send(request: SendNotificationRequest): Promise<Result<SendNotificationResult>>;
  validateRecipient(recipient: NotificationRecipient): Promise<Result<void>>;
  supportsTemplate(templateId: TemplateId): boolean;
  getDeliveryStatus?(externalId: string): Promise<Result<DeliveryStatus>>;
}

export interface SendNotificationRequest {
  recipient: NotificationRecipient;
  template: ChannelTemplate;
  variables: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SendNotificationResult {
  externalId: string;
  status: DeliveryStatus;
  metadata?: Record<string, any>;
}

export interface NotificationRecipient {
  userId: UserId;
  email?: string;
  phoneNumber?: string;
  pushToken?: string;
  preferredLanguage?: string;
}
```

#### Use Cases

**Send Notification Use Case**
```typescript
// packages/api/src/use-cases/notifications/SendNotificationUseCase.ts
export class SendNotificationUseCase implements IUseCase<SendNotificationCommand, SendNotificationResult> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly routingService: NotificationRoutingService,
    private readonly jobScheduler: IJobScheduler,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(command: SendNotificationCommand): Promise<Result<SendNotificationResult>> {
    return await this.unitOfWork.transaction(async () => {
      // Determine delivery channels based on user preferences
      const channelsResult = await this.routingService.determineDeliveryChannels({
        recipientId: command.recipientId,
        type: command.type,
        urgency: command.urgency || NotificationUrgency.NORMAL
      });

      if (channelsResult.isFailure) {
        return Result.fail(channelsResult.error);
      }

      const channels = channelsResult.value;
      if (channels.length === 0) {
        return Result.fail(new DomainError('No delivery channels available for recipient'));
      }

      // Validate template
      const templateValidation = await this.routingService.validateTemplate(
        command.templateId,
        channels,
        command.variables
      );

      if (templateValidation.isFailure) {
        return Result.fail(templateValidation.error);
      }

      // Create notification
      const notificationResult = Notification.create({
        recipientId: command.recipientId,
        type: command.type,
        channels,
        templateId: command.templateId,
        variables: command.variables,
        scheduledFor: command.scheduledFor
      });

      if (notificationResult.isFailure) {
        return Result.fail(notificationResult.error);
      }

      const notification = notificationResult.value;
      await this.notificationRepository.save(notification);

      // Schedule delivery jobs for each channel
      for (const channel of channels) {
        const jobResult = await this.jobScheduler.scheduleJob({
          name: 'deliver-notification',
          queueName: 'notifications',
          data: {
            notificationId: notification.id.value,
            channel,
            attempt: 1
          },
          options: {
            attempts: this.getMaxAttemptsForChannel(channel),
            backoff: { type: 'exponential', delay: 2000 },
            delay: command.scheduledFor 
              ? Math.max(0, command.scheduledFor.getTime() - Date.now())
              : 0
          }
        });

        if (jobResult.isFailure) {
          console.error(`Failed to schedule notification job for channel ${channel}:`, jobResult.error);
        }
      }

      return Result.ok({
        notificationId: notification.id.value,
        channels,
        scheduledFor: command.scheduledFor
      });
    });
  }

  private getMaxAttemptsForChannel(channel: NotificationChannel): number {
    switch (channel) {
      case NotificationChannel.EMAIL: return 3;
      case NotificationChannel.SMS: return 2;
      case NotificationChannel.PUSH: return 1;
      case NotificationChannel.IN_APP: return 1;
      default: return 1;
    }
  }
}
```

**Process Notification Delivery Use Case**
```typescript
// packages/api/src/use-cases/notifications/ProcessNotificationDeliveryUseCase.ts
export class ProcessNotificationDeliveryUseCase implements IUseCase<ProcessDeliveryCommand, void> {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly channelRegistry: INotificationChannelRegistry,
    private readonly userRepository: IUserRepository,
    private readonly templateRepository: INotificationTemplateRepository,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(command: ProcessDeliveryCommand): Promise<Result<void>> {
    return await this.unitOfWork.transaction(async () => {
      // Get notification
      const notification = await this.notificationRepository.findById(
        new NotificationId(command.notificationId)
      );

      if (!notification) {
        return Result.fail(new NotFoundError('Notification not found'));
      }

      // Check if channel can be retried
      if (!notification.canRetryChannel(command.channel)) {
        return Result.fail(new DomainError('Channel cannot be retried'));
      }

      // Get channel implementation
      const channelImpl = this.channelRegistry.getChannel(command.channel);
      if (!channelImpl) {
        return Result.fail(new InfrastructureError(`Channel ${command.channel} not available`));
      }

      // Mark as sending
      const sendingResult = notification.markAsSending(command.channel);
      if (sendingResult.isFailure) {
        return Result.fail(sendingResult.error);
      }

      try {
        // Get recipient details
        const user = await this.userRepository.findById(notification.recipientId);
        if (!user) {
          notification.markChannelAsFailed(
            command.channel,
            new NotificationError('Recipient not found'),
            false
          );
          await this.notificationRepository.save(notification);
          return Result.fail(new NotFoundError('Recipient not found'));
        }

        // Get template
        const template = await this.templateRepository.findById(notification.templateId);
        if (!template) {
          notification.markChannelAsFailed(
            command.channel,
            new NotificationError('Template not found'),
            false
          );
          await this.notificationRepository.save(notification);
          return Result.fail(new NotFoundError('Template not found'));
        }

        const channelTemplate = template.getChannelTemplate(command.channel);
        if (!channelTemplate) {
          notification.markChannelAsFailed(
            command.channel,
            new NotificationError('Channel template not found'),
            false
          );
          await this.notificationRepository.save(notification);
          return Result.fail(new DomainError('Channel template not available'));
        }

        // Prepare recipient
        const recipient: NotificationRecipient = {
          userId: user.id,
          email: user.email?.value,
          phoneNumber: user.phoneNumber?.value,
          preferredLanguage: user.preferredLanguage
        };

        // Validate recipient for channel
        const recipientValidation = await channelImpl.validateRecipient(recipient);
        if (recipientValidation.isFailure) {
          notification.markChannelAsFailed(
            command.channel,
            new NotificationError('Invalid recipient for channel'),
            false
          );
          await this.notificationRepository.save(notification);
          return Result.fail(recipientValidation.error);
        }

        // Send notification
        const sendResult = await channelImpl.send({
          recipient,
          template: channelTemplate,
          variables: notification.variables,
          metadata: {
            notificationId: notification.id.value,
            attempt: command.attempt
          }
        });

        if (sendResult.isSuccess) {
          // Mark as delivered
          notification.markChannelAsDelivered(
            command.channel,
            sendResult.value.externalId,
            new Date()
          );
        } else {
          // Mark as failed with retry capability
          const canRetry = this.canRetryError(sendResult.error);
          notification.markChannelAsFailed(
            command.channel,
            new NotificationError(sendResult.error.message),
            canRetry
          );
        }

        await this.notificationRepository.save(notification);
        return Result.ok();

      } catch (error) {
        // Handle unexpected errors
        notification.markChannelAsFailed(
          command.channel,
          new NotificationError(error instanceof Error ? error.message : 'Unknown error'),
          true
        );
        await this.notificationRepository.save(notification);
        return Result.fail(new ApplicationError('Notification delivery failed', error));
      }
    });
  }

  private canRetryError(error: any): boolean {
    // Don't retry on unrecoverable errors
    const unrecoverableErrors = [
      'INVALID_EMAIL',
      'INVALID_PHONE_NUMBER',
      'BLOCKED_RECIPIENT',
      'TEMPLATE_ERROR'
    ];

    return !unrecoverableErrors.includes(error.code);
  }
}
```

### Infrastructure Layer

#### Email Channel Implementation (Nodemailer)

**Nodemailer Email Channel**
```typescript
// packages/notifications/src/channels/EmailChannel.ts
import nodemailer, { Transporter } from 'nodemailer';
import { INotificationChannel } from '@repo/core/interfaces/notifications/INotificationChannel';

export class EmailChannel implements INotificationChannel {
  readonly name = NotificationChannel.EMAIL;
  readonly supportedTypes = [
    NotificationType.WELCOME,
    NotificationType.PASSWORD_RESET,
    NotificationType.SUBSCRIPTION_UPDATED,
    NotificationType.INVOICE_CREATED,
    NotificationType.SYSTEM_ALERT
  ];

  private readonly transporter: Transporter;

  constructor(config: EmailChannelConfig) {
    this.transporter = nodemailer.createTransporter({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465, // true for 465, false for other ports
      tls: {
        rejectUnauthorized: config.smtp.rejectUnauthorized !== false,
        minVersion: config.smtp.minTlsVersion || 'TLSv1.2',
        // Custom server name if using hardcoded IP
        servername: config.smtp.servername
      },
      auth: {
        user: config.smtp.username,
        pass: config.smtp.password
      },
      pool: true, // Use connection pooling
      maxConnections: config.smtp.maxConnections || 5,
      maxMessages: config.smtp.maxMessages || 100,
      rateLimit: config.smtp.rateLimit || 10 // emails per second
    });

    // Verify configuration on startup
    this.verifyConnection();
  }

  async send(request: SendNotificationRequest): Promise<Result<SendNotificationResult>> {
    try {
      if (!request.recipient.email) {
        return Result.fail(new NotificationError('Email address required for email channel'));
      }

      // Validate email template
      if (!request.template.subject || !request.template.htmlBody) {
        return Result.fail(new NotificationError('Email template missing required fields'));
      }

      // Render template
      const renderedTemplate = this.renderTemplate(request.template, request.variables);

      const mailOptions = {
        from: request.template.fromAddress || process.env.DEFAULT_FROM_EMAIL,
        to: request.recipient.email,
        subject: renderedTemplate.subject,
        html: renderedTemplate.htmlBody,
        text: renderedTemplate.textBody || this.extractTextFromHtml(renderedTemplate.htmlBody),
        // Custom headers for tracking
        headers: {
          'X-Notification-ID': request.metadata?.notificationId,
          'X-User-ID': request.recipient.userId.value,
          'X-Template-ID': request.template.id
        }
      };

      // Add attachments if specified
      if (request.template.attachments) {
        mailOptions.attachments = request.template.attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType
        }));
      }

      const info = await this.transporter.sendMail(mailOptions);

      return Result.ok({
        externalId: info.messageId,
        status: DeliveryStatus.SENT,
        metadata: {
          messageId: info.messageId,
          response: info.response
        }
      });

    } catch (error) {
      return Result.fail(this.mapNodemailerError(error));
    }
  }

  async validateRecipient(recipient: NotificationRecipient): Promise<Result<void>> {
    if (!recipient.email) {
      return Result.fail(new NotificationError('Email address is required'));
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient.email)) {
      return Result.fail(new NotificationError('Invalid email address format'));
    }

    return Result.ok();
  }

  supportsTemplate(templateId: TemplateId): boolean {
    // Email channel supports all template types
    return true;
  }

  async getDeliveryStatus(externalId: string): Promise<Result<DeliveryStatus>> {
    // For basic SMTP, we can only track sending status
    // For advanced tracking, integrate with services like SendGrid, SES, etc.
    return Result.ok(DeliveryStatus.SENT);
  }

  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('Email transport connection verified successfully');
    } catch (error) {
      console.error('Email transport connection failed:', error);
      throw new InfrastructureError('Failed to initialize email transport', error);
    }
  }

  private renderTemplate(template: ChannelTemplate, variables: Record<string, any>): {
    subject: string;
    htmlBody: string;
    textBody?: string;
  } {
    // Simple template rendering (in production, use a proper template engine like Handlebars)
    let subject = template.subject!;
    let htmlBody = template.htmlBody!;
    let textBody = template.textBody;

    // Replace variables using simple string replacement
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(placeholder, String(value));
      htmlBody = htmlBody.replace(placeholder, String(value));
      if (textBody) {
        textBody = textBody.replace(placeholder, String(value));
      }
    }

    return { subject, htmlBody, textBody };
  }

  private extractTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private mapNodemailerError(error: any): NotificationError {
    // Map common Nodemailer/SMTP errors
    const errorCode = error.code || error.responseCode;
    const errorMessage = error.message || 'Unknown email error';

    switch (errorCode) {
      case 'ETIMEDOUT':
        return new NotificationError('Email service timeout', 'TIMEOUT', true);
      
      case 'ENOTFOUND':
      case 'ECONNREFUSED':
        return new NotificationError('Email service unavailable', 'SERVICE_UNAVAILABLE', true);
      
      case 'EMESSAGE':
        return new NotificationError('Invalid email message', 'INVALID_MESSAGE', false);
      
      case 'EAUTH':
        return new NotificationError('Email authentication failed', 'AUTH_FAILED', false);
      
      default:
        // Check for specific SMTP response codes
        if (errorMessage.includes('550')) {
          return new NotificationError('Invalid recipient email', 'INVALID_EMAIL', false);
        }
        if (errorMessage.includes('554')) {
          return new NotificationError('Email rejected by recipient server', 'REJECTED', false);
        }
        
        return new NotificationError(errorMessage, 'UNKNOWN_ERROR', true);
    }
  }
}
```

**SMS Channel Implementation**
```typescript
// packages/notifications/src/channels/SmsChannel.ts
export class SmsChannel implements INotificationChannel {
  readonly name = NotificationChannel.SMS;
  readonly supportedTypes = [
    NotificationType.VERIFICATION_CODE,
    NotificationType.URGENT_ALERT,
    NotificationType.PAYMENT_FAILED
  ];

  constructor(
    private readonly smsProvider: ISmsProvider
  ) {}

  async send(request: SendNotificationRequest): Promise<Result<SendNotificationResult>> {
    try {
      if (!request.recipient.phoneNumber) {
        return Result.fail(new NotificationError('Phone number required for SMS channel'));
      }

      // Validate SMS template
      if (!request.template.textBody) {
        return Result.fail(new NotificationError('SMS template missing text body'));
      }

      // Render template
      const message = this.renderTemplate(request.template.textBody, request.variables);

      // Validate message length (SMS typically limited to 160 characters)
      if (message.length > 160) {
        console.warn(`SMS message exceeds 160 characters (${message.length}), may be split`);
      }

      const sendResult = await this.smsProvider.send({
        to: request.recipient.phoneNumber,
        message,
        metadata: {
          notificationId: request.metadata?.notificationId,
          userId: request.recipient.userId.value
        }
      });

      if (sendResult.isFailure) {
        return Result.fail(sendResult.error);
      }

      return Result.ok({
        externalId: sendResult.value.messageId,
        status: DeliveryStatus.SENT,
        metadata: sendResult.value.metadata
      });

    } catch (error) {
      return Result.fail(new NotificationError('SMS delivery failed', 'SMS_ERROR', true));
    }
  }

  async validateRecipient(recipient: NotificationRecipient): Promise<Result<void>> {
    if (!recipient.phoneNumber) {
      return Result.fail(new NotificationError('Phone number is required'));
    }

    // Basic phone number validation (E.164 format)
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(recipient.phoneNumber)) {
      return Result.fail(new NotificationError('Invalid phone number format (use E.164)'));
    }

    return Result.ok();
  }

  supportsTemplate(templateId: TemplateId): boolean {
    return true; // SMS channel supports text templates
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let message = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(placeholder, String(value));
    }

    return message;
  }
}
```

**Push Notification Channel**
```typescript
// packages/notifications/src/channels/PushChannel.ts
export class PushChannel implements INotificationChannel {
  readonly name = NotificationChannel.PUSH;
  readonly supportedTypes = [
    NotificationType.SYSTEM_ALERT,
    NotificationType.NEW_MESSAGE,
    NotificationType.TASK_REMINDER
  ];

  constructor(
    private readonly pushProvider: IPushProvider
  ) {}

  async send(request: SendNotificationRequest): Promise<Result<SendNotificationResult>> {
    try {
      if (!request.recipient.pushToken) {
        return Result.fail(new NotificationError('Push token required for push channel'));
      }

      const pushData = {
        token: request.recipient.pushToken,
        title: request.template.title || 'Notification',
        body: request.template.textBody || '',
        data: {
          notificationId: request.metadata?.notificationId,
          ...request.variables
        },
        badge: request.template.badge,
        sound: request.template.sound || 'default'
      };

      const sendResult = await this.pushProvider.send(pushData);

      if (sendResult.isFailure) {
        return Result.fail(sendResult.error);
      }

      return Result.ok({
        externalId: sendResult.value.messageId,
        status: DeliveryStatus.SENT,
        metadata: sendResult.value.metadata
      });

    } catch (error) {
      return Result.fail(new NotificationError('Push notification delivery failed'));
    }
  }

  async validateRecipient(recipient: NotificationRecipient): Promise<Result<void>> {
    if (!recipient.pushToken) {
      return Result.fail(new NotificationError('Push token is required'));
    }

    return Result.ok();
  }

  supportsTemplate(templateId: TemplateId): boolean {
    return true;
  }
}
```

#### Job Processor Integration

**Notification Delivery Job Processor**
```typescript
// packages/api/src/processors/NotificationDeliveryJobProcessor.ts
export class NotificationDeliveryJobProcessor implements IJobProcessor<NotificationDeliveryJobData> {
  readonly name = 'deliver-notification';
  readonly queueName = 'notifications';

  constructor(
    private readonly processDeliveryUseCase: ProcessNotificationDeliveryUseCase,
    private readonly jobScheduler: IJobScheduler
  ) {}

  async process(
    job: Job,
    data: NotificationDeliveryJobData,
    token?: string
  ): Promise<Result<void>> {
    const command = new ProcessDeliveryCommand({
      notificationId: data.notificationId,
      channel: data.channel,
      attempt: data.attempt
    });

    const result = await this.processDeliveryUseCase.execute(command);

    if (result.isFailure) {
      // Check if we should retry
      const shouldRetry = this.shouldRetryError(result.error, data.attempt);
      
      if (shouldRetry) {
        // Schedule retry with exponential backoff
        const delay = this.calculateRetryDelay(data.attempt);
        
        await this.jobScheduler.scheduleJob({
          name: this.name,
          queueName: this.queueName,
          data: {
            ...data,
            attempt: data.attempt + 1
          },
          scheduledFor: new Date(Date.now() + delay)
        });
      }

      return Result.fail(result.error);
    }

    return Result.ok();
  }

  async onCompleted(job: Job, result: void): Promise<void> {
    console.log(`Notification delivery completed for job ${job.id.value}`);
  }

  async onFailed(job: Job, error: Error): Promise<void> {
    console.error(`Notification delivery failed for job ${job.id.value}:`, error);
  }

  private shouldRetryError(error: any, attempt: number): boolean {
    const maxAttempts = 3;
    
    if (attempt >= maxAttempts) {
      return false;
    }

    // Don't retry unrecoverable errors
    const unrecoverableErrors = [
      'INVALID_EMAIL',
      'INVALID_PHONE_NUMBER',
      'RECIPIENT_NOT_FOUND',
      'TEMPLATE_NOT_FOUND'
    ];

    return !unrecoverableErrors.includes(error.code);
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff: 2^attempt * 1000ms with jitter
    const baseDelay = Math.pow(2, attempt - 1) * 1000;
    const jitter = Math.random() * 0.1 * baseDelay;
    return Math.min(baseDelay + jitter, 60000); // Max 1 minute
  }
}
```

### API Layer

#### Notification Controller

```typescript
// packages/api/src/controllers/notifications/NotificationsController.ts
export class NotificationsController {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly getNotificationStatusUseCase: GetNotificationStatusUseCase,
    private readonly updatePreferencesUseCase: UpdateNotificationPreferencesUseCase
  ) {}

  async sendNotification(c: Context): Promise<Response> {
    const validation = SendNotificationSchema.safeParse(await c.req.json());
    if (!validation.success) {
      return c.json({ error: 'Invalid request', details: validation.error }, 400);
    }

    const command = new SendNotificationCommand(validation.data);
    const result = await this.sendNotificationUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    return c.json({
      notificationId: result.value.notificationId,
      channels: result.value.channels,
      scheduledFor: result.value.scheduledFor
    }, 201);
  }

  async getNotificationStatus(c: Context): Promise<Response> {
    const notificationId = c.req.param('notificationId');
    
    const command = new GetNotificationStatusCommand({ notificationId });
    const result = await this.getNotificationStatusUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 404);
    }

    return c.json({
      notificationId: result.value.notificationId,
      status: result.value.status,
      channels: result.value.channelStatuses,
      createdAt: result.value.createdAt,
      sentAt: result.value.sentAt
    });
  }

  async updatePreferences(c: Context): Promise<Response> {
    const userId = c.get('userId'); // From authentication middleware
    const validation = UpdatePreferencesSchema.safeParse(await c.req.json());
    
    if (!validation.success) {
      return c.json({ error: 'Invalid request', details: validation.error }, 400);
    }

    const command = new UpdateNotificationPreferencesCommand({
      userId: new UserId(userId),
      preferences: validation.data
    });

    const result = await this.updatePreferencesUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    return c.json({ message: 'Preferences updated successfully' });
  }
}
```

## Testing Patterns

### Unit Tests

**Domain Entity Tests**
```typescript
// packages/core/domain/notifications/__tests__/Notification.test.ts
describe('Notification Domain Entity', () => {
  describe('create', () => {
    it('should create notification with multiple channels', () => {
      const result = Notification.create({
        recipientId: new UserId('user_123'),
        type: NotificationType.WELCOME,
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS],
        templateId: new TemplateId('template_123'),
        variables: { name: 'John' }
      });

      expect(result.isSuccess).toBe(true);
      const notification = result.value;
      expect(notification.channels).toHaveLength(2);
      expect(notification.status).toBe(NotificationStatus.PENDING);
    });

    it('should require at least one channel', () => {
      const result = Notification.create({
        recipientId: new UserId('user_123'),
        type: NotificationType.WELCOME,
        channels: [],
        templateId: new TemplateId('template_123'),
        variables: { name: 'John' }
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('At least one notification channel');
    });
  });

  describe('markChannelAsDelivered', () => {
    it('should update status to delivered when all channels succeed', () => {
      const notification = createTestNotification();
      
      notification.markChannelAsDelivered(
        NotificationChannel.EMAIL,
        'msg_123',
        new Date()
      );

      expect(notification.status).toBe(NotificationStatus.DELIVERED);
    });
  });
});
```

**Channel Implementation Tests**
```typescript
// packages/notifications/__tests__/EmailChannel.test.ts
describe('EmailChannel', () => {
  let emailChannel: EmailChannel;
  let mockTransporter: jest.Mocked<Transporter>;

  beforeEach(() => {
    mockTransporter = createMockTransporter();
    emailChannel = new EmailChannel({
      smtp: {
        host: 'smtp.test.com',
        port: 587,
        username: 'test@example.com',
        password: 'password'
      }
    });
    
    // Override transporter with mock
    (emailChannel as any).transporter = mockTransporter;
  });

  it('should send email successfully', async () => {
    mockTransporter.sendMail.mockResolvedValue({
      messageId: 'msg_123',
      response: '250 OK'
    });

    const request: SendNotificationRequest = {
      recipient: {
        userId: new UserId('user_123'),
        email: 'user@example.com'
      },
      template: {
        id: 'template_123',
        subject: 'Welcome {{name}}',
        htmlBody: '<p>Hello {{name}}</p>',
        fromAddress: 'noreply@example.com'
      },
      variables: { name: 'John' }
    };

    const result = await emailChannel.send(request);

    expect(result.isSuccess).toBe(true);
    expect(result.value.externalId).toBe('msg_123');
    expect(mockTransporter.sendMail).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'user@example.com',
      subject: 'Welcome John',
      html: '<p>Hello John</p>',
      text: 'Hello John',
      headers: expect.objectContaining({
        'X-User-ID': 'user_123'
      })
    });
  });

  it('should handle invalid email address', async () => {
    const request: SendNotificationRequest = {
      recipient: {
        userId: new UserId('user_123'),
        email: 'invalid-email'
      },
      template: {
        id: 'template_123',
        subject: 'Test',
        htmlBody: '<p>Test</p>'
      },
      variables: {}
    };

    const validationResult = await emailChannel.validateRecipient(request.recipient);

    expect(validationResult.isFailure).toBe(true);
    expect(validationResult.error.message).toContain('Invalid email address format');
  });
});
```

### Integration Tests

```typescript
// packages/notifications/__tests__/integration/NotificationFlow.test.ts
describe('Notification Flow Integration', () => {
  let testContainer: TestContainer;

  beforeAll(async () => {
    testContainer = await createTestContainer();
  });

  afterAll(async () => {
    await testContainer.cleanup();
  });

  it('should send multi-channel notification successfully', async () => {
    const sendUseCase = testContainer.resolve('SendNotificationUseCase');
    const deliveryProcessor = testContainer.resolve('NotificationDeliveryJobProcessor');

    // Send notification
    const command = new SendNotificationCommand({
      recipientId: new UserId('user_123'),
      type: NotificationType.WELCOME,
      templateId: new TemplateId('welcome_template'),
      variables: { name: 'John', email: 'john@example.com' }
    });

    const result = await sendUseCase.execute(command);

    expect(result.isSuccess).toBe(true);
    expect(result.value.channels).toContain(NotificationChannel.EMAIL);

    // Process delivery job
    const job = createTestJob({
      name: 'deliver-notification',
      data: {
        notificationId: result.value.notificationId,
        channel: NotificationChannel.EMAIL,
        attempt: 1
      }
    });

    const deliveryResult = await deliveryProcessor.process(job, job.data);

    expect(deliveryResult.isSuccess).toBe(true);
  });
});
```

## Performance & Monitoring

### Metrics Collection

```typescript
// packages/notifications/src/monitoring/NotificationMetrics.ts
export class NotificationMetrics {
  private static readonly metrics = {
    notificationsSent: createCounter('notifications_sent_total'),
    notificationsFailed: createCounter('notifications_failed_total'),
    channelDeliveryTime: createHistogram('notification_channel_delivery_duration_seconds'),
    templateRenderTime: createHistogram('template_render_duration_seconds'),
    channelFailureRate: createGauge('notification_channel_failure_rate')
  };

  static recordNotificationSent(type: NotificationType, channel: NotificationChannel): void {
    NotificationMetrics.metrics.notificationsSent.inc({
      notification_type: type,
      channel: channel
    });
  }

  static recordNotificationFailed(
    type: NotificationType,
    channel: NotificationChannel,
    reason: string
  ): void {
    NotificationMetrics.metrics.notificationsFailed.inc({
      notification_type: type,
      channel: channel,
      failure_reason: reason
    });
  }

  static recordChannelDeliveryTime(
    channel: NotificationChannel,
    durationMs: number
  ): void {
    NotificationMetrics.metrics.channelDeliveryTime.observe(
      { channel: channel },
      durationMs / 1000
    );
  }

  static recordTemplateRenderTime(templateId: string, durationMs: number): void {
    NotificationMetrics.metrics.templateRenderTime.observe(
      { template_id: templateId },
      durationMs / 1000
    );
  }
}
```

```yaml
# Embedded DSL Verification
verify:
  exists:
    - "packages/core/domain/notifications/entities/Notification.ts"
    - "packages/core/domain/notifications/entities/NotificationTemplate.ts"
    - "packages/core/domain/notifications/entities/NotificationPreferences.ts"
    - "packages/core/interfaces/notifications/INotificationChannel.ts"
    - "packages/api/src/use-cases/notifications/SendNotificationUseCase.ts"
    - "packages/notifications/src/channels/EmailChannel.ts"
    - "packages/api/src/processors/NotificationDeliveryJobProcessor.ts"

  contains:
    - file: "packages/core/domain/notifications/entities/Notification.ts"
      pattern: "class Notification extends AggregateRoot"
    
    - file: "packages/notifications/src/channels/EmailChannel.ts"
      pattern: "implements INotificationChannel"
    
    - file: "packages/notifications/src/channels/EmailChannel.ts"
      pattern: "nodemailer.createTransporter"
    
    - file: "packages/api/src/processors/NotificationDeliveryJobProcessor.ts"
      pattern: "implements IJobProcessor"

  patterns:
    - name: "Nodemailer Integration"
      files: ["packages/notifications/src/channels/EmailChannel.ts"]
      pattern: "from 'nodemailer'"
    
    - name: "Multi-channel Support"
      files: ["packages/notifications/src/channels/*.ts"]
      pattern: "implements INotificationChannel"
    
    - name: "Template Rendering"
      files: ["packages/notifications/src/channels/*.ts"]
      pattern: "renderTemplate"
    
    - name: "Domain Events"
      files: ["packages/core/domain/notifications/entities/*.ts"]
      pattern: "this.addDomainEvent"

  constraints:
    - name: "Channel Abstraction"
      description: "Domain should not depend on specific channel implementations"
      verify: "no_imports"
      from: "packages/core/domain/notifications/**/*.ts"
      to: "packages/notifications/src/channels/**/*.ts"

commands:
  - name: "test:notifications"
    description: "Run notification domain and use case tests"
    command: "pnpm test packages/core/domain/notifications packages/api/src/use-cases/notifications"
  
  - name: "test:notifications:integration"
    description: "Run notification integration tests"
    command: "pnpm test packages/notifications/__tests__/integration"
  
  - name: "start:notification-workers"
    description: "Start notification delivery workers"
    command: "pnpm --filter @repo/notifications start:workers"
```

## Key Implementation Notes

1. **Multi-Channel Strategy**: Use the Strategy pattern to support different notification channels while maintaining a common interface.

2. **User Preference Management**: Respect user preferences while allowing urgent notifications to override certain settings.

3. **Template Management**: Implement a flexible template system that supports different content formats for each channel.

4. **Delivery Tracking**: Track delivery status across multiple channels and implement proper retry logic.

5. **Nodemailer Integration**: Follow Nodemailer best practices including TLS configuration, connection pooling, and error handling.

6. **Queue Integration**: Leverage background job patterns for asynchronous notification processing with proper retry strategies.

7. **Domain Events**: Use domain events to trigger side effects like analytics tracking or webhook notifications.

8. **Error Handling**: Distinguish between retryable and permanent failures to optimize delivery success rates.

9. **Performance**: Implement connection pooling, rate limiting, and batch processing where appropriate.

10. **Monitoring**: Comprehensive metrics and logging for notification delivery analysis and troubleshooting.

This pattern provides a robust, scalable, and user-friendly notification system while maintaining Clean Architecture principles and supporting multiple delivery channels with proper fallback mechanisms.