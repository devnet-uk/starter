# Search Patterns

**Category**: Architecture  
**Type**: Implementation Pattern  
**Scope**: Backend Services  
**Related Standards**: [Clean Architecture](./clean-architecture.md), [CQRS Patterns](./use-case-patterns.md), [Caching Patterns](./caching-patterns.md)

## Overview

This document establishes comprehensive patterns for implementing search systems following Clean Architecture principles. It covers full-text search, faceted search, search indexing, CQRS read models, Elasticsearch integration, and performance optimization while maintaining domain isolation and high performance.

## Architecture Layers

### Domain Layer

#### Search Domain Entities

**Search Query Aggregate Root**
```typescript
// packages/core/domain/search/entities/SearchQuery.ts
import { AggregateRoot } from '@repo/domain/base/AggregateRoot';
import { Result } from '@repo/domain/base/Result';

export class SearchQuery extends AggregateRoot {
  private constructor(
    private readonly _id: SearchQueryId,
    private readonly _userId: UserId | null,
    private readonly _query: string,
    private readonly _filters: SearchFilter[],
    private readonly _sorting: SearchSort[],
    private readonly _pagination: SearchPagination,
    private readonly _scope: SearchScope,
    private _results: SearchResult | null,
    private readonly _executedAt: Date,
    private _completedAt: Date | null,
    private _executionTimeMs: number | null
  ) {
    super(_id.value);
  }

  public static create(props: {
    userId?: UserId;
    query: string;
    filters?: SearchFilter[];
    sorting?: SearchSort[];
    pagination?: SearchPagination;
    scope: SearchScope;
  }): Result<SearchQuery> {
    if (!props.query.trim() && (!props.filters || props.filters.length === 0)) {
      return Result.fail(new DomainError('Search query must have either text or filters'));
    }

    const searchQuery = new SearchQuery(
      SearchQueryId.create(),
      props.userId || null,
      props.query.trim(),
      props.filters || [],
      props.sorting || [],
      props.pagination || SearchPagination.default(),
      props.scope,
      null,
      new Date(),
      null,
      null
    );

    searchQuery.addDomainEvent(new SearchQueryCreatedEvent(searchQuery));
    return Result.ok(searchQuery);
  }

  public addFilter(filter: SearchFilter): Result<void> {
    // Prevent duplicate filters
    const existingFilter = this._filters.find(f => 
      f.field === filter.field && f.operator === filter.operator
    );

    if (existingFilter) {
      return Result.fail(new DomainError(`Filter already exists for field: ${filter.field}`));
    }

    this._filters.push(filter);
    return Result.ok();
  }

  public removeFilter(field: string, operator: SearchOperator): Result<void> {
    const index = this._filters.findIndex(f => 
      f.field === field && f.operator === operator
    );

    if (index === -1) {
      return Result.fail(new DomainError('Filter not found'));
    }

    this._filters.splice(index, 1);
    return Result.ok();
  }

  public addSort(sort: SearchSort): Result<void> {
    // Remove existing sort for the same field
    const index = this._sorting.findIndex(s => s.field === sort.field);
    if (index !== -1) {
      this._sorting.splice(index, 1);
    }

    this._sorting.push(sort);
    return Result.ok();
  }

  public setResults(
    results: SearchResult,
    executionTimeMs: number
  ): Result<void> {
    this._results = results;
    this._executionTimeMs = executionTimeMs;
    this._completedAt = new Date();

    this.addDomainEvent(new SearchQueryCompletedEvent(this, results));
    return Result.ok();
  }

  public isExecuted(): boolean {
    return this._results !== null;
  }

  // Getters
  public get id(): SearchQueryId { return this._id; }
  public get userId(): UserId | null { return this._userId; }
  public get query(): string { return this._query; }
  public get filters(): SearchFilter[] { return [...this._filters]; }
  public get sorting(): SearchSort[] { return [...this._sorting]; }
  public get pagination(): SearchPagination { return this._pagination; }
  public get scope(): SearchScope { return this._scope; }
  public get results(): SearchResult | null { return this._results; }
  public get executionTimeMs(): number | null { return this._executionTimeMs; }
}
```

**Search Result Value Object**
```typescript
// packages/core/domain/search/values/SearchResult.ts
export class SearchResult extends ValueObject {
  private constructor(
    private readonly _items: SearchResultItem[],
    private readonly _totalCount: number,
    private readonly _facets: SearchFacet[],
    private readonly _suggestions: SearchSuggestion[],
    private readonly _queryTime: number,
    private readonly _maxScore: number | null
  ) {
    super();
  }

  public static create(props: {
    items: SearchResultItem[];
    totalCount: number;
    facets?: SearchFacet[];
    suggestions?: SearchSuggestion[];
    queryTime: number;
    maxScore?: number;
  }): SearchResult {
    return new SearchResult(
      [...props.items],
      props.totalCount,
      props.facets || [],
      props.suggestions || [],
      props.queryTime,
      props.maxScore || null
    );
  }

  public hasResults(): boolean {
    return this._items.length > 0;
  }

  public getItemsByType<T extends SearchResultItem>(type: string): T[] {
    return this._items
      .filter(item => item.type === type) as T[];
  }

  public getFacetByField(field: string): SearchFacet | null {
    return this._facets.find(facet => facet.field === field) || null;
  }

  // Getters
  public get items(): SearchResultItem[] { return [...this._items]; }
  public get totalCount(): number { return this._totalCount; }
  public get facets(): SearchFacet[] { return [...this._facets]; }
  public get suggestions(): SearchSuggestion[] { return [...this._suggestions]; }
  public get queryTime(): number { return this._queryTime; }
  public get maxScore(): number | null { return this._maxScore; }

  protected getEqualityComponents(): any[] {
    return [
      this._items,
      this._totalCount,
      this._facets,
      this._suggestions,
      this._queryTime,
      this._maxScore
    ];
  }
}
```

**Search Index Entity**
```typescript
// packages/core/domain/search/entities/SearchIndex.ts
export class SearchIndex extends Entity<SearchIndexId> {
  private constructor(
    id: SearchIndexId,
    private readonly _name: string,
    private readonly _entityType: string,
    private _mappings: IndexMapping[],
    private _settings: IndexSettings,
    private _isActive: boolean,
    private _lastSyncedAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date
  ) {
    super(id);
  }

  public static create(props: {
    name: string;
    entityType: string;
    mappings: IndexMapping[];
    settings: IndexSettings;
  }): Result<SearchIndex> {
    if (!props.name.trim()) {
      return Result.fail(new DomainError('Index name is required'));
    }

    if (props.mappings.length === 0) {
      return Result.fail(new DomainError('Index must have at least one field mapping'));
    }

    const now = new Date();
    return Result.ok(new SearchIndex(
      SearchIndexId.create(),
      props.name,
      props.entityType,
      [...props.mappings],
      props.settings,
      true,
      null,
      now,
      now
    ));
  }

  public updateMapping(mapping: IndexMapping): Result<void> {
    const index = this._mappings.findIndex(m => m.field === mapping.field);
    
    if (index !== -1) {
      this._mappings[index] = mapping;
    } else {
      this._mappings.push(mapping);
    }

    this._updatedAt = new Date();
    return Result.ok();
  }

  public updateSettings(settings: IndexSettings): Result<void> {
    this._settings = { ...settings };
    this._updatedAt = new Date();
    return Result.ok();
  }

  public markAsSynced(): Result<void> {
    this._lastSyncedAt = new Date();
    return Result.ok();
  }

  public activate(): Result<void> {
    this._isActive = true;
    this._updatedAt = new Date();
    return Result.ok();
  }

  public deactivate(): Result<void> {
    this._isActive = false;
    this._updatedAt = new Date();
    return Result.ok();
  }

  public needsSync(threshold: Date): boolean {
    return !this._lastSyncedAt || this._lastSyncedAt < threshold;
  }

  // Getters
  public get name(): string { return this._name; }
  public get entityType(): string { return this._entityType; }
  public get mappings(): IndexMapping[] { return [...this._mappings]; }
  public get settings(): IndexSettings { return { ...this._settings }; }
  public get isActive(): boolean { return this._isActive; }
  public get lastSyncedAt(): Date | null { return this._lastSyncedAt; }
}
```

#### Domain Services

**Search Relevance Service**
```typescript
// packages/core/domain/search/services/SearchRelevanceService.ts
export class SearchRelevanceService {
  calculateRelevanceScore(
    query: string,
    item: SearchResultItem,
    context: SearchContext
  ): number {
    let score = 0;

    // Text relevance scoring
    score += this.calculateTextScore(query, item);

    // Boost based on item type
    score *= this.getTypeBoost(item.type, context.scope);

    // Recency boost
    if (item.createdAt) {
      score += this.calculateRecencyBoost(item.createdAt);
    }

    // User-specific boosts
    if (context.userId && item.userId) {
      score += this.calculateUserBoost(context.userId, item.userId);
    }

    // Quality signals
    score += this.calculateQualityScore(item);

    return Math.max(0, Math.min(100, score));
  }

  private calculateTextScore(query: string, item: SearchResultItem): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    let score = 0;

    // Title exact match boost
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes(query.toLowerCase())) {
      score += 10;
    }

    // Individual term matches
    for (const term of queryTerms) {
      if (titleLower.includes(term)) {
        score += 3;
      }
      if (item.content && item.content.toLowerCase().includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  private getTypeBoost(type: string, scope: SearchScope): number {
    const boosts: Record<string, number> = {
      'user': 1.2,
      'organization': 1.1,
      'project': 1.0,
      'document': 0.9,
      'comment': 0.7
    };

    return boosts[type] || 1.0;
  }

  private calculateRecencyBoost(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 1) return 5;
    if (ageInDays < 7) return 3;
    if (ageInDays < 30) return 1;
    
    return 0;
  }

  private calculateUserBoost(searchUserId: UserId, itemUserId: UserId): number {
    // Boost items created by the same user
    return searchUserId.equals(itemUserId) ? 2 : 0;
  }

  private calculateQualityScore(item: SearchResultItem): number {
    let score = 0;

    // Engagement metrics
    if (item.metadata?.viewCount) {
      score += Math.log10(item.metadata.viewCount + 1);
    }

    if (item.metadata?.likeCount) {
      score += Math.log10(item.metadata.likeCount + 1) * 2;
    }

    if (item.metadata?.commentCount) {
      score += Math.log10(item.metadata.commentCount + 1);
    }

    return Math.min(score, 10); // Cap quality boost
  }
}
```

### Application Layer

#### Search Service Interface

**Core Search Service**
```typescript
// packages/core/interfaces/search/ISearchService.ts
export interface ISearchService {
  search(query: SearchQuery): Promise<Result<SearchResult>>;
  suggest(query: string, scope: SearchScope, limit?: number): Promise<Result<SearchSuggestion[]>>;
  indexDocument(document: SearchDocument): Promise<Result<void>>;
  updateDocument(id: string, document: Partial<SearchDocument>): Promise<Result<void>>;
  deleteDocument(id: string, type: string): Promise<Result<void>>;
  bulkIndex(documents: SearchDocument[]): Promise<Result<BulkIndexResult>>;
  createIndex(index: SearchIndex): Promise<Result<void>>;
  deleteIndex(indexName: string): Promise<Result<void>>;
  refreshIndex(indexName?: string): Promise<Result<void>>;
}

export interface SearchDocument {
  id: string;
  type: string;
  title: string;
  content?: string;
  userId?: string;
  organizationId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkIndexResult {
  indexed: number;
  errors: BulkIndexError[];
}
```

#### Use Cases

**Execute Search Use Case**
```typescript
// packages/api/src/use-cases/search/ExecuteSearchUseCase.ts
export class ExecuteSearchUseCase implements IUseCase<ExecuteSearchCommand, SearchResult> {
  constructor(
    private readonly searchService: ISearchService,
    private readonly searchQueryRepository: ISearchQueryRepository,
    private readonly searchRelevanceService: SearchRelevanceService,
    private readonly cacheService: ICacheService
  ) {}

  async execute(command: ExecuteSearchCommand): Promise<Result<SearchResult>> {
    const startTime = Date.now();

    try {
      // Create search query domain object
      const queryResult = SearchQuery.create({
        userId: command.userId,
        query: command.query,
        filters: command.filters,
        sorting: command.sorting,
        pagination: command.pagination,
        scope: command.scope
      });

      if (queryResult.isFailure) {
        return Result.fail(queryResult.error);
      }

      const searchQuery = queryResult.value;

      // Check cache first
      const cacheKey = this.generateCacheKey(searchQuery);
      const cachedResult = await this.cacheService.get(cacheKey, SearchResult);

      if (cachedResult) {
        searchQuery.setResults(cachedResult, Date.now() - startTime);
        await this.searchQueryRepository.save(searchQuery);
        return Result.ok(cachedResult);
      }

      // Execute search
      const searchResult = await this.searchService.search(searchQuery);

      if (searchResult.isFailure) {
        return Result.fail(searchResult.error);
      }

      const result = searchResult.value;
      const executionTime = Date.now() - startTime;

      // Apply relevance scoring if needed
      const enhancedResult = await this.enhanceWithRelevanceScoring(
        result,
        searchQuery,
        command.userId
      );

      // Set results on query and save
      searchQuery.setResults(enhancedResult, executionTime);
      await this.searchQueryRepository.save(searchQuery);

      // Cache results
      await this.cacheService.set(
        cacheKey,
        enhancedResult,
        300 // 5 minutes cache
      );

      return Result.ok(enhancedResult);

    } catch (error) {
      return Result.fail(new ApplicationError('Search execution failed', error));
    }
  }

  private async enhanceWithRelevanceScoring(
    result: SearchResult,
    query: SearchQuery,
    userId?: UserId
  ): Promise<SearchResult> {
    if (!result.hasResults()) {
      return result;
    }

    const context: SearchContext = {
      userId,
      scope: query.scope,
      query: query.query
    };

    // Calculate relevance scores
    const enhancedItems = result.items.map(item => ({
      ...item,
      relevanceScore: this.searchRelevanceService.calculateRelevanceScore(
        query.query,
        item,
        context
      )
    }));

    // Re-sort by relevance if no explicit sorting is specified
    if (query.sorting.length === 0) {
      enhancedItems.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    return SearchResult.create({
      items: enhancedItems,
      totalCount: result.totalCount,
      facets: result.facets,
      suggestions: result.suggestions,
      queryTime: result.queryTime,
      maxScore: result.maxScore
    });
  }

  private generateCacheKey(query: SearchQuery): string {
    const keyParts = [
      'search',
      query.scope.toString(),
      query.query,
      JSON.stringify(query.filters),
      JSON.stringify(query.sorting),
      JSON.stringify(query.pagination),
      query.userId?.value || 'anonymous'
    ];

    return keyParts.join(':');
  }
}
```

**Index Document Use Case**
```typescript
// packages/api/src/use-cases/search/IndexDocumentUseCase.ts
export class IndexDocumentUseCase implements IUseCase<IndexDocumentCommand, void> {
  constructor(
    private readonly searchService: ISearchService,
    private readonly searchIndexRepository: ISearchIndexRepository,
    private readonly entityRepository: IEntityRepository
  ) {}

  async execute(command: IndexDocumentCommand): Promise<Result<void>> {
    try {
      // Get the entity to index
      const entity = await this.entityRepository.findById(
        command.entityId,
        command.entityType
      );

      if (!entity) {
        return Result.fail(new NotFoundError(`Entity not found: ${command.entityId}`));
      }

      // Get search index configuration
      const searchIndex = await this.searchIndexRepository.findByEntityType(
        command.entityType
      );

      if (!searchIndex || !searchIndex.isActive) {
        return Result.fail(new DomainError(`No active search index for type: ${command.entityType}`));
      }

      // Transform entity to search document
      const documentResult = this.transformEntityToDocument(entity, searchIndex);
      if (documentResult.isFailure) {
        return Result.fail(documentResult.error);
      }

      const document = documentResult.value;

      // Index the document
      const indexResult = await this.searchService.indexDocument(document);
      if (indexResult.isFailure) {
        return Result.fail(indexResult.error);
      }

      // Update sync timestamp
      searchIndex.markAsSynced();
      await this.searchIndexRepository.save(searchIndex);

      return Result.ok();

    } catch (error) {
      return Result.fail(new ApplicationError('Document indexing failed', error));
    }
  }

  private transformEntityToDocument(
    entity: any,
    index: SearchIndex
  ): Result<SearchDocument> {
    try {
      const document: SearchDocument = {
        id: entity.id,
        type: index.entityType,
        title: this.extractField(entity, 'title') || this.extractField(entity, 'name') || '',
        content: this.extractField(entity, 'content') || this.extractField(entity, 'description'),
        userId: this.extractField(entity, 'userId'),
        organizationId: this.extractField(entity, 'organizationId'),
        tags: this.extractField(entity, 'tags') || [],
        metadata: this.buildMetadata(entity, index),
        createdAt: entity.createdAt || new Date(),
        updatedAt: entity.updatedAt || new Date()
      };

      return Result.ok(document);
    } catch (error) {
      return Result.fail(new DomainError('Failed to transform entity to document'));
    }
  }

  private extractField(entity: any, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], entity);
  }

  private buildMetadata(entity: any, index: SearchIndex): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract searchable fields based on index mappings
    for (const mapping of index.mappings) {
      if (mapping.includeInMetadata) {
        const value = this.extractField(entity, mapping.field);
        if (value !== undefined && value !== null) {
          metadata[mapping.field] = value;
        }
      }
    }

    return metadata;
  }
}
```

### Infrastructure Layer

#### Elasticsearch Implementation

**Elasticsearch Search Service**
```typescript
// packages/search/src/services/ElasticsearchService.ts
import { Client } from '@elastic/elasticsearch';
import { ISearchService } from '@repo/core/interfaces/search/ISearchService';

export class ElasticsearchService implements ISearchService {
  private readonly client: Client;

  constructor(config: ElasticsearchConfig) {
    this.client = new Client({
      node: config.nodes,
      auth: config.auth ? {
        username: config.auth.username,
        password: config.auth.password
      } : undefined,
      tls: config.tls ? {
        ca: config.tls.ca,
        rejectUnauthorized: config.tls.rejectUnauthorized
      } : undefined,
      requestTimeout: config.requestTimeout || 30000,
      maxRetries: config.maxRetries || 3,
      compression: true,
      sniffOnStart: config.sniffOnStart || false,
      sniffInterval: config.sniffInterval
    });
  }

  async search(query: SearchQuery): Promise<Result<SearchResult>> {
    try {
      const searchRequest = this.buildElasticsearchQuery(query);
      const startTime = Date.now();

      const response = await this.client.search(searchRequest);
      const queryTime = Date.now() - startTime;

      const result = this.transformElasticsearchResponse(response, queryTime);
      return Result.ok(result);

    } catch (error) {
      return Result.fail(this.mapElasticsearchError(error));
    }
  }

  async suggest(
    query: string, 
    scope: SearchScope, 
    limit: number = 10
  ): Promise<Result<SearchSuggestion[]>> {
    try {
      const response = await this.client.search({
        index: this.getIndexForScope(scope),
        body: {
          size: 0,
          suggest: {
            title_suggest: {
              prefix: query,
              completion: {
                field: 'title.suggest',
                size: limit,
                skip_duplicates: true
              }
            }
          }
        }
      });

      const suggestions = this.extractSuggestions(response);
      return Result.ok(suggestions);

    } catch (error) {
      return Result.fail(this.mapElasticsearchError(error));
    }
  }

  async indexDocument(document: SearchDocument): Promise<Result<void>> {
    try {
      await this.client.index({
        index: this.getIndexForType(document.type),
        id: document.id,
        body: this.transformDocumentForIndexing(document),
        refresh: 'wait_for'
      });

      return Result.ok();

    } catch (error) {
      return Result.fail(this.mapElasticsearchError(error));
    }
  }

  async bulkIndex(documents: SearchDocument[]): Promise<Result<BulkIndexResult>> {
    try {
      const body = documents.flatMap(doc => [
        { 
          index: { 
            _index: this.getIndexForType(doc.type),
            _id: doc.id 
          }
        },
        this.transformDocumentForIndexing(doc)
      ]);

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for'
      });

      const result = this.processBulkResponse(response, documents);
      return Result.ok(result);

    } catch (error) {
      return Result.fail(this.mapElasticsearchError(error));
    }
  }

  private buildElasticsearchQuery(query: SearchQuery): any {
    const searchBody: any = {
      size: query.pagination.size,
      from: query.pagination.offset,
      track_total_hits: true
    };

    // Build query
    const queryClause: any = {
      bool: {
        must: [],
        filter: [],
        should: [],
        minimum_should_match: 0
      }
    };

    // Add text query
    if (query.query) {
      queryClause.bool.must.push({
        multi_match: {
          query: query.query,
          fields: [
            'title^3',
            'title.ngram^2',
            'content',
            'content.ngram^0.5',
            'tags^2'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO',
          prefix_length: 1,
          max_expansions: 10
        }
      });

      // Add phrase matching boost
      queryClause.bool.should.push({
        multi_match: {
          query: query.query,
          fields: ['title^5', 'content^2'],
          type: 'phrase'
        }
      });
    }

    // Add filters
    for (const filter of query.filters) {
      const filterClause = this.buildFilterClause(filter);
      if (filterClause) {
        queryClause.bool.filter.push(filterClause);
      }
    }

    // If no text query, use match_all
    if (!query.query && queryClause.bool.must.length === 0) {
      queryClause.bool.must.push({ match_all: {} });
    }

    searchBody.query = queryClause;

    // Add sorting
    if (query.sorting.length > 0) {
      searchBody.sort = query.sorting.map(sort => ({
        [sort.field]: { 
          order: sort.direction.toLowerCase(),
          missing: '_last'
        }
      }));
    } else {
      // Default sort by relevance, then by creation date
      searchBody.sort = [
        { _score: { order: 'desc' } },
        { createdAt: { order: 'desc' } }
      ];
    }

    // Add facets/aggregations
    searchBody.aggs = this.buildAggregations(query.scope);

    // Add highlighting
    searchBody.highlight = {
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
      fields: {
        title: { number_of_fragments: 0 },
        content: { fragment_size: 150, number_of_fragments: 3 }
      }
    };

    return {
      index: this.getIndexForScope(query.scope),
      body: searchBody
    };
  }

  private buildFilterClause(filter: SearchFilter): any {
    switch (filter.operator) {
      case SearchOperator.EQUALS:
        return { term: { [filter.field]: filter.value } };
      
      case SearchOperator.IN:
        return { terms: { [filter.field]: filter.value } };
      
      case SearchOperator.RANGE:
        return { 
          range: { 
            [filter.field]: {
              gte: filter.value.min,
              lte: filter.value.max
            }
          }
        };
      
      case SearchOperator.EXISTS:
        return { exists: { field: filter.field } };
      
      case SearchOperator.PREFIX:
        return { prefix: { [filter.field]: filter.value } };
      
      case SearchOperator.WILDCARD:
        return { wildcard: { [filter.field]: filter.value } };
      
      default:
        return null;
    }
  }

  private buildAggregations(scope: SearchScope): any {
    const aggs: any = {};

    // Type aggregation
    aggs.types = {
      terms: {
        field: 'type',
        size: 10
      }
    };

    // User aggregation (if applicable)
    aggs.users = {
      terms: {
        field: 'userId',
        size: 10
      }
    };

    // Date range aggregation
    aggs.date_ranges = {
      date_range: {
        field: 'createdAt',
        ranges: [
          { key: 'last_day', from: 'now-1d/d' },
          { key: 'last_week', from: 'now-1w/w' },
          { key: 'last_month', from: 'now-1M/M' },
          { key: 'last_year', from: 'now-1y/y' }
        ]
      }
    };

    // Tags aggregation
    aggs.tags = {
      terms: {
        field: 'tags',
        size: 20
      }
    };

    return aggs;
  }

  private transformElasticsearchResponse(
    response: any,
    queryTime: number
  ): SearchResult {
    const hits = response.body.hits.hits || [];
    const total = response.body.hits.total?.value || 0;
    const maxScore = response.body.hits.max_score;

    // Transform hits to search result items
    const items: SearchResultItem[] = hits.map((hit: any) => {
      const source = hit._source;
      const highlight = hit.highlight || {};

      return {
        id: hit._id,
        type: source.type,
        title: source.title,
        content: source.content,
        userId: source.userId,
        organizationId: source.organizationId,
        tags: source.tags || [],
        metadata: source.metadata || {},
        createdAt: new Date(source.createdAt),
        updatedAt: new Date(source.updatedAt),
        score: hit._score,
        highlights: {
          title: highlight.title || [],
          content: highlight.content || []
        }
      };
    });

    // Transform aggregations to facets
    const facets = this.transformAggregationsToFacets(response.body.aggregations || {});

    return SearchResult.create({
      items,
      totalCount: total,
      facets,
      suggestions: [],
      queryTime,
      maxScore
    });
  }

  private transformAggregationsToFacets(aggregations: any): SearchFacet[] {
    const facets: SearchFacet[] = [];

    for (const [key, agg] of Object.entries(aggregations)) {
      const buckets = (agg as any).buckets || [];
      
      if (buckets.length > 0) {
        const values = buckets.map((bucket: any) => ({
          value: bucket.key,
          count: bucket.doc_count,
          selected: false
        }));

        facets.push({
          field: key,
          label: this.getFacetLabel(key),
          values
        });
      }
    }

    return facets;
  }

  private getFacetLabel(field: string): string {
    const labels: Record<string, string> = {
      types: 'Content Type',
      users: 'Author',
      date_ranges: 'Date',
      tags: 'Tags'
    };

    return labels[field] || field;
  }

  private extractSuggestions(response: any): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const suggest = response.body.suggest?.title_suggest || [];

    for (const suggestionGroup of suggest) {
      for (const option of suggestionGroup.options || []) {
        suggestions.push({
          text: option._source?.title || option.text,
          score: option._score || 0,
          type: option._source?.type || 'unknown'
        });
      }
    }

    return suggestions;
  }

  private transformDocumentForIndexing(document: SearchDocument): any {
    return {
      ...document,
      title: {
        original: document.title,
        suggest: {
          input: [document.title, ...(document.tags || [])],
          weight: this.calculateSuggestionWeight(document)
        },
        ngram: document.title
      },
      content: {
        original: document.content || '',
        ngram: document.content || ''
      },
      indexed_at: new Date().toISOString()
    };
  }

  private calculateSuggestionWeight(document: SearchDocument): number {
    let weight = 1;

    // Boost newer documents
    const ageInDays = (Date.now() - document.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 7) weight += 2;
    else if (ageInDays < 30) weight += 1;

    // Boost based on engagement metrics
    if (document.metadata?.viewCount) {
      weight += Math.log10(document.metadata.viewCount + 1);
    }

    return Math.min(weight, 10);
  }

  private processBulkResponse(
    response: any,
    documents: SearchDocument[]
  ): BulkIndexResult {
    const errors: BulkIndexError[] = [];
    let indexed = 0;

    const items = response.body.items || [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const action = item.index || item.create || item.update || item.delete;

      if (action.status >= 200 && action.status < 300) {
        indexed++;
      } else {
        errors.push({
          documentId: documents[i]?.id || 'unknown',
          error: action.error?.reason || 'Unknown error',
          status: action.status
        });
      }
    }

    return { indexed, errors };
  }

  private getIndexForScope(scope: SearchScope): string {
    return `search_${scope.toString().toLowerCase()}`;
  }

  private getIndexForType(type: string): string {
    return `search_${type.toLowerCase()}`;
  }

  private mapElasticsearchError(error: any): SearchError {
    if (error.name === 'ResponseError') {
      const status = error.statusCode;
      const message = error.body?.error?.reason || error.message;

      switch (status) {
        case 400:
          return new SearchError('Invalid search query', 'INVALID_QUERY');
        case 404:
          return new SearchError('Index not found', 'INDEX_NOT_FOUND');
        case 429:
          return new SearchError('Search rate limit exceeded', 'RATE_LIMIT');
        case 503:
          return new SearchError('Search service unavailable', 'SERVICE_UNAVAILABLE');
        default:
          return new SearchError(message, 'ELASTICSEARCH_ERROR');
      }
    }

    return new SearchError('Search service error', 'UNKNOWN_ERROR');
  }
}
```

#### Search Event Handlers

**Domain Event Handlers for Auto-indexing**
```typescript
// packages/search/src/handlers/SearchEventHandlers.ts
export class SearchEventHandlers {
  constructor(
    private readonly indexDocumentUseCase: IndexDocumentUseCase,
    private readonly searchService: ISearchService
  ) {}

  @DomainEventHandler(UserCreatedEvent)
  async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.indexDocumentUseCase.execute(
      new IndexDocumentCommand({
        entityId: event.user.id.value,
        entityType: 'user'
      })
    );
  }

  @DomainEventHandler(OrganizationCreatedEvent)
  async handleOrganizationCreated(event: OrganizationCreatedEvent): Promise<void> {
    await this.indexDocumentUseCase.execute(
      new IndexDocumentCommand({
        entityId: event.organization.id.value,
        entityType: 'organization'
      })
    );
  }

  @DomainEventHandler(ProjectCreatedEvent)
  async handleProjectCreated(event: ProjectCreatedEvent): Promise<void> {
    await this.indexDocumentUseCase.execute(
      new IndexDocumentCommand({
        entityId: event.project.id.value,
        entityType: 'project'
      })
    );
  }

  @DomainEventHandler(UserUpdatedEvent)
  async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // Update the existing document
    await this.searchService.updateDocument(
      event.user.id.value,
      {
        title: event.user.name.value,
        updatedAt: new Date()
      }
    );
  }

  @DomainEventHandler(UserDeletedEvent)
  async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    await this.searchService.deleteDocument(
      event.userId.value,
      'user'
    );
  }
}
```

### API Layer

#### Search Controller

```typescript
// packages/api/src/controllers/search/SearchController.ts
export class SearchController {
  constructor(
    private readonly executeSearchUseCase: ExecuteSearchUseCase,
    private readonly getSuggestionsUseCase: GetSearchSuggestionsUseCase,
    private readonly indexDocumentUseCase: IndexDocumentUseCase
  ) {}

  async search(c: Context): Promise<Response> {
    const validation = SearchQuerySchema.safeParse({
      ...c.req.query(),
      ...await c.req.json().catch(() => ({}))
    });

    if (!validation.success) {
      return c.json({ error: 'Invalid search query', details: validation.error }, 400);
    }

    const userId = c.get('userId') ? new UserId(c.get('userId')) : undefined;
    
    const command = new ExecuteSearchCommand({
      userId,
      query: validation.data.q || '',
      filters: this.parseFilters(validation.data.filters),
      sorting: this.parseSorting(validation.data.sort),
      pagination: {
        size: Math.min(validation.data.size || 20, 100),
        offset: validation.data.offset || 0
      },
      scope: validation.data.scope || SearchScope.ALL
    });

    const result = await this.executeSearchUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    const searchResult = result.value;

    return c.json({
      query: command.query,
      total: searchResult.totalCount,
      items: searchResult.items.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content?.substring(0, 200),
        score: item.score,
        highlights: item.highlights,
        createdAt: item.createdAt,
        metadata: item.metadata
      })),
      facets: searchResult.facets,
      executionTime: searchResult.queryTime,
      pagination: {
        size: command.pagination.size,
        offset: command.pagination.offset,
        hasMore: (command.pagination.offset + command.pagination.size) < searchResult.totalCount
      }
    });
  }

  async suggest(c: Context): Promise<Response> {
    const query = c.req.query('q');
    const scope = c.req.query('scope') || SearchScope.ALL;
    const limit = Math.min(parseInt(c.req.query('limit') || '10'), 20);

    if (!query || query.length < 2) {
      return c.json({ suggestions: [] });
    }

    const command = new GetSearchSuggestionsCommand({
      query,
      scope,
      limit
    });

    const result = await this.getSuggestionsUseCase.execute(command);

    if (result.isFailure) {
      return c.json({ error: result.error.message }, 400);
    }

    return c.json({
      suggestions: result.value.map(suggestion => ({
        text: suggestion.text,
        type: suggestion.type,
        score: suggestion.score
      }))
    });
  }

  private parseFilters(filtersParam?: string): SearchFilter[] {
    if (!filtersParam) return [];

    try {
      const filters = JSON.parse(filtersParam);
      return Array.isArray(filters) ? filters : [];
    } catch {
      return [];
    }
  }

  private parseSorting(sortParam?: string): SearchSort[] {
    if (!sortParam) return [];

    const sorts = sortParam.split(',').map(sort => {
      const [field, direction = 'asc'] = sort.trim().split(':');
      return {
        field,
        direction: direction.toUpperCase() as 'ASC' | 'DESC'
      };
    });

    return sorts;
  }
}
```

## Performance Optimization

### Search Caching Strategy

```typescript
// packages/search/src/caching/SearchCacheManager.ts
export class SearchCacheManager {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly searchMetrics: IMetricsService
  ) {}

  async getCachedSearch(cacheKey: string): Promise<SearchResult | null> {
    const startTime = Date.now();
    
    try {
      const cached = await this.cacheService.get(cacheKey, SearchResult);
      
      if (cached) {
        this.searchMetrics.incrementCounter('search_cache_hits');
        this.searchMetrics.recordHistogram(
          'search_cache_retrieval_time',
          Date.now() - startTime
        );
        return cached;
      }

      this.searchMetrics.incrementCounter('search_cache_misses');
      return null;

    } catch (error) {
      this.searchMetrics.incrementCounter('search_cache_errors');
      return null;
    }
  }

  async cacheSearchResult(
    cacheKey: string,
    result: SearchResult,
    ttlSeconds: number = 300
  ): Promise<void> {
    try {
      await this.cacheService.set(cacheKey, result, ttlSeconds);
      this.searchMetrics.incrementCounter('search_results_cached');
    } catch (error) {
      this.searchMetrics.incrementCounter('search_cache_set_errors');
    }
  }

  generateCacheKey(query: SearchQuery): string {
    const components = [
      'search',
      this.hashString(query.query),
      this.hashObject(query.filters),
      this.hashObject(query.sorting),
      `${query.pagination.size}:${query.pagination.offset}`,
      query.scope.toString(),
      query.userId?.value || 'anonymous'
    ];

    return components.join(':');
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private hashObject(obj: any): string {
    return this.hashString(JSON.stringify(obj));
  }
}
```

## Testing Patterns

### Integration Tests

```typescript
// packages/search/__tests__/integration/ElasticsearchService.test.ts
describe('ElasticsearchService Integration', () => {
  let searchService: ElasticsearchService;
  let testIndex: string;

  beforeAll(async () => {
    searchService = new ElasticsearchService({
      nodes: [process.env.ELASTICSEARCH_TEST_URL || 'http://localhost:9200']
    });
    
    testIndex = `test_search_${Date.now()}`;
  });

  afterAll(async () => {
    await searchService.deleteIndex(testIndex);
  });

  beforeEach(async () => {
    await searchService.refreshIndex(testIndex);
  });

  it('should index and search documents', async () => {
    // Index test documents
    const documents: SearchDocument[] = [
      {
        id: '1',
        type: 'user',
        title: 'John Doe',
        content: 'Software engineer at Acme Corp',
        tags: ['engineering', 'javascript'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        type: 'user',
        title: 'Jane Smith',
        content: 'Product manager with expertise in SaaS',
        tags: ['product', 'saas'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const bulkResult = await searchService.bulkIndex(documents);
    expect(bulkResult.isSuccess).toBe(true);
    expect(bulkResult.value.indexed).toBe(2);

    // Wait for indexing to complete
    await searchService.refreshIndex(testIndex);

    // Execute search
    const searchQuery = SearchQuery.create({
      query: 'javascript engineer',
      scope: SearchScope.USERS,
      pagination: { size: 10, offset: 0 }
    });

    expect(searchQuery.isSuccess).toBe(true);

    const searchResult = await searchService.search(searchQuery.value);
    expect(searchResult.isSuccess).toBe(true);
    expect(searchResult.value.items).toHaveLength(1);
    expect(searchResult.value.items[0].title).toBe('John Doe');
  });

  it('should provide relevant suggestions', async () => {
    const suggestions = await searchService.suggest('john', SearchScope.ALL, 5);
    
    expect(suggestions.isSuccess).toBe(true);
    expect(suggestions.value).toBeInstanceOf(Array);
  });
});
```

```yaml
# Embedded DSL Verification
verify:
  exists:
    - "packages/core/domain/search/entities/SearchQuery.ts"
    - "packages/core/domain/search/entities/SearchIndex.ts"
    - "packages/core/domain/search/values/SearchResult.ts"
    - "packages/core/interfaces/search/ISearchService.ts"
    - "packages/api/src/use-cases/search/ExecuteSearchUseCase.ts"
    - "packages/search/src/services/ElasticsearchService.ts"
    - "packages/api/src/controllers/search/SearchController.ts"

  contains:
    - file: "packages/core/domain/search/entities/SearchQuery.ts"
      pattern: "class SearchQuery extends AggregateRoot"
    
    - file: "packages/search/src/services/ElasticsearchService.ts"
      pattern: "implements ISearchService"
    
    - file: "packages/search/src/services/ElasticsearchService.ts"
      pattern: "from '@elastic/elasticsearch'"
    
    - file: "packages/api/src/use-cases/search/ExecuteSearchUseCase.ts"
      pattern: "implements IUseCase"

  patterns:
    - name: "Elasticsearch Integration"
      files: ["packages/search/src/services/*.ts"]
      pattern: "@elastic/elasticsearch"
    
    - name: "Search Domain Events"
      files: ["packages/core/domain/search/entities/*.ts"]
      pattern: "this.addDomainEvent"
    
    - name: "CQRS Search Patterns"
      files: ["packages/api/src/use-cases/search/*.ts"]
      pattern: "(Query|Command)"
    
    - name: "Relevance Scoring"
      files: ["packages/core/domain/search/services/*.ts"]
      pattern: "calculateRelevanceScore"

  constraints:
    - name: "Search Abstraction"
      description: "Domain should not depend on Elasticsearch directly"
      verify: "no_imports"
      from: "packages/core/domain/search/**/*.ts"
      to: "@elastic/elasticsearch"

commands:
  - name: "test:search"
    description: "Run search domain and use case tests"
    command: "pnpm test packages/core/domain/search packages/api/src/use-cases/search"
  
  - name: "test:search:integration"
    description: "Run search integration tests"
    command: "pnpm test packages/search/__tests__/integration"
  
  - name: "index:reindex"
    description: "Reindex all search documents"
    command: "pnpm --filter @repo/search reindex"
```

## Key Implementation Notes

1. **Domain-Driven Search**: Model search as a domain concern with proper aggregates, value objects, and domain services.

2. **CQRS Integration**: Separate command and query responsibilities with dedicated read models for search.

3. **Elasticsearch Abstraction**: Use gateway pattern to abstract Elasticsearch specifics from domain logic.

4. **Relevance Engineering**: Implement custom relevance scoring based on business rules and user context.

5. **Auto-Indexing**: Use domain events to automatically maintain search indices when entities change.

6. **Performance Optimization**: Implement multi-level caching, query optimization, and result pagination.

7. **Faceted Search**: Provide rich filtering capabilities with aggregations and faceted navigation.

8. **Search Analytics**: Track search queries, results, and user interactions for continuous improvement.

9. **Error Resilience**: Implement proper error handling with fallback mechanisms and circuit breakers.

10. **Testing Strategy**: Comprehensive integration testing with real Elasticsearch instances and domain unit tests.

This pattern provides a robust, scalable, and maintainable search system while maintaining Clean Architecture principles and delivering high-performance search capabilities.