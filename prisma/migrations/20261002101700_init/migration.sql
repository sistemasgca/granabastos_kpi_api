-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "KpiDirection" AS ENUM ('higher_is_better', 'lower_is_better');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('CRITICO', 'EN_RIESGO', 'EN_META', 'SUPERADO');

-- CreateEnum
CREATE TYPE "Periodicity" AS ENUM ('MENSUAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "Quarter" AS ENUM ('T1', 'T2', 'T3', 'T4');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'RETRASADA');

-- CreateTable
CREATE TABLE "Kpi" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "targetValue" DECIMAL(14,4) NOT NULL,
    "currentValue" DECIMAL(14,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "direction" "KpiDirection" NOT NULL,
    "compliancePercentage" DECIMAL(8,2) NOT NULL,
    "responsible" TEXT NOT NULL,
    "responsibleEmail" TEXT NOT NULL,
    "periodicity" "Periodicity" NOT NULL,
    "lastUpdated" DATE NOT NULL,
    "status" "KpiStatus" NOT NULL,
    "observations" TEXT,
    "targetDriveFolder" TEXT,
    "baseline2023" DECIMAL(14,4),
    "target2024" DECIMAL(14,4),
    "target2025" DECIMAL(14,4),
    "target2026" DECIMAL(14,4),
    "target2027" DECIMAL(14,4),
    "target2028" DECIMAL(14,4),
    "strategyNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" UUID NOT NULL,
    "kpiId" UUID NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "year" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "targetQuarter" DECIMAL(14,4) NOT NULL,
    "value" DECIMAL(14,4) NOT NULL,
    "inputA" DECIMAL(14,4),
    "inputB" DECIMAL(14,4),
    "compliancePercentage" DECIMAL(8,2) NOT NULL,
    "note" TEXT,
    "registeredBy" TEXT,
    "driveFolderDestination" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" UUID NOT NULL,
    "measurementId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "externalUrl" TEXT,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiTask" (
    "id" UUID NOT NULL,
    "kpiId" UUID NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledFrequency" TEXT NOT NULL,
    "scheduledMonth" TEXT,
    "dueDate" DATE NOT NULL,
    "completedDate" DATE,
    "responsible" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KpiTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "kpiId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "responsibleEmail" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "progress" INTEGER NOT NULL,
    "status" "ActionStatus" NOT NULL,
    "observations" TEXT,
    "evidenceUrl" TEXT,
    "evidenceNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaTask" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "processName" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "responsibleEmail" TEXT NOT NULL,
    "quarter" "Quarter" NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "progress" INTEGER NOT NULL,
    "status" "ActionStatus" NOT NULL,
    "deliverables" TEXT NOT NULL,
    "linkedKpiId" UUID,
    "observations" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_code_key" ON "Kpi"("code");

-- CreateIndex
CREATE INDEX "Kpi_area_idx" ON "Kpi"("area");

-- CreateIndex
CREATE INDEX "Kpi_status_idx" ON "Kpi"("status");

-- CreateIndex
CREATE INDEX "Measurement_kpiId_year_quarter_idx" ON "Measurement"("kpiId", "year", "quarter");

-- CreateIndex
CREATE INDEX "KpiTask_kpiId_idx" ON "KpiTask"("kpiId");

-- CreateIndex
CREATE INDEX "KpiTask_dueDate_status_idx" ON "KpiTask"("dueDate", "status");

-- CreateIndex
CREATE INDEX "ActionPlan_kpiId_idx" ON "ActionPlan"("kpiId");

-- CreateIndex
CREATE INDEX "ActionPlan_dueDate_status_idx" ON "ActionPlan"("dueDate", "status");

-- CreateIndex
CREATE INDEX "AreaTask_area_year_quarter_idx" ON "AreaTask"("area", "year", "quarter");

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiTask" ADD CONSTRAINT "KpiTask_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionPlan" ADD CONSTRAINT "ActionPlan_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaTask" ADD CONSTRAINT "AreaTask_linkedKpiId_fkey" FOREIGN KEY ("linkedKpiId") REFERENCES "Kpi"("id") ON DELETE SET NULL ON UPDATE CASCADE;
