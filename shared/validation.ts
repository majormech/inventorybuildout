import {
  ANCHOR_KEYWORDS,
  DEFAULT_FIRST_DUE_DATE_FIELDS,
  FIRST_DUE_GENERAL_MAX_LENGTH,
  FIRST_DUE_NOTES_MAX_LENGTH,
  LIFE_SAFETY_KEYWORDS,
  USE_CHOICES,
  UTILITY_KEYWORDS
} from "./constants";
import type {
  EquipmentItem,
  FirstDueRow,
  UseChoice,
  ValidationIssue,
  ValidationResult
} from "./types";

interface ValidationOptions {
  truncate_over_limit?: boolean;
  row_id?: string;
}

function makeIssue(
  level: ValidationIssue["level"],
  code: string,
  field: string,
  message: string,
  row_id?: string
): ValidationIssue {
  return { level, code, field, message, row_id };
}

function appendIssues<T>(
  target: ValidationResult<T>,
  source: ValidationResult<T>
): ValidationResult<T> {
  return {
    value: source.value,
    errors: [...target.errors, ...source.errors],
    warnings: [...target.warnings, ...source.warnings]
  };
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function preserveTextValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

export function cleanWhitespace(value: unknown): string {
  return preserveTextValue(value)
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function normalizeApparatusName(value: string): string {
  const cleaned = cleanWhitespace(value);
  if (!cleaned) {
    return "";
  }

  const engineMatch = cleaned.match(/^(?:e|engine)\s*[- ]?\s*(\d+)$/i);
  if (engineMatch) {
    return `Engine ${engineMatch[1]}`;
  }

  const truckMatch = cleaned.match(/^(?:t|truck)\s*[- ]?\s*(\d+)$/i);
  if (truckMatch) {
    return `Truck ${truckMatch[1]}`;
  }

  const rescueMatch = cleaned.match(/^(?:r|rescue)\s*[- ]?\s*(\d+)$/i);
  if (rescueMatch) {
    return `Rescue ${rescueMatch[1]}`;
  }

  const battalionMatch = cleaned.match(
    /^(?:batt(?:al|all)ion)\s*[- ]?\s*(\d+)$/i
  );
  if (battalionMatch) {
    return `Battallion ${battalionMatch[1]}`;
  }

  return titleCase(cleaned);
}

export function applyBattallionTypo(value: string): string {
  return cleanWhitespace(value).replace(/\bBattalion\b/gi, "Battallion");
}

export function formatDateMMDDYYYY(value: unknown): string {
  const raw = cleanWhitespace(value);
  if (!raw) {
    return "";
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    return `${month}/${day}/${slashMatch[3]}`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
  }

  const compactMatch = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) {
    return `${compactMatch[2]}/${compactMatch[3]}/${compactMatch[1]}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const month = `${parsed.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getUTCDate()}`.padStart(2, "0");
  const year = parsed.getUTCFullYear();
  return `${month}/${day}/${year}`;
}

export function inferDefaultUseChoice(
  source: Partial<EquipmentItem> | Record<string, unknown>
): UseChoice {
  const combined = [
    source.name,
    source.group_name,
    source.equipment_type,
    source.make,
    source.model,
    source.description
  ]
    .map((value) => cleanWhitespace(value).toLowerCase())
    .join(" ");

  if (ANCHOR_KEYWORDS.some((keyword) => combined.includes(keyword))) {
    return "Anchor";
  }

  if (LIFE_SAFETY_KEYWORDS.some((keyword) => combined.includes(keyword))) {
    return "Life Safety";
  }

  if (UTILITY_KEYWORDS.some((keyword) => combined.includes(keyword))) {
    return "Utility";
  }

  return "Other";
}

export function coerceUseChoice(
  value: unknown,
  source: Partial<EquipmentItem> | Record<string, unknown>
): UseChoice {
  const cleaned = cleanWhitespace(value) as UseChoice;
  return USE_CHOICES.includes(cleaned) ? cleaned : inferDefaultUseChoice(source);
}

export function validateMaxLengths(
  row: FirstDueRow,
  options: ValidationOptions = {}
): ValidationResult<FirstDueRow> {
  const sanitized = { ...row };
  const result: ValidationResult<FirstDueRow> = {
    value: sanitized,
    errors: [],
    warnings: []
  };

  for (const [field, rawValue] of Object.entries(sanitized)) {
    if (field === "NOTES") {
      continue;
    }
    const cleaned = cleanWhitespace(rawValue);
    sanitized[field] = cleaned;

    if (cleaned.length <= FIRST_DUE_GENERAL_MAX_LENGTH) {
      continue;
    }

    if (options.truncate_over_limit) {
      sanitized[field] = cleaned.slice(0, FIRST_DUE_GENERAL_MAX_LENGTH);
      result.warnings.push(
        makeIssue(
          "warning",
          "field-truncated",
          field,
          `${field} was truncated to ${FIRST_DUE_GENERAL_MAX_LENGTH} characters for export.`,
          options.row_id
        )
      );
      continue;
    }

    result.errors.push(
      makeIssue(
        "error",
        "field-too-long",
        field,
        `${field} is ${cleaned.length} characters. First Due allows up to ${FIRST_DUE_GENERAL_MAX_LENGTH}.`,
        options.row_id
      )
    );
  }

  return result;
}

export function validateNotesLength(
  row: FirstDueRow,
  options: ValidationOptions = {}
): ValidationResult<FirstDueRow> {
  const sanitized = { ...row };
  const result: ValidationResult<FirstDueRow> = {
    value: sanitized,
    errors: [],
    warnings: []
  };

  const notes = cleanWhitespace(sanitized.NOTES);
  sanitized.NOTES = notes;

  if (notes.length <= FIRST_DUE_NOTES_MAX_LENGTH) {
    return result;
  }

  if (options.truncate_over_limit) {
    sanitized.NOTES = notes.slice(0, FIRST_DUE_NOTES_MAX_LENGTH);
    result.warnings.push(
      makeIssue(
        "warning",
        "notes-truncated",
        "NOTES",
        `NOTES was truncated to ${FIRST_DUE_NOTES_MAX_LENGTH} characters for export.`,
        options.row_id
      )
    );
    return result;
  }

  result.errors.push(
    makeIssue(
      "error",
      "notes-too-long",
      "NOTES",
      `NOTES is ${notes.length} characters. First Due allows up to ${FIRST_DUE_NOTES_MAX_LENGTH}.`,
      options.row_id
    )
  );
  return result;
}

export function validateDateFormat(
  row: FirstDueRow,
  options: ValidationOptions = {}
): ValidationResult<FirstDueRow> {
  const sanitized = { ...row };
  const result: ValidationResult<FirstDueRow> = {
    value: sanitized,
    errors: [],
    warnings: []
  };

  for (const field of DEFAULT_FIRST_DUE_DATE_FIELDS) {
    const rawValue = cleanWhitespace(sanitized[field]);
    if (!rawValue) {
      sanitized[field] = "";
      continue;
    }

    const formatted = formatDateMMDDYYYY(rawValue);
    if (!formatted) {
      result.errors.push(
        makeIssue(
          "error",
          "invalid-date",
          field,
          `${field} must be a real date that can export as MM/DD/YYYY.`,
          options.row_id
        )
      );
      continue;
    }

    if (formatted !== rawValue) {
      result.warnings.push(
        makeIssue(
          "warning",
          "date-normalized",
          field,
          `${field} was normalized to ${formatted}.`,
          options.row_id
        )
      );
    }

    sanitized[field] = formatted;
  }

  return result;
}

export function validateUseChoice(
  row: FirstDueRow,
  source: Partial<EquipmentItem> | Record<string, unknown> = {},
  options: ValidationOptions = {}
): ValidationResult<FirstDueRow> {
  const sanitized = { ...row };
  const result: ValidationResult<FirstDueRow> = {
    value: sanitized,
    errors: [],
    warnings: []
  };

  const original = cleanWhitespace(sanitized.USE);
  const coerced = coerceUseChoice(original, {
    ...source,
    name: sanitized.NAME,
    group_name: sanitized["GROUP NAME"],
    equipment_type: sanitized["EQUIPMENT TYPE"],
    description: sanitized.Description
  });

  sanitized.USE = coerced;

  if (!original) {
    result.warnings.push(
      makeIssue(
        "warning",
        "use-defaulted",
        "USE",
        `USE was blank and defaulted to ${coerced}.`,
        options.row_id
      )
    );
    return result;
  }

  if (original !== coerced) {
    result.warnings.push(
      makeIssue(
        "warning",
        "use-corrected",
        "USE",
        `USE "${original}" is not allowed. It was corrected to ${coerced}.`,
        options.row_id
      )
    );
  }

  return result;
}

export function validateApparatusName(
  row: FirstDueRow,
  options: ValidationOptions = {}
): ValidationResult<FirstDueRow> {
  const sanitized = { ...row };
  const result: ValidationResult<FirstDueRow> = {
    value: sanitized,
    errors: [],
    warnings: []
  };

  const apparatusName = cleanWhitespace(sanitized["Apparatus Name"]);
  if (!apparatusName) {
    sanitized["Apparatus Name"] = "";
    return result;
  }

  const normalized = applyBattallionTypo(normalizeApparatusName(apparatusName));
  sanitized["Apparatus Name"] = normalized;

  if (normalized !== apparatusName) {
    result.warnings.push(
      makeIssue(
        "warning",
        "apparatus-normalized",
        "Apparatus Name",
        `Apparatus Name was normalized to ${normalized}.`,
        options.row_id
      )
    );
  }

  return result;
}

export function validateExportRow(
  row: FirstDueRow,
  source: Partial<EquipmentItem> | Record<string, unknown> = {},
  options: ValidationOptions = {}
): ValidationResult<FirstDueRow> {
  let result: ValidationResult<FirstDueRow> = {
    value: { ...row },
    errors: [],
    warnings: []
  };

  result = appendIssues(result, validateApparatusName(result.value, options));
  result = appendIssues(
    result,
    validateUseChoice(result.value, source, options)
  );
  result = appendIssues(result, validateDateFormat(result.value, options));
  result = appendIssues(result, validateNotesLength(result.value, options));
  result = appendIssues(result, validateMaxLengths(result.value, options));

  return result;
}
