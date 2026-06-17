import { useState } from "react";
import type { FormEvent } from "react";
import { APPARATUS_TYPES } from "../../shared/constants";
import { normalizeApparatusName } from "../../shared/validation";
import { Button, Card, EmptyState, Field, PageHeader, SearchBar, Table, Toggle } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_APPARATUS = {
  station_id: "",
  apparatus_name: "",
  apparatus_type: "Engine",
  in_service: true,
  notes: ""
};

export function ApparatusPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_APPARATUS);

  if (!data) {
    return null;
  }

  const filteredApparatus = data.apparatus.filter((item) => {
    const station = data.stations.find((stationEntry) => stationEntry.id === item.station_id);
    return `${item.apparatus_name} ${item.apparatus_type} ${station?.station_name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY_APPARATUS);
  }

  function loadItem(apparatusId: string) {
    const item = data.apparatus.find((entry) => entry.id === apparatusId);
    if (!item) {
      return;
    }
    setEditingId(item.id);
    setForm({
      station_id: item.station_id,
      apparatus_name: item.apparatus_name,
      apparatus_type: item.apparatus_type,
      in_service: item.in_service,
      notes: item.notes ?? ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...form,
      apparatus_name: normalizeApparatusName(form.apparatus_name)
    };

    if (editingId) {
      await updateRecord("apparatus", editingId, payload);
    } else {
      await createRecord("apparatus", payload);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this apparatus entry?")) {
      return;
    }
    await deleteRecord("apparatus", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Apparatus"
        description="Use expanded DFD names here so exports never send abbreviated apparatus names."
      />

      <div className="page-grid">
        <Card title="Apparatus List" subtitle="Select an apparatus to edit it.">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search apparatus by name, type, or station"
          />

          {filteredApparatus.length === 0 ? (
            <EmptyState
              title="No apparatus found"
              body="Add apparatus entries like Engine 1 or Rescue 1 to begin staging equipment."
            />
          ) : (
            <Table
              headers={["Apparatus", "Station", "Type", "In Service"]}
              rows={filteredApparatus.map((item) => {
                const station = data.stations.find(
                  (stationEntry) => stationEntry.id === item.station_id
                );
                return (
                  <tr key={item.id} onClick={() => loadItem(item.id)}>
                    <td>{item.apparatus_name}</td>
                    <td>{station?.station_number ?? "-"}</td>
                    <td>{item.apparatus_type}</td>
                    <td>{item.in_service ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            />
          )}
        </Card>

        <Card
          title={editingId ? "Edit Apparatus" : "Add Apparatus"}
          subtitle={`Expanded preview: ${normalizeApparatusName(form.apparatus_name || "E-1")}`}
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
            <Field label="Apparatus Name">
              <input
                value={form.apparatus_name}
                onChange={(event) =>
                  setForm({ ...form, apparatus_name: event.target.value })
                }
                placeholder="Engine 1"
              />
            </Field>
            <Field label="Apparatus Type">
              <select
                value={form.apparatus_type}
                onChange={(event) =>
                  setForm({ ...form, apparatus_type: event.target.value })
                }
              >
                {APPARATUS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
            <Toggle
              checked={form.in_service}
              onChange={(in_service) => setForm({ ...form, in_service })}
              label="In service"
            />

            <div className="button-row">
              <Button type="submit">
                {editingId ? "Save Apparatus" : "Create Apparatus"}
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
