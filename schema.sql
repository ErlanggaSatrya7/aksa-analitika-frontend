-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DATA_ENGINEER', 'SUPER_ADMIN', 'STATE_ADMIN', 'CITY_ADMIN', 'RETAILER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LogisticStatus" AS ENUM ('PENDING_CITY', 'APPROVED_CITY', 'APPROVED_STATE', 'APPROVED_CENTER', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "assignedState" TEXT,
    "assignedCity" TEXT,
    "retailerId" TEXT,
    "password" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "token" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dataset_uploads" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" TEXT,
    "totalRows" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "uploadedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dataset_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_data" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "retailerId" TEXT NOT NULL,
    "invoiceDate" TIMESTAMPTZ(6) NOT NULL,
    "region" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT,
    "product" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "unitsSold" INTEGER NOT NULL,
    "totalSales" DOUBLE PRECISION NOT NULL,
    "operatingProfit" DOUBLE PRECISION NOT NULL,
    "operatingMargin" DOUBLE PRECISION NOT NULL,
    "salesMethod" TEXT NOT NULL,
    "uploadId" TEXT,
    "rowId" SERIAL NOT NULL,

    CONSTRAINT "sales_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistic_requests" (
    "id" TEXT NOT NULL,
    "retailerId" TEXT NOT NULL,
    "productCategory" TEXT NOT NULL,
    "qtyRequested" INTEGER NOT NULL,
    "status" "LogisticStatus" NOT NULL DEFAULT 'PENDING_CITY',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistic_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_history" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "action" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "notes" TEXT,
    "uploadId" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_metrics" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "uploadId" TEXT,
    "mape" DOUBLE PRECISION,
    "mae" DOUBLE PRECISION,
    "r2" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "sales_data_invoiceDate_idx" ON "sales_data"("invoiceDate");

-- CreateIndex
CREATE INDEX "sales_data_retailerId_idx" ON "sales_data"("retailerId");

-- CreateIndex
CREATE INDEX "sales_data_uploadId_idx" ON "sales_data"("uploadId");

-- CreateIndex
CREATE INDEX "sales_data_region_state_city_idx" ON "sales_data"("region", "state", "city");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_data" ADD CONSTRAINT "sales_data_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_data" ADD CONSTRAINT "sales_data_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "dataset_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistic_requests" ADD CONSTRAINT "logistic_requests_retailerId_fkey" FOREIGN KEY ("retailerId") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_history" ADD CONSTRAINT "system_history_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "dataset_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "model_metrics" ADD CONSTRAINT "model_metrics_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "dataset_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

