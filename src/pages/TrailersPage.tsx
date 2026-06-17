import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, EmptyState, Field, PageHeader, SearchBar, Table, Toggle } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_TRAILER = {
  station_id: "",
  trailer_name: "",
  trailer_type: "",
  in_service: true,
  notes: ""
};

export function TrailersPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_TRAILER);

  if (!data) {
    return null;
  }

  const filtered = data.trailers.filter((item) => {
    const station = data.stations.find((entry) => entry.id === item.station_id);
    return `${item.trailer_name} ${item.trailer_type ?? ""} ${station?.station_name ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY_TRAILER);
  }

  function loadItem(itemId: string) {
    const item = data.trailers.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setEditingId(item.id);
    setForm({
      station_id: item.station_id,
      trailer_name: item.trailer_name,
      trailer_type: item.trailer_type ?? "",
      in_service: item.in_service,
      notes: item.notes ?? ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      await updateRecord("trailers", editingId, form);
    } else {
      await createRecord("trailers", form);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this trailer?")) {
      return;
    }
    await deleteRecord("trailers", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Trailers"
        description="Track deployable trailers and export their equipment assignments through the same staging workflow."
      />

      <div className="page-grid">
        <Card title="Trailer List" subtitle="Select a trailer to edit it.">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search trailers by name, type, or station"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No trailers found"
              body="Add HazMat, Trench, Confined Space, or other trailer records here."
            />
          ) : (
            <Table
              headers={["Trailer", "Type", "Station", "In Service"]}
              rows={filtered.map((item) => {
                const station = data.stations.find(
                  (entry) => entry.id === item.station_id
                );
                return (
                  <tr key={item.id} onClick={() => loadItem(item.id)}>
                    <td>{item.trailer_name}</td>
                    <td>{item.trailer_type || "-"}</td>
                    <td>{station?.station_number ?? "-"}</td>
                    <td>{item.in_service ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            />
          )}
        </Card>

        <Card title={editingId ? "Edit Trailer" : "Add Trailer"}>
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
            <Field label="Trailer Name">
              <input
                value={form.trailer_name}
                onChange={(event) =>
                  setForm({ ...form, trailer_name: event.target.value })
                }
              />
            </Field>
            <Field label="Trailer Type">
              <input
                value={form.trailer_type}
                onChange={(event) =>
                  setForm({ ...form, trailer_type: event.target.value })
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
            <Toggle
              checked={form.in_service}
              onChange={(in_service) => setForm({ ...form, in_service })}
              label="In service"
            />

            <div className="button-row">
              <Button type="submit">
                {editingId ? "Save Trailer" : "Create Trailer"}
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
