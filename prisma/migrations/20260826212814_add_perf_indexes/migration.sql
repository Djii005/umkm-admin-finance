-- Add indexes on foreign keys and frequently filtered columns to speed up
-- transaction/finance date-range queries and product low-stock lookups.

-- Product
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_active_idx" ON "Product"("active");

-- Transaction
CREATE INDEX "Transaction_type_date_idx" ON "Transaction"("type", "date");
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX "Transaction_customerId_idx" ON "Transaction"("customerId");
CREATE INDEX "Transaction_supplierId_idx" ON "Transaction"("supplierId");

-- TransactionItem
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");
CREATE INDEX "TransactionItem_productId_idx" ON "TransactionItem"("productId");

-- Finance
CREATE INDEX "Finance_type_date_idx" ON "Finance"("type", "date");
CREATE INDEX "Finance_categoryId_idx" ON "Finance"("categoryId");
CREATE INDEX "Finance_userId_idx" ON "Finance"("userId");
