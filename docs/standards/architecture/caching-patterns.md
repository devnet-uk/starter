# Caching Patterns

**Category**: Architecture  
**Type**: Implementation Pattern  
**Scope**: Backend Services  
**Related Standards**: [Clean Architecture](./clean-architecture.md), [Resilience Patterns](./resilience-patterns.md), [Performance Patterns](./infrastructure-patterns.md)

## Overview

This document establishes comprehensive patterns for implementing distributed caching systems following Clean Architecture principles. It covers cache-aside, write-through, write-behind strategies, Redis integration, multi-level caching, cache invalidation, and performance optimization while maintaining domain isolation and high availability.

## Architecture Layers

### Domain Layer

#### Cache Domain Services

**Cache Strategy Service**
```typescript
// packages/core/domain/caching/services/CacheStrategyService.ts
import { Result } from '@repo/domain/base/Result';

export class CacheStrategyService {
  constructor(
    private readonly cacheKeyGenerator: ICacheKeyGenerator,
    private readonly cacheMetrics: ICacheMetrics
  ) {}

  async executeWithCacheAside<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<Result<T>> {
    const startTime = Date.now();
    
    try {
      // Generate cache key with proper namespace
      const cacheKey = this.cacheKeyGenerator.generate(key, options.namespace);
      
      // Try to get from cache first
      const cachedValue = await this.getFromCache<T>(cacheKey);
      if (cachedValue !== null) {
        this.cacheMetrics.recordHit(cacheKey);
        this.cacheMetrics.recordLatency('cache_hit', Date.now() - startTime);
        return Result.ok(cachedValue);
      }

      // Cache miss - fetch from source
      this.cacheMetrics.recordMiss(cacheKey);
      const value = await fetcher();

      // Store in cache with TTL
      await this.setInCache(cacheKey, value, options.ttl);
      this.cacheMetrics.recordLatency('cache_miss', Date.now() - startTime);

      return Result.ok(value);

    } catch (error) {
      this.cacheMetrics.recordError(key);
      return Result.fail(new CacheError('Cache-aside operation failed', error));
    }
  }

  async executeWithWriteThrough<T>(
    key: string,
    value: T,
    persistor: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<Result<void>> {
    try {
      const cacheKey = this.cacheKeyGenerator.generate(key, options.namespace);

      // Write to persistent storage first
      await persistor(value);

      // Then write to cache
      await this.setInCache(cacheKey, value, options.ttl);

      this.cacheMetrics.recordWriteThrough(cacheKey);
      return Result.ok();

    } catch (error) {
      this.cacheMetrics.recordError(key);
      return Result.fail(new CacheError('Write-through operation failed', error));
    }
  }

  async executeWithWriteBehind<T>(
    key: string,
    value: T,
    persistor: (value: T) => Promise<void>,
    options: CacheOptions = {}
  ): Promise<Result<void>> {
    try {
      const cacheKey = this.cacheKeyGenerator.generate(key, options.namespace);

      // Write to cache immediately
      await this.setInCache(cacheKey, value, options.ttl);

      // Schedule persistence for later (async)
      this.schedulePersistence(cacheKey, value, persistor, options);

      this.cacheMetrics.recordWriteBehind(cacheKey);
      return Result.ok();

    } catch (error) {
      this.cacheMetrics.recordError(key);
      return Result.fail(new CacheError('Write-behind operation failed', error));
    }
  }

  private async getFromCache<T>(key: string): Promise<T | null> {
    // This will be implemented by infrastructure layer
    throw new Error('Method should be implemented by infrastructure layer');
  }

  private async setInCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    // This will be implemented by infrastructure layer
    throw new Error('Method should be implemented by infrastructure layer');
  }

  private schedulePersistence<T>(
    key: string,
    value: T,
    persistor: (value: T) => Promise<void>,
    options: CacheOptions
  ): void {
    // Schedule background job for persistence
    // This will integrate with the background job patterns
    const delay = options.writeBehindDelay || 5000; // 5 seconds default
    
    setTimeout(async () => {
      try {
        await persistor(value);
        this.cacheMetrics.recordPersistenceSuccess(key);
      } catch (error) {
        this.cacheMetrics.recordPersistenceError(key);
        // Could implement retry logic here
      }
    }, delay);
  }
}
```

**Cache Invalidation Service**
```typescript
// packages/core/domain/caching/services/CacheInvalidationService.ts
export class CacheInvalidationService {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly cacheKeyGenerator: ICacheKeyGenerator,
    private readonly eventBus: IEventBus
  ) {}

  async invalidateByKey(key: string, namespace?: string): Promise<Result<void>> {
    try {
      const cacheKey = this.cacheKeyGenerator.generate(key, namespace);
      await this.cacheService.delete(cacheKey);
      
      // Publish invalidation event for cache coherence across instances
      await this.eventBus.publish(new CacheInvalidatedEvent(cacheKey));
      
      return Result.ok();
    } catch (error) {
      return Result.fail(new CacheError('Cache invalidation failed', error));
    }
  }

  async invalidateByPattern(pattern: string, namespace?: string): Promise<Result<number>> {
    try {
      const fullPattern = namespace 
        ? this.cacheKeyGenerator.generate(pattern, namespace)
        : pattern;

      const deletedCount = await this.cacheService.deletePattern(fullPattern);
      
      // Publish pattern invalidation event
      await this.eventBus.publish(new CachePatternInvalidatedEvent(fullPattern));
      
      return Result.ok(deletedCount);
    } catch (error) {
      return Result.fail(new CacheError('Pattern invalidation failed', error));
    }
  }

  async invalidateByTags(tags: string[]): Promise<Result<number>> {
    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        // Get all keys associated with this tag
        const taggedKeys = await this.cacheService.getKeysByTag(tag);
        
        if (taggedKeys.length > 0) {
          await this.cacheService.deleteMany(taggedKeys);
          totalDeleted += taggedKeys.length;
        }

        // Remove the tag set itself
        await this.cacheService.deleteTag(tag);
      }

      // Publish tag invalidation event
      await this.eventBus.publish(new CacheTagsInvalidatedEvent(tags));
      
      return Result.ok(totalDeleted);
    } catch (error) {
      return Result.fail(new CacheError('Tag-based invalidation failed', error));
    }
  }

  async scheduleInvalidation(
    key: string,
    delay: number,
    namespace?: string
  ): Promise<Result<void>> {
    try {
      const cacheKey = this.cacheKeyGenerator.generate(key, namespace);
      
      // Schedule invalidation using background job system
      await this.scheduleBackgroundInvalidation(cacheKey, delay);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(new CacheError('Scheduled invalidation failed', error));
    }
  }

  private async scheduleBackgroundInvalidation(key: string, delay: number): Promise<void> {
    // This would integrate with the background job patterns
    // For now, using simple timeout - in production, use proper job scheduler
    setTimeout(async () => {
      await this.cacheService.delete(key);
    }, delay);
  }
}
```

#### Cache Value Objects

**Cache Entry Value Object**
```typescript
// packages/core/domain/caching/values/CacheEntry.ts
export class CacheEntry<T> extends ValueObject {
  private constructor(
    private readonly _value: T,
    private readonly _key: string,
    private readonly _ttl: number,
    private readonly _tags: string[],
    private readonly _createdAt: Date,
    private readonly _accessCount: number,
    private readonly _lastAccessedAt: Date
  ) {
    super();
  }

  public static create<T>(props: {
    value: T;
    key: string;
    ttl: number;
    tags?: string[];
  }): CacheEntry<T> {
    const now = new Date();
    
    return new CacheEntry<T>(
      props.value,
      props.key,
      props.ttl,
      props.tags || [],
      now,
      0,
      now
    );
  }

  public withAccess(): CacheEntry<T> {
    return new CacheEntry<T>(
      this._value,
      this._key,
      this._ttl,
      this._tags,
      this._createdAt,
      this._accessCount + 1,
      new Date()
    );
  }

  public isExpired(): boolean {
    const expiryTime = this._createdAt.getTime() + (this._ttl * 1000);
    return Date.now() > expiryTime;
  }

  public getRemainingTtl(): number {
    const elapsed = (Date.now() - this._createdAt.getTime()) / 1000;
    return Math.max(0, this._ttl - elapsed);
  }

  // Getters
  public get value(): T { return this._value; }
  public get key(): string { return this._key; }
  public get ttl(): number { return this._ttl; }
  public get tags(): string[] { return [...this._tags]; }
  public get createdAt(): Date { return this._createdAt; }
  public get accessCount(): number { return this._accessCount; }
  public get lastAccessedAt(): Date { return this._lastAccessedAt; }

  protected getEqualityComponents(): any[] {
    return [this._key, this._value, this._ttl, this._tags];
  }
}
```

### Application Layer

#### Cache Service Interface

**Core Cache Service**
```typescript
// packages/core/interfaces/caching/ICacheService.ts
export interface ICacheService {
  get<T>(key: string, type?: new() => T): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  deletePattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<void>;
  getTtl(key: string): Promise<number>;
  
  // Tagged caching
  getKeysByTag(tag: string): Promise<string[]>;
  deleteTag(tag: string): Promise<void>;
  
  // Batch operations
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  mset<T>(entries: Array<{key: string; value: T; ttl?: number}>): Promise<void>;
  
  // Atomic operations
  increment(key: string, delta?: number): Promise<number>;
  decrement(key: string, delta?: number): Promise<number>;
  
  // Cache statistics
  getStats(): Promise<CacheStats>;
  
  // Health check
  ping(): Promise<boolean>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  memory: {
    used: number;
    max: number;
  };
  connections: {
    active: number;
    total: number;
  };
}
```

**Multi-Level Cache Service**
```typescript
// packages/core/interfaces/caching/IMultiLevelCacheService.ts
export interface IMultiLevelCacheService extends ICacheService {
  // L1 Cache (In-Memory)
  getFromL1<T>(key: string): Promise<T | null>;
  setInL1<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidateL1(key: string): Promise<void>;
  
  // L2 Cache (Distributed)
  getFromL2<T>(key: string): Promise<T | null>;
  setInL2<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidateL2(key: string): Promise<void>;
  
  // Cache coherence
  syncLevels(key: string): Promise<void>;
  warmL1FromL2(keys: string[]): Promise<void>;
}
```

#### Use Cases

**Cache Management Use Case**
```typescript
// packages/api/src/use-cases/caching/CacheManagementUseCase.ts
export class CacheManagementUseCase implements IUseCase<CacheManagementCommand, CacheManagementResult> {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly cacheInvalidationService: CacheInvalidationService,
    private readonly cacheMetrics: ICacheMetrics
  ) {}

  async execute(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    try {
      switch (command.action) {
        case 'get':
          return await this.handleGet(command);
        
        case 'set':
          return await this.handleSet(command);
        
        case 'delete':
          return await this.handleDelete(command);
        
        case 'invalidate_pattern':
          return await this.handleInvalidatePattern(command);
        
        case 'invalidate_tags':
          return await this.handleInvalidateTags(command);
        
        case 'warm':
          return await this.handleWarmCache(command);
        
        case 'stats':
          return await this.handleGetStats(command);
        
        default:
          return Result.fail(new DomainError(`Unknown cache action: ${command.action}`));
      }
    } catch (error) {
      return Result.fail(new ApplicationError('Cache management operation failed', error));
    }
  }

  private async handleGet(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    if (!command.key) {
      return Result.fail(new DomainError('Key is required for get operation'));
    }

    const value = await this.cacheService.get(command.key);
    const exists = value !== null;

    return Result.ok({
      action: 'get',
      key: command.key,
      value,
      exists,
      metadata: {
        ttl: exists ? await this.cacheService.getTtl(command.key) : null
      }
    });
  }

  private async handleSet(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    if (!command.key || command.value === undefined) {
      return Result.fail(new DomainError('Key and value are required for set operation'));
    }

    await this.cacheService.set(
      command.key,
      command.value,
      command.ttl,
      command.tags
    );

    this.cacheMetrics.recordSet(command.key);

    return Result.ok({
      action: 'set',
      key: command.key,
      success: true
    });
  }

  private async handleDelete(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    if (!command.key) {
      return Result.fail(new DomainError('Key is required for delete operation'));
    }

    const result = await this.cacheInvalidationService.invalidateByKey(command.key);
    
    if (result.isFailure) {
      return Result.fail(result.error);
    }

    return Result.ok({
      action: 'delete',
      key: command.key,
      success: true
    });
  }

  private async handleInvalidatePattern(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    if (!command.pattern) {
      return Result.fail(new DomainError('Pattern is required for pattern invalidation'));
    }

    const result = await this.cacheInvalidationService.invalidateByPattern(command.pattern);
    
    if (result.isFailure) {
      return Result.fail(result.error);
    }

    return Result.ok({
      action: 'invalidate_pattern',
      pattern: command.pattern,
      deletedCount: result.value,
      success: true
    });
  }

  private async handleWarmCache(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    if (!command.warmingStrategy) {
      return Result.fail(new DomainError('Warming strategy is required'));
    }

    const warmedCount = await this.executeWarmingStrategy(command.warmingStrategy);

    return Result.ok({
      action: 'warm',
      warmedCount,
      success: true
    });
  }

  private async handleGetStats(command: CacheManagementCommand): Promise<Result<CacheManagementResult>> {
    const stats = await this.cacheService.getStats();

    return Result.ok({
      action: 'stats',
      stats,
      success: true
    });
  }

  private async executeWarmingStrategy(strategy: CacheWarmingStrategy): Promise<number> {
    switch (strategy.type) {
      case 'preload_popular':
        return await this.preloadPopularItems(strategy);
      
      case 'preload_user_data':
        return await this.preloadUserData(strategy);
      
      case 'preload_critical':
        return await this.preloadCriticalData(strategy);
      
      default:
        return 0;
    }
  }

  private async preloadPopularItems(strategy: CacheWarmingStrategy): Promise<number> {
    // Implementation would fetch popular items and cache them
    // This is a simplified example
    let warmed = 0;
    
    for (const item of strategy.items || []) {
      try {
        // Fetch and cache the item
        await this.cacheService.set(item.key, item.value, item.ttl);
        warmed++;
      } catch (error) {
        console.error(`Failed to warm cache for key ${item.key}:`, error);
      }
    }

    return warmed;
  }

  private async preloadUserData(strategy: CacheWarmingStrategy): Promise<number> {
    // Preload user-specific data
    return 0; // Simplified
  }

  private async preloadCriticalData(strategy: CacheWarmingStrategy): Promise<number> {
    // Preload business-critical data
    return 0; // Simplified
  }
}
```

### Infrastructure Layer

#### Redis Cache Implementation

**Redis Cache Service**
```typescript
// packages/caching/src/services/RedisCacheService.ts
import Redis, { Cluster } from 'ioredis';
import { ICacheService } from '@repo/core/interfaces/caching/ICacheService';

export class RedisCacheService implements ICacheService {
  private readonly redis: Redis | Cluster;
  private readonly serializer: ICacheSerializer;
  private readonly keyPrefix: string;

  constructor(
    config: RedisCacheConfig,
    serializer: ICacheSerializer = new JsonCacheSerializer()
  ) {
    this.serializer = serializer;
    this.keyPrefix = config.keyPrefix || '';

    if (config.cluster) {
      // Redis Cluster configuration
      this.redis = new Redis.Cluster(config.cluster.nodes, {
        redisOptions: {
          password: config.cluster.password,
          tls: config.cluster.tls,
          connectTimeout: config.connectionTimeout || 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
        },
        slotsRefreshTimeout: config.cluster.slotsRefreshTimeout || 10000,
        enableOfflineQueue: false,
      });
    } else {
      // Single Redis instance
      this.redis = new Redis({
        host: config.host || 'localhost',
        port: config.port || 6379,
        password: config.password,
        db: config.database || 0,
        connectTimeout: config.connectionTimeout || 10000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        // Connection pooling
        family: 4,
        keepAlive: true,
        maxmemoryPolicy: 'allkeys-lru',
      });
    }

    // Set up event handlers
    this.setupEventHandlers();
  }

  async get<T>(key: string, type?: new() => T): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const value = await this.redis.get(fullKey);
      
      if (value === null) {
        return null;
      }

      return this.serializer.deserialize<T>(value, type);
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      const serializedValue = this.serializer.serialize(value);

      // Use pipeline for atomic operations
      const pipeline = this.redis.pipeline();

      if (ttl && ttl > 0) {
        pipeline.setex(fullKey, ttl, serializedValue);
      } else {
        pipeline.set(fullKey, serializedValue);
      }

      // Handle tags
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          const tagKey = this.buildTagKey(tag);
          pipeline.sadd(tagKey, fullKey);
          
          // Set TTL for tag sets (slightly longer than cache TTL)
          if (ttl && ttl > 0) {
            pipeline.expire(tagKey, ttl + 300); // 5 minutes buffer
          }
        }
      }

      await pipeline.exec();
    } catch (error) {
      throw new CacheError(`Failed to set cache key ${key}`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.redis.del(fullKey);
    } catch (error) {
      throw new CacheError(`Failed to delete cache key ${key}`, error);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      await this.redis.del(...fullKeys);
    } catch (error) {
      throw new CacheError('Failed to delete multiple cache keys', error);
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      let deletedCount = 0;
      
      if (this.redis instanceof Redis.Cluster) {
        // For cluster, we need to scan each node
        const nodes = this.redis.nodes('master');
        
        for (const node of nodes) {
          const keys = await this.scanPattern(node, fullPattern);
          if (keys.length > 0) {
            await node.del(...keys);
            deletedCount += keys.length;
          }
        }
      } else {
        // For single instance
        const keys = await this.scanPattern(this.redis, fullPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
          deletedCount = keys.length;
        }
      }

      return deletedCount;
    } catch (error) {
      throw new CacheError(`Failed to delete pattern ${pattern}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const fullKey = this.buildKey(key);
      await this.redis.expire(fullKey, ttl);
    } catch (error) {
      throw new CacheError(`Failed to set expiry for key ${key}`, error);
    }
  }

  async getTtl(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      return -1;
    }
  }

  async getKeysByTag(tag: string): Promise<string[]> {
    try {
      const tagKey = this.buildTagKey(tag);
      return await this.redis.smembers(tagKey);
    } catch (error) {
      return [];
    }
  }

  async deleteTag(tag: string): Promise<void> {
    try {
      const tagKey = this.buildTagKey(tag);
      await this.redis.del(tagKey);
    } catch (error) {
      throw new CacheError(`Failed to delete tag ${tag}`, error);
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    try {
      const fullKeys = keys.map(key => this.buildKey(key));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map((value, index) => {
        if (value === null) return null;
        try {
          return this.serializer.deserialize<T>(value);
        } catch (error) {
          console.error(`Failed to deserialize value for key ${keys[index]}:`, error);
          return null;
        }
      });
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null); // Fail gracefully
    }
  }

  async mset<T>(entries: Array<{key: string; value: T; ttl?: number}>): Promise<void> {
    if (entries.length === 0) return;

    try {
      const pipeline = this.redis.pipeline();

      for (const entry of entries) {
        const fullKey = this.buildKey(entry.key);
        const serializedValue = this.serializer.serialize(entry.value);

        if (entry.ttl && entry.ttl > 0) {
          pipeline.setex(fullKey, entry.ttl, serializedValue);
        } else {
          pipeline.set(fullKey, serializedValue);
        }
      }

      await pipeline.exec();
    } catch (error) {
      throw new CacheError('Failed to set multiple cache entries', error);
    }
  }

  async increment(key: string, delta: number = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.incrby(fullKey, delta);
    } catch (error) {
      throw new CacheError(`Failed to increment key ${key}`, error);
    }
  }

  async decrement(key: string, delta: number = 1): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      return await this.redis.decrby(fullKey, delta);
    } catch (error) {
      throw new CacheError(`Failed to decrement key ${key}`, error);
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      // Parse Redis info output
      const memoryUsed = this.parseInfoValue(info, 'used_memory');
      const maxMemory = this.parseInfoValue(info, 'maxmemory');
      const totalKeys = this.parseKeyspaceInfo(keyspace);

      return {
        hits: 0, // Would need to implement hit/miss tracking
        misses: 0,
        keys: totalKeys,
        memory: {
          used: memoryUsed,
          max: maxMemory
        },
        connections: {
          active: 1, // Simplified
          total: 1
        }
      };
    } catch (error) {
      throw new CacheError('Failed to get cache stats', error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  private async scanPattern(redis: Redis, pattern: string, batchSize: number = 1000): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        batchSize
      );

      keys.push(...foundKeys);
      cursor = nextCursor;
    } while (cursor !== '0');

    return keys;
  }

  private buildKey(key: string): string {
    return this.keyPrefix ? `${this.keyPrefix}:${key}` : key;
  }

  private buildTagKey(tag: string): string {
    return this.buildKey(`tag:${tag}`);
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('Redis cache connected');
    });

    this.redis.on('ready', () => {
      console.log('Redis cache ready');
    });

    this.redis.on('error', (error) => {
      console.error('Redis cache error:', error);
    });

    this.redis.on('close', () => {
      console.log('Redis cache connection closed');
    });

    this.redis.on('reconnecting', () => {
      console.log('Redis cache reconnecting...');
    });
  }

  private parseInfoValue(info: string, key: string): number {
    const match = info.match(new RegExp(`${key}:(\\d+)`));
    return match ? parseInt(match[1], 10) : 0;
  }

  private parseKeyspaceInfo(keyspace: string): number {
    const match = keyspace.match(/keys=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
```

**Multi-Level Cache Implementation**
```typescript
// packages/caching/src/services/MultiLevelCacheService.ts
export class MultiLevelCacheService implements IMultiLevelCacheService {
  constructor(
    private readonly l1Cache: IInMemoryCacheService, // LRU cache
    private readonly l2Cache: ICacheService, // Redis
    private readonly coherenceManager: ICacheCoherenceManager
  ) {}

  async get<T>(key: string, type?: new() => T): Promise<T | null> {
    // Try L1 first (fastest)
    let value = await this.l1Cache.get<T>(key, type);
    if (value !== null) {
      return value;
    }

    // Try L2 (distributed)
    value = await this.l2Cache.get<T>(key, type);
    if (value !== null) {
      // Promote to L1 for faster future access
      await this.l1Cache.set(key, value, 300); // 5 minutes in L1
      return value;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void> {
    // Set in both levels
    const promises: Promise<void>[] = [
      this.l2Cache.set(key, value, ttl, tags)
    ];

    // Set in L1 with shorter TTL
    const l1Ttl = ttl ? Math.min(ttl, 300) : 300; // Max 5 minutes in L1
    promises.push(this.l1Cache.set(key, value, l1Ttl));

    await Promise.all(promises);

    // Notify other instances for cache coherence
    await this.coherenceManager.notifySet(key, ttl);
  }

  async delete(key: string): Promise<void> {
    // Delete from both levels
    await Promise.all([
      this.l1Cache.delete(key),
      this.l2Cache.delete(key)
    ]);

    // Notify other instances
    await this.coherenceManager.notifyDelete(key);
  }

  async getFromL1<T>(key: string): Promise<T | null> {
    return await this.l1Cache.get<T>(key);
  }

  async setInL1<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.l1Cache.set(key, value, ttl);
  }

  async invalidateL1(key: string): Promise<void> {
    await this.l1Cache.delete(key);
  }

  async getFromL2<T>(key: string): Promise<T | null> {
    return await this.l2Cache.get<T>(key);
  }

  async setInL2<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.l2Cache.set(key, value, ttl);
  }

  async invalidateL2(key: string): Promise<void> {
    await this.l2Cache.delete(key);
  }

  async syncLevels(key: string): Promise<void> {
    // Get from L2 and promote to L1
    const value = await this.l2Cache.get(key);
    if (value !== null) {
      await this.l1Cache.set(key, value, 300);
    } else {
      // Remove from L1 if it doesn't exist in L2
      await this.l1Cache.delete(key);
    }
  }

  async warmL1FromL2(keys: string[]): Promise<void> {
    const values = await this.l2Cache.mget(keys);
    
    const setPromises: Promise<void>[] = [];
    for (let i = 0; i < keys.length; i++) {
      if (values[i] !== null) {
        setPromises.push(this.l1Cache.set(keys[i], values[i], 300));
      }
    }

    await Promise.all(setPromises);
  }

  // Delegate other methods to L2 cache
  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all([
      Promise.all(keys.map(key => this.l1Cache.delete(key))),
      this.l2Cache.deleteMany(keys)
    ]);
  }

  async deletePattern(pattern: string): Promise<number> {
    // Clear L1 entirely for pattern deletes (simpler)
    await this.l1Cache.clear();
    
    const deletedCount = await this.l2Cache.deletePattern(pattern);
    
    // Notify other instances
    await this.coherenceManager.notifyPatternDelete(pattern);
    
    return deletedCount;
  }

  async exists(key: string): Promise<boolean> {
    // Check L1 first, then L2
    const l1Exists = await this.l1Cache.exists(key);
    if (l1Exists) return true;
    
    return await this.l2Cache.exists(key);
  }

  async expire(key: string, ttl: number): Promise<void> {
    await Promise.all([
      this.l1Cache.expire(key, Math.min(ttl, 300)),
      this.l2Cache.expire(key, ttl)
    ]);
  }

  async getTtl(key: string): Promise<number> {
    // Return the longer TTL from L2
    return await this.l2Cache.getTtl(key);
  }

  async getKeysByTag(tag: string): Promise<string[]> {
    return await this.l2Cache.getKeysByTag(tag);
  }

  async deleteTag(tag: string): Promise<void> {
    const keys = await this.getKeysByTag(tag);
    await this.deleteMany(keys);
    await this.l2Cache.deleteTag(tag);
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    // Try to get all from L1 first
    const l1Values = await Promise.all(
      keys.map(key => this.l1Cache.get<T>(key))
    );

    // Identify missing keys
    const missingIndices: number[] = [];
    const missingKeys: string[] = [];
    
    for (let i = 0; i < l1Values.length; i++) {
      if (l1Values[i] === null) {
        missingIndices.push(i);
        missingKeys.push(keys[i]);
      }
    }

    if (missingKeys.length === 0) {
      return l1Values;
    }

    // Get missing keys from L2
    const l2Values = await this.l2Cache.mget<T>(missingKeys);

    // Merge results and promote L2 hits to L1
    const promotionPromises: Promise<void>[] = [];
    
    for (let i = 0; i < missingIndices.length; i++) {
      const originalIndex = missingIndices[i];
      const l2Value = l2Values[i];
      
      if (l2Value !== null) {
        l1Values[originalIndex] = l2Value;
        // Promote to L1
        promotionPromises.push(
          this.l1Cache.set(keys[originalIndex], l2Value, 300)
        );
      }
    }

    // Execute promotions asynchronously
    Promise.all(promotionPromises).catch(console.error);

    return l1Values;
  }

  async mset<T>(entries: Array<{key: string; value: T; ttl?: number}>): Promise<void> {
    // Set in both levels
    const l1Entries = entries.map(entry => ({
      ...entry,
      ttl: entry.ttl ? Math.min(entry.ttl, 300) : 300
    }));

    await Promise.all([
      this.l1Cache.mset(l1Entries),
      this.l2Cache.mset(entries)
    ]);
  }

  async increment(key: string, delta: number = 1): Promise<number> {
    // Increment in L2 (source of truth)
    const result = await this.l2Cache.increment(key, delta);
    
    // Invalidate L1 to ensure consistency
    await this.l1Cache.delete(key);
    
    return result;
  }

  async decrement(key: string, delta: number = 1): Promise<number> {
    // Decrement in L2 (source of truth)
    const result = await this.l2Cache.decrement(key, delta);
    
    // Invalidate L1 to ensure consistency
    await this.l1Cache.delete(key);
    
    return result;
  }

  async getStats(): Promise<CacheStats> {
    const [l1Stats, l2Stats] = await Promise.all([
      this.l1Cache.getStats(),
      this.l2Cache.getStats()
    ]);

    return {
      hits: l1Stats.hits + l2Stats.hits,
      misses: l1Stats.misses + l2Stats.misses,
      keys: l2Stats.keys, // L2 is source of truth for key count
      memory: {
        used: l1Stats.memory.used + l2Stats.memory.used,
        max: l1Stats.memory.max + l2Stats.memory.max
      },
      connections: l2Stats.connections
    };
  }

  async ping(): Promise<boolean> {
    const [l1Healthy, l2Healthy] = await Promise.all([
      this.l1Cache.ping(),
      this.l2Cache.ping()
    ]);

    // Both levels should be healthy
    return l1Healthy && l2Healthy;
  }
}
```

### Cache Event Handlers

**Domain Event Handlers for Cache Invalidation**
```typescript
// packages/caching/src/handlers/CacheInvalidationHandlers.ts
export class CacheInvalidationHandlers {
  constructor(
    private readonly cacheInvalidationService: CacheInvalidationService,
    private readonly cacheService: ICacheService
  ) {}

  @DomainEventHandler(UserUpdatedEvent)
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // Invalidate user-specific cache entries
    await this.cacheInvalidationService.invalidateByPattern(`user:${event.user.id.value}:*`);
    
    // Invalidate user lists that might include this user
    await this.cacheInvalidationService.invalidateByTags(['user-list', 'organization-members']);
  }

  @DomainEventHandler(OrganizationUpdatedEvent)
  async handleOrganizationUpdated(event: OrganizationUpdatedEvent): Promise<void> {
    const orgId = event.organization.id.value;
    
    // Invalidate organization cache
    await this.cacheInvalidationService.invalidateByPattern(`org:${orgId}:*`);
    
    // Invalidate related caches
    await this.cacheInvalidationService.invalidateByTags([
      `org-${orgId}`,
      'organization-list'
    ]);
  }

  @DomainEventHandler(ProjectCreatedEvent)
  async handleProjectCreated(event: ProjectCreatedEvent): Promise<void> {
    const orgId = event.project.organizationId.value;
    
    // Invalidate organization's project list
    await this.cacheInvalidationService.invalidateByKey(`org:${orgId}:projects`);
    
    // Invalidate project count cache
    await this.cacheInvalidationService.invalidateByKey(`org:${orgId}:project-count`);
  }

  @DomainEventHandler(SubscriptionUpdatedEvent)
  async handleSubscriptionUpdated(event: SubscriptionUpdatedEvent): Promise<void> {
    const customerId = event.subscription.customerId.value;
    
    // Invalidate subscription cache
    await this.cacheInvalidationService.invalidateByPattern(`subscription:${customerId}:*`);
    
    // Invalidate billing-related cache entries
    await this.cacheInvalidationService.invalidateByTags(['billing', 'subscription']);
  }
}
```

## Performance Optimization

### Cache Warming Strategies

```typescript
// packages/caching/src/warming/CacheWarmingService.ts
export class CacheWarmingService {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly dataService: IDataService,
    private readonly jobScheduler: IJobScheduler
  ) {}

  async warmCriticalData(): Promise<void> {
    const strategies: CacheWarmingStrategy[] = [
      {
        name: 'popular-users',
        keys: await this.getPopularUserKeys(),
        fetcher: this.fetchUser.bind(this),
        ttl: 3600 // 1 hour
      },
      {
        name: 'active-organizations',
        keys: await this.getActiveOrganizationKeys(),
        fetcher: this.fetchOrganization.bind(this),
        ttl: 1800 // 30 minutes
      },
      {
        name: 'system-configuration',
        keys: ['system:config', 'feature:flags'],
        fetcher: this.fetchSystemConfig.bind(this),
        ttl: 7200 // 2 hours
      }
    ];

    // Execute warming strategies in parallel
    await Promise.all(
      strategies.map(strategy => this.executeWarmingStrategy(strategy))
    );
  }

  async schedulePeriodicWarming(): Promise<void> {
    // Schedule cache warming jobs
    const jobs = [
      {
        name: 'warm-popular-content',
        schedule: '0 */6 * * *', // Every 6 hours
        handler: () => this.warmPopularContent()
      },
      {
        name: 'warm-user-preferences',
        schedule: '0 2 * * *', // Daily at 2 AM
        handler: () => this.warmUserPreferences()
      },
      {
        name: 'warm-analytics-data',
        schedule: '0 1 * * *', // Daily at 1 AM
        handler: () => this.warmAnalyticsData()
      }
    ];

    for (const job of jobs) {
      await this.jobScheduler.scheduleRecurring({
        name: job.name,
        cronPattern: job.schedule,
        handler: job.handler
      });
    }
  }

  private async executeWarmingStrategy(strategy: CacheWarmingStrategy): Promise<void> {
    const batchSize = 50;
    
    for (let i = 0; i < strategy.keys.length; i += batchSize) {
      const batch = strategy.keys.slice(i, i + batchSize);
      
      // Process batch in parallel
      await Promise.all(
        batch.map(async (key) => {
          try {
            const data = await strategy.fetcher(key);
            if (data) {
              await this.cacheService.set(key, data, strategy.ttl);
            }
          } catch (error) {
            console.error(`Failed to warm cache for key ${key}:`, error);
          }
        })
      );
    }
  }

  private async getPopularUserKeys(): Promise<string[]> {
    // Get most viewed/accessed users
    const popularUsers = await this.dataService.getMostAccessedUsers(100);
    return popularUsers.map(user => `user:${user.id}`);
  }

  private async getActiveOrganizationKeys(): Promise<string[]> {
    // Get organizations with recent activity
    const activeOrgs = await this.dataService.getActiveOrganizations(50);
    return activeOrgs.map(org => `org:${org.id}`);
  }

  private async fetchUser(key: string): Promise<any> {
    const userId = key.replace('user:', '');
    return await this.dataService.getUserById(userId);
  }

  private async fetchOrganization(key: string): Promise<any> {
    const orgId = key.replace('org:', '');
    return await this.dataService.getOrganizationById(orgId);
  }

  private async fetchSystemConfig(key: string): Promise<any> {
    switch (key) {
      case 'system:config':
        return await this.dataService.getSystemConfiguration();
      case 'feature:flags':
        return await this.dataService.getFeatureFlags();
      default:
        return null;
    }
  }

  private async warmPopularContent(): Promise<void> {
    // Implementation for warming popular content
  }

  private async warmUserPreferences(): Promise<void> {
    // Implementation for warming user preferences
  }

  private async warmAnalyticsData(): Promise<void> {
    // Implementation for warming analytics data
  }
}
```

## Testing Patterns

### Integration Tests

```typescript
// packages/caching/__tests__/integration/RedisCacheService.test.ts
describe('RedisCacheService Integration', () => {
  let cacheService: RedisCacheService;
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis(process.env.REDIS_TEST_URL);
    cacheService = new RedisCacheService({
      host: 'localhost',
      port: 6379,
      keyPrefix: 'test'
    });
  });

  afterAll(async () => {
    await redis.disconnect();
  });

  beforeEach(async () => {
    await redis.flushall();
  });

  describe('basic operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { id: 1, name: 'Test Object' };

      await cacheService.set(key, value, 300);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should handle TTL correctly', async () => {
      const key = 'ttl-test';
      const value = 'test-value';

      await cacheService.set(key, value, 1); // 1 second TTL
      
      let retrieved = await cacheService.get(key);
      expect(retrieved).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });

    it('should delete keys correctly', async () => {
      const key = 'delete-test';
      const value = 'test-value';

      await cacheService.set(key, value);
      await cacheService.delete(key);
      
      const retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe('pattern operations', () => {
    it('should delete keys by pattern', async () => {
      // Set up test data
      await Promise.all([
        cacheService.set('user:1:profile', { id: 1 }),
        cacheService.set('user:1:settings', { theme: 'dark' }),
        cacheService.set('user:2:profile', { id: 2 }),
        cacheService.set('other:data', { value: 'test' })
      ]);

      // Delete user:1:* pattern
      const deletedCount = await cacheService.deletePattern('user:1:*');
      expect(deletedCount).toBe(2);

      // Verify deletion
      expect(await cacheService.get('user:1:profile')).toBeNull();
      expect(await cacheService.get('user:1:settings')).toBeNull();
      expect(await cacheService.get('user:2:profile')).not.toBeNull();
      expect(await cacheService.get('other:data')).not.toBeNull();
    });
  });

  describe('tagged caching', () => {
    it('should handle tagged cache entries', async () => {
      await cacheService.set('item1', { id: 1 }, 300, ['tag1', 'tag2']);
      await cacheService.set('item2', { id: 2 }, 300, ['tag1']);
      await cacheService.set('item3', { id: 3 }, 300, ['tag2']);

      // Get keys by tag
      const tag1Keys = await cacheService.getKeysByTag('tag1');
      expect(tag1Keys).toHaveLength(2);
      expect(tag1Keys).toContain('test:item1');
      expect(tag1Keys).toContain('test:item2');

      // Invalidate by tag
      const keys = await cacheService.getKeysByTag('tag1');
      await cacheService.deleteMany(keys.map(k => k.replace('test:', '')));

      expect(await cacheService.get('item1')).toBeNull();
      expect(await cacheService.get('item2')).toBeNull();
      expect(await cacheService.get('item3')).not.toBeNull();
    });
  });
});
```

```yaml
# Embedded DSL Verification
verify:
  exists:
    - "packages/core/domain/caching/services/CacheStrategyService.ts"
    - "packages/core/domain/caching/services/CacheInvalidationService.ts"
    - "packages/core/interfaces/caching/ICacheService.ts"
    - "packages/api/src/use-cases/caching/CacheManagementUseCase.ts"
    - "packages/caching/src/services/RedisCacheService.ts"
    - "packages/caching/src/services/MultiLevelCacheService.ts"

  contains:
    - file: "packages/caching/src/services/RedisCacheService.ts"
      pattern: "implements ICacheService"
    
    - file: "packages/caching/src/services/RedisCacheService.ts"
      pattern: "from 'ioredis'"
    
    - file: "packages/caching/src/services/MultiLevelCacheService.ts"
      pattern: "implements IMultiLevelCacheService"
    
    - file: "packages/core/domain/caching/services/CacheStrategyService.ts"
      pattern: "executeWithCacheAside"

  patterns:
    - name: "Redis Integration"
      files: ["packages/caching/src/services/*.ts"]
      pattern: "ioredis"
    
    - name: "Cache Strategy Patterns"
      files: ["packages/core/domain/caching/services/*.ts"]
      pattern: "(CacheAside|WriteThrough|WriteBehind)"
    
    - name: "Multi-level Caching"
      files: ["packages/caching/src/services/MultiLevelCacheService.ts"]
      pattern: "(l1Cache|l2Cache)"
    
    - name: "Cache Invalidation"
      files: ["packages/caching/src/handlers/*.ts"]
      pattern: "CacheInvalidationHandlers"

  constraints:
    - name: "Cache Abstraction"
      description: "Domain should not depend on Redis directly"
      verify: "no_imports"
      from: "packages/core/domain/caching/**/*.ts"
      to: "ioredis"

commands:
  - name: "test:caching"
    description: "Run caching domain and use case tests"
    command: "pnpm test packages/core/domain/caching packages/api/src/use-cases/caching"
  
  - name: "test:caching:integration"
    description: "Run caching integration tests"
    command: "pnpm test packages/caching/__tests__/integration"
  
  - name: "cache:warm"
    description: "Warm cache with critical data"
    command: "pnpm --filter @repo/caching warm"
  
  - name: "cache:stats"
    description: "Show cache statistics"
    command: "pnpm --filter @repo/caching stats"
```

## Key Implementation Notes

1. **Strategy Pattern**: Implement different caching strategies (cache-aside, write-through, write-behind) as configurable strategies.

2. **Multi-Level Caching**: Use L1 (in-memory) and L2 (distributed) caches for optimal performance with proper cache coherence.

3. **Cache Invalidation**: Implement comprehensive invalidation strategies including key-based, pattern-based, and tag-based invalidation.

4. **Redis Integration**: Use ioredis with proper connection pooling, clustering support, and error handling.

5. **Performance Optimization**: Implement cache warming, batch operations, and pipeline usage for high performance.

6. **Domain Events**: Use domain events to automatically invalidate related cache entries when entities change.

7. **Cache Coherence**: Ensure consistency across multiple application instances with proper cache coherence mechanisms.

8. **Monitoring**: Comprehensive metrics collection for cache hit rates, performance, and health monitoring.

9. **Resilience**: Graceful degradation when cache is unavailable, with proper error handling and fallback mechanisms.

10. **Testing**: Thorough integration testing with real Redis instances and comprehensive unit testing for cache logic.

This pattern provides a robust, scalable, and high-performance caching system while maintaining Clean Architecture principles and supporting various caching strategies and optimizations.