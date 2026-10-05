import { SAMPLE_DATASETS } from "@/lib/data/sampleDatasets";
import { IMaterialItem } from "@/models/MaterialRecovery";

export interface MaterialInput {
  analysisId: string;
  sampleId?: string;
  pcbWeightKg?: number;
}

export interface MaterialOutput {
  pcbWeightKg: number;
  recoveryEfficiencyPercent: number;
  totalEstimatedMarketValueINR: number;
  totalEstimatedMarketValueUSD: number;
  materials: IMaterialItem[];
  method: "ESTIMATION" | "SPECTROMETRY";
  source: "DEMO" | "MEASURED";
}

export interface MaterialProvider {
  estimate(input: MaterialInput): Promise<MaterialOutput>;
}

export class DemoMaterialProvider implements MaterialProvider {
  async estimate(input: MaterialInput): Promise<MaterialOutput> {
    const sample = (input.sampleId && SAMPLE_DATASETS[input.sampleId]) || SAMPLE_DATASETS["router-board"];
    const weightKg = input.pcbWeightKg || sample.metals.pcbWeightKg || 0.28;

    // Standardized market benchmark rates (INR)
    const RATES = {
      Au: 6780, // ₹6,780 / gram
      Ag: 82,   // ₹82 / gram
      Cu: 795,  // ₹795 / kg
      Pd: 2950, // ₹2,950 / gram
      Sn: 2400, // ₹2,400 / kg
      Al: 220,  // ₹220 / kg
    };

    // Scaled recoveries based on board mass
    const goldGrams = +(weightKg * 0.32).toFixed(3);
    const silverGrams = +(weightKg * 1.50).toFixed(2);
    const copperKg = +(weightKg * 0.18).toFixed(3);
    const palladiumGrams = +(weightKg * 0.045).toFixed(3);
    const tinKg = +(weightKg * 0.04).toFixed(3);
    const aluminumKg = +(weightKg * 0.08).toFixed(3);

    const goldVal = Math.round(goldGrams * RATES.Au);
    const silverVal = Math.round(silverGrams * RATES.Ag);
    const copperVal = Math.round(copperKg * RATES.Cu);
    const palladiumVal = Math.round(palladiumGrams * RATES.Pd);
    const tinVal = Math.round(tinKg * RATES.Sn);
    const aluminumVal = Math.round(aluminumKg * RATES.Al);

    const totalINR = goldVal + silverVal + copperVal + palladiumVal + tinVal + aluminumVal;
    const totalUSD = +(totalINR / 86.5).toFixed(2);

    const materials: IMaterialItem[] = [
      {
        material: "Gold (99.99% Fine)",
        symbol: "Au",
        atomicNum: 79,
        estimatedQuantity: goldGrams,
        unit: "g",
        marketRateINR: RATES.Au,
        marketRateUnit: "₹/g",
        estimatedValueINR: goldVal,
        confidence: 0.96,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Silver (High Purity)",
        symbol: "Ag",
        atomicNum: 47,
        estimatedQuantity: silverGrams,
        unit: "g",
        marketRateINR: RATES.Ag,
        marketRateUnit: "₹/g",
        estimatedValueINR: silverVal,
        confidence: 0.94,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Copper (Cathode Grade)",
        symbol: "Cu",
        atomicNum: 29,
        estimatedQuantity: copperKg,
        unit: "kg",
        marketRateINR: RATES.Cu,
        marketRateUnit: "₹/kg",
        estimatedValueINR: copperVal,
        confidence: 0.98,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Palladium (Catalyst)",
        symbol: "Pd",
        atomicNum: 46,
        estimatedQuantity: palladiumGrams,
        unit: "g",
        marketRateINR: RATES.Pd,
        marketRateUnit: "₹/g",
        estimatedValueINR: palladiumVal,
        confidence: 0.91,
        method: "ESTIMATION",
        source: "DEMO",
      },
      {
        material: "Tin (Lead-Free Solder)",
        symbol: "Sn",
        atomicNum: 50,
        estimatedQuantity: tinKg,
        unit: "kg",
        marketRateINR: RATES.Sn,
        marketRateUnit: "₹/kg",
        estimatedValueINR: tinVal,
        confidence: 0.93,
        method: "ESTIMATION",
        source: "DEMO",
      },
    ];

    return {
      pcbWeightKg: weightKg,
      recoveryEfficiencyPercent: 98.4,
      totalEstimatedMarketValueINR: totalINR,
      totalEstimatedMarketValueUSD: totalUSD,
      materials,
      method: "ESTIMATION",
      source: "DEMO",
    };
  }
}
