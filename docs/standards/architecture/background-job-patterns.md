# Background Job Patterns

**Category**: Architecture  
**Type**: Implementation Pattern  
**Scope**: Backend Services  
**Related Standards**: [Clean Architecture](./clean-architecture.md), [Use Case Patterns](./use-case-patterns.md), [Resilience Patterns](./resilience-patterns.md)

## Overview

This document establishes comprehensive patterns for implementing background job processing systems following Clean Architecture principles. It covers job queues, workers, retry strategies, dead letter queues, and monitoring while maintaining domain isolation and high reliability.

## Architecture Layers

### Domain Layer

#### Job Domain Entities

**Job Aggregate Root**
```typescript
// packages/core/domain/jobs/entities/Job.ts
import { AggregateRoot } from '@repo/domain/base/AggregateRoot';
import { Result } from '@repo/domain/base/Result';

export class Job extends AggregateRoot {
  private constructor(
    private readonly _id: JobId,
    private readonly _name: JobName,
    private readonly _queueName: QueueName,
    private _status: JobStatus,
    private _data: Record<string, any>,
    private _options: JobOptions,
    private _attempts: number,
    private _progress: number,
    private _processedAt: Date | null,
    private _failedAt: Date | null,
    private _failureReason: string | null,
    private readonly _createdAt: Date,
    private _scheduledFor: Date | null
  ) {
    super(_id.value);
  }

  public static create(props: {
    name: JobName;
    queueName: QueueName;
    data: Record<string, any>;
    options?: Partial<JobOptions>;
    scheduledFor?: Date;
  }): Result<Job> {
    const defaultOptions: JobOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      delay: 0,
      priority: 0,
      removeOnComplete: 10,
      removeOnFail: 50
    };

    const job = new Job(
      JobId.create(),
      props.name,
      props.queueName,
      JobStatus.WAITING,
      props.data,
      { ...defaultOptions, ...props.options },
      0,
      0,
      null,
      null,
      null,
      new Date(),
      props.scheduledFor || null
    );

    job.addDomainEvent(new JobCreatedEvent(job));
    return Result.ok(job);
  }

  public updateProgress(progress: number): Result<void> {
    if (progress < 0 || progress > 100) {
      return Result.fail(new DomainError('Progress must be between 0 and 100'));
    }

    if (this._status !== JobStatus.ACTIVE) {
      return Result.fail(new DomainError('Cannot update progress of non-active job'));
    }

    this._progress = progress;
    this.addDomainEvent(new JobProgressUpdatedEvent(this, progress));
    return Result.ok();
  }

  public markAsActive(): Result<void> {
    if (this._status !== JobStatus.WAITING && this._status !== JobStatus.DELAYED) {
      return Result.fail(new DomainError('Job must be waiting or delayed to be activated'));
    }

    this._status = JobStatus.ACTIVE;
    this._processedAt = new Date();
    this.addDomainEvent(new JobActivatedEvent(this));
    return Result.ok();
  }

  public markAsCompleted(result?: any): Result<void> {
    if (this._status !== JobStatus.ACTIVE) {
      return Result.fail(new DomainError('Only active jobs can be completed'));
    }

    this._status = JobStatus.COMPLETED;
    this.addDomainEvent(new JobCompletedEvent(this, result));
    return Result.ok();
  }

  public markAsFailed(error: Error, canRetry: boolean = true): Result<void> {
    this._attempts++;
    this._failedAt = new Date();
    this._failureReason = error.message;

    if (canRetry && this._attempts < this._options.attempts) {
      this._status = JobStatus.WAITING;
      
      // Calculate retry delay based on backoff strategy
      const delay = this.calculateRetryDelay();
      if (delay > 0) {
        this._status = JobStatus.DELAYED;
        this._scheduledFor = new Date(Date.now() + delay);
      }

      this.addDomainEvent(new JobRetryScheduledEvent(this, error));
    } else {
      this._status = JobStatus.FAILED;
      this.addDomainEvent(new JobFailedEvent(this, error));
    }

    return Result.ok();
  }

  public moveToDeadLetter(reason: string): Result<void> {
    this._status = JobStatus.DEAD_LETTER;
    this._failureReason = reason;
    this.addDomainEvent(new JobMovedToDeadLetterEvent(this, reason));
    return Result.ok();
  }

  private calculateRetryDelay(): number {
    const { backoff } = this._options;
    
    switch (backoff.type) {
      case 'fixed':
        return backoff.delay;
      
      case 'exponential':
        const exponentialDelay = backoff.delay * Math.pow(2, this._attempts - 1);
        const jitter = backoff.jitter ? Math.random() * backoff.jitter * exponentialDelay : 0;
        return exponentialDelay + jitter;
      
      case 'custom':
        return backoff.strategy!(this._attempts, backoff.delay);
      
      default:
        return 0;
    }
  }

  // Getters
  public get id(): JobId { return this._id; }
  public get name(): JobName { return this._name; }
  public get queueName(): QueueName { return this._queueName; }
  public get status(): JobStatus { return this._status; }
  public get data(): Record<string, any> { return { ...this._data }; }
  public get attempts(): number { return this._attempts; }
  public get progress(): number { return this._progress; }
  public get isActive(): boolean { return this._status === JobStatus.ACTIVE; }
  public get isCompleted(): boolean { return this._status === JobStatus.COMPLETED; }
  public get isFailed(): boolean { return this._status === JobStatus.FAILED; }
  public get canRetry(): boolean { return this._attempts < this._options.attempts; }
}
```

**Queue Configuration Entity**
```typescript
// packages/core/domain/jobs/entities/QueueConfig.ts
export class QueueConfig extends Entity<QueueConfigId> {
  private constructor(
    id: QueueConfigId,
    private readonly _name: QueueName,
    private _concurrency: number,
    private _rateLimiting: RateLimitConfig | null,
    private _defaultJobOptions: JobOptions,
    private _isActive: boolean
  ) {
    super(id);
  }

  public static create(props: {
    name: QueueName;
    concurrency: number;
    rateLimiting?: RateLimitConfig;
    defaultJobOptions?: Partial<JobOptions>;
  }): Result<QueueConfig> {
    if (props.concurrency <= 0) {
      return Result.fail(new DomainError('Concurrency must be greater than 0'));
    }

    const defaultOptions: JobOptions = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      delay: 0,
      priority: 0,
      removeOnComplete: 10,
      removeOnFail: 50
    };

    return Result.ok(new QueueConfig(
      QueueConfigId.create(),
      props.name,
      props.concurrency,
      props.rateLimiting || null,
      { ...defaultOptions, ...props.defaultJobOptions },
      true
    ));
  }

  public updateConcurrency(concurrency: number): Result<void> {
    if (concurrency <= 0) {
      return Result.fail(new DomainError('Concurrency must be greater than 0'));
    }

    this._concurrency = concurrency;
    return Result.ok();
  }

  public updateRateLimiting(rateLimiting: RateLimitConfig | null): Result<void> {
    this._rateLimiting = rateLimiting;
    return Result.ok();
  }

  // Getters
  public get name(): QueueName { return this._name; }
  public get concurrency(): number { return this._concurrency; }
  public get rateLimiting(): RateLimitConfig | null { return this._rateLimiting; }
  public get defaultJobOptions(): JobOptions { return { ...this._defaultJobOptions }; }
  public get isActive(): boolean { return this._isActive; }
}
```

#### Domain Services

**Job Scheduler Service**
```typescript
// packages/core/domain/jobs/services/JobSchedulerService.ts
export class JobSchedulerService {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly queueConfigRepository: IQueueConfigRepository
  ) {}

  async scheduleJob(command: {
    name: string;
    queueName: string;
    data: Record<string, any>;
    options?: Partial<JobOptions>;
    scheduledFor?: Date;
  }): Promise<Result<Job>> {
    // Validate queue exists and is active
    const queueConfig = await this.queueConfigRepository.findByName(
      new QueueName(command.queueName)
    );
    
    if (!queueConfig) {
      return Result.fail(new DomainError(`Queue '${command.queueName}' not found`));
    }

    if (!queueConfig.isActive) {
      return Result.fail(new DomainError(`Queue '${command.queueName}' is not active`));
    }

    // Merge queue default options with job-specific options
    const jobOptions = {
      ...queueConfig.defaultJobOptions,
      ...command.options
    };

    const jobResult = Job.create({
      name: new JobName(command.name),
      queueName: new QueueName(command.queueName),
      data: command.data,
      options: jobOptions,
      scheduledFor: command.scheduledFor
    });

    if (jobResult.isFailure) {
      return Result.fail(jobResult.error);
    }

    const job = jobResult.value;
    await this.jobRepository.save(job);

    return Result.ok(job);
  }

  async scheduleRecurringJob(command: {
    name: string;
    queueName: string;
    data: Record<string, any>;
    cronPattern: string;
    options?: Partial<JobOptions>;
  }): Promise<Result<void>> {
    // Implementation for recurring jobs using cron patterns
    // This would integrate with BullMQ's repeat functionality
    const nextExecution = this.calculateNextExecution(command.cronPattern);
    
    const jobResult = await this.scheduleJob({
      ...command,
      scheduledFor: nextExecution
    });

    return jobResult.isSuccess 
      ? Result.ok() 
      : Result.fail(jobResult.error);
  }

  private calculateNextExecution(cronPattern: string): Date {
    // Implementation would use a cron parsing library
    // This is simplified for demonstration
    return new Date(Date.now() + 60000); // Next minute
  }
}
```

### Application Layer

#### Job Processor Interface

**Core Job Processor**
```typescript
// packages/core/interfaces/jobs/IJobProcessor.ts
export interface IJobProcessor<TData = any, TResult = any> {
  readonly name: string;
  readonly queueName: string;
  
  process(job: Job, data: TData, token?: string): Promise<Result<TResult>>;
  onActive?(job: Job): Promise<void>;
  onProgress?(job: Job, progress: number): Promise<void>;
  onCompleted?(job: Job, result: TResult): Promise<void>;
  onFailed?(job: Job, error: Error): Promise<void>;
  onStalled?(job: Job): Promise<void>;
}
```

**Step-based Job Processor**
```typescript
// packages/core/interfaces/jobs/IStepJobProcessor.ts
export interface IStepJobProcessor<TData = any> extends IJobProcessor<TData> {
  processStep(job: Job, step: JobStep, data: TData): Promise<Result<JobStep | 'FINISHED'>>;
}

export abstract class BaseStepJobProcessor<TData = any> implements IStepJobProcessor<TData> {
  abstract readonly name: string;
  abstract readonly queueName: string;

  async process(job: Job, data: TData & { step?: JobStep }, token?: string): Promise<Result<any>> {
    let currentStep = data.step || JobStep.INITIAL;

    while (currentStep !== JobStep.FINISHED) {
      const stepResult = await this.processStep(job, currentStep, data);
      
      if (stepResult.isFailure) {
        return Result.fail(stepResult.error);
      }

      const nextStep = stepResult.value;
      
      if (nextStep === 'FINISHED') {
        currentStep = JobStep.FINISHED;
      } else {
        // Update job data with new step
        await this.updateJobStep(job, nextStep);
        currentStep = nextStep;
      }
    }

    return Result.ok('FINISHED');
  }

  abstract processStep(job: Job, step: JobStep, data: TData): Promise<Result<JobStep | 'FINISHED'>>;

  protected async updateJobStep(job: Job, step: JobStep): Promise<void> {
    // Update job data in the queue to persist step progress
    // This ensures that if the job fails and retries, it resumes from the correct step
  }
}
```

#### Use Cases

**Process Job Use Case**
```typescript
// packages/api/src/use-cases/jobs/ProcessJobUseCase.ts
export class ProcessJobUseCase implements IUseCase<ProcessJobCommand, ProcessJobResult> {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly processorRegistry: IJobProcessorRegistry,
    private readonly unitOfWork: IUnitOfWork
  ) {}

  async execute(command: ProcessJobCommand): Promise<Result<ProcessJobResult>> {
    return await this.unitOfWork.transaction(async () => {
      // Retrieve job
      const job = await this.jobRepository.findById(new JobId(command.jobId));
      if (!job) {
        return Result.fail(new NotFoundError('Job not found'));
      }

      // Find appropriate processor
      const processor = this.processorRegistry.getProcessor(
        job.name.value,
        job.queueName.value
      );

      if (!processor) {
        const error = new ProcessorNotFoundError(job.name.value, job.queueName.value);
        job.moveToDeadLetter(error.message);
        await this.jobRepository.save(job);
        return Result.fail(error);
      }

      // Mark job as active
      const activateResult = job.markAsActive();
      if (activateResult.isFailure) {
        return Result.fail(activateResult.error);
      }

      try {
        // Process the job
        const processingResult = await processor.process(job, job.data, command.token);

        if (processingResult.isSuccess) {
          // Mark as completed
          job.markAsCompleted(processingResult.value);
          await processor.onCompleted?.(job, processingResult.value);
        } else {
          // Handle failure with retry logic
          await this.handleJobFailure(job, processor, processingResult.error);
        }

        await this.jobRepository.save(job);

        return Result.ok({
          jobId: job.id.value,
          status: job.status,
          result: processingResult.isSuccess ? processingResult.value : null
        });

      } catch (error) {
        await this.handleJobFailure(job, processor, error);
        await this.jobRepository.save(job);
        return Result.fail(new ApplicationError('Job processing failed', error));
      }
    });
  }

  private async handleJobFailure(
    job: Job,
    processor: IJobProcessor,
    error: any
  ): Promise<void> {
    // Check if error is unrecoverable
    const isUnrecoverable = error instanceof UnrecoverableJobError ||
                           error.name === 'UnrecoverableError';

    if (isUnrecoverable) {
      job.moveToDeadLetter(error.message);
    } else {
      job.markAsFailed(error, !isUnrecoverable);
    }

    await processor.onFailed?.(job, error);
  }
}
```

**Schedule Job Use Case**
```typescript
// packages/api/src/use-cases/jobs/ScheduleJobUseCase.ts
export class ScheduleJobUseCase implements IUseCase<ScheduleJobCommand, ScheduleJobResult> {
  constructor(
    private readonly jobSchedulerService: JobSchedulerService,
    private readonly queueManager: IQueueManager
  ) {}

  async execute(command: ScheduleJobCommand): Promise<Result<ScheduleJobResult>> {
    try {
      // Schedule the job in domain
      const jobResult = await this.jobSchedulerService.scheduleJob({
        name: command.name,
        queueName: command.queueName,
        data: command.data,
        options: command.options,
        scheduledFor: command.scheduledFor
      });

      if (jobResult.isFailure) {
        return Result.fail(jobResult.error);
      }

      const job = jobResult.value;

      // Add to queue infrastructure
      const addResult = await this.queueManager.addJob({
        id: job.id.value,
        name: job.name.value,
        queueName: job.queueName.value,
        data: job.data,
        options: {
          delay: command.scheduledFor 
            ? Math.max(0, command.scheduledFor.getTime() - Date.now()) 
            : 0,
          attempts: job.canRetry ? 3 : 1,
          backoff: command.options?.backoff || { type: 'exponential', delay: 1000 },
          priority: command.options?.priority || 0
        }
      });

      if (addResult.isFailure) {
        return Result.fail(addResult.error);
      }

      return Result.ok({
        jobId: job.id.value,
        queueName: job.queueName.value,
        scheduledFor: command.scheduledFor
      });

    } catch (error) {
      return Result.fail(new ApplicationError('Failed to schedule job', error));
    }
  }
}
```

### Infrastructure Layer

#### BullMQ Implementation

**BullMQ Queue Manager**
```typescript
// packages/jobs/src/infrastructure/BullMQQueueManager.ts
import { Queue, Worker, Job as BullJob } from 'bullmq';
import { Redis } from 'ioredis';

export class BullMQQueueManager implements IQueueManager {
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();
  private readonly connection: Redis;

  constructor(
    private readonly redisConfig: RedisConfig,
    private readonly processorRegistry: IJobProcessorRegistry
  ) {
    this.connection = new Redis({
      ...redisConfig,
      maxRetriesPerRequest: null,
      lazyConnect: true
    });
  }

  async addJob(request: AddJobRequest): Promise<Result<void>> {
    try {
      const queue = await this.getOrCreateQueue(request.queueName);
      
      await queue.add(request.name, request.data, {
        jobId: request.id,
        delay: request.options.delay,
        attempts: request.options.attempts,
        backoff: this.mapBackoffStrategy(request.options.backoff),
        priority: request.options.priority,
        removeOnComplete: request.options.removeOnComplete || 10,
        removeOnFail: request.options.removeOnFail || 50
      });

      return Result.ok();
    } catch (error) {
      return Result.fail(new QueueError('Failed to add job to queue', error));
    }
  }

  async createWorker(queueName: string, concurrency: number = 1): Promise<Result<void>> {
    try {
      if (this.workers.has(queueName)) {
        return Result.ok(); // Worker already exists
      }

      const worker = new Worker(
        queueName,
        async (bullJob: BullJob) => {
          return await this.processJobWithProcessor(bullJob);
        },
        {
          connection: this.connection,
          concurrency,
          settings: {
            backoffStrategy: this.createCustomBackoffStrategy(),
          }
        }
      );

      // Set up event handlers
      this.setupWorkerEventHandlers(worker);

      this.workers.set(queueName, worker);
      return Result.ok();

    } catch (error) {
      return Result.fail(new QueueError('Failed to create worker', error));
    }
  }

  private async processJobWithProcessor(bullJob: BullJob): Promise<any> {
    const processor = this.processorRegistry.getProcessor(bullJob.name, bullJob.queueName);
    
    if (!processor) {
      throw new ProcessorNotFoundError(bullJob.name, bullJob.queueName);
    }

    // Convert BullMQ job to domain job
    const domainJob = this.mapBullJobToDomainJob(bullJob);
    
    // Set up progress reporting
    const progressHandler = (progress: number) => {
      bullJob.updateProgress(progress);
    };

    try {
      // Process with domain processor
      const result = await processor.process(domainJob, bullJob.data, bullJob.token);
      
      if (result.isFailure) {
        if (result.error instanceof UnrecoverableJobError) {
          throw new UnrecoverableError(result.error.message);
        }
        throw result.error;
      }

      return result.value;

    } catch (error) {
      // Handle rate limiting
      if (error instanceof RateLimitError) {
        const queue = await this.getOrCreateQueue(bullJob.queueName);
        await queue.rateLimit(error.duration || 60000);
        
        if (bullJob.attemptsStarted >= bullJob.opts.attempts!) {
          throw new UnrecoverableError('Rate limited and max attempts reached');
        }
        
        throw error;
      }

      // Handle waiting children
      if (error instanceof WaitingChildrenError) {
        const shouldWait = await bullJob.moveToWaitingChildren(bullJob.token);
        if (!shouldWait) {
          // All children completed, continue processing
          return await this.processJobWithProcessor(bullJob);
        }
        throw error;
      }

      throw error;
    }
  }

  private setupWorkerEventHandlers(worker: Worker): void {
    worker.on('completed', async (job: BullJob, returnvalue: any) => {
      const processor = this.processorRegistry.getProcessor(job.name, job.queueName);
      const domainJob = this.mapBullJobToDomainJob(job);
      await processor?.onCompleted?.(domainJob, returnvalue);
    });

    worker.on('failed', async (job: BullJob | undefined, error: Error) => {
      if (!job) return;
      
      const processor = this.processorRegistry.getProcessor(job.name, job.queueName);
      const domainJob = this.mapBullJobToDomainJob(job);
      await processor?.onFailed?.(domainJob, error);
    });

    worker.on('active', async (job: BullJob) => {
      const processor = this.processorRegistry.getProcessor(job.name, job.queueName);
      const domainJob = this.mapBullJobToDomainJob(job);
      await processor?.onActive?.(domainJob);
    });

    worker.on('progress', async (job: BullJob, progress: number | object) => {
      const processor = this.processorRegistry.getProcessor(job.name, job.queueName);
      const domainJob = this.mapBullJobToDomainJob(job);
      const progressValue = typeof progress === 'number' ? progress : 0;
      await processor?.onProgress?.(domainJob, progressValue);
    });

    worker.on('stalled', async (jobId: string) => {
      // Handle stalled jobs
      console.warn(`Job ${jobId} stalled`);
    });
  }

  private createCustomBackoffStrategy() {
    return (attemptsMade: number, type: string, error: Error, job: BullJob) => {
      switch (type) {
        case 'fixed':
          return 1000; // 1 second
        
        case 'exponential':
          return Math.min(1000 * Math.pow(2, attemptsMade - 1), 30000); // Max 30 seconds
        
        case 'linear':
          return attemptsMade * 1000;
        
        default:
          return 1000 * attemptsMade;
      }
    };
  }

  private mapBackoffStrategy(backoff: BackoffStrategy): any {
    if (backoff.type === 'custom' && backoff.strategy) {
      return {
        type: 'custom',
        delay: backoff.delay
      };
    }

    return {
      type: backoff.type,
      delay: backoff.delay,
      jitter: backoff.jitter
    };
  }

  private async getOrCreateQueue(queueName: string): Promise<Queue> {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName)!;
    }

    const queue = new Queue(queueName, {
      connection: this.connection,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        }
      }
    });

    this.queues.set(queueName, queue);
    return queue;
  }

  private mapBullJobToDomainJob(bullJob: BullJob): Job {
    // This would be implemented to convert BullMQ job to domain job
    // For now, returning a simplified mapping
    return {
      id: new JobId(bullJob.id!),
      name: new JobName(bullJob.name),
      queueName: new QueueName(bullJob.queueName),
      data: bullJob.data,
      progress: bullJob.progress || 0,
      attempts: bullJob.attemptsMade || 0
    } as Job;
  }

  async pauseQueue(queueName: string): Promise<Result<void>> {
    try {
      const queue = this.queues.get(queueName);
      if (queue) {
        await queue.pause();
      }
      return Result.ok();
    } catch (error) {
      return Result.fail(new QueueError('Failed to pause queue', error));
    }
  }

  async resumeQueue(queueName: string): Promise<Result<void>> {
    try {
      const queue = this.queues.get(queueName);
      if (queue) {
        await queue.resume();
      }
      return Result.ok();
    } catch (error) {
      return Result.fail(new QueueError('Failed to resume queue', error));
    }
  }
}
```

**Example Job Processors**

**Email Job Processor**
```typescript
// packages/api/src/processors/EmailJobProcessor.ts
export class EmailJobProcessor implements IJobProcessor<EmailJobData, void> {
  readonly name = 'send-email';
  readonly queueName = 'notifications';

  constructor(
    private readonly emailService: IEmailService,
    private readonly userRepository: IUserRepository
  ) {}

  async process(job: Job, data: EmailJobData, token?: string): Promise<Result<void>> {
    try {
      // Update progress
      await job.updateProgress(10);

      // Validate recipient
      const user = await this.userRepository.findById(new UserId(data.userId));
      if (!user) {
        return Result.fail(new UnrecoverableJobError('User not found'));
      }

      await job.updateProgress(30);

      // Prepare email
      const emailResult = await this.emailService.prepareEmail({
        to: user.email.value,
        templateId: data.templateId,
        variables: data.variables
      });

      if (emailResult.isFailure) {
        return Result.fail(emailResult.error);
      }

      await job.updateProgress(70);

      // Send email
      const sendResult = await this.emailService.send(emailResult.value);
      if (sendResult.isFailure) {
        // Check if it's a temporary failure (rate limiting, service unavailable)
        if (this.isTemporaryFailure(sendResult.error)) {
          throw new RateLimitError('Email service temporarily unavailable', 300000); // 5 minutes
        }
        return Result.fail(sendResult.error);
      }

      await job.updateProgress(100);
      return Result.ok();

    } catch (error) {
      return Result.fail(error);
    }
  }

  async onCompleted(job: Job, result: void): Promise<void> {
    console.log(`Email job ${job.id.value} completed successfully`);
  }

  async onFailed(job: Job, error: Error): Promise<void> {
    console.error(`Email job ${job.id.value} failed:`, error);
  }

  private isTemporaryFailure(error: any): boolean {
    return error.code === 'RATE_LIMIT_EXCEEDED' ||
           error.code === 'SERVICE_UNAVAILABLE' ||
           error.statusCode >= 500;
  }
}
```

**Multi-step Data Processing Job**
```typescript
// packages/api/src/processors/DataProcessingJobProcessor.ts
enum DataProcessingStep {
  INITIAL = 'initial',
  VALIDATE = 'validate',
  TRANSFORM = 'transform',
  SAVE = 'save',
  NOTIFY = 'notify',
  FINISHED = 'finished'
}

export class DataProcessingJobProcessor extends BaseStepJobProcessor<DataProcessingJobData> {
  readonly name = 'process-data';
  readonly queueName = 'data-processing';

  constructor(
    private readonly dataValidationService: IDataValidationService,
    private readonly dataTransformationService: IDataTransformationService,
    private readonly dataRepository: IDataRepository,
    private readonly notificationService: INotificationService
  ) {
    super();
  }

  async processStep(
    job: Job,
    step: DataProcessingStep,
    data: DataProcessingJobData
  ): Promise<Result<DataProcessingStep | 'FINISHED'>> {
    try {
      switch (step) {
        case DataProcessingStep.INITIAL:
          await job.updateProgress(10);
          return Result.ok(DataProcessingStep.VALIDATE);

        case DataProcessingStep.VALIDATE:
          const validationResult = await this.dataValidationService.validate(data.rawData);
          if (validationResult.isFailure) {
            return Result.fail(new UnrecoverableJobError('Data validation failed'));
          }
          await job.updateProgress(30);
          return Result.ok(DataProcessingStep.TRANSFORM);

        case DataProcessingStep.TRANSFORM:
          const transformResult = await this.dataTransformationService.transform(
            data.rawData,
            data.transformationRules
          );
          if (transformResult.isFailure) {
            return Result.fail(transformResult.error);
          }
          
          // Update job data with transformed result
          data.transformedData = transformResult.value;
          await job.updateProgress(60);
          return Result.ok(DataProcessingStep.SAVE);

        case DataProcessingStep.SAVE:
          const saveResult = await this.dataRepository.saveProcessedData(data.transformedData);
          if (saveResult.isFailure) {
            return Result.fail(saveResult.error);
          }
          
          data.savedId = saveResult.value.id;
          await job.updateProgress(80);
          return Result.ok(DataProcessingStep.NOTIFY);

        case DataProcessingStep.NOTIFY:
          if (data.notifyOnCompletion) {
            await this.notificationService.notifyDataProcessingComplete({
              userId: data.userId,
              dataId: data.savedId
            });
          }
          await job.updateProgress(100);
          return Result.ok('FINISHED');

        default:
          return Result.fail(new DomainError(`Invalid step: ${step}`));
      }
    } catch (error) {
      return Result.fail(error);
    }
  }
}
```

### API Layer

#### Job Management Controller

```typescript
// packages/api/src/controllers/jobs/JobsController.ts
export class JobsController {
  constructor(
    private readonly scheduleJobUseCase: ScheduleJobUseCase,
    private readonly getJobStatusUseCase: GetJobStatusUseCase,
    private readonly retryJobUseCase: RetryJobUseCase,
    private readonly cancelJobUseCase: CancelJobUseCase
  ) {}

  async scheduleJob(c: Context): Promise<Response> {
    const validation = ScheduleJobSchema.safeParse(await c.req.json());
    if (!validation.success) {
      return c.json({ error: 'Invalid request', details: validation.error }, 400);
    }

    const command = new ScheduleJobCommand(validation.data);
    const result = await this.scheduleJobUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    return c.json({
      jobId: result.value.jobId,
      queueName: result.value.queueName,
      scheduledFor: result.value.scheduledFor
    }, 201);
  }

  async getJobStatus(c: Context): Promise<Response> {
    const jobId = c.req.param('jobId');
    
    const command = new GetJobStatusCommand({ jobId });
    const result = await this.getJobStatusUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 404);
    }

    return c.json({
      jobId: result.value.jobId,
      status: result.value.status,
      progress: result.value.progress,
      attempts: result.value.attempts,
      createdAt: result.value.createdAt,
      processedAt: result.value.processedAt,
      failureReason: result.value.failureReason
    });
  }

  async retryJob(c: Context): Promise<Response> {
    const jobId = c.req.param('jobId');
    
    const command = new RetryJobCommand({ jobId });
    const result = await this.retryJobUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    return c.json({ message: 'Job retry scheduled', jobId });
  }
}
```

## Testing Patterns

### Unit Tests

**Domain Entity Tests**
```typescript
// packages/core/domain/jobs/__tests__/Job.test.ts
describe('Job Domain Entity', () => {
  describe('create', () => {
    it('should create job with default options', () => {
      const result = Job.create({
        name: new JobName('test-job'),
        queueName: new QueueName('test-queue'),
        data: { test: 'data' }
      });

      expect(result.isSuccess).toBe(true);
      const job = result.value;
      expect(job.status).toBe(JobStatus.WAITING);
      expect(job.attempts).toBe(0);
    });
  });

  describe('markAsFailed', () => {
    it('should schedule retry when within attempt limits', () => {
      const job = createTestJob();
      
      const result = job.markAsFailed(new Error('Test error'));
      
      expect(result.isSuccess).toBe(true);
      expect(job.status).toBe(JobStatus.DELAYED);
      expect(job.attempts).toBe(1);
    });

    it('should move to failed when max attempts reached', () => {
      const job = createTestJob({ attempts: 3 });
      
      // Simulate max attempts reached
      job.markAsFailed(new Error('Attempt 1'));
      job.markAsFailed(new Error('Attempt 2'));
      const result = job.markAsFailed(new Error('Final attempt'));
      
      expect(result.isSuccess).toBe(true);
      expect(job.status).toBe(JobStatus.FAILED);
    });
  });
});
```

**Job Processor Tests**
```typescript
// packages/api/src/processors/__tests__/EmailJobProcessor.test.ts
describe('EmailJobProcessor', () => {
  let processor: EmailJobProcessor;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockEmailService = createMockEmailService();
    mockUserRepository = createMockUserRepository();
    
    processor = new EmailJobProcessor(mockEmailService, mockUserRepository);
  });

  it('should process email job successfully', async () => {
    const user = createTestUser();
    mockUserRepository.findById.mockResolvedValue(user);
    
    const emailData = createTestEmailData();
    mockEmailService.prepareEmail.mockResolvedValue(Result.ok(emailData));
    mockEmailService.send.mockResolvedValue(Result.ok());

    const job = createTestJob();
    const jobData = { userId: 'user_123', templateId: 'welcome', variables: {} };

    const result = await processor.process(job, jobData);

    expect(result.isSuccess).toBe(true);
    expect(mockEmailService.send).toHaveBeenCalledWith(emailData);
  });

  it('should handle user not found as unrecoverable error', async () => {
    mockUserRepository.findById.mockResolvedValue(null);

    const job = createTestJob();
    const jobData = { userId: 'nonexistent', templateId: 'welcome', variables: {} };

    const result = await processor.process(job, jobData);

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(UnrecoverableJobError);
  });
});
```

### Integration Tests

**BullMQ Integration Test**
```typescript
// packages/jobs/__tests__/integration/BullMQQueueManager.test.ts
describe('BullMQQueueManager Integration', () => {
  let queueManager: BullMQQueueManager;
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(process.env.REDIS_TEST_URL);
    queueManager = new BullMQQueueManager(
      { url: process.env.REDIS_TEST_URL },
      new MockProcessorRegistry()
    );
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  it('should add job to queue', async () => {
    const request: AddJobRequest = {
      id: 'job_123',
      name: 'test-job',
      queueName: 'test-queue',
      data: { test: 'data' },
      options: {
        delay: 0,
        attempts: 3,
        priority: 1,
        backoff: { type: 'exponential', delay: 1000 }
      }
    };

    const result = await queueManager.addJob(request);

    expect(result.isSuccess).toBe(true);

    // Verify job was added to Redis
    const jobData = await redis.hgetall('bull:test-queue:job_123');
    expect(jobData).toBeDefined();
  });

  it('should create worker and process jobs', async () => {
    const processingPromise = new Promise<void>((resolve) => {
      const mockProcessor: IJobProcessor = {
        name: 'test-processor',
        queueName: 'test-queue',
        process: async (job, data) => {
          expect(data.test).toBe('data');
          resolve();
          return Result.ok('completed');
        }
      };

      queueManager.registerProcessor(mockProcessor);
    });

    await queueManager.createWorker('test-queue', 1);

    await queueManager.addJob({
      id: 'job_123',
      name: 'test-processor',
      queueName: 'test-queue',
      data: { test: 'data' },
      options: { delay: 0, attempts: 1, priority: 0, backoff: { type: 'fixed', delay: 1000 } }
    });

    await processingPromise;
  });
});
```

## Error Handling & Resilience

### Error Types

```typescript
// packages/core/domain/jobs/errors/JobErrors.ts
export class UnrecoverableJobError extends DomainError {
  constructor(message: string) {
    super(`Unrecoverable job error: ${message}`);
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public readonly duration: number = 60000) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class WaitingChildrenError extends Error {
  constructor() {
    super('Job is waiting for children to complete');
    this.name = 'WaitingChildrenError';
  }
}

export class ProcessorNotFoundError extends InfrastructureError {
  constructor(jobName: string, queueName: string) {
    super(`No processor found for job '${jobName}' in queue '${queueName}'`);
  }
}
```

### Dead Letter Queue Handler

```typescript
// packages/jobs/src/handlers/DeadLetterQueueHandler.ts
export class DeadLetterQueueHandler {
  constructor(
    private readonly jobRepository: IJobRepository,
    private readonly alertingService: IAlertingService,
    private readonly queueManager: IQueueManager
  ) {}

  async processDeadLetterQueue(queueName: string): Promise<void> {
    const deadJobs = await this.jobRepository.findByStatusAndQueue(
      JobStatus.DEAD_LETTER,
      new QueueName(queueName)
    );

    for (const job of deadJobs) {
      await this.analyzeAndHandleDeadJob(job);
    }
  }

  private async analyzeAndHandleDeadJob(job: Job): Promise<void> {
    const analysis = await this.analyzeFailurePattern(job);

    switch (analysis.category) {
      case 'CONFIGURATION_ERROR':
        await this.alertingService.sendAlert({
          severity: 'HIGH',
          message: `Job ${job.id.value} failed due to configuration error`,
          metadata: { jobId: job.id.value, reason: analysis.reason }
        });
        break;

      case 'EXTERNAL_SERVICE_ERROR':
        // Potentially retry if service is back online
        if (analysis.shouldRetry) {
          await this.retryDeadJob(job);
        }
        break;

      case 'DATA_CORRUPTION':
        await this.quarantineJob(job);
        break;

      default:
        await this.logUnknownFailure(job, analysis);
    }
  }

  private async retryDeadJob(job: Job): Promise<void> {
    // Reset job status and add back to queue
    const retryResult = job.markAsWaiting();
    if (retryResult.isSuccess) {
      await this.jobRepository.save(job);
      
      await this.queueManager.addJob({
        id: job.id.value,
        name: job.name.value,
        queueName: job.queueName.value,
        data: job.data,
        options: {
          delay: 60000, // 1 minute delay
          attempts: 1,  // Single retry attempt
          priority: -1, // Lower priority
          backoff: { type: 'fixed', delay: 5000 }
        }
      });
    }
  }
}
```

## Performance Optimization

### Queue Monitoring & Metrics

```typescript
// packages/jobs/src/monitoring/QueueMonitor.ts
export class QueueMonitor {
  private static readonly metrics = {
    jobsProcessed: createCounter('jobs_processed_total'),
    jobsFailedTotal: createCounter('jobs_failed_total'),
    jobProcessingDuration: createHistogram('job_processing_duration_seconds'),
    queueLength: createGauge('queue_length'),
    activeJobs: createGauge('active_jobs')
  };

  constructor(
    private readonly queueManager: IQueueManager,
    private readonly jobRepository: IJobRepository
  ) {}

  async collectMetrics(): Promise<void> {
    const queueNames = await this.queueManager.getQueueNames();

    for (const queueName of queueNames) {
      await this.collectQueueMetrics(queueName);
    }
  }

  private async collectQueueMetrics(queueName: string): Promise<void> {
    const stats = await this.queueManager.getQueueStats(queueName);

    QueueMonitor.metrics.queueLength.set(
      { queue: queueName },
      stats.waiting + stats.delayed
    );

    QueueMonitor.metrics.activeJobs.set(
      { queue: queueName },
      stats.active
    );

    // Collect historical metrics
    const recentJobs = await this.jobRepository.findRecentByQueue(
      new QueueName(queueName),
      new Date(Date.now() - 3600000) // Last hour
    );

    let completedCount = 0;
    let failedCount = 0;
    let totalDuration = 0;

    for (const job of recentJobs) {
      if (job.isCompleted) {
        completedCount++;
        if (job.processedAt && job.createdAt) {
          totalDuration += job.processedAt.getTime() - job.createdAt.getTime();
        }
      } else if (job.isFailed) {
        failedCount++;
      }
    }

    QueueMonitor.metrics.jobsProcessed.inc(
      { queue: queueName, status: 'completed' },
      completedCount
    );

    QueueMonitor.metrics.jobsFailedTotal.inc(
      { queue: queueName },
      failedCount
    );

    if (completedCount > 0) {
      const averageDuration = totalDuration / completedCount / 1000; // Convert to seconds
      QueueMonitor.metrics.jobProcessingDuration.observe(
        { queue: queueName },
        averageDuration
      );
    }
  }

  static recordJobCompletion(queueName: string, duration: number): void {
    QueueMonitor.metrics.jobProcessingDuration.observe(
      { queue: queueName },
      duration
    );
    
    QueueMonitor.metrics.jobsProcessed.inc({
      queue: queueName,
      status: 'completed'
    });
  }

  static recordJobFailure(queueName: string, errorType: string): void {
    QueueMonitor.metrics.jobsFailedTotal.inc({
      queue: queueName,
      error_type: errorType
    });
  }
}
```

### Batch Job Processing

```typescript
// packages/jobs/src/processors/BatchJobProcessor.ts
export abstract class BatchJobProcessor<T> implements IJobProcessor<T[]> {
  abstract readonly name: string;
  abstract readonly queueName: string;
  protected abstract readonly batchSize: number;

  async process(job: Job, data: T[], token?: string): Promise<Result<void>> {
    const batches = this.createBatches(data, this.batchSize);
    let processedCount = 0;

    for (const batch of batches) {
      const batchResult = await this.processBatch(batch, job, token);
      
      if (batchResult.isFailure) {
        return Result.fail(batchResult.error);
      }

      processedCount += batch.length;
      const progress = Math.round((processedCount / data.length) * 100);
      await job.updateProgress(progress);
    }

    return Result.ok();
  }

  protected abstract processBatch(
    batch: T[], 
    job: Job, 
    token?: string
  ): Promise<Result<void>>;

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }
}

// Example implementation
export class EmailBatchJobProcessor extends BatchJobProcessor<EmailRecipient> {
  readonly name = 'send-bulk-email';
  readonly queueName = 'bulk-notifications';
  protected readonly batchSize = 50;

  constructor(private readonly emailService: IEmailService) {
    super();
  }

  protected async processBatch(
    recipients: EmailRecipient[],
    job: Job,
    token?: string
  ): Promise<Result<void>> {
    try {
      const sendResults = await Promise.allSettled(
        recipients.map(recipient => 
          this.emailService.send({
            to: recipient.email,
            templateId: recipient.templateId,
            variables: recipient.variables
          })
        )
      );

      // Check for failures
      const failures = sendResults
        .map((result, index) => ({ result, recipient: recipients[index] }))
        .filter(({ result }) => result.status === 'rejected');

      if (failures.length > 0) {
        // Log failures but don't fail the entire batch
        console.error(`Batch processing failures: ${failures.length}/${recipients.length}`);
      }

      return Result.ok();
    } catch (error) {
      return Result.fail(error);
    }
  }
}
```

```yaml
# Embedded DSL Verification
verify:
  exists:
    - "packages/core/domain/jobs/entities/Job.ts"
    - "packages/core/domain/jobs/entities/QueueConfig.ts"
    - "packages/core/domain/jobs/repositories/IJobRepository.ts"
    - "packages/core/interfaces/jobs/IJobProcessor.ts"
    - "packages/api/src/use-cases/jobs/ProcessJobUseCase.ts"
    - "packages/api/src/use-cases/jobs/ScheduleJobUseCase.ts"
    - "packages/jobs/src/infrastructure/BullMQQueueManager.ts"
    - "packages/api/src/controllers/jobs/JobsController.ts"

  contains:
    - file: "packages/core/domain/jobs/entities/Job.ts"
      pattern: "class Job extends AggregateRoot"
    
    - file: "packages/jobs/src/infrastructure/BullMQQueueManager.ts"
      pattern: "implements IQueueManager"
    
    - file: "packages/api/src/use-cases/jobs/ProcessJobUseCase.ts"
      pattern: "UnrecoverableJobError"
    
    - file: "packages/jobs/src/infrastructure/BullMQQueueManager.ts"
      pattern: "new Worker"

  patterns:
    - name: "BullMQ Integration"
      files: ["packages/jobs/src/infrastructure/*.ts"]
      pattern: "from 'bullmq'"
    
    - name: "Job Event Publishing"
      files: ["packages/core/domain/jobs/entities/*.ts"]
      pattern: "this.addDomainEvent"
    
    - name: "Step-based Processing"
      files: ["packages/api/src/processors/*.ts"]
      pattern: "BaseStepJobProcessor"
    
    - name: "Error Handling"
      files: ["packages/api/src/processors/*.ts"]
      pattern: "(UnrecoverableError|RateLimitError|WaitingChildrenError)"

  constraints:
    - name: "Clean Architecture Layering"
      description: "Domain entities must not import infrastructure"
      verify: "no_imports"
      from: "packages/core/domain/**/*.ts"
      to: "packages/jobs/src/infrastructure/**/*.ts"
    
    - name: "Queue Implementation Abstraction"
      description: "Application layer should not directly import BullMQ"
      verify: "no_imports"
      from: "packages/api/src/**/*.ts"
      to: "bullmq"

commands:
  - name: "test:jobs"
    description: "Run job domain and use case tests"
    command: "pnpm test packages/core/domain/jobs packages/api/src/use-cases/jobs"
  
  - name: "test:jobs:integration"
    description: "Run job queue integration tests"
    command: "pnpm test packages/jobs/__tests__/integration"
  
  - name: "start:workers"
    description: "Start all job workers"
    command: "pnpm --filter @repo/jobs start:workers"
  
  - name: "monitor:queues"
    description: "Monitor queue health and metrics"
    command: "pnpm --filter @repo/jobs monitor"
```

## Key Implementation Notes

1. **Domain-Driven Job Management**: Jobs are modeled as domain entities with proper business rules and invariants.

2. **Processor Registry Pattern**: Use a registry to dynamically discover and route jobs to appropriate processors.

3. **Step-based Processing**: Implement complex jobs as a series of steps that can be resumed on failure.

4. **Retry Strategies**: Implement configurable retry strategies with exponential backoff and jitter.

5. **Dead Letter Queue**: Proper handling of permanently failed jobs with alerting and manual intervention capabilities.

6. **Rate Limiting**: Handle rate limiting gracefully with proper error signaling to the queue system.

7. **Monitoring**: Comprehensive metrics collection for job processing performance and failure analysis.

8. **Batch Processing**: Efficient handling of bulk operations with progress tracking and partial failure recovery.

9. **Clean Separation**: Clear separation between domain logic, application orchestration, and infrastructure concerns.

10. **Resilience**: Built-in resilience patterns including circuit breakers, retries, and graceful degradation.

This pattern provides a robust, scalable, and maintainable approach to background job processing while maintaining Clean Architecture principles and leveraging proven queue management strategies.