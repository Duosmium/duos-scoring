-- CreateTable
CREATE TABLE "scoring"."Slides" (
    "tournamentId" BIGINT NOT NULL,
    "channelId" TEXT,
    "settings" JSONB,
    "batches" JSONB
);

-- CreateIndex
CREATE UNIQUE INDEX "Slides_tournamentId_key" ON "scoring"."Slides"("tournamentId");

-- AddForeignKey
ALTER TABLE "scoring"."Slides" ADD CONSTRAINT "Slides_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "scoring"."Tournament"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
