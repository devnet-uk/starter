# Database Migration Strategy

## Core Principles

1. **Always Backward Compatible**: Never break existing functionality
2. **Blue-Green Deployments**: For breaking changes requiring coordinated deployment
3. **Migration Testing**: All migrations tested in staging before production
4. **Rollback Procedures**: Every migration has a documented rollback plan
5. **Data Integrity**: Never lose or corrupt data during migrations

## Migration Workflow

### 1. Development Phase
```bash
# Create new migration
pnpm db:generate

# Review generated SQL
cat drizzle/migrations/0001_migration_name.sql

# Apply migration locally
pnpm db:migrate

# Test rollback locally
pnpm db:rollback
```

### 2. Testing Phase
```typescript
// tests/migrations/migration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { migrate, rollback } from '@/db/migrate';
import { db } from '@/db';

describe('Migration: Add user_preferences table', () => {
  const testDb = createTestDatabase();
  
  beforeAll(async () => {
    // Apply all migrations up to the one being tested
    await migrate(testDb, { to: '0010_add_user_preferences' });
  });
  
  afterAll(async () => {
    await testDb.close();
  });
  
  it('should create user_preferences table', async () => {
    const tables = await testDb.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'user_preferences'`
    );
    
    expect(tables.rows).toHaveLength(1);
  });
  
  it('should handle existing data correctly', async () => {
    // Insert test data
    const userId = await testDb.insert(users).values({
      email: 'test@example.com',
      name: 'Test User'
    }).returning({ id: users.id });
    
    // Verify default preferences were created
    const preferences = await testDb
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId[0].id));
    
    expect(preferences).toHaveLength(1);
    expect(preferences[0].theme).toBe('light'); // Default value
  });
  
  it('should rollback cleanly', async () => {
    await rollback(testDb, { from: '0010_add_user_preferences' });
    
    const tables = await testDb.query(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name = 'user_preferences'`
    );
    
    expect(tables.rows).toHaveLength(0);
  });
});
```

### 3. Staging Deployment
```yaml
# .github/workflows/staging-migration.yml
name: Staging Migration

on:
  pull_request:
    paths:
      - 'drizzle/migrations/**'
      - 'packages/db/schema/**'

jobs:
  staging-migration:
    environment: staging
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Backup staging database
        run: |
          pg_dump ${{ secrets.STAGING_DATABASE_URL }} > backup.sql
          aws s3 cp backup.sql s3://backups/staging/$(date +%Y%m%d_%H%M%S).sql
      
      - name: Run migration dry-run
        run: |
          pnpm db:migrate:dry-run
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      
      - name: Apply migration
        run: |
          pnpm db:migrate
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      
      - name: Run migration tests
        run: |
          pnpm test:migrations
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
      
      - name: Health check
        run: |
          curl -f https://staging.example.com/health || exit 1
```

## Migration Patterns

### 1. Backward Compatible Column Addition
```sql
-- Migration: 0011_add_user_avatar.sql
-- Safe: Adding nullable column
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

-- Migration: 0012_populate_avatar.sql
-- Populate data in separate migration
UPDATE users 
SET avatar_url = 'https://api.dicebear.com/7.x/initials/svg?seed=' || id
WHERE avatar_url IS NULL;

-- Migration: 0013_avatar_not_null.sql (after deployment)
-- Make non-nullable after all code is updated
ALTER TABLE users ALTER COLUMN avatar_url SET NOT NULL;
```

### 2. Backward Compatible Column Removal
```typescript
// Step 1: Stop using column in code (deploy first)
// schema.ts
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  // @deprecated - will be removed in next major version
  // legacyField: varchar('legacy_field', { length: 100 }),
});

// Step 2: Drop column in later migration (after all code deployed)
```

```sql
-- Migration: 0014_drop_legacy_field.sql (deploy later)
ALTER TABLE users DROP COLUMN IF EXISTS legacy_field;
```

### 3. Table Rename Strategy
```sql
-- Migration: 0015_rename_posts_to_articles.sql
-- Step 1: Create new table
CREATE TABLE articles AS SELECT * FROM posts;

-- Step 2: Add triggers to sync both tables
CREATE OR REPLACE FUNCTION sync_posts_to_articles() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN
    INSERT INTO articles SELECT NEW.* ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = EXCLUDED.updated_at;
  ELSE
    INSERT INTO posts SELECT NEW.* ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = EXCLUDED.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_posts_insert
AFTER INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION sync_posts_to_articles();

CREATE TRIGGER sync_articles_insert
AFTER INSERT OR UPDATE ON articles
FOR EACH ROW EXECUTE FUNCTION sync_posts_to_articles();

-- Step 3: Update application to use 'articles' table
-- Step 4: Drop sync triggers and old table in future migration
```

### 4. Complex Schema Changes
```typescript
// migration-scripts/complex-migration.ts
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function migrateUserRoles() {
  // Start transaction
  await db.transaction(async (tx) => {
    // Create new structure
    await tx.execute(sql`
      CREATE TABLE role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES roles(id),
        permission VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(role_id, permission)
      )
    `);
    
    // Migrate data with progress tracking
    const users = await tx.select().from(usersTable);
    const batchSize = 100;
    
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (user) => {
        // Complex migration logic
        const oldPermissions = parseOldPermissions(user.permissions_json);
        const newPermissions = transformToNewFormat(oldPermissions);
        
        await tx.insert(rolePermissions).values(newPermissions);
      }));
      
      console.log(`Migrated ${Math.min(i + batchSize, users.length)} / ${users.length} users`);
    }
    
    // Verify migration
    const oldCount = await tx.select({ count: count() }).from(usersTable);
    const newCount = await tx.select({ count: count() }).from(rolePermissions);
    
    if (oldCount[0].count !== newCount[0].count) {
      throw new Error('Migration verification failed: count mismatch');
    }
  });
}
```

## Blue-Green Deployment for Breaking Changes

### Configuration
```typescript
// db/config.ts
export const dbConfig = {
  // Feature flag for migration state
  useNewSchema: process.env.USE_NEW_SCHEMA === 'true',
  
  // Dual-write mode during transition
  dualWriteMode: process.env.DUAL_WRITE_MODE === 'true',
};

// Repository pattern to abstract schema changes
export class UserRepository {
  async findById(id: string) {
    if (dbConfig.useNewSchema) {
      // New schema query
      return db.select().from(usersV2).where(eq(usersV2.id, id));
    } else {
      // Old schema query
      return db.select().from(users).where(eq(users.id, id));
    }
  }
  
  async create(data: CreateUserData) {
    if (dbConfig.dualWriteMode) {
      // Write to both schemas during transition
      await db.transaction(async (tx) => {
        await tx.insert(users).values(transformToOldSchema(data));
        await tx.insert(usersV2).values(transformToNewSchema(data));
      });
    } else if (dbConfig.useNewSchema) {
      await db.insert(usersV2).values(transformToNewSchema(data));
    } else {
      await db.insert(users).values(transformToOldSchema(data));
    }
  }
}
```

### Deployment Steps
```yaml
# deployment/blue-green-migration.yml
stages:
  - name: prepare
    steps:
      - backup_production_database
      - create_new_schema_in_shadow_tables
      - start_data_sync_jobs
      
  - name: validate
    steps:
      - verify_data_consistency
      - run_integration_tests
      - performance_benchmarks
      
  - name: switch_blue
    steps:
      - enable_dual_write_mode
      - deploy_blue_environment
      - monitor_for_errors: 30m
      
  - name: switch_green
    steps:
      - switch_traffic_to_blue: 10%
      - monitor_metrics: 1h
      - switch_traffic_to_blue: 50%
      - monitor_metrics: 1h
      - switch_traffic_to_blue: 100%
      
  - name: cleanup
    steps:
      - disable_dual_write_mode
      - archive_old_schema
      - update_documentation
```

## Rollback Procedures

### Immediate Rollback
```bash
#!/bin/bash
# scripts/rollback-migration.sh

set -e

MIGRATION_ID=$1
ENVIRONMENT=$2

echo "Starting rollback of migration $MIGRATION_ID in $ENVIRONMENT"

# Step 1: Create backup point
pg_dump $DATABASE_URL > "rollback_backup_$(date +%Y%m%d_%H%M%S).sql"

# Step 2: Check current migration state
CURRENT_VERSION=$(psql $DATABASE_URL -t -c "SELECT version FROM migrations ORDER BY version DESC LIMIT 1")

if [ "$CURRENT_VERSION" -lt "$MIGRATION_ID" ]; then
  echo "Migration $MIGRATION_ID has not been applied yet"
  exit 1
fi

# Step 3: Execute rollback
psql $DATABASE_URL -f "drizzle/rollbacks/${MIGRATION_ID}_rollback.sql"

# Step 4: Update migration table
psql $DATABASE_URL -c "DELETE FROM migrations WHERE version = $MIGRATION_ID"

# Step 5: Verify application health
./scripts/health-check.sh

echo "Rollback completed successfully"
```

### Rollback Templates
```sql
-- drizzle/rollbacks/0011_rollback.sql
-- Rollback for: Add user_preferences table

BEGIN;

-- Drop foreign keys first
ALTER TABLE user_preferences DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS idx_user_preferences_user_id;

-- Drop table
DROP TABLE IF EXISTS user_preferences;

-- Restore any modified columns
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS old_preferences JSONB;

COMMIT;
```

## Migration Testing Checklist

### Pre-Migration
- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] Rollback tested on staging
- [ ] Performance impact assessed
- [ ] Backup strategy confirmed
- [ ] Monitoring alerts configured

### During Migration
- [ ] Database backup completed
- [ ] Migration dry-run successful
- [ ] Application health checks passing
- [ ] No significant performance degradation
- [ ] Error rates within acceptable limits

### Post-Migration
- [ ] Data integrity verified
- [ ] Application fully functional
- [ ] Performance metrics normal
- [ ] Rollback plan documented
- [ ] Team notified of completion

## Data Migration Tools

### Batch Migration Script
```typescript
// scripts/batch-migrate.ts
import { db } from '@/db';
import pLimit from 'p-limit';

interface MigrationOptions {
  batchSize: number;
  concurrency: number;
  dryRun: boolean;
  progressCallback?: (progress: number) => void;
}

export async function batchMigrate<T>(
  source: T[],
  migrator: (item: T) => Promise<void>,
  options: MigrationOptions
) {
  const limit = pLimit(options.concurrency);
  const total = source.length;
  let processed = 0;
  let errors: Array<{ item: T; error: Error }> = [];
  
  for (let i = 0; i < total; i += options.batchSize) {
    const batch = source.slice(i, i + options.batchSize);
    
    const promises = batch.map((item) =>
      limit(async () => {
        try {
          if (!options.dryRun) {
            await migrator(item);
          }
          processed++;
          options.progressCallback?.(processed / total);
        } catch (error) {
          errors.push({ item, error: error as Error });
        }
      })
    );
    
    await Promise.all(promises);
    
    // Log progress
    console.log(`Processed ${processed}/${total} items (${errors.length} errors)`);
  }
  
  if (errors.length > 0) {
    console.error('Migration errors:', errors);
    throw new Error(`Migration failed with ${errors.length} errors`);
  }
  
  return { processed, errors };
}
```

### Zero-Downtime Migration
```typescript
// db/zero-downtime-migration.ts
export class ZeroDowntimeMigration {
  constructor(
    private oldTable: string,
    private newTable: string,
    private db: Database
  ) {}
  
  async execute() {
    // Phase 1: Create shadow table
    await this.createShadowTable();
    
    // Phase 2: Setup triggers for dual writes
    await this.setupDualWriteTriggers();
    
    // Phase 3: Backfill historical data
    await this.backfillData();
    
    // Phase 4: Verify data consistency
    await this.verifyConsistency();
    
    // Phase 5: Switch reads to new table
    await this.switchReads();
    
    // Phase 6: Monitor and validate
    await this.monitorPerformance();
    
    // Phase 7: Cleanup old table
    await this.cleanup();
  }
  
  private async createShadowTable() {
    await this.db.execute(sql`
      CREATE TABLE ${sql.identifier(this.newTable)} 
      AS TABLE ${sql.identifier(this.oldTable)} 
      WITH NO DATA
    `);
  }
  
  private async setupDualWriteTriggers() {
    await this.db.execute(sql`
      CREATE OR REPLACE FUNCTION dual_write_${sql.identifier(this.oldTable)}()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO ${sql.identifier(this.newTable)} 
        SELECT NEW.* 
        ON CONFLICT (id) DO UPDATE SET
          updated_at = EXCLUDED.updated_at;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER dual_write_trigger
      AFTER INSERT OR UPDATE ON ${sql.identifier(this.oldTable)}
      FOR EACH ROW EXECUTE FUNCTION dual_write_${sql.identifier(this.oldTable)}();
    `);
  }
  
  private async backfillData() {
    const batchSize = 10000;
    let offset = 0;
    
    while (true) {
      const result = await this.db.execute(sql`
        INSERT INTO ${sql.identifier(this.newTable)}
        SELECT * FROM ${sql.identifier(this.oldTable)}
        ORDER BY created_at
        LIMIT ${batchSize}
        OFFSET ${offset}
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `);
      
      if (result.rows.length === 0) break;
      
      offset += batchSize;
      console.log(`Backfilled ${offset} records`);
      
      // Throttle to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  private async verifyConsistency() {
    const oldCount = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(this.oldTable)}
    `);
    
    const newCount = await this.db.execute(sql`
      SELECT COUNT(*) as count FROM ${sql.identifier(this.newTable)}
    `);
    
    if (oldCount.rows[0].count !== newCount.rows[0].count) {
      throw new Error('Data consistency check failed');
    }
    
    // Sample verification
    const sample = await this.db.execute(sql`
      SELECT * FROM ${sql.identifier(this.oldTable)}
      ORDER BY RANDOM()
      LIMIT 100
    `);
    
    for (const row of sample.rows) {
      const newRow = await this.db.execute(sql`
        SELECT * FROM ${sql.identifier(this.newTable)}
        WHERE id = ${row.id}
      `);
      
      if (!newRow.rows[0]) {
        throw new Error(`Missing row in new table: ${row.id}`);
      }
    }
  }
  
  private async switchReads() {
    // This is handled at the application level through feature flags
    console.log('Ready to switch reads to new table via feature flag');
  }
  
  private async monitorPerformance() {
    // Monitor query performance
    const metrics = await this.db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins,
        n_tup_upd,
        n_tup_del,
        n_live_tup,
        n_dead_tup
      FROM pg_stat_user_tables
      WHERE tablename IN (${sql.identifier(this.oldTable)}, ${sql.identifier(this.newTable)})
    `);
    
    console.log('Table metrics:', metrics.rows);
  }
  
  private async cleanup() {
    // Remove triggers
    await this.db.execute(sql`
      DROP TRIGGER IF EXISTS dual_write_trigger ON ${sql.identifier(this.oldTable)}
    `);
    
    // Schedule old table removal
    console.log('Schedule old table removal after verification period');
  }
}
```

## Monitoring and Alerts

### Migration Monitoring
```typescript
// monitoring/migration-monitor.ts
import { Logger } from '@/lib/logger';
import * as Sentry from '@sentry/node';

export class MigrationMonitor {
  static async trackMigration(
    migrationId: string,
    operation: () => Promise<void>
  ) {
    const startTime = Date.now();
    const transaction = Sentry.startTransaction({
      op: 'migration',
      name: migrationId,
    });
    
    try {
      await operation();
      
      const duration = Date.now() - startTime;
      Logger.info('Migration completed', {
        migrationId,
        duration,
        status: 'success',
      });
      
      transaction.setStatus('ok');
    } catch (error) {
      Logger.error('Migration failed', error as Error, {
        migrationId,
        duration: Date.now() - startTime,
        status: 'failed',
      });
      
      transaction.setStatus('internal_error');
      Sentry.captureException(error);
      
      throw error;
    } finally {
      transaction.finish();
    }
  }
  
  static async validateMigration(checks: Array<() => Promise<boolean>>) {
    const results = await Promise.all(
      checks.map(async (check, index) => {
        try {
          const result = await check();
          return { index, success: result };
        } catch (error) {
          Logger.error(`Validation check ${index} failed`, error as Error);
          return { index, success: false, error };
        }
      })
    );
    
    const failures = results.filter(r => !r.success);
    
    if (failures.length > 0) {
      throw new Error(`Migration validation failed: ${failures.length} checks failed`);
    }
    
    return true;
  }
}
```

## Best Practices

1. **Always test migrations in staging** - No exceptions
2. **Keep migrations small and focused** - One concern per migration
3. **Use transactions when possible** - Ensure atomicity
4. **Document breaking changes** - Clear communication with team
5. **Monitor after deployment** - Watch metrics for 24-48 hours
6. **Maintain migration history** - Never delete or modify applied migrations
7. **Version control everything** - Including rollback scripts
8. **Automate testing** - Reduce human error
9. **Plan for failure** - Always have a rollback plan
10. **Communicate changes** - Notify team before and after migrations