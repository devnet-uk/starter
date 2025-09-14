# Multi-Tenancy Patterns

This document defines comprehensive patterns for implementing multi-tenant applications with role-based access control (RBAC) following Clean Architecture principles.

## Overview

Multi-tenancy allows a single instance of software to serve multiple tenants (organizations, clients, or isolated user groups) while maintaining data isolation, security, and customization capabilities.

## Core Multi-Tenancy Patterns

### 1. Tenant Isolation Strategies

#### Row-Level Security (RLS) Pattern
```typescript
// Domain Entity with Tenant Awareness
abstract class TenantAwareEntity extends Entity<any> {
  protected _tenantId: TenantId

  constructor(props: any, id?: UniqueEntityID, tenantId?: TenantId) {
    super(props, id)
    this._tenantId = tenantId || TenantContext.current()
  }

  get tenantId(): TenantId {
    return this._tenantId
  }

  public belongsToTenant(tenantId: TenantId): boolean {
    return this._tenantId.equals(tenantId)
  }
}

// Example Domain Entity
class Project extends TenantAwareEntity {
  private constructor(props: ProjectProps, id?: UniqueEntityID, tenantId?: TenantId) {
    super(props, id, tenantId)
  }

  public static create(props: CreateProjectProps, tenantId: TenantId): Result<Project> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: props.name, argumentName: 'name' },
      { argument: tenantId, argumentName: 'tenantId' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new Project({
      name: props.name,
      description: props.description,
      createdAt: new Date()
    }, undefined, tenantId))
  }
}
```

#### Repository Pattern with Tenant Filtering
```typescript
// Tenant-Aware Repository Interface
interface ITenantAwareRepository<T extends TenantAwareEntity> {
  findById(id: string, tenantId: TenantId): Promise<T | null>
  findByTenant(tenantId: TenantId, options?: QueryOptions): Promise<T[]>
  save(entity: T): Promise<void>
  delete(id: string, tenantId: TenantId): Promise<void>
}

// Implementation with automatic tenant filtering
class DrizzleProjectRepository implements IProjectRepository {
  constructor(
    private db: Database,
    private tenantContext: ITenantContext
  ) {}

  async findById(id: string, tenantId?: TenantId): Promise<Project | null> {
    const currentTenant = tenantId || this.tenantContext.getCurrentTenant()
    
    const result = await this.db
      .select()
      .from(projectTable)
      .where(
        and(
          eq(projectTable.id, id),
          eq(projectTable.tenantId, currentTenant.toString())
        )
      )
      .limit(1)

    if (!result.length) return null

    return ProjectMapper.toDomain(result[0])
  }

  async findByTenant(tenantId: TenantId, options?: QueryOptions): Promise<Project[]> {
    const query = this.db
      .select()
      .from(projectTable)
      .where(eq(projectTable.tenantId, tenantId.toString()))

    if (options?.limit) query.limit(options.limit)
    if (options?.offset) query.offset(options.offset)

    const results = await query
    return results.map(ProjectMapper.toDomain)
  }
}
```

### 2. Role-Based Access Control (RBAC)

#### Domain Model for RBAC
```typescript
// Permission Value Object
class Permission extends ValueObject<PermissionProps> {
  private constructor(props: PermissionProps) {
    super(props)
  }

  public static create(resource: string, action: string): Result<Permission> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: resource, argumentName: 'resource' },
      { argument: action, argumentName: 'action' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new Permission({ 
      resource: resource.toLowerCase(),
      action: action.toLowerCase()
    }))
  }

  get resource(): string {
    return this.props.resource
  }

  get action(): string {
    return this.props.action
  }

  get key(): string {
    return `${this.props.resource}:${this.props.action}`
  }
}

// Role Aggregate Root
class Role extends TenantAwareEntity {
  private _name: string
  private _permissions: Permission[]
  private _description?: string

  private constructor(props: RoleProps, id?: UniqueEntityID, tenantId?: TenantId) {
    super(props, id, tenantId)
    this._name = props.name
    this._permissions = props.permissions || []
    this._description = props.description
  }

  public static create(props: CreateRoleProps, tenantId: TenantId): Result<Role> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: props.name, argumentName: 'name' },
      { argument: tenantId, argumentName: 'tenantId' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new Role({
      name: props.name,
      description: props.description,
      permissions: [],
      createdAt: new Date()
    }, undefined, tenantId))
  }

  public addPermission(permission: Permission): Result<void> {
    const exists = this._permissions.some(p => p.equals(permission))
    if (exists) {
      return Result.fail('Permission already exists in role')
    }

    this._permissions.push(permission)
    return Result.ok()
  }

  public removePermission(permission: Permission): Result<void> {
    const index = this._permissions.findIndex(p => p.equals(permission))
    if (index === -1) {
      return Result.fail('Permission not found in role')
    }

    this._permissions.splice(index, 1)
    return Result.ok()
  }

  public hasPermission(permission: Permission): boolean {
    return this._permissions.some(p => p.equals(permission))
  }

  get name(): string {
    return this._name
  }

  get permissions(): Permission[] {
    return [...this._permissions] // Return copy to prevent mutation
  }
}
```

#### User-Role Assignment
```typescript
// User Aggregate with Role Management
class User extends TenantAwareEntity {
  private _email: Email
  private _name: string
  private _roleAssignments: RoleAssignment[]

  public assignRole(roleId: RoleId, tenantId: TenantId, assignedBy: UserId): Result<void> {
    // Check if user already has this role in this tenant
    const existingAssignment = this._roleAssignments.find(
      ra => ra.roleId.equals(roleId) && ra.tenantId.equals(tenantId)
    )

    if (existingAssignment) {
      return Result.fail('User already has this role in the specified tenant')
    }

    const assignment = RoleAssignment.create({
      userId: this.id,
      roleId,
      tenantId,
      assignedBy,
      assignedAt: new Date()
    })

    if (assignment.isFailure) {
      return Result.fail(assignment.error)
    }

    this._roleAssignments.push(assignment.getValue())
    return Result.ok()
  }

  public removeRole(roleId: RoleId, tenantId: TenantId): Result<void> {
    const index = this._roleAssignments.findIndex(
      ra => ra.roleId.equals(roleId) && ra.tenantId.equals(tenantId)
    )

    if (index === -1) {
      return Result.fail('User does not have this role in the specified tenant')
    }

    this._roleAssignments.splice(index, 1)
    return Result.ok()
  }

  public getRolesForTenant(tenantId: TenantId): RoleAssignment[] {
    return this._roleAssignments.filter(ra => ra.tenantId.equals(tenantId))
  }

  public hasRole(roleId: RoleId, tenantId: TenantId): boolean {
    return this._roleAssignments.some(
      ra => ra.roleId.equals(roleId) && ra.tenantId.equals(tenantId)
    )
  }
}

// Role Assignment Value Object
class RoleAssignment extends ValueObject<RoleAssignmentProps> {
  public static create(props: CreateRoleAssignmentProps): Result<RoleAssignment> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: props.userId, argumentName: 'userId' },
      { argument: props.roleId, argumentName: 'roleId' },
      { argument: props.tenantId, argumentName: 'tenantId' },
      { argument: props.assignedBy, argumentName: 'assignedBy' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    return Result.ok(new RoleAssignment(props))
  }

  get userId(): UserId {
    return this.props.userId
  }

  get roleId(): RoleId {
    return this.props.roleId
  }

  get tenantId(): TenantId {
    return this.props.tenantId
  }

  get assignedBy(): UserId {
    return this.props.assignedBy
  }

  get assignedAt(): Date {
    return this.props.assignedAt
  }
}
```

### 3. Authorization Service Patterns

#### Permission-Based Authorization
```typescript
interface IAuthorizationService {
  hasPermission(userId: UserId, tenantId: TenantId, permission: Permission): Promise<boolean>
  getUserPermissions(userId: UserId, tenantId: TenantId): Promise<Permission[]>
  authorizeResource(userId: UserId, tenantId: TenantId, resource: string, action: string): Promise<Result<void>>
}

class AuthorizationService implements IAuthorizationService {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository
  ) {}

  async hasPermission(
    userId: UserId, 
    tenantId: TenantId, 
    permission: Permission
  ): Promise<boolean> {
    const user = await this.userRepository.findById(userId.toString())
    if (!user) return false

    const userRoles = user.getRolesForTenant(tenantId)
    
    for (const roleAssignment of userRoles) {
      const role = await this.roleRepository.findById(roleAssignment.roleId.toString(), tenantId)
      if (role && role.hasPermission(permission)) {
        return true
      }
    }

    return false
  }

  async getUserPermissions(userId: UserId, tenantId: TenantId): Promise<Permission[]> {
    const user = await this.userRepository.findById(userId.toString())
    if (!user) return []

    const userRoles = user.getRolesForTenant(tenantId)
    const allPermissions: Permission[] = []

    for (const roleAssignment of userRoles) {
      const role = await this.roleRepository.findById(roleAssignment.roleId.toString(), tenantId)
      if (role) {
        allPermissions.push(...role.permissions)
      }
    }

    // Remove duplicates
    const uniquePermissions = allPermissions.filter(
      (permission, index, array) => 
        array.findIndex(p => p.equals(permission)) === index
    )

    return uniquePermissions
  }

  async authorizeResource(
    userId: UserId, 
    tenantId: TenantId, 
    resource: string, 
    action: string
  ): Promise<Result<void>> {
    const permissionResult = Permission.create(resource, action)
    if (permissionResult.isFailure) {
      return Result.fail(permissionResult.error)
    }

    const hasAccess = await this.hasPermission(userId, tenantId, permissionResult.getValue())
    
    if (!hasAccess) {
      return Result.fail(`Access denied: ${action} on ${resource}`)
    }

    return Result.ok()
  }
}
```

### 4. Organization Management Patterns

#### Organization Aggregate
```typescript
class Organization extends TenantAwareEntity {
  private _name: string
  private _settings: OrganizationSettings
  private _members: Member[]
  private _invitations: Invitation[]

  public static create(props: CreateOrganizationProps, ownerId: UserId): Result<Organization> {
    const guardResult = Guard.againstNullOrUndefined([
      { argument: props.name, argumentName: 'name' },
      { argument: ownerId, argumentName: 'ownerId' }
    ])

    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message)
    }

    const orgId = new TenantId(UniqueEntityID.create())
    
    const organization = new Organization({
      name: props.name,
      settings: OrganizationSettings.createDefaults(),
      members: [],
      invitations: [],
      createdAt: new Date()
    }, orgId.id, orgId)

    // Add owner as first member
    const ownerMember = Member.create({
      userId: ownerId,
      role: MemberRole.OWNER,
      joinedAt: new Date()
    })

    organization._members.push(ownerMember.getValue())

    return Result.ok(organization)
  }

  public inviteMember(email: Email, role: MemberRole, invitedBy: UserId): Result<Invitation> {
    // Check if user is already a member
    const existingMember = this._members.find(m => m.email?.equals(email))
    if (existingMember) {
      return Result.fail('User is already a member of this organization')
    }

    // Check if invitation already exists
    const existingInvitation = this._invitations.find(
      i => i.email.equals(email) && i.status === InvitationStatus.PENDING
    )
    if (existingInvitation) {
      return Result.fail('Invitation already sent to this email')
    }

    const invitationResult = Invitation.create({
      organizationId: this.id,
      email,
      role,
      invitedBy,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    if (invitationResult.isFailure) {
      return Result.fail(invitationResult.error)
    }

    const invitation = invitationResult.getValue()
    this._invitations.push(invitation)

    // Domain event
    this.addDomainEvent(new MemberInvitedEvent(this.id, invitation))

    return Result.ok(invitation)
  }

  public acceptInvitation(invitationId: string, userId: UserId): Result<void> {
    const invitation = this._invitations.find(i => i.id.toString() === invitationId)
    
    if (!invitation) {
      return Result.fail('Invitation not found')
    }

    if (invitation.isExpired()) {
      return Result.fail('Invitation has expired')
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      return Result.fail('Invitation is no longer valid')
    }

    // Create member
    const memberResult = Member.create({
      userId,
      role: invitation.role,
      joinedAt: new Date()
    })

    if (memberResult.isFailure) {
      return Result.fail(memberResult.error)
    }

    this._members.push(memberResult.getValue())
    invitation.accept()

    // Domain event
    this.addDomainEvent(new MemberJoinedEvent(this.id, memberResult.getValue()))

    return Result.ok()
  }

  public removeMember(userId: UserId, removedBy: UserId): Result<void> {
    const memberIndex = this._members.findIndex(m => m.userId.equals(userId))
    
    if (memberIndex === -1) {
      return Result.fail('Member not found in organization')
    }

    const member = this._members[memberIndex]
    
    // Cannot remove owner
    if (member.role === MemberRole.OWNER) {
      return Result.fail('Cannot remove organization owner')
    }

    this._members.splice(memberIndex, 1)

    // Domain event
    this.addDomainEvent(new MemberRemovedEvent(this.id, member, removedBy))

    return Result.ok()
  }

  get members(): Member[] {
    return [...this._members]
  }

  get activeInvitations(): Invitation[] {
    return this._invitations.filter(i => i.status === InvitationStatus.PENDING && !i.isExpired())
  }
}
```

### 5. Invitation System Patterns

#### Invitation Workflow
```typescript
// Invitation Entity
class Invitation extends Entity<InvitationProps> {
  private constructor(props: InvitationProps, id?: UniqueEntityID) {
    super(props, id)
  }

  public static create(props: CreateInvitationProps): Result<Invitation> {
    const token = this.generateSecureToken()
    
    return Result.ok(new Invitation({
      ...props,
      token,
      status: InvitationStatus.PENDING,
      createdAt: new Date()
    }))
  }

  public accept(): void {
    if (this.props.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation is not in pending status')
    }

    if (this.isExpired()) {
      throw new Error('Invitation has expired')
    }

    this.props.status = InvitationStatus.ACCEPTED
    this.props.acceptedAt = new Date()
  }

  public decline(): void {
    if (this.props.status !== InvitationStatus.PENDING) {
      throw new Error('Invitation is not in pending status')
    }

    this.props.status = InvitationStatus.DECLINED
    this.props.declinedAt = new Date()
  }

  public isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }

  private static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  get email(): Email {
    return this.props.email
  }

  get role(): MemberRole {
    return this.props.role
  }

  get status(): InvitationStatus {
    return this.props.status
  }

  get token(): string {
    return this.props.token
  }
}

// Invitation Use Cases
class InviteMemberUseCase {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private emailService: IEmailService,
    private authorizationService: IAuthorizationService
  ) {}

  async execute(command: InviteMemberCommand): Promise<Result<void>> {
    // Authorize the action
    const authResult = await this.authorizationService.authorizeResource(
      command.invitedBy,
      command.organizationId,
      'members',
      'invite'
    )

    if (authResult.isFailure) {
      return Result.fail(authResult.error)
    }

    // Load organization
    const organization = await this.organizationRepository.findById(
      command.organizationId.toString(),
      command.organizationId
    )

    if (!organization) {
      return Result.fail('Organization not found')
    }

    // Create invitation
    const emailResult = Email.create(command.email)
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error)
    }

    const invitationResult = organization.inviteMember(
      emailResult.getValue(),
      command.role,
      command.invitedBy
    )

    if (invitationResult.isFailure) {
      return Result.fail(invitationResult.error)
    }

    // Save organization
    await this.organizationRepository.save(organization)

    // Send invitation email
    const invitation = invitationResult.getValue()
    await this.emailService.sendInvitationEmail({
      to: invitation.email.value,
      organizationName: organization.name,
      invitationToken: invitation.token,
      role: invitation.role
    })

    return Result.ok()
  }
}
```

## Verification Standards

<verification-block context-check="multi-tenancy-verification">
  <verification_definitions>
    <test name="tenant_aware_entities">
      TEST: grep -r "extends TenantAwareEntity\|TenantId" packages/core/src/domain/ | head -5
      REQUIRED: true
      ERROR: "Domain entities must extend TenantAwareEntity for proper tenant isolation."
      DESCRIPTION: "Enforces tenant-aware base classes to ensure data isolation across tenants."
    </test>
    <test name="rbac_implementation">
      TEST: grep -r "Permission\|Role.*Entity\|RoleAssignment" packages/core/src/domain/ | head -5
      REQUIRED: true
      ERROR: "RBAC must be implemented with Permission, Role, and RoleAssignment domain objects."
      DESCRIPTION: "Checks for core RBAC domain constructs to support authorization policies."
    </test>
    <test name="tenant_filtering_repositories">
      TEST: grep -r "tenantId.*filter\|WHERE.*tenant" packages/infrastructure/src/repositories/ | head -5
      REQUIRED: true
      ERROR: "Repositories must implement tenant filtering to prevent data leakage."
      DESCRIPTION: "Validates repository implementations apply tenant filters in queries."
    </test>
    <test name="authorization_service">
      TEST: ls packages/core/src/use-cases/services/*[Aa]uthorization* 2>/dev/null | head -1
      REQUIRED: true
      ERROR: "Authorization service must be implemented for permission checking."
      DESCRIPTION: "Confirms presence of a service responsible for authorization checks."
    </test>
    <test name="organization_aggregate">
      TEST: grep -r "class Organization.*extends.*Entity\|Organization.*Aggregate" packages/core/src/domain/ | head -1
      REQUIRED: true
      ERROR: "Organization must be implemented as an aggregate root."
      DESCRIPTION: "Ensures Organization is modeled as an aggregate for consistent invariants and boundaries."
    </test>
    <test name="invitation_system">
      TEST: grep -r "class Invitation\|InvitationStatus\|inviteMember" packages/core/src/domain/ | head -3
      REQUIRED: true
      ERROR: "Invitation system must be implemented for member management."
      DESCRIPTION: "Checks for domain constructs enabling invitations and membership workflows."
    </test>
    <test name="tenant_context">
      TEST: grep -r "TenantContext\|ITenantContext" packages/core/src/ | head -3
      REQUIRED: true
      ERROR: "Tenant context service must be available for current tenant tracking."
      DESCRIPTION: "Validates availability of a tenant context to propagate current tenant identity."
    </test>
  </verification_definitions>
</verification-block>

## Implementation Guidelines

### 1. Data Isolation
- Use tenant-aware base classes for all entities
- Implement automatic tenant filtering in repositories
- Never allow cross-tenant data access
- Use database-level constraints where possible

### 2. Role-Based Access Control
- Define permissions as resource:action pairs
- Implement hierarchical role structures
- Use authorization service for all protected operations
- Cache permissions for performance

### 3. Organization Management
- Treat organizations as aggregate roots
- Implement proper invitation workflows
- Handle member lifecycle events
- Maintain audit logs for security

### 4. Security Considerations
- Always validate tenant ownership
- Use secure tokens for invitations
- Implement rate limiting for invitations
- Log all authorization decisions

### 5. Performance Optimization
- Index all tenant-related queries
- Implement caching for role/permission lookups
- Use database-level RLS when available
- Consider read replicas for tenant-specific data

This multi-tenancy patterns standard ensures secure, scalable multi-tenant applications with proper data isolation and access control.
