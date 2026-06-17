import { cleanWhitespace } from "../../shared/validation";

export interface BarcodeParseResult {
  raw_value: string;
  parsed_serial_number: string;
  parsed_udi_gtin: string;
  suggested_field: string;
}

export function parseBarcodeValue(value: string): BarcodeParseResult {
  const raw = cleanWhitespace(value);
  const serialMatch = raw.match(
    /(?:serial|s\/n|sn|21)[\s:#-]*([a-z0-9-]{4,})/i
  );
  const gtinMatch = raw.match(/(?:01)?(\d{14})/);

  return {
    raw_value: raw,
    parsed_serial_number: serialMatch?.[1]?.toUpperCase() ?? "",
    parsed_udi_gtin: gtinMatch?.[1] ?? "",
    suggested_field: serialMatch ? "Serial Number" : gtinMatch ? "Equipment ID" : "Notes"
  };
}
