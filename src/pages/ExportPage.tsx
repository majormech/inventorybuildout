import { useState } from "react";
import { Button, Card, Field, IssueList, PageHeader, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export function ExportPage() {
  const { data, exportPreview } = useAppData();
  const [filters, setFilters] = useState({
    station_id: "",
    apparatus_id: "",
    storage_area_id: "",
    trailer_id: "",
    group_name: "",
    equipment_type: ""
  });
  const [truncateOverLimit, setTruncateOverLimit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof exportPreview>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!data) {
    return null;
  }

  async function handlePreview() {
    setLoading(true);
    try {
      const response = await exportPreview(filters, {
        truncate_over_limit: truncateOverLimit,
        include_bom: true
      });
      setResult(response);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to build the First Due export."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!result) {
      return;
    }
    const blob = new Blob([result.csv], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dfd-first-due-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <PageHeader
        title="Export First Due CSV"
        description="Build a filtered export, validate every row, and download UTF-8 CSV with BOM for Excel-friendly review."
        action={
          <Button onClick={() => void handlePreview()} disabled={loading}>
            {loading ? "Building export..." : "Build Export Preview"}
          </Button>
        }
      />

      <Card title="Export Filters" subtitle="Only valid rows will be included in the generated CSV.">
        <div className="filter-grid">
          <Field label="Station">
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
          <Field label="Apparatus">
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
          <Field label="Storage Area">
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
          <Field label="Trailer">
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
          <Field label="Group Name">
            <input
              value={filters.group_name}
              onChange={(event) =>
                setFilters({ ...filters, group_name: event.target.value })
              }
            />
          </Field>
          <Field label="Equipment Type">
            <input
              value={filters.equipment_type}
              onChange={(event) =>
                setFilters({ ...filters, equipment_type: event.target.value })
              }
            />
          </Field>
        </div>
        <div className="toggle-grid">
          <label className="toggle">
            <input
              type="checkbox"
              checked={truncateOverLimit}
              onChange={(event) => setTruncateOverLimit(event.target.checked)}
            />
            <span>Truncate overly long fields instead of blocking export</span>
          </label>
        </div>
      </Card>

      {error ? (
        <Card title="Export Error">
          <p>{error}</p>
        </Card>
      ) : null}

      {result ? (
        <>
          <div className="stat-grid">
            <Card title="Rows">
              <p className="big-number">{result.summary.total_rows}</p>
              <p className="muted">Total candidate equipment rows.</p>
            </Card>
            <Card title="Valid">
              <p className="big-number">{result.summary.valid_rows}</p>
              <p className="muted">Rows that will export.</p>
            </Card>
            <Card title="Skipped">
              <p className="big-number">{result.summary.rows_skipped}</p>
              <p className="muted">Rows blocked by validation or blank data.</p>
            </Card>
            <Card title="Fields Truncated">
              <p className="big-number">{result.summary.fields_truncated}</p>
              <p className="muted">Only when truncation is enabled.</p>
            </Card>
          </div>

          <div className="button-row">
            <Button onClick={handleDownload} disabled={result.rows.length === 0}>
              Download CSV
            </Button>
          </div>

          <div className="two-column">
            <IssueList title="Export Errors" issues={result.summary.errors} />
            <IssueList title="Export Warnings" issues={result.summary.warnings} />
          </div>

          <Card title="CSV Preview" subtitle="First 25 rows of the validated export.">
            <Table
              headers={["NAME", "EQUIPMENT ID", "Apparatus Name", "Station Number", "USE"]}
              rows={result.rows.slice(0, 25).map((row, index) => (
                <tr key={`${row["EQUIPMENT ID"]}-${index}`}>
                  <td>{row.NAME}</td>
                  <td>{row["EQUIPMENT ID"]}</td>
                  <td>{row["Apparatus Name"] || "-"}</td>
                  <td>{row["Station Number"] || "-"}</td>
                  <td>{row.USE}</td>
                </tr>
              ))}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
