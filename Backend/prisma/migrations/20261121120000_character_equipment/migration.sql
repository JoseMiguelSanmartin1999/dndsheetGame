-- AlterTable
ALTER TABLE "characters" ADD COLUMN     "inventory" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "leveling_mode" TEXT NOT NULL DEFAULT 'hito',
ADD COLUMN     "weapons" TEXT[];
