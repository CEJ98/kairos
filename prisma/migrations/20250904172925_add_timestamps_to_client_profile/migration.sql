/*
  Warnings:

  - Added the required column `updatedAt` to the `client_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_client_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trainerId" TEXT,
    "age" INTEGER,
    "weight" REAL,
    "height" REAL,
    "gender" TEXT,
    "fitnessGoal" TEXT,
    "activityLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "client_profiles_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "trainer_profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_client_profiles" ("activityLevel", "age", "fitnessGoal", "gender", "height", "id", "trainerId", "userId", "weight") SELECT "activityLevel", "age", "fitnessGoal", "gender", "height", "id", "trainerId", "userId", "weight" FROM "client_profiles";
DROP TABLE "client_profiles";
ALTER TABLE "new_client_profiles" RENAME TO "client_profiles";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
