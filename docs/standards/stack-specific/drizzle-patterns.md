# Drizzle ORM Patterns

> Follow the Drizzle ORM version documented in `docs/standards/tech-stack.md` (currently 0.44.5+). Update examples when the tech stack file changes.

We keep this standard as the shared source of truth for Drizzle usage so product teams can reference a single, curated playbook. When the upstream Drizzle project adds new capabilities, refresh the guidance here rather than duplicating tips in individual repos.

### Best Practices Checklist

- Keep schema modules colocated under `src/db/schema/**`, export types via `typeof users.$inferSelect` or `InferSelectModel`, and centralise shared enums/constants.
- Manage configuration with a checked-in `drizzle.config.ts` that calls `defineConfig`, and prefer per-environment overrides (`drizzle-dev.config.ts`, etc.) when needed.
- Use the `relations` API (or the generated `relations.ts` produced by `drizzle-kit pull` with relations enabled) so `db.query.<table>` calls stay fully typed.
- Run `pnpm drizzle-kit generate` for every schema change, gate pull requests with `pnpm drizzle-kit check`, and commit generated SQL to keep drift observable.
- Scope tenant data via PostgreSQL schemas or Row-Level Security helpers; never mix tenant records in shared tables without RLS or tenant filters.
- Use generated columns + functional indexes for full-text search, vector operations, and materialised views instead of ad-hoc SQL in services.
- Wrap read-heavy paths with the Drizzle `Cache` interface (or Upstash Redis) and call `Cache.onMutate` from mutations for deterministic invalidation.

## Schema Definition

### Table Definitions
```typescript
// db/schema/users.ts
import { pgTable, varchar, uuid, timestamp, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', precision: 3 }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at', { mode: 'date', precision: 3 }),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt.desc()),
  // Partial index for soft deletes
  activeUsersIdx: index('users_active_idx')
    .on(table.email)
    .where(sql`deleted_at IS NULL`),
}));

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  sessions: many(sessions),
}));
```

### Type Inference
```typescript
// Infer types from schema
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Shorthand introduced in Drizzle 0.29+
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

// Custom types with relations
export type UserWithProfile = User & {
  profile: Profile | null;
};

export type UserWithPosts = User & {
  posts: Post[];
};

### Custom Schemas & Shared Types
```typescript
// db/schema/multi-tenancy.ts
import { pgSchema, uuid, text, timestamp } from 'drizzle-orm/pg-core';

// Keep tenant-specific tables in a separate PostgreSQL schema
export const tenantsSchema = pgSchema('tenants');

export const tenantRoles = tenantsSchema.enum('tenant_role', ['owner', 'admin', 'member']);

export const tenantMembers = tenantsSchema.table('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: tenantRoles('role').default('member').notNull(),
  joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
});

// Expose typed helpers so application code never hard-codes schema-qualified names
export type TenantMember = typeof tenantMembers.$inferSelect;
export const tenantMembersTableName = tenantMembers[Symbol.for('drizzle:Name')];
```

## Relations API Patterns

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  authoredPosts: many(posts, { relationName: 'author' }),
  reviewedPosts: many(posts, { relationName: 'reviewer' }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
    relationName: 'author',
  }),
  reviewer: one(users, {
    fields: [posts.reviewerId],
    references: [users.id],
    relationName: 'reviewer',
  }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

// Query with eager loading
const postsWithRelations = await db.query.posts.findMany({
  where: eq(posts.published, true),
  with: {
    author: { columns: { id: true, name: true } },
    reviewer: true,
    comments: {
      columns: { id: true, text: true },
      orderBy: [desc(comments.createdAt)],
    },
  },
});

// Database-first workflow: drizzle-kit pull can emit relations based on FK metadata
// pnpm drizzle-kit pull --out ./src/db/introspected --config=drizzle-dev.config.ts
```

> **Tip**: When multiple relations reference the same pair of tables, always set `relationName` so `db.query.*` typings stay unambiguous.

## Query Patterns

### Basic Queries
```typescript
// Select with conditions
const activeUsers = await db
  .select()
  .from(users)
  .where(
    and(
      eq(users.emailVerified, true),
      isNull(users.deletedAt)
    )
  )
  .orderBy(desc(users.createdAt))
  .limit(10);

// Insert with returning
const [newUser] = await db
  .insert(users)
  .values({
    email: 'user@example.com',
    name: 'John Doe',
    passwordHash: await hashPassword(password),
  })
  .returning();

// Update with conditions
await db
  .update(users)
  .set({ emailVerified: true })
  .where(eq(users.id, userId));

// Soft delete
await db
  .update(users)
  .set({ deletedAt: new Date() })
  .where(eq(users.id, userId));
```

### Advanced Queries

```typescript
// DrizzleORM 0.44.5+ $onUpdate Features
const usersWithUpdateTracking = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  // $onUpdateFn for SQL expressions (v0.44.5+)
  updateCounter: integer('update_counter').default(1)
    .$onUpdateFn(() => sql`update_counter + 1`),
  // $onUpdate for JavaScript functions
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 })
    .$onUpdate(() => new Date()),
  // Complex $onUpdate logic with context
  lastModifiedBy: uuid('last_modified_by')
    .$onUpdate(() => getCurrentUserId()),
  // Conditional $onUpdate
  version: integer('version').default(1)
    .$onUpdateFn(() => sql`version + 1`),
  // Always null $onUpdate for clearing fields
  tempData: text('temp_data')
    .$onUpdate(() => null),
});

// UPDATE FROM with CTE for complex updates
const averagePrice = db.$with('average_price').as(
  db.select({ value: sql`avg(${products.price})`.as('value') }).from(products)
);

await db.with(averagePrice)
  .update(products)
  .set({ cheap: true })
  .where(lt(products.price, sql`(select * from ${averagePrice})`))
  .returning({ id: products.id });

// Batch updates with different values
const inputs = [
  { id: 1, status: 'active' },
  { id: 2, status: 'inactive' },
  { id: 3, status: 'pending' }
];

const sqlChunks: SQL[] = [];
const ids: number[] = [];

sqlChunks.push(sql`(case`);
for (const input of inputs) {
  sqlChunks.push(sql`when ${users.id} = ${input.id} then ${input.status}`);
  ids.push(input.id);
}
sqlChunks.push(sql`end)`);

const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));
await db.update(users).set({ status: finalSql }).where(inArray(users.id, ids));
```

### Vector & Full-Text Search

```typescript
import { eq, l2Distance, sql } from 'drizzle-orm';

// items and users tables defined in ./schema

const embeddingQuery = [0.12, 0.44, -0.81] satisfies number[];
const searchTerm = 'growth & roadmap';
const tsQuery = sql`websearch_to_tsquery('english', ${searchTerm})`;

// Vector similarity search with pgvector
const similarEmbeddings = await db
  .select({
    id: items.id,
    distance: l2Distance(items.embedding, embeddingQuery).as('distance'),
  })
  .from(items)
  .orderBy(l2Distance(items.embedding, embeddingQuery))
  .limit(10);

// Sub-query vector comparison
const referenceId = 'item_1';

const reference = db
  .select({ embedding: items.embedding })
  .from(items)
  .where(eq(items.id, referenceId));

const neighbours = await db
  .select()
  .from(items)
  .orderBy(l2Distance(items.embedding, reference))
  .limit(5);

// Full-text search powered by generated tsvector column
const rankedResults = await db
  .select({
    id: users.id,
    score: sql`ts_rank(${users.searchVector}, ${tsQuery})`,
  })
  .from(users)
  .where(sql`${users.searchVector} @@ ${tsQuery}`)
  .orderBy(sql`ts_rank(${users.searchVector}, ${tsQuery}) DESC`)
  .limit(20);
```

## Generated Columns

```typescript
// Virtual generated columns (computed on read)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  // Virtual column - computed on query
  totalValue: decimal('total_value', { precision: 12, scale: 2 })
    .generatedAlwaysAs(sql`price * quantity`),
});

// Stored generated columns (computed on write)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  // Stored column - computed and persisted
  fullName: varchar('full_name', { length: 101 })
    .generatedAlwaysAs(sql`first_name || ' ' || last_name`, { mode: 'stored' }),
  email: varchar('email', { length: 255 }).notNull(),
  // Search optimization
  searchVector: text('search_vector')
    .generatedAlwaysAs(sql`to_tsvector('english', first_name || ' ' || last_name || ' ' || email)`, 
      { mode: 'stored' }
    ),
});

// Index on generated column for performance
export const usersWithSearchIndex = pgTable('users', {
  // ... columns above
}, (table) => ({
  searchIdx: index('users_search_idx').using('gin', table.searchVector),
  fullNameIdx: index('users_full_name_idx').on(table.fullName),
}));
```

## Row-Level Security (RLS)

```typescript
// RLS with Better-Auth integration
import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  ownerId: uuid('owner_id').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  organizationId: uuid('organization_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Enable RLS
  rls: table.enableRLS(),
  
  // Policy: Users can only see their own documents or public ones
  ownerPolicy: table.policy('owner_policy', {
    as: 'permissive',
    for: 'all',
    to: ['authenticated'],
    using: sql`(owner_id = auth.uid() OR is_public = true)`,
    withCheck: sql`(owner_id = auth.uid())`,
  }),
  
  // Policy: Organization members can see org documents
  orgPolicy: table.policy('org_policy', {
    as: 'permissive', 
    for: 'select',
    to: ['authenticated'],
    using: sql`(
      organization_id IS NOT NULL AND 
      EXISTS (
        SELECT 1 FROM organization_members 
        WHERE organization_id = documents.organization_id 
        AND user_id = auth.uid()
      )
    )`,
  }),
}));

// Multi-tenant RLS pattern
export const tenantData = pgTable('tenant_data', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  data: text('data').notNull(),
}, (table) => ({
  rls: table.enableRLS(),
  tenantPolicy: table.policy('tenant_isolation', {
    as: 'restrictive',
    for: 'all', 
    to: ['authenticated'],
    using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
  }),
}));

// Usage with database context
async function withTenantContext<T>(
  tenantId: string, 
  callback: () => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
    return await callback();
  });
}
```

### Advanced Live Query Patterns (Expo SQLite)

```typescript
// Setup for live queries
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

// Enable change listeners
const expo = openDatabaseSync('app.db', { enableChangeListener: true });
const db = drizzle(expo);

// React component with live data
function UsersList() {
  // Automatically re-renders when users table changes
  const { data: users, error, updatedAt } = useLiveQuery(
    db.select().from(usersTable).where(eq(usersTable.active, true))
  );

  const { data: userWithPosts } = useLiveQuery(
    db.query.users.findMany({
      with: { posts: true },
      where: eq(users.active, true),
    })
  );

  if (error) return <Text>Error: {error.message}</Text>;
  
  return (
    <ScrollView>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      <Text>Last updated: {updatedAt?.toISOString()}</Text>
    </ScrollView>
  );
}

// Live query with custom hook
function useUserActivity(userId: string) {
  const { data: activities } = useLiveQuery(
    db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(10)
  );

  return activities ?? [];
}
```

## Migration Patterns

```typescript
// drizzle.config.ts - Updated for v0.44.5+
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/*",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  },
  migrations: {
    table: "drizzle_migrations",
    schema: "public",
    prefix: "index", // timestamp or index
  },
  entities: {
    roles: {
      provider: 'supabase',
    },
  },
  extensionsFilters: ["postgis"],
  schemaFilter: ["public", "auth"],
  tablesFilter: ["!auth.*"],
  verbose: true,
  strict: true,
  breakpoints: true,
});

// Generate migration with custom name and breakpoints
// pnpm drizzle-kit generate --name add_user_profiles --breakpoints

// Push schema with inspection and confirmation
// pnpm drizzle-kit push --force

// Apply migrations with dry run
// pnpm drizzle-kit migrate --dry-run
// pnpm drizzle-kit migrate

// Introspect existing database
// pnpm drizzle-kit pull

// Studio for database visualization
// pnpm drizzle-kit studio --port 3333

// Validate schema drift in CI
// pnpm drizzle-kit check --config=drizzle-dev.config.ts

// Database-first workflow: emit schema + relations
// pnpm drizzle-kit pull --out ./src/db/introspected

// Support multiple environments with explicit configs
// pnpm drizzle-kit migrate --config=drizzle-dev.config.ts
// pnpm drizzle-kit migrate --config=drizzle-prod.config.ts
```

> Run `pnpm drizzle-kit check` in CI to block drift and to keep generated relation metadata (`relations.ts`) aligned with production schemas.

## Error Handling

```typescript
import { DrizzleError } from 'drizzle-orm';

// Proper error handling with stack traces
async function createUser(userData: NewUser) {
  try {
    const [user] = await db.insert(users).values(userData).returning();
    return { success: true, user };
  } catch (error) {
    if (error instanceof DrizzleError) {
      // Enhanced error with proper stack trace
      console.error('Drizzle Error:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
        query: error.sql, // If available
      });
      
      // Handle specific database errors
      if (error.code === '23505') { // Unique violation
        return { success: false, error: 'Email already exists' };
      }
    }
    
    throw error;
  }
}

// Transaction error handling
async function transferFunds(fromId: string, toId: string, amount: number) {
  try {
    await db.transaction(async (tx) => {
      await tx.update(accounts)
        .set({ balance: sql`balance - ${amount}` })
        .where(eq(accounts.id, fromId));
        
      await tx.update(accounts)
        .set({ balance: sql`balance + ${amount}` })
        .where(eq(accounts.id, toId));
    });
  } catch (error) {
    if (error instanceof DrizzleError) {
      // Log with full context
      logger.error('Transaction failed', {
        operation: 'transferFunds',
        fromId,
        toId,
        amount,
        error: error.message,
        sql: error.sql,
      });
    }
    throw error;
  }
}
```

## Performance Optimizations

```typescript
// Caching with Upstash integration
import { drizzle } from 'drizzle-orm/node-postgres';
import { Redis } from '@upstash/redis';
import Keyv from 'keyv';
import { Cache } from 'drizzle-orm/cache';
import { Table, getTableName, is } from 'drizzle-orm';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const db = drizzle(connection, {
  caching: {
    ttl: 300, // 5 minutes
    store: {
      get: async (key: string) => {
        const value = await redis.get(key);
        return value ? JSON.parse(value as string) : undefined;
      },
      set: async (key: string, value: any, ttl?: number) => {
        await redis.set(key, JSON.stringify(value), { ex: ttl });
      },
      delete: async (key: string) => {
        await redis.del(key);
      },
    },
  },
});

// Advanced cache invalidation strategy using Drizzle's Cache interface
class GlobalCache extends Cache {
  private readonly store = new Keyv();
  private readonly tableKeyMap = new Map<string, string[]>();
  private readonly ttl = 1_000; // milliseconds

  override strategy() {
    return 'all';
  }

  override async get(key: string) {
    const cached = await this.store.get(key);
    return cached === undefined ? undefined : (cached as any[]);
  }

  override async put(key: string, response: any[], tables: string[]) {
    await this.store.set(key, response, this.ttl);
    for (const table of tables) {
      const keys = this.tableKeyMap.get(table) ?? [];
      keys.push(key);
      this.tableKeyMap.set(table, keys);
    }
  }

  override async onMutate({ tables, tags }: { tables: string[] | Table<any>[]; tags: string | string[] }) {
    const tableList = Array.isArray(tables) ? tables : [tables];
    for (const table of tableList) {
      const tableName = is(table, Table) ? getTableName(table) : table;
      const keys = this.tableKeyMap.get(tableName) ?? [];
      await Promise.all(keys.map((key) => this.store.delete(key)));
      this.tableKeyMap.delete(tableName);
    }

    const tagList = Array.isArray(tags) ? tags : [tags];
    await Promise.all(tagList.filter(Boolean).map((tag) => this.store.delete(tag)));
  }
}

const cachedDb = drizzle(connection, { caching: { provider: new GlobalCache() } });

// Batch operations for performance
async function bulkCreateUsers(users: NewUser[]) {
  const BATCH_SIZE = 100;
  const results = [];
  
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const batchResults = await db.insert(usersTable)
      .values(batch)
      .returning({ id: usersTable.id });
    results.push(...batchResults);
  }
  
  return results;
}

// Optimized queries with proper indexing
export const optimizedUserQueries = {
  // Use covering index for common queries
  getActiveUsers: () => db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(and(
      eq(users.emailVerified, true),
      isNull(users.deletedAt)
    ))
    .orderBy(desc(users.createdAt)),

  // Use generated column for search
  searchUsers: (query: string) => db
    .select()
    .from(usersWithSearchIndex)
    .where(sql`search_vector @@ to_tsquery('english', ${query})`),
};
```

## Repository Patterns

```typescript
// Base repository class
abstract class BaseRepository<TTable extends PgTable, TSelect, TInsert> {
  constructor(
    protected db: NodePgDatabase,
    protected table: TTable
  ) {}

  async findById(id: string): Promise<TSelect | null> {
    const results = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.id, id))
      .limit(1);
    
    return results[0] ?? null;
  }

  async create(data: TInsert): Promise<TSelect> {
    const [result] = await this.db
      .insert(this.table)
      .values(data)
      .returning();
    return result;
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    const [result] = await this.db
      .update(this.table)
      .set(data)
      .where(eq(this.table.id, id))
      .returning();
    
    return result ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db
      .delete(this.table)
      .where(eq(this.table.id, id));
    
    return result.rowCount > 0;
  }
}

// User repository with domain-specific methods
class UserRepository extends BaseRepository<typeof users, User, NewUser> {
  constructor(db: NodePgDatabase) {
    super(db, users);
  }

  async findByEmail(email: string): Promise<User | null> {
    const results = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return results[0] ?? null;
  }

  async findWithProfile(id: string): Promise<UserWithProfile | null> {
    const results = await this.db.query.users.findFirst({
      where: eq(users.id, id),
      with: { profile: true },
    });
    
    return results ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(eq(users.id, id));
    
    return result.rowCount > 0;
  }

  async getActiveUsers(limit = 10): Promise<User[]> {
    return await this.db
      .select()
      .from(users)
      .where(and(
        eq(users.emailVerified, true),
        isNull(users.deletedAt)
      ))
      .orderBy(desc(users.createdAt))
      .limit(limit);
  }
}

// Usage
const userRepo = new UserRepository(db);
const user = await userRepo.findByEmail('user@example.com');
const activeUsers = await userRepo.getActiveUsers(20);
```

## Live Queries (Expo SQLite)

```typescript
// DrizzleORM 0.44.5+ Live Queries with Expo SQLite
import { useLiveQuery, drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import { eq, desc } from 'drizzle-orm';

// Enable change listener for live queries
const expo = openDatabaseSync('app.db', { enableChangeListener: true });
const db = drizzle(expo);

// React component with live query
function UsersList() {
  const { data: users, error, updatedAt } = useLiveQuery(
    db.select().from(usersTable).where(eq(usersTable.active, true))
      .orderBy(desc(usersTable.createdAt))
  );

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  return (
    <ScrollView>
      {users?.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
      <Text style={styles.timestamp}>
        Last updated: {updatedAt?.toISOString()}
      </Text>
    </ScrollView>
  );
}

// Live query with complex conditions
function ActivePostsWithComments() {
  const { data: posts, error, updatedAt } = useLiveQuery(
    db.query.posts.findMany({
      where: eq(posts.published, true),
      with: {
        comments: {
          where: eq(comments.approved, true),
          orderBy: [desc(comments.createdAt)],
          limit: 5,
        },
        author: {
          columns: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: [desc(posts.createdAt)],
      limit: 20,
    })
  );

  return (
    <View>
      {posts?.map(post => (
        <PostWithComments 
          key={post.id} 
          post={post} 
          lastUpdate={updatedAt}
        />
      ))}
    </View>
  );
}

// Custom hook for live query with debouncing
function useDebouncedLiveQuery<T>(
  query: () => Promise<T>,
  debounceMs = 100
) {
  const { data, error, updatedAt } = useLiveQuery(query);
  const [debouncedData, setDebouncedData] = useState(data);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedData(data);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [data, debounceMs]);

  return { data: debouncedData, error, updatedAt };
}
```

## Testing Patterns

```typescript
// Test utilities for RLS
export async function createTestContext(userId: string, tenantId?: string) {
  return {
    userId,
    tenantId,
    db: drizzle(testConnection, {
      schema: { ...schema },
    }),
    
    async withAuth<T>(callback: () => Promise<T>): Promise<T> {
      // Set auth context for testing
      await this.db.execute(sql`SET LOCAL role authenticated`);
      await this.db.execute(sql`SET LOCAL request.jwt.claim.sub = ${userId}`);
      
      if (tenantId) {
        await this.db.execute(sql`SET LOCAL app.current_tenant = ${tenantId}`);
      }
      
      return await callback();
    }
  };
}

// Mock generated columns in tests
export const testUsers = pgTable('test_users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 50 }),
  lastName: varchar('last_name', { length: 50 }),
  // Mock the generated column for tests
  fullName: varchar('full_name', { length: 101 })
    .$defaultFn(() => ''), // Override in tests
});

// Test RLS policies
describe('Document RLS', () => {
  it('should only show user documents', async () => {
    const ctx = await createTestContext('user-1');
    
    const documents = await ctx.withAuth(() =>
      ctx.db.select().from(documentsTable)
    );
    
    expect(documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ownerId: 'user-1' })
      ])
    );
  });
});
```

## Database Verification

<verification-block context-check="drizzle-patterns-verification">
  <verification_definitions>
    <test name="drizzle_kit_config_present">
      TEST: test -f drizzle.config.ts || test -f drizzle.config.js
      REQUIRED: true
      ERROR: "Drizzle config file not found. Create drizzle.config.ts with database configuration."
      DESCRIPTION: "Ensures Drizzle Kit configuration file exists for migrations"
    </test>
    <test name="proper_schema_imports">
      TEST: rg --max-count 1 "from .*drizzle-orm/pg-core" packages/database --glob "*.ts"
      REQUIRED: true
      ERROR: "Drizzle ORM imports not found. Import table and column definitions from 'drizzle-orm/pg-core'."
      DESCRIPTION: "Verifies proper Drizzle ORM imports in schema files"
    </test>
    <test name="schema_folder_structure">
      TEST: find . -path "*/schema/*.ts" -o -path "*/db/schema/*.ts" | head -1
      REQUIRED: true
      ERROR: "Schema files should be organized in a 'schema/' or 'db/schema/' directory."
      DESCRIPTION: "Ensures schema files are properly organized"
    </test>
    <test name="migrations_folder_exists">
      TEST: test -d migrations || test -d drizzle/migrations
      REQUIRED: true
      ERROR: "Migrations folder not found. Run 'pnpm drizzle-kit generate' to create migrations."
      DESCRIPTION: "Verifies migrations directory exists"
    </test>
    <test name="no_raw_sql_in_business_logic">
      TEST: "! rg 'sql`' packages/core --glob '*.ts' --glob '!**/__tests__/**' --glob '!**/*.test.ts'"
      REQUIRED: true
      ERROR: "Raw SQL found in core business logic. Use Drizzle query builder instead."
      DESCRIPTION: "Ensures business logic uses type-safe Drizzle queries, not raw SQL"
    </test>
    <test name="proper_table_naming">
      TEST: rg --max-count 3 "pgTable\('[a-z_]+'" packages/database --glob "*.ts"
      REQUIRED: false
      ERROR: "Consider using snake_case for database table names for consistency."
      DESCRIPTION: "Checks that table names follow snake_case convention"
    </test>
    <test name="primary_keys_defined">
      TEST: rg --max-count 3 "\\.primaryKey\(\)" packages/database --glob "*.ts"
      REQUIRED: true
      ERROR: "Tables should have primary keys defined. Add .primaryKey() to appropriate columns."
      DESCRIPTION: "Ensures all tables have primary keys defined"
    </test>
    <test name="proper_relations_usage">
      TEST: rg --max-count 3 "relations\(" packages/database --glob "*.ts"
      REQUIRED: false
      ERROR: "Consider using Drizzle relations for better type safety and query building."
      DESCRIPTION: "Encourages use of Drizzle relations for table relationships"
    </test>
    <test name="environment_variable_usage">
      TEST: rg --max-count 1 "process\\.env\\.DATABASE_URL" packages/database --glob "*.ts"
      REQUIRED: true
      ERROR: "DATABASE_URL environment variable not used. Configure database connection properly."
      DESCRIPTION: "Ensures database connection uses environment variables"
    </test>
    <test name="type_inference_patterns">
      TEST: rg --max-count 3 "(InferSelectModel|InferInsertModel|\\$inferSelect)" packages/database --glob "*.ts"
      REQUIRED: false
      ERROR: "Consider using InferSelectModel and InferInsertModel for better TypeScript integration."
      DESCRIPTION: "Encourages use of Drizzle type inference utilities"
    </test>
    <test name="drizzle_kit_check_in_ci">
      TEST: rg --max-count 1 "drizzle-kit check" package.json .github --glob "*.json" --glob "*.yml"
      REQUIRED: false
      ERROR: "Consider wiring 'drizzle-kit check' into scripts/CI to block unreviewed schema drift."
      DESCRIPTION: "Encourages automated schema drift detection with drizzle-kit check"
    </test>
  </verification_definitions>
</verification-block>
