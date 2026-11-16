import { CarbonImpactProvider } from "./carbon.interface";
import { MockCarbonImpactProvider } from "./mock.carbon.provider";
import { FactorBasedCarbonProvider } from "./factors.carbon.provider";

export function getCarbonImpactProvider(providerType?: string): CarbonImpactProvider {
  const chosen = (providerType || process.env.CARBON_PROVIDER || "mock").toLowerCase();

  switch (chosen) {
    case "factors":
    case "factor":
    case "factorbased":
      return new FactorBasedCarbonProvider();
    case "mock":
    default:
      return new MockCarbonImpactProvider();
  }
}

export * from "./carbon.interface";
export * from "./mock.carbon.provider";
export * from "./factors.carbon.provider";
