export const FIRST_DUE_COLUMNS = [
  "GROUP NAME",
  "NAME",
  "EQUIPMENT ID",
  "IN SERVICE",
  "IS PRIMARY",
  "MAKE",
  "MODEL",
  "Description",
  "Apparatus Name",
  "Compartment Name",
  "Station Number",
  "Storage Name",
  "Kit Reference Id",
  "SERIAL NUMBER",
  "MANUFACTURE DATE",
  "EQUIPMENT TYPE",
  "OWNERSHIP",
  "NEXT SERVICE TEST DATE",
  "LAST SERVICE TEST DATE",
  "NOTES",
  "USE",
  "LOT",
  "Electronic Type",
  "Battery Voltage",
  "Amp-Hours",
  "Electronic Product Code",
  "Firmware Version"
] as const;

export type FirstDueColumn = (typeof FIRST_DUE_COLUMNS)[number];

export const DEFAULT_FIRST_DUE_COLUMN_MAPPING: Record<FirstDueColumn, string> =
  FIRST_DUE_COLUMNS.reduce(
    (mapping, header) => {
      mapping[header] = header;
      return mapping;
    },
    {} as Record<FirstDueColumn, string>
  );
