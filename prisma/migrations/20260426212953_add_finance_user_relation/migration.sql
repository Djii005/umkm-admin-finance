/*
  Warnings:

  - Added the required column `userId` to the `Finance` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Finance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "receipt" TEXT,
    CONSTRAINT "Finance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Finance_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Finance" ("amount", "categoryId", "date", "description", "id", "receipt", "type") SELECT "amount", "categoryId", "date", "description", "id", "receipt", "type" FROM "Finance";
DROP TABLE "Finance";
ALTER TABLE "new_Finance" RENAME TO "Finance";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
