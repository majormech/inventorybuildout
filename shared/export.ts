import { buildCsv } from "./csv";
import { FIRST_DUE_COLUMNS } from "./firstdueColumns";
import { applyBattallionTypo, cleanWhitespace, formatDateMMDDYYYY, normalizeApparatusName, validateExportRow } from "./validation";
import type {
  EquipmentExportRecord,
  ExportOptions,
  ExportPreviewResponse,
  FirstDueRow
} from "./types";

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function composeNotes(item: EquipmentExportRecord): string {
  const parts = [
    cleanWhitespace(item.notes),
    item.parent_equipment_name || item.parent_serial_number
      ? `Attached to ${cleanWhitespace(item.assigned_unit)} ${cleanWhitespace(
          item.parent_equipment_name
        )} SN ${cleanWhitespace(item.parent_serial_number)}`
      : "",
    item.raw_barcode_value
      ? `Raw barcode: ${cleanWhitespace(item.raw_barcode_value)}`
      : ""
  ]
    .map((value) => cleanWhitespace(value))
    .filter(Boolean);

  return parts.join(" | ");
}

export function buildFirstDueRow(item: EquipmentExportRecord): FirstDueRow {
  const assignedToStorage = Boolean(item.storage_area_id);
  const apparatusName = item.trailer_name
    ? cleanWhitespace(item.trailer_name)
    : applyBattallionTypo(normalizeApparatusName(cleanWhitespace(item.apparatus_name)));

  const row: FirstDueRow = Object.fromEntries(
    FIRST_DUE_COLUMNS.map((column) => [column, ""])
  );

  row["GROUP NAME"] = cleanWhitespace(item.group_name);
  row.NAME = cleanWhitespace(item.name);
  row["EQUIPMENT ID"] = cleanWhitespace(item.equipment_id);
  row["IN SERVICE"] = yesNo(item.in_service);
  row["IS PRIMARY"] = yesNo(item.is_primary);
  row.MAKE = cleanWhitespace(item.make);
  row.MODEL = cleanWhitespace(item.model);
  row.Description = cleanWhitespace(item.description);
  row["Apparatus Name"] = assignedToStorage ? "" : apparatusName;
  row["Compartment Name"] = assignedToStorage
    ? ""
    : cleanWhitespace(item.compartment_name);
  row["Station Number"] = cleanWhitespace(item.station_number);
  row["Storage Name"] = assignedToStorage
    ? cleanWhitespace(item.storage_name)
    : "";
  row["Kit Reference Id"] = cleanWhitespace(item.kit_reference_id);
  row["SERIAL NUMBER"] = cleanWhitespace(item.serial_number);
  row["MANUFACTURE DATE"] = "";
  row["EQUIPMENT TYPE"] = cleanWhitespace(item.equipment_type);
  row.OWNERSHIP = cleanWhitespace(item.ownership);
  row["NEXT SERVICE TEST DATE"] = formatDateMMDDYYYY(
    item.next_service_test_date
  );
  row["LAST SERVICE TEST DATE"] = formatDateMMDDYYYY(
    item.last_service_test_date
  );
  row.NOTES = composeNotes(item);
  row.USE = cleanWhitespace(item.use_choice);
  row.LOT = cleanWhitespace(item.lot);
  row["Electronic Type"] = cleanWhitespace(item.electronic_type);
  row["Battery Voltage"] = cleanWhitespace(item.battery_voltage);
  row["Amp-Hours"] = cleanWhitespace(item.amp_hours);
  row["Electronic Product Code"] = cleanWhitespace(
    item.electronic_product_code
  );
  row["Firmware Version"] = cleanWhitespace(item.firmware_version);

  return row;
}

export function buildFirstDueExport(
  items: EquipmentExportRecord[],
  options: ExportOptions = {}
): ExportPreviewResponse {
  const rows: FirstDueRow[] = [];
  const warnings = [];
  const errors = [];
  let fieldsTruncated = 0;

  for (const item of items) {
    const rawRow = buildFirstDueRow(item);
    const validation = validateExportRow(rawRow, item, {
      truncate_over_limit: options.truncate_over_limit,
      row_id: item.id
    });

    warnings.push(...validation.warnings);
    errors.push(...validation.errors);
    fieldsTruncated += validation.warnings.filter((warning) =>
      ["field-truncated", "notes-truncated"].includes(warning.code)
    ).length;

    if (validation.errors.length > 0) {
      continue;
    }

    const hasAnyValue = Object.values(validation.value).some((value) =>
      cleanWhitespace(value)
    );

    if (!hasAnyValue) {
      continue;
    }

    rows.push(validation.value);
  }

  return {
    columns: [...FIRST_DUE_COLUMNS],
    rows,
    csv: buildCsv([...FIRST_DUE_COLUMNS], rows, {
      include_bom: options.include_bom
    }),
    summary: {
      total_rows: items.length,
      valid_rows: rows.length,
      rows_skipped: items.length - rows.length,
      fields_truncated: fieldsTruncated,
      warnings,
      errors
    }
  };
}
