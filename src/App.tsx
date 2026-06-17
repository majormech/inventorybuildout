import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Button, Card } from "./components/ui";
import { useAppData } from "./context/AppDataContext";
import { ApparatusPage } from "./pages/ApparatusPage";
import { AssistantPage } from "./pages/AssistantPage";
import { CompartmentsPage } from "./pages/CompartmentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EquipmentPage } from "./pages/EquipmentPage";
import { ExportPage } from "./pages/ExportPage";
import { ImportPage } from "./pages/ImportPage";
import { StationsPage } from "./pages/StationsPage";
import { StorageAreasPage } from "./pages/StorageAreasPage";
import { TemplatesPage } from "./pages/TemplatesPage";
import { TrailersPage } from "./pages/TrailersPage";

export default function App() {
  const { data, is_loading, error, refresh } = useAppData();

  if (is_loading && !data) {
    return (
      <div className="loading-screen">
        <Card title="Loading inventory workspace">
          <p className="muted">
            Pulling stations, apparatus, compartments, equipment, and export
            status from the staging API.
          </p>
        </Card>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="loading-screen">
        <Card title="Unable to load the app">
          <p>{error}</p>
          <Button onClick={() => void refresh()}>Try again</Button>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <AppShell dashboard={data.dashboard}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/stations" element={<StationsPage />} />
        <Route path="/apparatus" element={<ApparatusPage />} />
        <Route path="/storage" element={<StorageAreasPage />} />
        <Route path="/trailers" element={<TrailersPage />} />
        <Route path="/compartments" element={<CompartmentsPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
