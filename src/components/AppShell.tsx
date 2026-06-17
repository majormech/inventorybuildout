import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { DashboardSummary } from "../../shared/types";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard" },
  { to: "/stations", label: "Stations" },
  { to: "/apparatus", label: "Apparatus" },
  { to: "/storage", label: "Storage" },
  { to: "/trailers", label: "Trailers" },
  { to: "/compartments", label: "Compartments" },
  { to: "/equipment", label: "Equipment" },
  { to: "/templates", label: "Templates" },
  { to: "/export", label: "Export" },
  { to: "/import", label: "Import" },
  { to: "/assistant", label: "AI Assistant" }
];

export function AppShell({
  dashboard,
  children
}: {
  dashboard?: DashboardSummary;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-kicker">Decatur Fire Department</span>
          <strong>Inventory Staging</strong>
          <p>First Due import prep with DFD guardrails built in.</p>
        </div>

        <div className="status-card">
          <span>Export readiness</span>
          <strong>{dashboard?.export_ready_rows ?? 0} rows ready</strong>
          <p>
            {dashboard?.export_error_count ?? 0} errors and{" "}
            {dashboard?.export_warning_count ?? 0} warnings detected.
          </p>
        </div>

        <nav className="nav-list">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
