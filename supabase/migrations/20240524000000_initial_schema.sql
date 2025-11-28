-- Create tables

CREATE TABLE IF NOT EXISTS "public"."body_types" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "display_name" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."doors" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "value" text NOT NULL,
    "display_name" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."fuel_types" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "display_name" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."makes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "logo_url" text,
    "country_of_origin" text,
    "founded_year" integer,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."models" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "make_id" uuid NOT NULL REFERENCES "public"."makes"("id") ON DELETE CASCADE,
    "name" text NOT NULL,
    "body_type" text,
    "year_introduced" integer,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."search_radius" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "value" text NOT NULL,
    "display_name" text NOT NULL,
    "sort_order" integer,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."seats" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "value" text NOT NULL,
    "display_name" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."transmission_types" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "display_name" text NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Enable Row Level Security (RLS)
ALTER TABLE "public"."body_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."doors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."fuel_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."makes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."models" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."search_radius" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."seats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."transmission_types" ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON "public"."body_types" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."doors" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."fuel_types" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."makes" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."models" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."search_radius" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."seats" FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON "public"."transmission_types" FOR SELECT USING (true);
