CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_user_id" text,
	"email" text,
	"display_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_status_check" CHECK ("accounts"."status" in ('active', 'suspended', 'deleted'))
);
--> statement-breakpoint
CREATE TABLE "crew_memberships" (
	"crew_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crew_memberships_crew_id_account_id_pk" PRIMARY KEY("crew_id","account_id"),
	CONSTRAINT "crew_memberships_role_check" CHECK ("crew_memberships"."role" in ('owner', 'admin', 'member'))
);
--> statement-breakpoint
CREATE TABLE "crews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_account_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crews_name_length_check" CHECK (char_length("crews"."name") between 1 and 80)
);
--> statement-breakpoint
CREATE TABLE "pilot_access" (
	"pilot_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"granted_by_account_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilot_access_pilot_id_account_id_pk" PRIMARY KEY("pilot_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "pilots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"local_id" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"management_mode" text DEFAULT 'private' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pilots_id_account_unique" UNIQUE("id","account_id"),
	CONSTRAINT "pilots_name_length_check" CHECK (char_length("pilots"."name") between 1 and 80),
	CONSTRAINT "pilots_language_check" CHECK ("pilots"."language" in ('en', 'es')),
	CONSTRAINT "pilots_management_mode_check" CHECK ("pilots"."management_mode" in ('private', 'crew'))
);
--> statement-breakpoint
CREATE TABLE "progress_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"pilot_id" uuid NOT NULL,
	"version" bigint DEFAULT 1 NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_snapshots_version_check" CHECK ("progress_snapshots"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "sync_operations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"operation_id" text NOT NULL,
	"request_hash" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_operations_status_check" CHECK ("sync_operations"."status" in ('completed', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "crew_memberships" ADD CONSTRAINT "crew_memberships_crew_id_crews_id_fk" FOREIGN KEY ("crew_id") REFERENCES "public"."crews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crew_memberships" ADD CONSTRAINT "crew_memberships_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crews" ADD CONSTRAINT "crews_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_access" ADD CONSTRAINT "pilot_access_pilot_id_pilots_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_access" ADD CONSTRAINT "pilot_access_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_access" ADD CONSTRAINT "pilot_access_granted_by_account_id_accounts_id_fk" FOREIGN KEY ("granted_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilots" ADD CONSTRAINT "pilots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_pilot_account_fk" FOREIGN KEY ("pilot_id","account_id") REFERENCES "public"."pilots"("id","account_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_operations" ADD CONSTRAINT "sync_operations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_auth_user_id_unique" ON "accounts" USING btree ("auth_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_email_unique" ON "accounts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "crew_memberships_account_id_idx" ON "crew_memberships" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crews_owner_name_unique" ON "crews" USING btree ("owner_account_id","name");--> statement-breakpoint
CREATE INDEX "pilot_access_account_id_idx" ON "pilot_access" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pilots_account_local_id_unique" ON "pilots" USING btree ("account_id","local_id");--> statement-breakpoint
CREATE INDEX "pilots_account_id_idx" ON "pilots" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_snapshots_pilot_unique" ON "progress_snapshots" USING btree ("pilot_id");--> statement-breakpoint
CREATE INDEX "progress_snapshots_account_id_idx" ON "progress_snapshots" USING btree ("account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sync_operations_account_operation_unique" ON "sync_operations" USING btree ("account_id","operation_id");--> statement-breakpoint
CREATE INDEX "sync_operations_account_id_idx" ON "sync_operations" USING btree ("account_id");