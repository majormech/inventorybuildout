import type {
  AiSuggestionRequest,
  AiSuggestionResponse,
  BootstrapPayload,
  ExportFilters,
  ExportOptions,
  ExportPreviewResponse,
  ImportPreviewResponse
} from "../../shared/types";

export type ResourceName =
  | "stations"
  | "apparatus"
  | "storage_areas"
  | "trailers"
  | "compartments"
  | "equipment_items"
  | "equipment_templates";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "content-type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

export function getBootstrap(): Promise<BootstrapPayload> {
  return request<BootstrapPayload>("/api/bootstrap");
}

export function createResource<T>(
  resource: ResourceName,
  payload: Record<string, unknown>
): Promise<T> {
  return request<T>(`/api/${resource}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateResource<T>(
  resource: ResourceName,
  id: string,
  payload: Record<string, unknown>
): Promise<T> {
  return request<T>(`/api/${resource}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteResource(resource: ResourceName, id: string): Promise<void> {
  return request<void>(`/api/${resource}/${id}`, {
    method: "DELETE"
  });
}

export function exportFirstDue(
  filters: ExportFilters,
  options: ExportOptions
): Promise<ExportPreviewResponse> {
  return request<ExportPreviewResponse>("/api/export/first-due", {
    method: "POST",
    body: JSON.stringify({ filters, options })
  });
}

export function previewImport(text: string): Promise<ImportPreviewResponse> {
  return request<ImportPreviewResponse>("/api/import/preview", {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

export function requestAiSuggestions(
  payload: AiSuggestionRequest
): Promise<AiSuggestionResponse> {
  return request<AiSuggestionResponse>("/api/ai/suggest", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
