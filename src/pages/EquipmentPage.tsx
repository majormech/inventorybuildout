import { useState } from "react";
import type { FormEvent } from "react";
import { USE_CHOICES } from "../../shared/constants";
import { parseBarcodeValue } from "../lib/barcode";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  SearchBar,
  Table,
  Toggle
} from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_EQUIPMENT = {
  name: "",
  equipment_id: "",
  group_name: "",
  equipment_type: "",
  make: "",
  model: "",
  serial_number: "",
  description: "",
  notes: "",
  use_choice: "Other",
  in_service: true,
  is_primary: false,
  ownership: "Department",
  station_id: "",
  apparatus_id: "",
  trailer_id: "",
  storage_area_id: "",
  compartment_id: "",
  parent_equipment_id: "",
  parent_equipment_name: "",
  parent_serial_number: "",
  assigned_unit: "",
  kit_reference_id: "",
  last_service_test_date: "",
  next_service_test_date: "",
  battery_type: "",
  battery_voltage: "",
  amp_hours: "",
  electronic_type: "",
  electronic_product_code: "",
  firmware_version: "",
  lot: "",
  raw_barcode_value: ""
};

export function EquipmentPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    station_id: "",
    apparatus_id: "",
    storage_area_id: "",
    trailer_id: "",
    equipment_type: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [showBarcodeHelper, setShowBarcodeHelper] = useState(false);
  const [form, setForm] = useState(EMPTY_EQUIPMENT);

  if (!data) {
    return null;
  }

  const barcodePreview = parseBarcodeValue(form.raw_barcode_value);
  const hasBarcodeDetector =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const availableCompartments = data.compartments.filter((compartment) => {
    if (form.apparatus_id) {
      return (
        compartment.parent_type === "apparatus" &&
        compartment.parent_id === form.apparatus_id
      );
    }
    if (form.trailer_id) {
      return (
        compartment.parent_type === "trailer" &&
        compartment.parent_id === form.trailer_id
      );
    }
    if (form.storage_area_id) {
      return (
        compartment.parent_type === "storage_area" &&
        compartment.parent_id === form.storage_area_id
      );
    }
    return false;
  });

  const filteredItems = data.equipment_items.filter((item) => {
    const matchesSearch = [
      item.name,
      item.equipment_id,
      item.group_name ?? "",
      item.equipment_type ?? "",
      item.serial_number ?? "",
      item.parent_equipment_name ?? "",
      item.raw_barcode_value ?? ""
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesStation = !filters.station_id || item.station_id === filters.station_id;
    const matchesApparatus =
      !filters.apparatus_id || item.apparatus_id === filters.apparatus_id;
    const matchesStorage =
      !filters.storage_area_id || item.storage_area_id === filters.storage_area_id;
    const matchesTrailer =
      !filters.trailer_id || item.trailer_id === filters.trailer_id;
    const matchesType =
      !filters.equipment_type ||
      (item.equipment_type ?? "").toLowerCase() ===
        filters.equipment_type.toLowerCase();

    return (
      matchesSearch &&
      matchesStation &&
      matchesApparatus &&
      matchesStorage &&
      matchesTrailer &&
      matchesType
    );
  });

  function getLocationLabel(itemId: string) {
    const item = data.equipment_items.find((entry) => entry.id === itemId);
    if (!item) {
      return "-";
    }

    if (item.storage_area_id) {
      const station = data.stations.find((entry) => entry.id === item.station_id);
      const storage = data.storage_areas.find(
        (entry) => entry.id === item.storage_area_id
      );
      return `Station ${station?.station_number ?? "?"} / ${
        storage?.storage_name ?? "Storage"
      }`;
    }

    if (item.apparatus_id) {
      const apparatus = data.apparatus.find(
        (entry) => entry.id === item.apparatus_id
      );
      const compartment = data.compartments.find(
        (entry) => entry.id === item.compartment_id
      );
      return `${apparatus?.apparatus_name ?? "Apparatus"}${
        compartment ? ` / ${compartment.compartment_name}` : ""
      }`;
    }

    if (item.trailer_id) {
      const trailer = data.trailers.find((entry) => entry.id === item.trailer_id);
      const compartment = data.compartments.find(
        (entry) => entry.id === item.compartment_id
      );
      return `${trailer?.trailer_name ?? "Trailer"}${
        compartment ? ` / ${compartment.compartment_name}` : ""
      }`;
    }

    const station = data.stations.find((entry) => entry.id === item.station_id);
    return station ? `Station ${station.station_number}` : "-";
  }

  function reset() {
    setEditingId(null);
    setTemplateId("");
    setForm(EMPTY_EQUIPMENT);
  }

  function loadItem(itemId: string) {
    const item = data.equipment_items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    setEditingId(item.id);
    setForm({
      name: item.name,
      equipment_id: item.equipment_id,
      group_name: item.group_name ?? "",
      equipment_type: item.equipment_type ?? "",
      make: item.make ?? "",
      model: item.model ?? "",
      serial_number: item.serial_number ?? "",
      description: item.description ?? "",
      notes: item.notes ?? "",
      use_choice: item.use_choice ?? "Other",
      in_service: item.in_service,
      is_primary: item.is_primary,
      ownership: item.ownership ?? "",
      station_id: item.station_id ?? "",
      apparatus_id: item.apparatus_id ?? "",
      trailer_id: item.trailer_id ?? "",
      storage_area_id: item.storage_area_id ?? "",
      compartment_id: item.compartment_id ?? "",
      parent_equipment_id: item.parent_equipment_id ?? "",
      parent_equipment_name: item.parent_equipment_name ?? "",
      parent_serial_number: item.parent_serial_number ?? "",
      assigned_unit: item.assigned_unit ?? "",
      kit_reference_id: item.kit_reference_id ?? "",
      last_service_test_date: item.last_service_test_date ?? "",
      next_service_test_date: item.next_service_test_date ?? "",
      battery_type: item.battery_type ?? "",
      battery_voltage: item.battery_voltage ?? "",
      amp_hours: item.amp_hours ?? "",
      electronic_type: item.electronic_type ?? "",
      electronic_product_code: item.electronic_product_code ?? "",
      firmware_version: item.firmware_version ?? "",
      lot: item.lot ?? "",
      raw_barcode_value: item.raw_barcode_value ?? ""
    });
  }

  function applyTemplate() {
    const template = data.equipment_templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setForm({
      ...form,
      group_name: template.group_name ?? form.group_name,
      equipment_type: template.equipment_type ?? form.equipment_type,
      make: template.make ?? form.make,
      model: template.model ?? form.model,
      use_choice: template.default_use_choice ?? form.use_choice,
      description: template.default_description ?? form.description,
      notes: template.default_notes ?? form.notes,
      ownership: template.default_ownership ?? form.ownership,
      electronic_type:
        template.default_electronic_type ?? form.electronic_type,
      name: form.name || template.template_name
    });
  }

  function applyBarcodeSuggestion() {
    const nextSerial = barcodePreview.parsed_serial_number;
    if (!nextSerial) {
      return;
    }
    if (form.serial_number && form.serial_number !== nextSerial) {
      const confirmed = window.confirm(
        `Serial Number already contains ${form.serial_number}. Replace it with ${nextSerial}?`
      );
      if (!confirmed) {
        return;
      }
    }
    setForm({ ...form, serial_number: nextSerial });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      await updateRecord("equipment_items", editingId, form);
    } else {
      await createRecord("equipment_items", form);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this equipment item?")) {
      return;
    }
    await deleteRecord("equipment_items", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Equipment"
        description="Capture field-level inventory data, assignment context, parent-child relationships, and barcode metadata before export."
        action={
          <Button variant="secondary" onClick={() => setShowBarcodeHelper((value) => !value)}>
            Scan Barcode
          </Button>
        }
      />

      <div className="filter-grid">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by item name, ID, serial, parent, or barcode"
        />
        <Field label="Station Filter">
          <select
            value={filters.station_id}
            onChange={(event) =>
              setFilters({ ...filters, station_id: event.target.value })
            }
          >
            <option value="">All stations</option>
            {data.stations.map((station) => (
              <option key={station.id} value={station.id}>
                Station {station.station_number}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Apparatus Filter">
          <select
            value={filters.apparatus_id}
            onChange={(event) =>
              setFilters({ ...filters, apparatus_id: event.target.value })
            }
          >
            <option value="">All apparatus</option>
            {data.apparatus.map((item) => (
              <option key={item.id} value={item.id}>
                {item.apparatus_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Storage Filter">
          <select
            value={filters.storage_area_id}
            onChange={(event) =>
              setFilters({ ...filters, storage_area_id: event.target.value })
            }
          >
            <option value="">All storage areas</option>
            {data.storage_areas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.storage_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Trailer Filter">
          <select
            value={filters.trailer_id}
            onChange={(event) =>
              setFilters({ ...filters, trailer_id: event.target.value })
            }
          >
            <option value="">All trailers</option>
            {data.trailers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.trailer_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Equipment Type Filter">
          <input
            value={filters.equipment_type}
            onChange={(event) =>
              setFilters({ ...filters, equipment_type: event.target.value })
            }
            placeholder="Cardiac Monitor"
          />
        </Field>
      </div>

      {showBarcodeHelper ? (
        <Card
          title="Barcode Helper"
          subtitle={
            hasBarcodeDetector
              ? "Browser barcode support is detected. This MVP keeps the approval flow manual before save."
              : "Live browser scanning is not available in this browser. Manual barcode entry is ready."
          }
        >
          <div className="form-grid">
            <Field label="Raw Barcode Value">
              <input
                value={form.raw_barcode_value}
                onChange={(event) =>
                  setForm({ ...form, raw_barcode_value: event.target.value })
                }
                placeholder="Paste or type the full barcode, QR, or UDI string"
              />
            </Field>
            <Field label="Parsed Serial Number">
              <input value={barcodePreview.parsed_serial_number} readOnly />
            </Field>
            <Field label="Parsed UDI / GTIN">
              <input value={barcodePreview.parsed_udi_gtin} readOnly />
            </Field>
            <Field label="Suggested Equipment Field">
              <input value={barcodePreview.suggested_field} readOnly />
            </Field>
          </div>
          <div className="button-row">
            <Button
              variant="secondary"
              onClick={applyBarcodeSuggestion}
              disabled={!barcodePreview.parsed_serial_number}
            >
              Apply Parsed Serial Number
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="page-grid">
        <Card title="Equipment List" subtitle="Tap a row to edit it.">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="No equipment found"
              body="Add equipment manually, apply a template, and attach items to apparatus, trailers, or station storage."
            />
          ) : (
            <Table
              headers={[
                "Name",
                "Equipment ID",
                "Location",
                "Use",
                "Parent",
                "Serial"
              ]}
              rows={filteredItems.map((item) => (
                <tr key={item.id} onClick={() => loadItem(item.id)}>
                  <td>{item.name}</td>
                  <td>{item.equipment_id}</td>
                  <td>{getLocationLabel(item.id)}</td>
                  <td>{item.use_choice || "-"}</td>
                  <td>{item.parent_equipment_name || "-"}</td>
                  <td>{item.serial_number || "-"}</td>
                </tr>
              ))}
            />
          )}
        </Card>

        <Card
          title={editingId ? "Edit Equipment Item" : "Add Equipment Item"}
          subtitle="All critical First Due field rules are applied again at export."
        >
          <div className="inline-tools">
            <Field label="Template">
              <select
                value={templateId}
                onChange={(event) => setTemplateId(event.target.value)}
              >
                <option value="">Choose a template</option>
                {data.equipment_templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.template_name}
                  </option>
                ))}
              </select>
            </Field>
            <Button variant="secondary" onClick={applyTemplate} disabled={!templateId}>
              Apply Template
            </Button>
          </div>

          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="Name">
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </Field>
            <Field label="Equipment ID">
              <input
                value={form.equipment_id}
                onChange={(event) =>
                  setForm({ ...form, equipment_id: event.target.value })
                }
              />
            </Field>
            <Field label="Group Name">
              <input
                value={form.group_name}
                onChange={(event) =>
                  setForm({ ...form, group_name: event.target.value })
                }
              />
            </Field>
            <Field label="Equipment Type">
              <input
                value={form.equipment_type}
                onChange={(event) =>
                  setForm({ ...form, equipment_type: event.target.value })
                }
              />
            </Field>
            <Field label="Make">
              <input
                value={form.make}
                onChange={(event) => setForm({ ...form, make: event.target.value })}
              />
            </Field>
            <Field label="Model">
              <input
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
              />
            </Field>
            <Field label="Serial Number">
              <input
                value={form.serial_number}
                onChange={(event) =>
                  setForm({ ...form, serial_number: event.target.value })
                }
              />
            </Field>
            <Field label="Use">
              <select
                value={form.use_choice}
                onChange={(event) =>
                  setForm({ ...form, use_choice: event.target.value })
                }
              >
                {USE_CHOICES.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </Field>

            <Field label="Station">
              <select
                value={form.station_id}
                onChange={(event) =>
                  setForm({ ...form, station_id: event.target.value })
                }
              >
                <option value="">Select a station</option>
                {data.stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    Station {station.station_number} - {station.station_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Apparatus">
              <select
                value={form.apparatus_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    apparatus_id: event.target.value,
                    trailer_id: "",
                    storage_area_id: "",
                    compartment_id: ""
                  })
                }
              >
                <option value="">None</option>
                {data.apparatus.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.apparatus_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trailer">
              <select
                value={form.trailer_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    trailer_id: event.target.value,
                    apparatus_id: "",
                    storage_area_id: "",
                    compartment_id: ""
                  })
                }
              >
                <option value="">None</option>
                {data.trailers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.trailer_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Storage Area">
              <select
                value={form.storage_area_id}
                onChange={(event) =>
                  setForm({
                    ...form,
                    storage_area_id: event.target.value,
                    apparatus_id: "",
                    trailer_id: "",
                    compartment_id: ""
                  })
                }
              >
                <option value="">None</option>
                {data.storage_areas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.storage_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Compartment">
              <select
                value={form.compartment_id}
                onChange={(event) =>
                  setForm({ ...form, compartment_id: event.target.value })
                }
              >
                <option value="">None</option>
                {availableCompartments.map((compartment) => (
                  <option key={compartment.id} value={compartment.id}>
                    {compartment.compartment_name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Parent Equipment">
              <select
                value={form.parent_equipment_id}
                onChange={(event) => {
                  const parentItem = data.equipment_items.find(
                    (item) => item.id === event.target.value
                  );
                  setForm({
                    ...form,
                    parent_equipment_id: event.target.value,
                    parent_equipment_name: parentItem?.name ?? "",
                    parent_serial_number: parentItem?.serial_number ?? ""
                  });
                }}
              >
                <option value="">None</option>
                {data.equipment_items
                  .filter((item) => item.id !== editingId)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.serial_number ? `- SN ${item.serial_number}` : ""}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Parent Equipment Name">
              <input
                value={form.parent_equipment_name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    parent_equipment_name: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Parent Serial Number">
              <input
                value={form.parent_serial_number}
                onChange={(event) =>
                  setForm({
                    ...form,
                    parent_serial_number: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Assigned Unit">
              <input
                value={form.assigned_unit}
                onChange={(event) =>
                  setForm({ ...form, assigned_unit: event.target.value })
                }
              />
            </Field>
            <Field label="Kit Reference Id">
              <input
                value={form.kit_reference_id}
                onChange={(event) =>
                  setForm({ ...form, kit_reference_id: event.target.value })
                }
              />
            </Field>
            <Field label="Last Service Test Date">
              <input
                type="date"
                value={form.last_service_test_date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    last_service_test_date: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Next Service Test Date">
              <input
                type="date"
                value={form.next_service_test_date}
                onChange={(event) =>
                  setForm({
                    ...form,
                    next_service_test_date: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Ownership">
              <input
                value={form.ownership}
                onChange={(event) =>
                  setForm({ ...form, ownership: event.target.value })
                }
              />
            </Field>
            <Field label="Battery Type">
              <input
                value={form.battery_type}
                onChange={(event) =>
                  setForm({ ...form, battery_type: event.target.value })
                }
              />
            </Field>
            <Field label="Battery Voltage">
              <input
                value={form.battery_voltage}
                onChange={(event) =>
                  setForm({ ...form, battery_voltage: event.target.value })
                }
              />
            </Field>
            <Field label="Amp-Hours">
              <input
                value={form.amp_hours}
                onChange={(event) =>
                  setForm({ ...form, amp_hours: event.target.value })
                }
              />
            </Field>
            <Field label="Electronic Type">
              <input
                value={form.electronic_type}
                onChange={(event) =>
                  setForm({ ...form, electronic_type: event.target.value })
                }
              />
            </Field>
            <Field label="Electronic Product Code">
              <input
                value={form.electronic_product_code}
                onChange={(event) =>
                  setForm({
                    ...form,
                    electronic_product_code: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Firmware Version">
              <input
                value={form.firmware_version}
                onChange={(event) =>
                  setForm({
                    ...form,
                    firmware_version: event.target.value
                  })
                }
              />
            </Field>
            <Field label="Lot">
              <input
                value={form.lot}
                onChange={(event) => setForm({ ...form, lot: event.target.value })}
              />
            </Field>

            <div className="toggle-grid">
              <Toggle
                checked={form.in_service}
                onChange={(in_service) => setForm({ ...form, in_service })}
                label="In service"
              />
              <Toggle
                checked={form.is_primary}
                onChange={(is_primary) => setForm({ ...form, is_primary })}
                label="Is primary"
              />
            </div>

            <div className="button-row">
              <Button type="submit">
                {editingId ? "Save Equipment" : "Create Equipment"}
              </Button>
              <Button variant="secondary" onClick={reset}>
                Clear
              </Button>
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                disabled={!editingId}
              >
                Delete
              </Button>
            </div>
          </form>

          <div className="helper-row">
            <Badge tone="warning">
              Camera scanning, import-assisted approval, and live BarcodeDetector
              capture are queued for the next phase.
            </Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
