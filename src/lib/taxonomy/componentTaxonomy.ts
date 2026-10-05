/**
 * EcoIntel Canonical Component Taxonomy
 * Normalizes varied model class names into standardized circular electronics categories.
 */

export const CANONICAL_COMPONENT_CLASSES = [
  "IC",
  "Resistor",
  "Capacitor",
  "Diode",
  "Transistor",
  "MOSFET",
  "Inductor",
  "Connector",
  "Crystal",
  "Sensor",
  "Relay",
  "Voltage_Regulator",
  "LED",
  "Fuse",
  "Transformer",
] as const;

export type CanonicalComponentType = typeof CANONICAL_COMPONENT_CLASSES[number] | "Other";

const CLASS_ALIAS_MAP: Record<string, CanonicalComponentType> = {
  // IC & Chips
  ic: "IC",
  integrated_circuit: "IC",
  chip: "IC",
  mcu: "IC",
  microcontroller: "IC",
  cpu: "IC",
  processor: "IC",
  soc: "IC",
  eeprom: "IC",
  flash_memory: "IC",
  op_amp: "IC",
  bga: "IC",
  sop: "IC",
  qfp: "IC",

  // Resistors
  resistor: "Resistor",
  res: "Resistor",
  smd_resistor: "Resistor",
  shunt: "Resistor",

  // Capacitors
  capacitor: "Capacitor",
  cap: "Capacitor",
  smd_capacitor: "Capacitor",
  electrolytic_capacitor: "Capacitor",
  tantalum_capacitor: "Capacitor",
  ceramic_capacitor: "Capacitor",

  // Diodes
  diode: "Diode",
  rectifier: "Diode",
  zener: "Diode",
  schottky: "Diode",

  // Transistors & MOSFETs
  transistor: "Transistor",
  bjt: "Transistor",
  mosfet: "MOSFET",
  fet: "MOSFET",
  igbt: "MOSFET",

  // Inductors & Chokes
  inductor: "Inductor",
  choke: "Inductor",
  ferrite_bead: "Inductor",
  coil: "Inductor",

  // Connectors & Ports
  connector: "Connector",
  header: "Connector",
  port: "Connector",
  usb: "Connector",
  rj45: "Connector",
  terminal: "Connector",
  jack: "Connector",

  // Crystals & Oscillators
  crystal: "Crystal",
  oscillator: "Crystal",
  resonator: "Crystal",
  xtal: "Crystal",

  // Sensors
  sensor: "Sensor",
  thermistor: "Sensor",
  accelerometer: "Sensor",
  gyroscope: "Sensor",
  hall_sensor: "Sensor",

  // Relays
  relay: "Relay",
  solenoid: "Relay",

  // Regulators & Power ICs
  voltage_regulator: "Voltage_Regulator",
  regulator: "Voltage_Regulator",
  ldo: "Voltage_Regulator",
  buck_converter: "Voltage_Regulator",
  pmic: "Voltage_Regulator",

  // Optoelectronics
  led: "LED",
  light_emitting_diode: "LED",
  photodiode: "LED",
  optocoupler: "LED",

  // Protection
  fuse: "Fuse",
  ptc: "Fuse",
  mov: "Fuse",
  varistor: "Fuse",

  // Magnetics
  transformer: "Transformer",
  lan_transformer: "Transformer",
  pulse_transformer: "Transformer",
};

/**
 * Maps any raw detection label or alias into the standard canonical EcoIntel component type.
 */
export function normalizeComponentType(rawLabel: string): CanonicalComponentType {
  if (!rawLabel) return "Other";
  const cleaned = rawLabel.trim().toLowerCase().replace(/[\s-]+/g, "_");
  
  if (CLASS_ALIAS_MAP[cleaned]) {
    return CLASS_ALIAS_MAP[cleaned];
  }

  // Exact match search in standard list (case-insensitive)
  const directMatch = CANONICAL_COMPONENT_CLASSES.find(
    (c) => c.toLowerCase() === cleaned
  );
  if (directMatch) return directMatch;

  return "Other";
}

/**
 * Returns estimated 3D package dimensions (in Three.js spatial units) for a given component type
 */
export function getComponent3dProfile(type: string): {
  color: number;
  height: number;
  roughness: number;
  metalness: number;
  hasPins: boolean;
} {
  switch (normalizeComponentType(type)) {
    case "IC":
      return { color: 0x0f172a, height: 0.16, roughness: 0.2, metalness: 0.8, hasPins: true };
    case "Capacitor":
      return { color: 0xd4d4d8, height: 0.32, roughness: 0.1, metalness: 0.95, hasPins: false };
    case "Resistor":
      return { color: 0x0284c7, height: 0.08, roughness: 0.5, metalness: 0.3, hasPins: false };
    case "Inductor":
      return { color: 0x334155, height: 0.28, roughness: 0.35, metalness: 0.7, hasPins: false };
    case "Transformer":
      return { color: 0x1e293b, height: 0.45, roughness: 0.4, metalness: 0.5, hasPins: true };
    case "Connector":
      return { color: 0xd97706, height: 0.38, roughness: 0.2, metalness: 0.85, hasPins: true };
    case "Crystal":
      return { color: 0xe2e8f0, height: 0.14, roughness: 0.1, metalness: 0.98, hasPins: false };
    case "Voltage_Regulator":
    case "MOSFET":
    case "Transistor":
      return { color: 0x18181b, height: 0.2, roughness: 0.2, metalness: 0.9, hasPins: true };
    case "LED":
      return { color: 0x22c55e, height: 0.12, roughness: 0.1, metalness: 0.2, hasPins: false };
    case "Fuse":
      return { color: 0xf59e0b, height: 0.12, roughness: 0.3, metalness: 0.8, hasPins: false };
    case "Relay":
      return { color: 0x1e3a8a, height: 0.42, roughness: 0.3, metalness: 0.4, hasPins: true };
    default:
      return { color: 0x475569, height: 0.12, roughness: 0.4, metalness: 0.5, hasPins: false };
  }
}
