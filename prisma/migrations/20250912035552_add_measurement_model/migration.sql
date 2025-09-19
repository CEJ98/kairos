-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "peso" REAL,
    "grasa" REAL,
    "cintura" REAL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "measurements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "measurements_userId_idx" ON "measurements"("userId");

-- CreateIndex
CREATE INDEX "measurements_fecha_idx" ON "measurements"("fecha");

-- CreateIndex
CREATE INDEX "measurements_userId_fecha_idx" ON "measurements"("userId", "fecha");
