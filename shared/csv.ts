import type { FirstDueRow } from "./types";

export interface CsvBuildOptions {
  include_bom?: boolean;
}

export function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

export function buildCsv(
  columns: string[],
  rows: FirstDueRow[],
  options: CsvBuildOptions = {}
): string {
  const header = columns.map(escapeCsvValue).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column] ?? "")).join(",")
  );
  const csv = [header, ...lines].join("\r\n");
  return options.include_bom === false ? csv : `\uFEFF${csv}`;
}

export function parseCsv(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        currentField += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      currentRow.push(currentField);
      rows.push(currentRow);
      currentField = "";
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const [headerRow, ...bodyRows] = rows;
  const headers = headerRow.map((header) => header.trim());
  const mappedRows = bodyRows
    .filter((row) => row.some((value) => value.trim().length > 0))
    .map((row) =>
      headers.reduce(
        (record, header, index) => {
          record[header] = row[index] ?? "";
          return record;
        },
        {} as Record<string, string>
      )
    );

  return { headers, rows: mappedRows };
}
