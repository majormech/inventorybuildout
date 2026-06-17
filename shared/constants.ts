import type { ApparatusType, CompartmentParentType, UseChoice } from "./types";

export const USE_CHOICES: UseChoice[] = [
  "Anchor",
  "Life Safety",
  "Other",
  "Utility"
];

export const APPARATUS_TYPES: ApparatusType[] = [
  "Engine",
  "Truck",
  "Rescue",
  "Battallion",
  "Boat",
  "Trailer",
  "Chief Vehicle",
  "Support Vehicle",
  "Other"
];

export const COMPARTMENT_PARENT_TYPES: CompartmentParentType[] = [
  "apparatus",
  "trailer",
  "storage_area"
];

export const FIRST_DUE_GENERAL_MAX_LENGTH = 255;
export const FIRST_DUE_NOTES_MAX_LENGTH = 250;

export const LIFE_SAFETY_KEYWORDS = [
  "gas monitor",
  "draeger",
  "drager",
  "ems",
  "lifepak",
  "radio",
  "motorola",
  "scba",
  "ppe",
  "rescue",
  "defib",
  "monitor",
  "oxygen",
  "air pack"
];

export const ANCHOR_KEYWORDS = ["anchor"];
export const UTILITY_KEYWORDS = [
  "generator",
  "fan",
  "light",
  "charger",
  "tool",
  "saw",
  "wrench",
  "utility"
];

export const DEFAULT_FIRST_DUE_DATE_FIELDS = [
  "NEXT SERVICE TEST DATE",
  "LAST SERVICE TEST DATE"
] as const;
