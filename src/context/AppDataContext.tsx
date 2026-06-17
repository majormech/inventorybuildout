import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  createResource,
  deleteResource,
  exportFirstDue,
  getBootstrap,
  previewImport,
  requestAiSuggestions,
  updateResource
} from "../lib/api";
import type {
  AiSuggestionRequest,
  AiSuggestionResponse,
  BootstrapPayload,
  ExportFilters,
  ExportOptions,
  ExportPreviewResponse,
  ImportPreviewResponse
} from "../../shared/types";
import type { ResourceName } from "../lib/api";

interface AppDataContextValue {
  data: BootstrapPayload | null;
  is_loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRecord: (
    resource: ResourceName,
    payload: Record<string, unknown>
  ) => Promise<void>;
  updateRecord: (
    resource: ResourceName,
    id: string,
    payload: Record<string, unknown>
  ) => Promise<void>;
  deleteRecord: (resource: ResourceName, id: string) => Promise<void>;
  exportPreview: (
    filters: ExportFilters,
    options: ExportOptions
  ) => Promise<ExportPreviewResponse>;
  importPreview: (text: string) => Promise<ImportPreviewResponse>;
  aiSuggest: (payload: AiSuggestionRequest) => Promise<AiSuggestionResponse>;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [is_loading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setIsLoading(true);
    try {
      const payload = await getBootstrap();
      setData(payload);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load the app data."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createRecord(
    resource: ResourceName,
    payload: Record<string, unknown>
  ) {
    await createResource(resource, payload);
    await refresh();
  }

  async function updateExistingRecord(
    resource: ResourceName,
    id: string,
    payload: Record<string, unknown>
  ) {
    await updateResource(resource, id, payload);
    await refresh();
  }

  async function removeRecord(resource: ResourceName, id: string) {
    await deleteResource(resource, id);
    await refresh();
  }

  const value: AppDataContextValue = {
    data,
    is_loading,
    error,
    refresh,
    createRecord,
    updateRecord: updateExistingRecord,
    deleteRecord: removeRecord,
    exportPreview: exportFirstDue,
    importPreview: previewImport,
    aiSuggest: requestAiSuggestions
  };

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider.");
  }
  return context;
}
