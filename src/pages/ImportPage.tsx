import { useState } from "react";
import type { ChangeEvent } from "react";
import { Button, Card, EmptyState, PageHeader, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export function ImportPage() {
  const { importPreview } = useAppData();
  const [csvText, setCsvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof importPreview>> | null>(null);

  async function handlePreview() {
    setLoading(true);
    try {
      const response = await importPreview(csvText);
      setResult(response);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to preview the CSV."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setCsvText(await file.text());
  }

  return (
    <div className="page">
      <PageHeader
        title="Import Existing CSV"
        description="Paste or upload a First Due style CSV, preview the cleaned rows, and review validation messages before any future save workflow."
      />

      <Card title="CSV Input" subtitle="This MVP reviews and cleans rows without saving imported data yet.">
        <div className="button-row">
          <label className="button secondary file-button">
            Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={(event) => void handleFileChange(event)} />
          </label>
          <Button onClick={() => void handlePreview()} disabled={loading || !csvText.trim()}>
            {loading ? "Parsing..." : "Preview Import Cleanup"}
          </Button>
        </div>
        <textarea
          className="large-textarea"
          rows={12}
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          placeholder="Paste First Due CSV content here"
        />
      </Card>

      {error ? (
        <Card title="Import Error">
          <p>{error}</p>
        </Card>
      ) : null}

      {result ? (
        <Card
          title="Import Preview"
          subtitle="Rows are cleaned with DFD rules applied, but nothing is silently discarded."
        >
          {result.rows.length === 0 ? (
            <EmptyState
              title="No rows found"
              body="The uploaded CSV did not include any non-blank records."
            />
          ) : (
            <Table
              headers={[
                "Row",
                "Name",
                "Equipment ID",
                "Use",
                "Errors",
                "Warnings"
              ]}
              rows={result.rows.slice(0, 50).map((row) => (
                <tr key={row.row_number}>
                  <td>{row.row_number}</td>
                  <td>{row.cleaned.NAME || "-"}</td>
                  <td>{row.cleaned["EQUIPMENT ID"] || "-"}</td>
                  <td>{row.cleaned.USE || "-"}</td>
                  <td>{row.errors.length}</td>
                  <td>{row.warnings.length}</td>
                </tr>
              ))}
            />
          )}
        </Card>
      ) : null}
    </div>
  );
}
