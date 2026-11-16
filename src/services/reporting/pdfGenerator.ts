import { jsPDF } from "jspdf";
import { IReport } from "@/models/Report";

export class ReportPdfGenerator {
  /**
   * Generates a clean, professional industrial PDF from an IReport document.
   */
  public static generatePdf(report: IReport): Buffer {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper to add new page if needed
    const ensureSpace = (neededMm: number) => {
      if (y + neededMm > pageHeight - margin - 15) {
        doc.addPage();
        y = margin + 10;
        drawHeaderFooter();
      }
    };

    // Header & Footer helper
    const drawHeaderFooter = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("ECOINTEL | CIRCULAR ELECTRONICS INTELLIGENCE PLATFORM", margin, margin);
      doc.setFont("helvetica", "normal");
      doc.text(`REPORT ID: ${report.reportId} | v${report.version}`, pageWidth - margin, margin, { align: "right" });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, margin + 2, pageWidth - margin, margin + 2);

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      doc.line(margin, pageHeight - margin - 4, pageWidth - margin, pageHeight - margin - 4);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      const footerText = report.branding?.reportFooter || "Confidential & Proprietary. All estimates retain documented confidence intervals.";
      doc.text(footerText, margin, pageHeight - margin);
      doc.text(`Page ${currentPage} of ${totalPages}`, pageWidth - margin, pageHeight - margin, { align: "right" });
    };

    // Draw initial header
    drawHeaderFooter();
    y = margin + 8;

    // Watermark if demo
    if (report.isDemo) {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(245, 158, 11);
      doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text("DEMO DATASET — SYNTHETIC / BENCHMARK DATA ONLY — NOT FOR REGULATORY FILING", pageWidth / 2, y + 5.5, { align: "center" });
      y += 12;
    }

    // Title Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text(report.title, margin, y + 6);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    const dateStr = new Date(report.generatedAt).toISOString().split("T")[0];
    doc.text(`Type: ${report.reportType} | Status: ${report.status} | Version: ${report.version} | Generated: ${dateStr}`, margin, y);
    if (report.analysisId) {
      doc.text(`Analysis Reference: ${report.analysisId}`, margin, y + 4.5);
      y += 4.5;
    }
    y += 8;

    // Completeness Summary Box
    ensureSpace(22);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("AUDIT & COMPLETENESS INDEX", margin + 4, y + 5.5);

    const comp = report.completeness || {
      overallPercent: 0,
      technicalPercent: 0,
      healthPercent: 0,
      materialsPercent: 0,
      repairPercent: 0,
      environmentalPercent: 0,
      missingSections: [],
    };

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const colW = contentWidth / 6;
    doc.text(`Overall: ${comp.overallPercent}%`, margin + 4, y + 12);
    doc.text(`Technical: ${comp.technicalPercent}%`, margin + 4 + colW, y + 12);
    doc.text(`Health/RUL: ${comp.healthPercent}%`, margin + 4 + colW * 2, y + 12);
    doc.text(`Materials: ${comp.materialsPercent}%`, margin + 4 + colW * 3, y + 12);
    doc.text(`Repair: ${comp.repairPercent}%`, margin + 4 + colW * 4, y + 12);
    doc.text(`Carbon: ${comp.environmentalPercent}%`, margin + 4 + colW * 5, y + 12);

    if (comp.missingSections && comp.missingSections.length > 0) {
      doc.setTextColor(220, 38, 38);
      doc.setFontSize(7.5);
      doc.text(`Missing / Incomplete: ${comp.missingSections.join(", ")}`, margin + 4, y + 17);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(7.5);
      doc.text("All core intelligence sections verified and present.", margin + 4, y + 17);
    }
    y += 26;

    // Executive Summary Block
    if (report.summary && Object.keys(report.summary).length > 0) {
      ensureSpace(30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Executive Summary & KPI Overview", margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const summaryKeys = Object.keys(report.summary);
      let summaryY = y;
      for (const key of summaryKeys) {
        ensureSpace(6);
        const val = typeof report.summary[key] === "object" ? JSON.stringify(report.summary[key]) : String(report.summary[key]);
        const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        doc.setFont("helvetica", "bold");
        doc.text(`${formattedKey}:`, margin + 4, summaryY);
        doc.setFont("helvetica", "normal");
        doc.text(val.substring(0, 75), margin + 65, summaryY);
        summaryY += 5;
        y = summaryY;
      }
      y += 4;
    }

    // Sections
    if (report.sections && report.sections.length > 0) {
      let secIndex = 2;
      for (const sec of report.sections) {
        ensureSpace(24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`${secIndex}. ${sec.title}`, margin, y);
        y += 5;

        // Evidence and confidence tag
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        const evLevel = sec.evidenceLevel || "ESTIMATED";
        doc.setTextColor(79, 70, 229);
        doc.text(`[EVIDENCE: ${evLevel}]`, margin + 2, y);
        if (sec.confidence !== undefined) {
          doc.setTextColor(100, 116, 139);
          doc.text(`CONFIDENCE: ${sec.confidence}%`, margin + 45, y);
        }
        if (sec.source) {
          doc.setTextColor(100, 116, 139);
          doc.text(`SOURCE: ${sec.source}`, margin + 85, y);
        }
        y += 5;

        // Content rendering
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        if (typeof sec.content === "string") {
          const lines = doc.splitTextToSize(sec.content, contentWidth - 4);
          for (const line of lines) {
            ensureSpace(4);
            doc.text(line, margin + 4, y);
            y += 4;
          }
        } else if (typeof sec.content === "object" && sec.content !== null) {
          const entries = Object.entries(sec.content);
          for (const [k, v] of entries) {
            ensureSpace(4.5);
            const valStr = typeof v === "object" ? JSON.stringify(v) : String(v);
            doc.setFont("helvetica", "bold");
            doc.text(`${k}:`, margin + 4, y);
            doc.setFont("helvetica", "normal");
            const valLines = doc.splitTextToSize(valStr, contentWidth - 55);
            doc.text(valLines[0] || "", margin + 50, y);
            y += 4.5;
          }
        }

        // Section limitations
        if (sec.limitations && sec.limitations.length > 0) {
          ensureSpace(5);
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text(`Limitations: ${sec.limitations.join("; ")}`, margin + 4, y);
          y += 5;
        }

        y += 4;
        secIndex++;
      }
    }

    // Methodology & Limitations Final Block
    ensureSpace(35);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text("Scientific Methodology & Provenance Disclosures", margin, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const methLines = doc.splitTextToSize(
      `Methodology: ${report.methodology || "EcoIntel Multi-Stage Circular Pipeline"}. Data sources: ${(report.dataSources || []).join(", ") || "Active telemetry and verified models"}.`,
      contentWidth
    );
    for (const line of methLines) {
      doc.text(line, margin, y);
      y += 3.8;
    }

    if (report.assumptions && report.assumptions.length > 0) {
      doc.text(`Assumptions: ${report.assumptions.join("; ")}`, margin, y);
      y += 3.8;
    }
    if (report.limitations && report.limitations.length > 0) {
      doc.text(`Platform Disclaimers: ${report.limitations.join("; ")}`, margin, y);
      y += 3.8;
    }

    // Update total pages on all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - margin, { align: "right" });
    }

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
  }
}
