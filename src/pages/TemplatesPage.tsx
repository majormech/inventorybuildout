import { useState } from "react";
import type { FormEvent } from "react";
import { USE_CHOICES } from "../../shared/constants";
import { Button, Card, EmptyState, Field, PageHeader, SearchBar, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

const EMPTY_TEMPLATE = {
  template_name: "",
  group_name: "",
  equipment_type: "",
  make: "",
  model: "",
  default_use_choice: "Other",
  default_description: "",
  default_notes: "",
  default_ownership: "Department",
  default_electronic_type: ""
};

export function TemplatesPage() {
  const { data, createRecord, updateRecord, deleteRecord } = useAppData();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_TEMPLATE);

  if (!data) {
    return null;
  }

  const filtered = data.equipment_templates.filter((item) =>
    `${item.template_name} ${item.group_name ?? ""} ${item.equipment_type ?? ""} ${
      item.make ?? ""
    } ${item.model ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function reset() {
    setEditingId(null);
    setForm(EMPTY_TEMPLATE);
  }

  function loadItem(itemId: string) {
    const item = data.equipment_templates.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    setEditingId(item.id);
    setForm({
      template_name: item.template_name,
      group_name: item.group_name ?? "",
      equipment_type: item.equipment_type ?? "",
      make: item.make ?? "",
      model: item.model ?? "",
      default_use_choice: item.default_use_choice ?? "Other",
      default_description: item.default_description ?? "",
      default_notes: item.default_notes ?? "",
      default_ownership: item.default_ownership ?? "",
      default_electronic_type: item.default_electronic_type ?? ""
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId) {
      await updateRecord("equipment_templates", editingId, form);
    } else {
      await createRecord("equipment_templates", form);
    }
    reset();
  }

  async function handleDelete() {
    if (!editingId) {
      return;
    }
    if (!window.confirm("Delete this equipment template?")) {
      return;
    }
    await deleteRecord("equipment_templates", editingId);
    reset();
  }

  return (
    <div className="page">
      <PageHeader
        title="Equipment Templates"
        description="Use templates to speed up consistent entry for common DFD equipment models."
      />

      <div className="page-grid">
        <Card title="Template List" subtitle="Seeded starter templates are editable.">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search templates by name, group, type, make, or model"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No templates found"
              body="Create a template for common equipment like LIFEPAK batteries or gas monitors."
            />
          ) : (
            <Table
              headers={["Template", "Group", "Type", "Make", "Model", "Use"]}
              rows={filtered.map((item) => (
                <tr key={item.id} onClick={() => loadItem(item.id)}>
                  <td>{item.template_name}</td>
                  <td>{item.group_name || "-"}</td>
                  <td>{item.equipment_type || "-"}</td>
                  <td>{item.make || "-"}</td>
                  <td>{item.model || "-"}</td>
                  <td>{item.default_use_choice || "-"}</td>
                </tr>
              ))}
            />
          )}
        </Card>

        <Card
          title={editingId ? "Edit Template" : "Add Template"}
          subtitle="These defaults can be applied directly from the equipment page."
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <Field label="Template Name">
              <input
                value={form.template_name}
                onChange={(event) =>
                  setForm({ ...form, template_name: event.target.value })
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
            <Field label="Default Use">
              <select
                value={form.default_use_choice}
                onChange={(event) =>
                  setForm({ ...form, default_use_choice: event.target.value })
                }
              >
                {USE_CHOICES.map((choice) => (
                  <option key={choice} value={choice}>
                    {choice}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default Description">
              <textarea
                rows={4}
                value={form.default_description}
                onChange={(event) =>
                  setForm({ ...form, default_description: event.target.value })
                }
              />
            </Field>
            <Field label="Default Notes">
              <textarea
                rows={4}
                value={form.default_notes}
                onChange={(event) =>
                  setForm({ ...form, default_notes: event.target.value })
                }
              />
            </Field>
            <Field label="Default Ownership">
              <input
                value={form.default_ownership}
                onChange={(event) =>
                  setForm({ ...form, default_ownership: event.target.value })
                }
              />
            </Field>
            <Field label="Default Electronic Type">
              <input
                value={form.default_electronic_type}
                onChange={(event) =>
                  setForm({
                    ...form,
                    default_electronic_type: event.target.value
                  })
                }
              />
            </Field>

            <div className="button-row">
              <Button type="submit">
                {editingId ? "Save Template" : "Create Template"}
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
