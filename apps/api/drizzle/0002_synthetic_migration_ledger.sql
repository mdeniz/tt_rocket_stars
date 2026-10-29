CREATE TABLE "migration_imports" (
	"package_sha256" text PRIMARY KEY NOT NULL,
	"manifest" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
