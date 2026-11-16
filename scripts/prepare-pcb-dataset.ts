import fs from "fs";
import path from "path";
import { SAMPLE_DATASETS } from "../src/lib/data/sampleDatasets";
import { normalizeComponentType } from "../src/lib/taxonomy/componentTaxonomy";

const CLASS_INDEX: Record<string, number> = {
  IC: 0,
  Resistor: 1,
  Capacitor: 2,
  Diode: 3,
  Transistor: 4,
  MOSFET: 5,
  Inductor: 6,
  Connector: 7,
  Crystal: 8,
  Sensor: 9,
  Relay: 10,
  Voltage_Regulator: 11,
  LED: 12,
  Fuse: 13,
  Transformer: 14,
  Dust_Contamination: 15,
};

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function prepareDataset() {
  console.log("Preparing EcoIntel PCB Component Dataset for YOLO Training...");

  const baseDir = path.resolve(process.cwd(), "datasets", "pcb-components");
  const splits = ["train", "val", "test"];

  for (const s of splits) {
    ensureDir(path.join(baseDir, "images", s));
    ensureDir(path.join(baseDir, "labels", s));
  }

  const sampleEntries = Object.entries(SAMPLE_DATASETS);
  console.log(`Found ${sampleEntries.length} PCB benchmark boards.`);

  let totalImages = 0;
  let totalAnnotations = 0;

  for (let i = 0; i < sampleEntries.length; i++) {
    const [sampleKey, sample] = sampleEntries[i];
    const imageRelative = sample.image.replace(/^\//, "");
    const sourceImagePath = path.resolve(process.cwd(), "public", imageRelative);

    if (!fs.existsSync(sourceImagePath)) {
      console.warn(`Source image not found: ${sourceImagePath}`);
      continue;
    }

    const imageBuffer = fs.readFileSync(sourceImagePath);

    // Build YOLO labels
    const labelLines: string[] = [];
    for (const comp of sample.detection.components) {
      const canonicalType = normalizeComponentType(comp.type);
      const classId = CLASS_INDEX[canonicalType] !== undefined ? CLASS_INDEX[canonicalType] : 0;

      const xc = Math.max(0.01, Math.min(0.99, (comp.coordinates.x + comp.coordinates.width / 2) / 100));
      const yc = Math.max(0.01, Math.min(0.99, (comp.coordinates.y + comp.coordinates.height / 2) / 100));
      const w = Math.max(0.01, Math.min(0.99, comp.coordinates.width / 100));
      const h = Math.max(0.01, Math.min(0.99, comp.coordinates.height / 100));

      labelLines.push(`${classId} ${xc.toFixed(6)} ${yc.toFixed(6)} ${w.toFixed(6)} ${h.toFixed(6)}`);
      totalAnnotations++;
    }

    const labelContent = labelLines.join("\n");

    // Assign to splits:
    // Every board contributes to train, and key boards also evaluate in val & test
    const targetSplits: string[] = ["train"];
    if (i % 2 === 0) targetSplits.push("val");
    if (i % 3 === 0) targetSplits.push("test");

    for (const split of targetSplits) {
      const imgFileName = `${sampleKey}.jpg`;
      const txtFileName = `${sampleKey}.txt`;

      fs.writeFileSync(path.join(baseDir, "images", split, imgFileName), imageBuffer);
      fs.writeFileSync(path.join(baseDir, "labels", split, txtFileName), labelContent);
      totalImages++;
    }
  }

  console.log(`Dataset prepared successfully!`);
  console.log(`Total images written: ${totalImages}`);
  console.log(`Total component annotations: ${totalAnnotations}`);
}

prepareDataset().catch((err) => {
  console.error("Dataset preparation error:", err);
  process.exit(1);
});
