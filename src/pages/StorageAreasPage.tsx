import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, EmptyState, Field, PageHeader, SearchBar, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_STORAGE = {
  station_id: "",
  storage_name: "",
  description: "",
  notes: ""
};

export function StorageAreasPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_STORAGE);

  if (!data) {
    return null;
  }

  const filtered = data.storage_areas.filter((item) => {
    const station = data.stations.find((entry) => entry.id === item.station_id);
    return `${item.storage_name} ${item.description ?? ""} ${station?.station_name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY_STORAGE);
  }

  function loadItem(itemId: string) {
    const item = data.storage_areas.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setEditingId(item.id);
    setForm({
      station_id: item.station_id,
      storage_name: item.storage_name,
      description: item.description ?? "",
      notes: item.notes ?? ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      await updateRecord("storage_areas", editingId, form);
    } else {
      await createRecord("storage_areas", form);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this storage area?")) {
      return;
    }
    await deleteRecord("storage_areas", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Storage Areas"
        description="Staging areas like SCBA Room or RTC Storage export with Station Number and Storage Name only."
      />

      <div className="page-grid">
        <Card title="Storage Area List" subtitle="Tap a storage area to edit it.">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search storage areas by name, description, or station"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No storage areas found"
              body="Use this page for rooms and staging areas that are separate from apparatus."
            />
          ) : (
            <Table
              headers={["Storage Area", "Station", "Equipment", "Description"]}
              rows={filtered.map((item) => {
                const station = data.stations.find(
                  (entry) => entry.id === item.station_id
                );
                const equipmentCount = data.equipment_items.filter(
                  (equipment) => equipment.storage_area_id === item.id
                ).length;
                return (
                  <tr key={item.id} onClick={() => loadItem(item.id)}>
                    <td>{item.storage_name}</td>
                    <td>{station?.station_number ?? "-"}</td>
                    <td>{equipmentCount}</td>
                    <td>{item.description || "-"}</td>
                  </tr>
                );
              })}
            />
          )}
        </Card>

        <Card
          title={editingId ? "Edit Storage Area" : "Add Storage Area"}
          subtitle="Storage equipment will export with blank apparatus and compartment values."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
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
            <Field label="Storage Name">
              <input
                value={form.storage_name}
                onChange={(event) =>
                  setForm({ ...form, storage_name: event.target.value })
                }
              />
            </Field>
            <Field label="Description">
              <input
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
              />
            </Field>
            <Field label="Notes">
              <textarea
                rows={5}
                value={form.notes}
                onChange={(event) =>
                  setForm({ ...form, notes: event.target.value })
                }
              />
            </Field>

            <div className="button-row">
              <Button type="submit">
                {editingId ? "Save Storage Area" : "Create Storage Area"}
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
        </Card>
      </div>
    </div>
  );
}
