import { describe, expect, it } from "vitest";
import { buildFirstDueRow } from "../shared/export";
import {
  applyBattallionTypo,
  formatDateMMDDYYYY,
  normalizeApparatusName,
  validateMaxLengths,
  validateNotesLength,
  validateUseChoice
} from "../shared/validation";
import type { EquipmentExportRecord, FirstDueRow } from "../shared/types";

function buildEquipmentRecord(
  overrides: Partial<EquipmentExportRecord> = {}
): EquipmentExportRecord {
  return {
    id: "equipment-1",
    name: "Test Item",
    equipment_id: "EQ-1",
    group_name: "General",
    equipment_type: "General Equipment",
    make: "",
    model: "",
    serial_number: "00071691",
    description: "",
    notes: "",
    use_choice: "Other",
    in_service: true,
    is_primary: false,
    ownership: "Department",
    station_id: "station-1",
    apparatus_id: null,
    trailer_id: null,
    storage_area_id: null,
    compartment_id: null,
    parent_equipment_id: null,
    parent_equipment_name: null,
    parent_serial_number: null,
    assigned_unit: null,
    kit_reference_id: null,
    last_service_test_date: "2026-06-16",
    next_service_test_date: "2026-12-16",
    battery_type: null,
    battery_voltage: null,
    amp_hours: null,
    electronic_type: null,
    electronic_product_code: null,
    firmware_version: null,
    lot: null,
    raw_barcode_value: null,
    created_at: "2026-06-16T00:00:00.000Z",
    updated_at: "2026-06-16T00:00:00.000Z",
    station_number: "1",
    station_name: "Station 1",
    apparatus_name: null,
    storage_name: null,
    trailer_name: null,
    compartment_name: null,
    ...overrides
  };
}

function buildRow(overrides: Partial<FirstDueRow> = {}): FirstDueRow {
  return {
    NAME: "Example",
    "EQUIPMENT ID": "EQ-1",
    NOTES: "",
    USE: "Other",
    "Apparatus Name": "",
    "NEXT SERVICE TEST DATE": "",
    "LAST SERVICE TEST DATE": "",
    ...overrides
  };
}

describe("apparatus normalization", () => {
  it("turns E-1 into Engine 1", () => {
    expect(normalizeApparatusName("E-1")).toBe("Engine 1");
  });

  it("turns T-2 into Truck 2", () => {
    expect(normalizeApparatusName("T-2")).toBe("Truck 2");
  });

  it("turns R-1 into Rescue 1", () => {
    expect(normalizeApparatusName("R-1")).toBe("Rescue 1");
  });

  it("exports Battalion 1 as Battallion 1", () => {
    expect(applyBattallionTypo("Battalion 1")).toBe("Battallion 1");
  });
});

describe("field length validation", () => {
  it("blocks notes over 250 when truncation is disabled", () => {
    const result = validateNotesLength(
      buildRow({ NOTES: "A".repeat(251) }),
      { truncate_over_limit: false }
    );
    expect(result.errors).toHaveLength(1);
  });

  it("truncates notes over 250 when truncation is enabled", () => {
    const result = validateNotesLength(
      buildRow({ NOTES: "A".repeat(251) }),
      { truncate_over_limit: true }
    );
    expect(result.errors).toHaveLength(0);
    expect(result.value.NOTES).toHaveLength(250);
  });

  it("blocks general fields over 255 when truncation is disabled", () => {
    const result = validateMaxLengths(
      buildRow({ NAME: "A".repeat(256) }),
      { truncate_over_limit: false }
    );
    expect(result.errors).toHaveLength(1);
  });

  it("truncates general fields over 255 when truncation is enabled", () => {
    const result = validateMaxLengths(
      buildRow({ NAME: "A".repeat(256) }),
      { truncate_over_limit: true }
    );
    expect(result.errors).toHaveLength(0);
    expect(result.value.NAME).toHaveLength(255);
  });
});

describe("use choice and dates", () => {
  it("defaults invalid use to Life Safety for life safety equipment", () => {
    const result = validateUseChoice(
      buildRow({ USE: "Not Allowed", "EQUIPMENT TYPE": "Gas Monitor" }),
      { equipment_type: "Gas Monitor" }
    );
    expect(result.value.USE).toBe("Life Safety");
  });

  it("defaults invalid use to Other for unknown equipment", () => {
    const result = validateUseChoice(
      buildRow({ USE: "Invalid", "EQUIPMENT TYPE": "Office Supply" }),
      { equipment_type: "Office Supply" }
    );
    expect(result.value.USE).toBe("Other");
  });

  it("formats dates as MM/DD/YYYY", () => {
    expect(formatDateMMDDYYYY("2026-06-16")).toBe("06/16/2026");
  });
});

describe("export row building", () => {
  it("preserves leading zeroes in serial numbers", () => {
    const row = buildFirstDueRow(
      buildEquipmentRecord({ serial_number: "00071691" })
    );
    expect(row["SERIAL NUMBER"]).toBe("00071691");
  });

  it("exports DM7, DM11, DM17, and DM20 to Station 1 / SCBA Room", () => {
    for (const equipmentId of ["DM7", "DM11", "DM17", "DM20"]) {
      const row = buildFirstDueRow(
        buildEquipmentRecord({
          equipment_id: equipmentId,
          name: equipmentId,
          storage_area_id: "storage-scba-room",
          storage_name: "SCBA Room",
          station_number: "1",
          apparatus_name: null,
          compartment_name: "Should Stay Blank"
        })
      );

      expect(row["Station Number"]).toBe("1");
      expect(row["Storage Name"]).toBe("SCBA Room");
      expect(row["Apparatus Name"]).toBe("");
      expect(row["Compartment Name"]).toBe("");
    }
  });

  it("exports apparatus assignments with apparatus and compartment names", () => {
    const row = buildFirstDueRow(
      buildEquipmentRecord({
        apparatus_id: "apparatus-engine-1",
        apparatus_name: "Engine 1",
        compartment_id: "compartment-1",
        compartment_name: "EMS Cabinet"
      })
    );

    expect(row["Apparatus Name"]).toBe("Engine 1");
    expect(row["Compartment Name"]).toBe("EMS Cabinet");
  });

  it("exports storage assignments with station and storage only", () => {
    const row = buildFirstDueRow(
      buildEquipmentRecord({
        storage_area_id: "storage-scba-room",
        storage_name: "SCBA Room",
        apparatus_name: "Engine 1",
        compartment_name: "Driver Side 1"
      })
    );

    expect(row["Station Number"]).toBe("1");
    expect(row["Storage Name"]).toBe("SCBA Room");
    expect(row["Apparatus Name"]).toBe("");
    expect(row["Compartment Name"]).toBe("");
  });
});
