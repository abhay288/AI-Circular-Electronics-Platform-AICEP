from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ComponentRULFeatureInput(BaseModel):
    componentId: str
    componentType: str
    manufacturer: Optional[str] = "Generic"
    partNumber: Optional[str] = None
    packageType: Optional[str] = "SMD"
    visualDamageSeverity: Optional[str] = "NONE" # NONE, LOW, MEDIUM, HIGH, CRITICAL
    hasCorrosion: Optional[bool] = False
    hasThermalDamage: Optional[bool] = False
    connectedTracesCount: Optional[int] = 2

class RULPredictionRequest(BaseModel):
    analysisId: str
    sampleId: Optional[str] = None
    componentAgeYears: Optional[float] = None
    operatingHours: Optional[float] = None
    operatingCycles: Optional[float] = None
    temperatureC: Optional[float] = None
    voltageV: Optional[float] = None
    currentA: Optional[float] = None
    loadPercentage: Optional[float] = None
    environmentalStress: Optional[float] = None
    maintenanceCount: Optional[int] = None
    pcbIntegrityScore: Optional[float] = None
    topologyRiskScore: Optional[float] = None
    components: Optional[List[ComponentRULFeatureInput]] = None
    isScenarioSimulation: Optional[bool] = False

class HealthFactorItem(BaseModel):
    factor: str
    impact: float
    severity: str
    evidence: str

class FailureModeItem(BaseModel):
    name: str
    risk: str  # LOW, MODERATE, HIGH, CRITICAL
    evidence: List[str]
    confidence: float

class ComponentHealthResult(BaseModel):
    componentId: str
    componentType: str
    healthScore: int
    healthStatus: str
    estimatedRULHours: int
    estimatedRULYears: float
    riskLevel: str
    confidence: float
    primaryContributingFactor: str

class RULPredictionInterval(BaseModel):
    lowerBoundHours: int
    upperBoundHours: int
    lowerBoundYears: float
    upperBoundYears: float
    confidenceIntervalPercent: int = 90

class RULPredictionResponse(BaseModel):
    success: bool = True
    analysisId: str
    status: str  # COMPLETED, INSUFFICIENT_DATA, PARTIAL
    modelProvider: str = "XGBOOST"
    modelName: str = "EcoIntel-Degradation-XGBoost"
    modelVersion: str = "v1.2.0"
    datasetVersion: str = "synthetic-reliability-v1"
    featureVersion: str = "rul-features-v1"

    # Overall Health Assessment
    healthScore: int
    healthStatus: str  # HEALTHY, GOOD, FAIR, DEGRADED, CRITICAL, UNKNOWN
    healthConfidence: float
    healthFactors: List[HealthFactorItem]

    # RUL Metrics & Uncertainty
    rulHours: int
    rulDays: int
    rulMonths: float
    rulYears: float
    rulCycles: int
    predictionInterval: RULPredictionInterval
    confidence: float
    uncertaintyHours: int
    failureRisk: str  # LOW, MODERATE, HIGH, CRITICAL
    riskLevel: str

    # Scientific Transparency & Explanations
    contributingFactors: List[str]
    failureModes: List[FailureModeItem]
    dataCompleteness: int  # 0 to 100 percentage
    missingFeatures: List[str]
    limitations: List[str]
    provenance: str = "PREDICTED"  # PREDICTED, ESTIMATED, SIMULATED

    # Component-level granular breakdowns
    components: List[ComponentHealthResult]
    isScenarioSimulation: bool = False
