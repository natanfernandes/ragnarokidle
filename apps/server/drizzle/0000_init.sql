CREATE TABLE "character_equipment" (
	"character_id" text NOT NULL,
	"slot" text NOT NULL,
	"item_id" text NOT NULL,
	CONSTRAINT "character_equipment_character_id_slot_pk" PRIMARY KEY("character_id","slot")
);
--> statement-breakpoint
CREATE TABLE "character_stats" (
	"character_id" text PRIMARY KEY NOT NULL,
	"str" integer NOT NULL,
	"agi" integer NOT NULL,
	"vit" integer NOT NULL,
	"int" integer NOT NULL,
	"dex" integer NOT NULL,
	"luk" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"class_id" text NOT NULL,
	"level" integer NOT NULL,
	"experience" bigint NOT NULL,
	"zeny" bigint NOT NULL,
	"hp" integer NOT NULL,
	"sp" integer NOT NULL,
	"current_map_id" text NOT NULL,
	"gender" text NOT NULL,
	"hair_style" integer NOT NULL,
	"hair_color" integer NOT NULL,
	"clothes_color" integer NOT NULL,
	"last_simulation_at" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_configs" (
	"character_id" text PRIMARY KEY NOT NULL,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "combat_sessions" (
	"character_id" text PRIMARY KEY NOT NULL,
	"map_id" text NOT NULL,
	"state" jsonb NOT NULL,
	"simulated_at" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"character_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "inventory_items_character_id_item_id_pk" PRIMARY KEY("character_id","item_id"),
	CONSTRAINT "inventory_items_quantity_positive" CHECK ("inventory_items"."quantity" > 0)
);
--> statement-breakpoint
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "character_stats" ADD CONSTRAINT "character_stats_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_configs" ADD CONSTRAINT "combat_configs_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_sessions" ADD CONSTRAINT "combat_sessions_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;