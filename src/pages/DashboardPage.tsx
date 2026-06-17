import { Card, IssueList, PageHeader, StatCard, Table } from "../components/ui";
import { useAppData } from "../context/AppDataContext";

export function DashboardPage() {
  const { data } = useAppData();

  if (!data) {
    return null;
  }

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        description="Track staging progress across stations, apparatus, storage areas, trailers, and export readiness."
      />

      <div className="stat-grid">
        <StatCard label="Stations" value={data.dashboard.total_stations} />
        <StatCard label="Apparatus" value={data.dashboard.total_apparatus} />
        <StatCard
          label="Storage Areas"
          value={data.dashboard.total_storage_areas}
        />
        <StatCard label="Trailers" value={data.dashboard.total_trailers} />
        <StatCard label="Equipment" value={data.dashboard.total_equipment} />
        <StatCard
          label="Export Ready"
          value={data.dashboard.export_ready_rows}
          tone={data.dashboard.export_error_count === 0 ? "good" : "warning"}
        />
      </div>

      <div className="two-column">
        <IssueList
          title="Validation Snapshot"
          issues={data.dashboard.top_issues}
        />

        <Card title="Readiness Summary">
          <ul className="summary-list">
            <li>
              <strong>{data.dashboard.export_error_count}</strong> errors still
              block export.
            </li>
            <li>
              <strong>{data.dashboard.export_warning_count}</strong> warnings
              need review before import.
            </li>
            <li>
              Use the export page to generate the First Due CSV and see row-by-row
              details.
            </li>
          </ul>
        </Card>
      </div>

      <Card
        title="Recently Added Equipment"
        subtitle="Most recent items captured in the staging database."
      >
        <Table
          headers={[
            "Name",
            "Equipment ID",
            "Serial Number",
            "Use",
            "In Service"
          ]}
          rows={data.dashboard.recent_equipment.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.equipment_id}</td>
              <td>{item.serial_number || "-"}</td>
              <td>{item.use_choice || "-"}</td>
              <td>{item.in_service ? "Yes" : "No"}</td>
            </tr>
          ))}
        />
      </Card>
    </div>
  );
}
