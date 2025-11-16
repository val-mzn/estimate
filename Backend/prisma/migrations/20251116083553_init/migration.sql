-- CreateTable
CREATE TABLE "rooms" (
    "code" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cardSet" TEXT NOT NULL,
    "currentTaskId" TEXT,
    "isRevealed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "socketId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "currentEstimate" TEXT,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "participationMode" TEXT,
    "roomCode" TEXT NOT NULL,
    CONSTRAINT "participants_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "rooms" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalEstimate" TEXT,
    "roomCode" TEXT NOT NULL,
    CONSTRAINT "tasks_roomCode_fkey" FOREIGN KEY ("roomCode") REFERENCES "rooms" ("code") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "estimates" (
    "taskId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "estimate" TEXT NOT NULL,

    PRIMARY KEY ("taskId", "participantId"),
    CONSTRAINT "estimates_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "estimates_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "participants_roomCode_idx" ON "participants"("roomCode");

-- CreateIndex
CREATE INDEX "participants_socketId_idx" ON "participants"("socketId");

-- CreateIndex
CREATE INDEX "tasks_roomCode_idx" ON "tasks"("roomCode");

-- CreateIndex
CREATE INDEX "estimates_taskId_idx" ON "estimates"("taskId");
