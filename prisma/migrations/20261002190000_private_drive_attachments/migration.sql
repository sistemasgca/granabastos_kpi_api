ALTER TABLE "Attachment"
ADD COLUMN "uploadedById" UUID;

CREATE INDEX "Attachment_measurementId_createdAt_idx"
ON "Attachment"("measurementId", "createdAt");

ALTER TABLE "Attachment"
ADD CONSTRAINT "Attachment_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
