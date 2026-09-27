ALTER TABLE "Comment" ADD COLUMN "parentId" TEXT REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");