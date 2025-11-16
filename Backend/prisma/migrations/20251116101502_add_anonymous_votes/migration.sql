-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_rooms" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cardSet" TEXT NOT NULL,
    "currentTaskId" TEXT,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "anonymousVotes" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_rooms" ("cardSet", "code", "createdAt", "currentTaskId", "isRevealed", "name") SELECT "cardSet", "code", "createdAt", "currentTaskId", "isRevealed", "name" FROM "rooms";
DROP TABLE "rooms";
ALTER TABLE "new_rooms" RENAME TO "rooms";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
