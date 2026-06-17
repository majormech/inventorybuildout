import { useState } from "react";
import type { FormEvent } from "react";
import { COMPARTMENT_PARENT_TYPES } from "../../shared/constants";
import { Button, Card, EmptyState, Field, PageHeader, SearchBar, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_COMPARTMENT = {
  parent_type: "apparatus",
  parent_id: "",
  compartment_name: "",
  sort_order: 0,
  notes: ""
};

export function CompartmentsPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_COMPARTMENT);

  if (!data) {
    return null;
  }

  const parentOptions =
    form.parent_type === "apparatus"
      ? data.apparatus.map((item) => ({
          value: item.id,
          label: item.apparatus_name
        }))
      : form.parent_type === "trailer"
        ? data.trailers.map((item) => ({
            value: item.id,
            label: item.trailer_name
          }))
        : data.storage_areas.map((item) => ({
            value: item.id,
            label: item.storage_name
          }));

  const filtered = data.compartments.filter((item) => {
    const parentLabel =
      item.parent_type === "apparatus"
        ? data.apparatus.find((entry) => entry.id === item.parent_id)?.apparatus_name
        : item.parent_type === "trailer"
          ? data.trailers.find((entry) => entry.id === item.parent_id)?.trailer_name
          : data.storage_areas.find((entry) => entry.id === item.parent_id)?.storage_name;

    return `${item.compartment_name} ${item.parent_type} ${parentLabel ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  function reset() {
    setEditingId(null);
    setForm(EMPTY_COMPARTMENT);
  }

  function loadItem(itemId: string) {
    const item = data.compartments.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setEditingId(item.id);
    setForm({
      parent_type: item.parent_type,
      parent_id: item.parent_id,
      compartment_name: item.compartment_name,
      sort_order: item.sort_order,
      notes: item.notes ?? ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      await updateRecord("compartments", editingId, form);
    } else {
      await createRecord("compartments", form);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this compartment?")) {
      return;
    }
    await deleteRecord("compartments", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Compartments"
        description="Phase 1 CRUD for apparatus, trailer, and storage compartments. Layout cloning and drag sorting can land next."
      />

      <div className="page-grid">
        <Card
          title="Compartment List"
          subtitle="Compartment builder enhancements come next, but these records are ready for assignment now."
        >
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search compartments by name or parent"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No compartments found"
              body="Add compartments like Cab, EMS Cabinet, or Driver Side 1."
            />
          ) : (
            <Table
              headers={["Name", "Parent Type", "Parent", "Order", "Equipment"]}
              rows={filtered.map((item) => {
                const parentLabel =
                  item.parent_type === "apparatus"
                    ? data.apparatus.find((entry) => entry.id === item.parent_id)
                        ?.apparatus_name
                    : item.parent_type === "trailer"
                      ? data.trailers.find((entry) => entry.id === item.parent_id)
                          ?.trailer_name
                      : data.storage_areas.find((entry) => entry.id === item.parent_id)
                          ?.storage_name;
                const equipmentCount = data.equipment_items.filter(
                  (equipment) => equipment.compartment_id === item.id
                ).length;

                return (
                  <tr key={item.id} onClick={() => loadItem(item.id)}>
                    <td>{item.compartment_name}</td>
                    <td>{item.parent_type}</td>
                    <td>{parentLabel ?? "-"}</td>
                    <td>{item.sort_order}</td>
                    <td>{equipmentCount}</td>
                  </tr>
                );
              })}
            />
          )}
        </Card>

        <Card title={editingId ? "Edit Compartment" : "Add Compartment"}>
          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="Parent Type">
              <select
                value={form.parent_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    parent_type: event.target.value,
                    parent_id: ""
                  })
                }
              >
                {COMPARTMENT_PARENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Parent">
              <select
                value={form.parent_id}
                onChange={(event) =>
                  setForm({ ...form, parent_id: event.target.value })
                }
              >
                <option value="">Select a parent</option>
                {parentOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Compartment Name">
              <input
                value={form.compartment_name}
                onChange={(event) =>
                  setForm({ ...form, compartment_name: event.target.value })
                }
              />
            </Field>
            <Field label="Sort Order">
              <input
                type="number"
                value={form.sort_order}
                onChange={(event) =>
                  setForm({
                    ...form,
                    sort_order: Number.parseInt(event.target.value, 10) || 0
                  })
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
                {editingId ? "Save Compartment" : "Create Compartment"}
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
