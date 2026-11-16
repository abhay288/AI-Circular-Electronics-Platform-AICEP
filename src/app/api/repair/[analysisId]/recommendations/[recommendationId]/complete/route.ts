import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import RepairAssessment from "@/models/RepairAssessment";
import AnalysisSession from "@/models/AnalysisSession";
import DigitalPassport from "@/models/DigitalPassport";
import Component from "@/models/Component";
import AuditLog from "@/models/AuditLog";
import { getAuthUser } from "@/lib/auth";
import { DigitalPassportService } from "@/services/passport.service";
import { FunctionalTestStatus } from "@/lib/repair/repairTaxonomy";

export async function POST(
  req: NextRequest,
  { params }: { params: { analysisId: string; recommendationId: string } }
) {
  try {
    await connectDB();
    const authUser = await getAuthUser(req);
    const { analysisId, recommendationId } = params;
    const body = await req.json().catch(() => ({}));

    const {
      technicianId,
      notes,
      replacedComponentId,
      replacementPartNumber,
      evidenceDocuments = [],
      beforeMeasurements,
      afterMeasurements,
      functionalTestResult = "PASS",
      beforeHealth,
      afterHealth,
    } = body;

    const session = await AnalysisSession.findOne({
      $or: [{ analysisId }, { sessionId: analysisId }],
    });

    if (!session) {
      return NextResponse.json(
        { error: `Analysis session '${analysisId}' not found` },
        { status: 404 }
      );
    }

    if (
      authUser &&
      authUser.role !== "ADMIN" &&
      session.organizationId &&
      authUser.organizationId &&
      String(session.organizationId) !== String(authUser.organizationId)
    ) {
      return NextResponse.json(
        { error: "Forbidden: Access denied to foreign organization analysis" },
        { status: 403 }
      );
    }

    const assessment = await RepairAssessment.findOne({ analysisId: session.analysisId });
    if (!assessment) {
      return NextResponse.json(
        { error: "Repair assessment not found for this session" },
        { status: 404 }
      );
    }

    const recIndex = assessment.repairRecommendations.findIndex(
      (r) => r.recommendationId === recommendationId
    );

    if (recIndex === -1) {
      return NextResponse.json(
        { error: `Recommendation '${recommendationId}' not found` },
        { status: 404 }
      );
    }

    const rec = assessment.repairRecommendations[recIndex];
    if (rec.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Historical completed repair records are immutable and cannot be re-completed" },
        { status: 400 }
      );
    }

    const effectiveTech = technicianId || authUser?.userId || "Certified Repair Technician";
    const testResult: FunctionalTestStatus =
      functionalTestResult === "FAIL"
        ? "FAIL"
        : functionalTestResult === "NOT_PERFORMED"
        ? "NOT_PERFORMED"
        : "PASS";

    // Acceptance Criteria: If functional test is FAIL, status is FAILED (not COMPLETED/REPAIRED)
    const isSuccess = testResult === "PASS";
    rec.status = isSuccess ? "COMPLETED" : "CANCELLED"; // Or marked as failed
    rec.technicianId = effectiveTech;
    rec.notes = notes || "";
    rec.replacedComponentId = replacedComponentId || rec.componentId;
    rec.replacementPartNumber = replacementPartNumber;
    rec.evidenceDocuments = evidenceDocuments;
    rec.functionalTestResult = testResult;
    rec.completedAt = new Date();

    if (isSuccess && typeof afterHealth === "number") {
      rec.beforeHealth = beforeHealth ?? 58;
      rec.afterHealth = afterHealth;
    } else {
      // Do NOT claim improved health on failure or unmeasured test
      rec.beforeHealth = beforeHealth;
      rec.afterHealth = undefined;
    }

    // Update corresponding component repair assessment if present
    const compAss = assessment.componentAssessments.find(
      (c) => c.componentId === rec.componentId
    );
    if (compAss && isSuccess) {
      compAss.repairability = "REPAIRABLE";
      if (typeof afterHealth === "number") {
        compAss.healthScore = afterHealth;
        compAss.healthStatus = afterHealth >= 80 ? "HEALTHY" : "FAIR";
      }
    }

    assessment.markModified("repairRecommendations");
    assessment.markModified("componentAssessments");
    await assessment.save();

    // Update physical Component document state in database
    if (rec.componentId && isSuccess) {
      await Component.updateOne(
        {
          analysisId: session.analysisId,
          $or: [{ serialNumber: rec.componentId }, { name: rec.componentId }],
        },
        {
          $set: {
            condition: "GOOD",
            healthScore: typeof afterHealth === "number" ? afterHealth : 85,
            partNumber: replacementPartNumber || undefined,
          },
        }
      );
    }

    // Audit Log
    await AuditLog.create({
      analysisId: session.analysisId,
      userId: authUser?.userId || effectiveTech,
      organizationId: authUser?.organizationId || (session.organizationId ? String(session.organizationId) : undefined),
      action: isSuccess ? "REPAIR_COMPLETED" : "REPAIR_FAILED",
      resource: "RepairRecommendation",
      resourceId: recommendationId,
      metadata: {
        recommendationId,
        action: rec.action,
        componentId: rec.componentId,
        technicianId: effectiveTech,
        functionalTestResult: testResult,
        isSuccess,
      },
      timestamp: new Date(),
    });

    // Phase 7 Digital Product Passport Integration (only if repair succeeded!)
    let updatedPassport: any = null;
    if (isSuccess) {
      try {
        const passportService = new DigitalPassportService();
        let passport: any = await DigitalPassport.findOne({ analysisId: session.analysisId });
        
        if (!passport) {
          // If passport hasn't been created yet, initialize it
          passport = await passportService.createFromAnalysis(session.analysisId, {
            actor: effectiveTech,
            notes: "Passport initialized upon first verified physical repair.",
          });
        }

        if (passport) {
          updatedPassport = await passportService.addLifecycleEvent(passport.passportId, {
            eventType: "REPAIRED",
            description: `Executed action '${rec.action}' on component '${rec.componentId || "Board"}'. Result: Functional test PASS. ${notes || ""}`.trim(),
            actor: effectiveTech,
            organization: (session.organizationId ? String(session.organizationId) : undefined) || "EcoIntel Certified Lab",
            evidence: evidenceDocuments.length > 0 ? JSON.stringify(evidenceDocuments) : undefined,
            metadata: {
              recommendationId,
              action: rec.action,
              componentId: rec.componentId,
              replacementPartNumber,
              functionalTest: "PASS",
              beforeHealth: rec.beforeHealth,
              afterHealth: rec.afterHealth,
            },
          });
        }
      } catch (passportErr: any) {
        console.warn(`[API Repair Complete] Notice updating Phase 7 Passport: ${passportErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: isSuccess
        ? `Repair recommendation ${recommendationId} successfully completed`
        : `Repair recommendation ${recommendationId} recorded with test failure`,
      isSuccess,
      recommendation: rec,
      passportUpdated: !!updatedPassport,
      passportVersion: updatedPassport?.version,
      contentHash: updatedPassport?.verification?.contentHash,
    });
  } catch (err: any) {
    console.error("[API Repair Complete Error]:", err);
    return NextResponse.json(
      { error: err.message || "Failed to complete repair" },
      { status: 500 }
    );
  }
}
