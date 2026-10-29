import {
  bigint,
  boolean,
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  ...timestamps,
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const authAccount = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    authUserId: text("auth_user_id"),
    email: text("email"),
    displayName: text("display_name"),
    status: text("status").default("active").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("accounts_auth_user_id_unique").on(table.authUserId),
    uniqueIndex("accounts_email_unique").on(table.email),
    check("accounts_status_check", sql`${table.status} in ('active', 'suspended', 'deleted')`),
  ],
);

export const pilots = pgTable(
  "pilots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    localId: text("local_id").notNull(),
    name: text("name").notNull(),
    avatar: text("avatar").notNull(),
    language: text("language").default("en").notNull(),
    managementMode: text("management_mode").default("private").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pilots_account_local_id_unique").on(table.accountId, table.localId),
    unique("pilots_id_account_unique").on(table.id, table.accountId),
    index("pilots_account_id_idx").on(table.accountId),
    foreignKey({
      name: "pilots_account_id_accounts_id_fk",
      columns: [table.accountId],
      foreignColumns: [accounts.id],
    }).onDelete("cascade"),
    check("pilots_name_length_check", sql`char_length(${table.name}) between 1 and 80`),
    check("pilots_language_check", sql`${table.language} in ('en', 'es')`),
    check("pilots_management_mode_check", sql`${table.managementMode} in ('private', 'crew')`),
  ],
);

export const progressSnapshots = pgTable(
  "progress_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    pilotId: uuid("pilot_id").notNull(),
    version: bigint("version", { mode: "number" }).default(1).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("progress_snapshots_pilot_unique").on(table.pilotId),
    index("progress_snapshots_account_id_idx").on(table.accountId),
    foreignKey({
      name: "progress_snapshots_account_id_accounts_id_fk",
      columns: [table.accountId],
      foreignColumns: [accounts.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "progress_snapshots_pilot_account_fk",
      columns: [table.pilotId, table.accountId],
      foreignColumns: [pilots.id, pilots.accountId],
    }).onDelete("cascade"),
    check("progress_snapshots_version_check", sql`${table.version} > 0`),
  ],
);

export const syncOperations = pgTable(
  "sync_operations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: text("account_id").notNull(),
    operationId: text("operation_id").notNull(),
    requestHash: text("request_hash").notNull(),
    status: text("status").default("completed").notNull(),
    result: jsonb("result").$type<Record<string, unknown> | null>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sync_operations_account_operation_unique").on(table.accountId, table.operationId),
    index("sync_operations_account_id_idx").on(table.accountId),
    foreignKey({
      name: "sync_operations_account_id_accounts_id_fk",
      columns: [table.accountId],
      foreignColumns: [accounts.id],
    }).onDelete("cascade"),
    check("sync_operations_status_check", sql`${table.status} in ('completed', 'rejected')`),
  ],
);

export const crews = pgTable(
  "crews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerAccountId: text("owner_account_id").notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("crews_owner_name_unique").on(table.ownerAccountId, table.name),
    foreignKey({
      name: "crews_owner_account_id_accounts_id_fk",
      columns: [table.ownerAccountId],
      foreignColumns: [accounts.id],
    }).onDelete("cascade"),
    check("crews_name_length_check", sql`char_length(${table.name}) between 1 and 80`),
  ],
);

export const crewMemberships = pgTable(
  "crew_memberships",
  {
    crewId: uuid("crew_id").notNull(),
    accountId: text("account_id").notNull(),
    role: text("role").default("member").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.crewId, table.accountId] }),
    index("crew_memberships_account_id_idx").on(table.accountId),
    foreignKey({
      name: "crew_memberships_crew_id_crews_id_fk",
      columns: [table.crewId],
      foreignColumns: [crews.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "crew_memberships_account_id_accounts_id_fk",
      columns: [table.accountId],
      foreignColumns: [accounts.id],
    }).onDelete("cascade"),
    check("crew_memberships_role_check", sql`${table.role} in ('owner', 'admin', 'member')`),
  ],
);

export const pilotAccess = pgTable(
  "pilot_access",
  {
    pilotId: uuid("pilot_id").notNull(),
    accountId: text("account_id").notNull(),
    grantedByAccountId: text("granted_by_account_id").notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.pilotId, table.accountId] }),
    index("pilot_access_account_id_idx").on(table.accountId),
    foreignKey({
      name: "pilot_access_pilot_id_pilots_id_fk",
      columns: [table.pilotId],
      foreignColumns: [pilots.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "pilot_access_account_id_accounts_id_fk",
      columns: [table.accountId],
      foreignColumns: [accounts.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "pilot_access_granted_by_account_id_accounts_id_fk",
      columns: [table.grantedByAccountId],
      foreignColumns: [accounts.id],
    }).onDelete("restrict"),
  ],
);

export const migrationImports = pgTable("migration_imports", {
  packageSha256: text("package_sha256").primaryKey(),
  manifest: jsonb("manifest").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const schema = {
  user,
  session,
  account: authAccount,
  verification,
  accounts,
  pilots,
  progressSnapshots,
  syncOperations,
  crews,
  crewMemberships,
  pilotAccess,
  migrationImports,
};
