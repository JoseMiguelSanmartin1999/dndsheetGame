-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ContentSource" AS ENUM ('SRD_5_2_1', 'HOMEBREW');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Ability" AS ENUM ('STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA');

-- CreateEnum
CREATE TYPE "SpellSchool" AS ENUM ('ABJURATION', 'CONJURATION', 'DIVINATION', 'ENCHANTMENT', 'EVOCATION', 'ILLUSION', 'NECROMANCY', 'TRANSMUTATION');

-- CreateEnum
CREATE TYPE "FeatCategory" AS ENUM ('ORIGIN', 'GENERAL', 'FIGHTING_STYLE', 'EPIC_BOON');

-- CreateEnum
CREATE TYPE "ClassOptionKind" AS ENUM ('INVOCATION', 'METAMAGIC', 'FIGHTING_STYLE', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "date_of_birth" DATE NOT NULL,
    "has_played_before" BOOLEAN NOT NULL DEFAULT false,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "max_characters" INTEGER NOT NULL DEFAULT 5,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMP(3),
    "legacy_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "hit_die" INTEGER NOT NULL,
    "primary_abilities" "Ability"[],
    "complexity" TEXT,
    "playstyle" TEXT,
    "tagline" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_features" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_subclass_placeholder" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subclasses" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "legacy_names" TEXT[],
    "description" TEXT,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subclasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "legacy_names" TEXT[],
    "description" TEXT,
    "creature_type" TEXT NOT NULL DEFAULT 'Humanoide',
    "size" TEXT,
    "speed_meters" DECIMAL(4,1) NOT NULL DEFAULT 9,
    "languages" TEXT,
    "traits" JSONB NOT NULL DEFAULT '[]',
    "legacy_ability_bonuses" JSONB NOT NULL DEFAULT '{}',
    "icon" TEXT,
    "image" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "species_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "species_lineages" (
    "id" UUID NOT NULL,
    "species_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "damage_type" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "species_lineages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feats" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "legacy_names" TEXT[],
    "category" "FeatCategory" NOT NULL,
    "prerequisite" TEXT,
    "benefits" JSONB NOT NULL DEFAULT '[]',
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backgrounds" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "legacy_names" TEXT[],
    "concept" TEXT,
    "ability_options" "Ability"[],
    "feat_id" UUID,
    "feat_option" TEXT,
    "skill_proficiencies" TEXT[],
    "tool_proficiency" TEXT,
    "equipment" JSONB NOT NULL DEFAULT '{}',
    "recommendations" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backgrounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spells" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "level" INTEGER NOT NULL,
    "school" "SpellSchool",
    "ritual" BOOLEAN NOT NULL DEFAULT false,
    "concentration" BOOLEAN NOT NULL DEFAULT false,
    "casting_time" TEXT,
    "range" TEXT,
    "components" TEXT,
    "duration" TEXT,
    "short_description" TEXT,
    "description" TEXT,
    "data" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spells_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spell_list_entries" (
    "id" UUID NOT NULL,
    "spell_id" UUID NOT NULL,
    "class_id" UUID,
    "subclass_id" UUID,

    CONSTRAINT "spell_list_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_options" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "ClassOptionKind" NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "needs_rewrite" BOOLEAN NOT NULL DEFAULT false,
    "prerequisite" TEXT,
    "cost" INTEGER,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment_packs" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" "ContentSource" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipment_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "class_id" UUID NOT NULL,
    "subclass_id" UUID,
    "subclass_variant" TEXT,
    "species_id" UUID NOT NULL,
    "lineage_id" UUID,
    "background_id" UUID NOT NULL,
    "base_scores" JSONB NOT NULL,
    "background_bonuses" JSONB NOT NULL DEFAULT '{}',
    "hp_max" INTEGER NOT NULL,
    "hp_current" INTEGER NOT NULL,
    "hp_temp" INTEGER NOT NULL DEFAULT 0,
    "heroic_inspiration" BOOLEAN NOT NULL DEFAULT false,
    "choices" JSONB NOT NULL DEFAULT '{}',
    "play_state" JSONB NOT NULL DEFAULT '{}',
    "avatar" TEXT,
    "history" TEXT,
    "physical_desc" TEXT,
    "height_cm" INTEGER,
    "size_class" TEXT,
    "notes" TEXT,
    "share_slug" TEXT,
    "legacy_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_spells" (
    "character_id" UUID NOT NULL,
    "spell_id" UUID NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'class',
    "prepared" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "character_spells_pkey" PRIMARY KEY ("character_id","spell_id","origin")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_id" UUID,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "diff" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_legacy_id_key" ON "users"("legacy_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_slug_key" ON "classes"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "class_features_slug_key" ON "class_features"("slug");

-- CreateIndex
CREATE INDEX "class_features_class_id_level_idx" ON "class_features"("class_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "subclasses_slug_key" ON "subclasses"("slug");

-- CreateIndex
CREATE INDEX "subclasses_class_id_idx" ON "subclasses"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "species_slug_key" ON "species"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "species_lineages_species_id_slug_key" ON "species_lineages"("species_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "feats_slug_key" ON "feats"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "backgrounds_slug_key" ON "backgrounds"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "spells_slug_key" ON "spells"("slug");

-- CreateIndex
CREATE INDEX "spells_level_idx" ON "spells"("level");

-- CreateIndex
CREATE INDEX "spell_list_entries_class_id_idx" ON "spell_list_entries"("class_id");

-- CreateIndex
CREATE INDEX "spell_list_entries_subclass_id_idx" ON "spell_list_entries"("subclass_id");

-- CreateIndex
CREATE UNIQUE INDEX "spell_list_entries_spell_id_class_id_subclass_id_key" ON "spell_list_entries"("spell_id", "class_id", "subclass_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_options_slug_key" ON "class_options"("slug");

-- CreateIndex
CREATE INDEX "class_options_class_id_kind_idx" ON "class_options"("class_id", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_packs_slug_key" ON "equipment_packs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "characters_share_slug_key" ON "characters"("share_slug");

-- CreateIndex
CREATE UNIQUE INDEX "characters_legacy_id_key" ON "characters"("legacy_id");

-- CreateIndex
CREATE INDEX "characters_user_id_idx" ON "characters"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- AddForeignKey
ALTER TABLE "class_features" ADD CONSTRAINT "class_features_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subclasses" ADD CONSTRAINT "subclasses_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "species_lineages" ADD CONSTRAINT "species_lineages_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backgrounds" ADD CONSTRAINT "backgrounds_feat_id_fkey" FOREIGN KEY ("feat_id") REFERENCES "feats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_list_entries" ADD CONSTRAINT "spell_list_entries_spell_id_fkey" FOREIGN KEY ("spell_id") REFERENCES "spells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_list_entries" ADD CONSTRAINT "spell_list_entries_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spell_list_entries" ADD CONSTRAINT "spell_list_entries_subclass_id_fkey" FOREIGN KEY ("subclass_id") REFERENCES "subclasses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_options" ADD CONSTRAINT "class_options_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_subclass_id_fkey" FOREIGN KEY ("subclass_id") REFERENCES "subclasses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_lineage_id_fkey" FOREIGN KEY ("lineage_id") REFERENCES "species_lineages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_background_id_fkey" FOREIGN KEY ("background_id") REFERENCES "backgrounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_spells" ADD CONSTRAINT "character_spells_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_spells" ADD CONSTRAINT "character_spells_spell_id_fkey" FOREIGN KEY ("spell_id") REFERENCES "spells"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
