import { useState } from "react";
import type { FormEvent } from "react";
import { Button, Card, EmptyState, Field, PageHeader, SearchBar, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_STATION = {
  station_number: "",
  station_name: "",
  address: "",
  notes: ""
};

export function StationsPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_STATION);

  if (!data) {
    return null;
  }

  const filteredStations = data.stations.filter((station) =>
    `${station.station_number} ${station.station_name} ${station.address ?? ""} ${
      station.notes ?? ""
    }`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function loadStation(stationId: string) {
    const station = data.stations.find((entry) => entry.id === stationId);
    if (!station) {
      return;
    }
    setEditingId(station.id);
    setForm({
      station_number: station.station_number,
      station_name: station.station_name,
      address: station.address ?? "",
      notes: station.notes ?? ""
    });
  }

  function reset() {
    setEditingId(null);
    setForm(EMPTY_STATION);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      await updateRecord("stations", editingId, form);
    } else {
      await createRecord("stations", form);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this station? Related records may lose context.")) {
      return;
    }
    await deleteRecord("stations", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Stations"
        description="Add or clean up fire stations before apparatus, storage, trailer, and equipment assignments."
      />

      <div className="page-grid">
        <Card title="Station List" subtitle="Tap a row to edit it.">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search stations by number, name, address, or notes"
          />
          {filteredStations.length === 0 ? (
            <EmptyState
              title="No stations found"
              body="Try a different search or add a new station."
            />
          ) : (
            <Table
              headers={[
                "Station",
                "Name",
                "Apparatus",
                "Storage Areas",
                "Trailers"
              ]}
              rows={filteredStations.map((station) => {
                const apparatusCount = data.apparatus.filter(
                  (item) => item.station_id === station.id
                ).length;
                const storageCount = data.storage_areas.filter(
                  (item) => item.station_id === station.id
                ).length;
                const trailerCount = data.trailers.filter(
                  (item) => item.station_id === station.id
                ).length;

                return (
                  <tr key={station.id} onClick={() => loadStation(station.id)}>
                    <td>{station.station_number}</td>
                    <td>{station.station_name}</td>
                    <td>{apparatusCount}</td>
                    <td>{storageCount}</td>
                    <td>{trailerCount}</td>
                  </tr>
                );
              })}
            />
          )}
        </Card>

        <Card
          title={editingId ? "Edit Station" : "Add Station"}
          subtitle="Addresses are optional. Notes are staged and validated before export."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="Station Number">
              <input
                value={form.station_number}
                onChange={(event) =>
                  setForm({ ...form, station_number: event.target.value })
                }
              />
            </Field>
            <Field label="Station Name">
              <input
                value={form.station_name}
                onChange={(event) =>
                  setForm({ ...form, station_name: event.target.value })
                }
              />
            </Field>
            <Field label="Address">
              <input
                value={form.address}
                onChange={(event) =>
                  setForm({ ...form, address: event.target.value })
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
                {editingId ? "Save Station" : "Create Station"}
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
