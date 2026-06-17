import { buildFirstDueExport } from "../shared/export";
import { FIRST_DUE_COLUMNS } from "../shared/firstdueColumns";
import { parseCsv } from "../shared/csv";
import {
  cleanWhitespace,
  coerceUseChoice,
  formatDateMMDDYYYY,
  normalizeApparatusName,
  validateExportRow
} from "../shared/validation";
import type {
  AiSuggestionRequest,
  Apparatus,
  BootstrapPayload,
  Compartment,
  DashboardSummary,
  EquipmentExportRecord,
  EquipmentItem,
  EquipmentTemplate,
  ExportFilters,
  ExportOptions,
  ImportPreviewResponse,
  Station,
  StorageArea,
  Trailer
} from "../shared/types";
import { MockAiProvider } from "./lib/mockAiProvider";

interface Env {
  APP_NAME?: string;
  AI_PROVIDER?: string;
  DB: D1Database;
}

type ResourceName =
  | "stations"
  | "apparatus"
  | "storage_areas"
  | "trailers"
  | "compartments"
  | "equipment_items"
  | "equipment_templates";

interface ResourceConfig {
  table: ResourceName;
  booleanFields: string[];
  orderBy: string;
}

const RESOURCE_CONFIG: Record<ResourceName, ResourceConfig> = {
  stations: {
    table: "stations",
    booleanFields: [],
    orderBy: "station_number ASC"
  },
  apparatus: {
    table: "apparatus",
    booleanFields: ["in_service"],
    orderBy: "apparatus_name ASC"
  },
  storage_areas: {
    table: "storage_areas",
    booleanFields: [],
    orderBy: "storage_name ASC"
  },
  trailers: {
    table: "trailers",
    booleanFields: ["in_service"],
    orderBy: "trailer_name ASC"
  },
  compartments: {
    table: "compartments",
    booleanFields: [],
    orderBy: "parent_type ASC, sort_order ASC, compartment_name ASC"
  },
  equipment_items: {
    table: "equipment_items",
    booleanFields: ["in_service", "is_primary"],
    orderBy: "name ASC"
  },
  equipment_templates: {
    table: "equipment_templates",
    booleanFields: [],
    orderBy: "template_name ASC"
  }
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function badRequest(message: string, details?: unknown): Response {
  return json({ error: message, details }, 400);
}

function notFound(message = "Not found"): Response {
  return json({ error: message }, 404);
}

function cleanOptional(value: unknown): string | null {
  const cleaned = cleanWhitespace(value);
  return cleaned ? cleaned : null;
}

function cleanRequired(value: unknown, field: string): string {
  const cleaned = cleanWhitespace(value);
  if (!cleaned) {
    throw new Error(`${field} is required.`);
  }
  return cleaned;
}

function coerceBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const cleaned = cleanWhitespace(value).toLowerCase();
  if (!cleaned) {
    return fallback;
  }
  return ["1", "true", "yes", "y", "on"].includes(cleaned);
}

function coerceInteger(value: unknown, fallback = 0): number {
  const parsed = Number.parseInt(cleanWhitespace(value), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function assertFieldLengths(record: Record<string, unknown>): void {
  for (const [field, value] of Object.entries(record)) {
    if (typeof value !== "string" || !value) {
      continue;
    }

    const limit = field.toLowerCase().includes("notes") ? 250 : 255;
    if (cleanWhitespace(value).length > limit) {
      throw new Error(
        `${field} is too long. ${field} must be ${limit} characters or fewer before save.`
      );
    }
  }
}

function normalizeStoredDate(value: unknown): string | null {
  const cleaned = cleanWhitespace(value);
  if (!cleaned) {
    return null;
  }

  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return cleaned;
  }

  const slashMatch = formatDateMMDDYYYY(cleaned).match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );
  if (!slashMatch) {
    throw new Error(
      "Service test dates must be a valid date that can export as MM/DD/YYYY."
    );
  }

  return `${slashMatch[3]}-${slashMatch[1]}-${slashMatch[2]}`;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

async function queryAll<T>(
  db: D1Database,
  sql: string,
  bindings: unknown[] = []
): Promise<T[]> {
  const result = await db.prepare(sql).bind(...bindings).all<T>();
  return (result.results ?? []) as T[];
}

async function queryFirst<T>(
  db: D1Database,
  sql: string,
  bindings: unknown[] = []
): Promise<T | null> {
  const row = await db.prepare(sql).bind(...bindings).first<T>();
  return row ?? null;
}

async function execute(
  db: D1Database,
  sql: string,
  bindings: unknown[] = []
): Promise<D1Result> {
  return db.prepare(sql).bind(...bindings).run();
}

function withBooleans<T extends Record<string, unknown>>(
  row: T,
  booleanFields: string[]
): T {
  const next = { ...row };
  for (const field of booleanFields) {
    if (field in next) {
      next[field] = Boolean(Number(next[field]));
    }
  }
  return next;
}

async function insertAuditLog(
  db: D1Database,
  entityType: string,
  entityId: string,
  action: string,
  beforeJson: unknown,
  afterJson: unknown
): Promise<void> {
  await execute(
    db,
    `
      INSERT INTO audit_log (
        id,
        entity_type,
        entity_id,
        action,
        before_json,
        after_json
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      crypto.randomUUID(),
      entityType,
      entityId,
      action,
      beforeJson ? JSON.stringify(beforeJson) : null,
      afterJson ? JSON.stringify(afterJson) : null
    ]
  );
}

async function listResource<T extends Record<string, unknown>>(
  db: D1Database,
  resource: ResourceName
): Promise<T[]> {
  const config = RESOURCE_CONFIG[resource];
  const rows = await queryAll<T>(
    db,
    `SELECT * FROM ${config.table} ORDER BY ${config.orderBy}`
  );
  return rows.map((row) => withBooleans(row, config.booleanFields));
}

async function findById<T extends Record<string, unknown>>(
  db: D1Database,
  resource: ResourceName,
  id: string
): Promise<T | null> {
  const config = RESOURCE_CONFIG[resource];
  const row = await queryFirst<T>(
    db,
    `SELECT * FROM ${config.table} WHERE id = ?`,
    [id]
  );
  return row ? withBooleans(row, config.booleanFields) : null;
}

async function resolveEquipmentAssignment(
  db: D1Database,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const next = { ...payload };

  if (cleanWhitespace(next.compartment_id)) {
    const compartment = await queryFirst<Compartment>(
      db,
      "SELECT * FROM compartments WHERE id = ?",
      [next.compartment_id]
    );
    if (!compartment) {
      throw new Error("Selected compartment was not found.");
    }

    next.parent_type = compartment.parent_type;

    if (compartment.parent_type === "apparatus") {
      next.apparatus_id = compartment.parent_id;
      next.trailer_id = null;
      next.storage_area_id = null;
    }

    if (compartment.parent_type === "trailer") {
      next.trailer_id = compartment.parent_id;
      next.apparatus_id = null;
      next.storage_area_id = null;
    }

    if (compartment.parent_type === "storage_area") {
      next.storage_area_id = compartment.parent_id;
      next.apparatus_id = null;
      next.trailer_id = null;
    }
  }

  if (cleanWhitespace(next.apparatus_id)) {
    const apparatus = await queryFirst<Apparatus>(
      db,
      "SELECT * FROM apparatus WHERE id = ?",
      [next.apparatus_id]
    );
    if (!apparatus) {
      throw new Error("Selected apparatus was not found.");
    }
    next.station_id = apparatus.station_id;
    next.assigned_unit = cleanWhitespace(next.assigned_unit) || apparatus.apparatus_name;
    next.storage_area_id = null;
  }

  if (cleanWhitespace(next.trailer_id)) {
    const trailer = await queryFirst<Trailer>(
      db,
      "SELECT * FROM trailers WHERE id = ?",
      [next.trailer_id]
    );
    if (!trailer) {
      throw new Error("Selected trailer was not found.");
    }
    next.station_id = trailer.station_id;
    next.assigned_unit = cleanWhitespace(next.assigned_unit) || trailer.trailer_name;
    next.apparatus_id = null;
  }

  if (cleanWhitespace(next.storage_area_id)) {
    const storageArea = await queryFirst<StorageArea>(
      db,
      "SELECT * FROM storage_areas WHERE id = ?",
      [next.storage_area_id]
    );
    if (!storageArea) {
      throw new Error("Selected storage area was not found.");
    }
    next.station_id = storageArea.station_id;
    next.assigned_unit =
      cleanWhitespace(next.assigned_unit) || storageArea.storage_name;
    next.apparatus_id = null;
    next.trailer_id = null;
  }

  if (cleanWhitespace(next.parent_equipment_id)) {
    const parentItem = await queryFirst<EquipmentItem>(
      db,
      "SELECT * FROM equipment_items WHERE id = ?",
      [next.parent_equipment_id]
    );
    if (!parentItem) {
      throw new Error("Selected parent equipment item was not found.");
    }
    next.parent_equipment_name =
      cleanWhitespace(next.parent_equipment_name) || parentItem.name;
    next.parent_serial_number =
      cleanWhitespace(next.parent_serial_number) || parentItem.serial_number;
  }

  return next;
}

async function sanitizePayload(
  db: D1Database,
  resource: ResourceName,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  let record: Record<string, unknown>;

  switch (resource) {
    case "stations":
      record = {
        station_number: cleanRequired(payload.station_number, "Station Number"),
        station_name: cleanRequired(payload.station_name, "Station Name"),
        address: cleanOptional(payload.address),
        notes: cleanOptional(payload.notes)
      };
      break;
    case "apparatus":
      record = {
        station_id: cleanRequired(payload.station_id, "Station"),
        apparatus_name: normalizeApparatusName(
          cleanRequired(payload.apparatus_name, "Apparatus Name")
        ),
        apparatus_type: cleanRequired(payload.apparatus_type, "Apparatus Type"),
        in_service: coerceBoolean(payload.in_service, true),
        notes: cleanOptional(payload.notes)
      };
      break;
    case "storage_areas":
      record = {
        station_id: cleanRequired(payload.station_id, "Station"),
        storage_name: cleanRequired(payload.storage_name, "Storage Name"),
        description: cleanOptional(payload.description),
        notes: cleanOptional(payload.notes)
      };
      break;
    case "trailers":
      record = {
        station_id: cleanRequired(payload.station_id, "Station"),
        trailer_name: cleanRequired(payload.trailer_name, "Trailer Name"),
        trailer_type: cleanOptional(payload.trailer_type),
        in_service: coerceBoolean(payload.in_service, true),
        notes: cleanOptional(payload.notes)
      };
      break;
    case "compartments":
      record = {
        parent_type: cleanRequired(payload.parent_type, "Parent Type"),
        parent_id: cleanRequired(payload.parent_id, "Parent"),
        compartment_name: cleanRequired(
          payload.compartment_name,
          "Compartment Name"
        ),
        sort_order: coerceInteger(payload.sort_order, 0),
        notes: cleanOptional(payload.notes)
      };
      break;
    case "equipment_templates":
      record = {
        template_name: cleanRequired(payload.template_name, "Template Name"),
        group_name: cleanOptional(payload.group_name),
        equipment_type: cleanOptional(payload.equipment_type),
        make: cleanOptional(payload.make),
        model: cleanOptional(payload.model),
        default_use_choice: cleanOptional(
          coerceUseChoice(payload.default_use_choice, payload)
        ),
        default_description: cleanOptional(payload.default_description),
        default_notes: cleanOptional(payload.default_notes),
        default_ownership: cleanOptional(payload.default_ownership),
        default_electronic_type: cleanOptional(payload.default_electronic_type)
      };
      break;
    case "equipment_items": {
      const resolved = await resolveEquipmentAssignment(db, payload);
      record = {
        name: cleanRequired(resolved.name, "Name"),
        equipment_id: cleanRequired(resolved.equipment_id, "Equipment ID"),
        group_name: cleanOptional(resolved.group_name),
        equipment_type: cleanOptional(resolved.equipment_type),
        make: cleanOptional(resolved.make),
        model: cleanOptional(resolved.model),
        serial_number: cleanOptional(resolved.serial_number),
        description: cleanOptional(resolved.description),
        notes: cleanOptional(resolved.notes),
        use_choice: cleanOptional(coerceUseChoice(resolved.use_choice, resolved)),
        in_service: coerceBoolean(resolved.in_service, true),
        is_primary: coerceBoolean(resolved.is_primary, false),
        ownership: cleanOptional(resolved.ownership),
        station_id: cleanOptional(resolved.station_id),
        apparatus_id: cleanOptional(resolved.apparatus_id),
        trailer_id: cleanOptional(resolved.trailer_id),
        storage_area_id: cleanOptional(resolved.storage_area_id),
        compartment_id: cleanOptional(resolved.compartment_id),
        parent_equipment_id: cleanOptional(resolved.parent_equipment_id),
        parent_equipment_name: cleanOptional(resolved.parent_equipment_name),
        parent_serial_number: cleanOptional(resolved.parent_serial_number),
        assigned_unit: cleanOptional(resolved.assigned_unit),
        kit_reference_id: cleanOptional(resolved.kit_reference_id),
        last_service_test_date: normalizeStoredDate(
          resolved.last_service_test_date
        ),
        next_service_test_date: normalizeStoredDate(
          resolved.next_service_test_date
        ),
        battery_type: cleanOptional(resolved.battery_type),
        battery_voltage: cleanOptional(resolved.battery_voltage),
        amp_hours: cleanOptional(resolved.amp_hours),
        electronic_type: cleanOptional(resolved.electronic_type),
        electronic_product_code: cleanOptional(
          resolved.electronic_product_code
        ),
        firmware_version: cleanOptional(resolved.firmware_version),
        lot: cleanOptional(resolved.lot),
        raw_barcode_value: cleanOptional(resolved.raw_barcode_value)
      };
      break;
    }
    default:
      throw new Error("Unsupported resource.");
  }

  assertFieldLengths(record);
  return record;
}

function buildInsertStatement(
  table: string,
  record: Record<string, unknown>
): { sql: string; bindings: unknown[] } {
  const columns = Object.keys(record);
  const placeholders = columns.map(() => "?").join(", ");
  return {
    sql: `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`,
    bindings: columns.map((column) => record[column])
  };
}

function buildUpdateStatement(
  table: string,
  record: Record<string, unknown>
): { sql: string; bindings: unknown[] } {
  const columns = Object.keys(record);
  const assignments = columns.map((column) => `${column} = ?`).join(", ");
  return {
    sql: `UPDATE ${table} SET ${assignments} WHERE id = ?`,
    bindings: [...columns.map((column) => record[column])]
  };
}

async function createResource(
  db: D1Database,
  resource: ResourceName,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const config = RESOURCE_CONFIG[resource];
  const id = crypto.randomUUID();
  const record = {
    id,
    ...(await sanitizePayload(db, resource, payload)),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const insert = buildInsertStatement(config.table, record);
  await execute(db, insert.sql, insert.bindings);
  await insertAuditLog(db, resource, id, "create", null, record);

  const created = await findById<Record<string, unknown>>(db, resource, id);
  if (!created) {
    throw new Error("The record was created but could not be reloaded.");
  }

  return created;
}

async function updateResource(
  db: D1Database,
  resource: ResourceName,
  id: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const config = RESOURCE_CONFIG[resource];
  const before = await findById<Record<string, unknown>>(db, resource, id);
  if (!before) {
    throw new Error("Record not found.");
  }

  const record = {
    ...(await sanitizePayload(db, resource, payload)),
    updated_at: new Date().toISOString()
  };

  const update = buildUpdateStatement(config.table, record);
  await execute(db, update.sql, [...update.bindings, id]);
  const after = await findById<Record<string, unknown>>(db, resource, id);
  await insertAuditLog(db, resource, id, "update", before, after);

  if (!after) {
    throw new Error("The record was updated but could not be reloaded.");
  }

  return after;
}

async function deleteResource(
  db: D1Database,
  resource: ResourceName,
  id: string
): Promise<void> {
  const before = await findById<Record<string, unknown>>(db, resource, id);
  if (!before) {
    throw new Error("Record not found.");
  }
  await execute(db, `DELETE FROM ${RESOURCE_CONFIG[resource].table} WHERE id = ?`, [
    id
  ]);
  await insertAuditLog(db, resource, id, "delete", before, null);
}

async function getExportRecords(
  db: D1Database,
  filters: ExportFilters = {}
): Promise<EquipmentExportRecord[]> {
  const clauses: string[] = [];
  const bindings: unknown[] = [];

  if (filters.station_id) {
    clauses.push("equipment_items.station_id = ?");
    bindings.push(filters.station_id);
  }

  if (filters.apparatus_id) {
    clauses.push("equipment_items.apparatus_id = ?");
    bindings.push(filters.apparatus_id);
  }

  if (filters.storage_area_id) {
    clauses.push("equipment_items.storage_area_id = ?");
    bindings.push(filters.storage_area_id);
  }

  if (filters.trailer_id) {
    clauses.push("equipment_items.trailer_id = ?");
    bindings.push(filters.trailer_id);
  }

  if (filters.group_name) {
    clauses.push("equipment_items.group_name = ?");
    bindings.push(filters.group_name);
  }

  if (filters.equipment_type) {
    clauses.push("equipment_items.equipment_type = ?");
    bindings.push(filters.equipment_type);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await queryAll<EquipmentExportRecord>(
    db,
    `
      SELECT
        equipment_items.*,
        stations.station_number AS station_number,
        stations.station_name AS station_name,
        apparatus.apparatus_name AS apparatus_name,
        storage_areas.storage_name AS storage_name,
        trailers.trailer_name AS trailer_name,
        compartments.compartment_name AS compartment_name
      FROM equipment_items
      LEFT JOIN stations ON stations.id = equipment_items.station_id
      LEFT JOIN apparatus ON apparatus.id = equipment_items.apparatus_id
      LEFT JOIN storage_areas ON storage_areas.id = equipment_items.storage_area_id
      LEFT JOIN trailers ON trailers.id = equipment_items.trailer_id
      LEFT JOIN compartments ON compartments.id = equipment_items.compartment_id
      ${whereClause}
      ORDER BY equipment_items.name ASC
    `,
    bindings
  );

  return rows.map((row) => withBooleans(row, ["in_service", "is_primary"]));
}

async function buildDashboard(db: D1Database): Promise<DashboardSummary> {
  const [
    stations,
    apparatus,
    storageAreas,
    trailers,
    equipmentItems,
    recentEquipment,
    exportRecords
  ] = await Promise.all([
    queryAll<{ count: number }>(db, "SELECT COUNT(*) AS count FROM stations"),
    queryAll<{ count: number }>(db, "SELECT COUNT(*) AS count FROM apparatus"),
    queryAll<{ count: number }>(
      db,
      "SELECT COUNT(*) AS count FROM storage_areas"
    ),
    queryAll<{ count: number }>(db, "SELECT COUNT(*) AS count FROM trailers"),
    queryAll<{ count: number }>(
      db,
      "SELECT COUNT(*) AS count FROM equipment_items"
    ),
    queryAll<EquipmentItem>(
      db,
      "SELECT * FROM equipment_items ORDER BY datetime(created_at) DESC LIMIT 8"
    ),
    getExportRecords(db)
  ]);

  const exportPreview = buildFirstDueExport(exportRecords, {
    truncate_over_limit: false,
    include_bom: false
  });

  return {
    total_stations: stations[0]?.count ?? 0,
    total_apparatus: apparatus[0]?.count ?? 0,
    total_storage_areas: storageAreas[0]?.count ?? 0,
    total_trailers: trailers[0]?.count ?? 0,
    total_equipment: equipmentItems[0]?.count ?? 0,
    export_ready_rows: exportPreview.summary.valid_rows,
    export_error_count: exportPreview.summary.errors.length,
    export_warning_count: exportPreview.summary.warnings.length,
    recent_equipment: recentEquipment.map((item) =>
      withBooleans(item, ["in_service", "is_primary"])
    ),
    top_issues: [
      ...exportPreview.summary.errors,
      ...exportPreview.summary.warnings
    ].slice(0, 8)
  };
}

async function readBootstrap(db: D1Database): Promise<BootstrapPayload> {
  const [
    stations,
    apparatus,
    storageAreas,
    trailers,
    compartments,
    equipmentItems,
    equipmentTemplates,
    dashboard
  ] = await Promise.all([
    listResource<Station>(db, "stations"),
    listResource<Apparatus>(db, "apparatus"),
    listResource<StorageArea>(db, "storage_areas"),
    listResource<Trailer>(db, "trailers"),
    listResource<Compartment>(db, "compartments"),
    listResource<EquipmentItem>(db, "equipment_items"),
    listResource<EquipmentTemplate>(db, "equipment_templates"),
    buildDashboard(db)
  ]);

  return {
    stations,
    apparatus,
    storage_areas: storageAreas,
    trailers,
    compartments,
    equipment_items: equipmentItems,
    equipment_templates: equipmentTemplates,
    dashboard
  };
}

async function previewImport(text: string): Promise<ImportPreviewResponse> {
  const parsed = parseCsv(text.replace(/^\uFEFF/, ""));
  const rows = parsed.rows.map((row, index) => {
    const cleaned = Object.fromEntries(
      FIRST_DUE_COLUMNS.map((column) => [column, cleanWhitespace(row[column])])
    );
    const validation = validateExportRow(cleaned);
    return {
      row_number: index + 2,
      raw: row,
      cleaned: validation.value,
      errors: validation.errors,
      warnings: validation.warnings
    };
  });

  return {
    headers: parsed.headers,
    rows
  };
}

function routeResource(pathname: string): {
  resource: ResourceName;
  id?: string;
} | null {
  const parts = pathname.replace(/^\/api\//, "").split("/").filter(Boolean);
  const [resource, id] = parts;

  if (!resource) {
    return null;
  }

  if (
    resource !== "stations" &&
    resource !== "apparatus" &&
    resource !== "storage_areas" &&
    resource !== "trailers" &&
    resource !== "compartments" &&
    resource !== "equipment_items" &&
    resource !== "equipment_templates"
  ) {
    return null;
  }

  return { resource, id };
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === "/api/health") {
    return json({ ok: true, app: env.APP_NAME ?? "DFD Inventory Staging" });
  }

  if (url.pathname === "/api/bootstrap" && request.method === "GET") {
    return json(await readBootstrap(env.DB));
  }

  if (url.pathname === "/api/export/first-due" && request.method === "POST") {
    const payload = await readJson(request);
    const filters = (payload.filters ?? {}) as ExportFilters;
    const options = (payload.options ?? {}) as ExportOptions;
    const exportRecords = await getExportRecords(env.DB, filters);
    return json(buildFirstDueExport(exportRecords, options));
  }

  if (url.pathname === "/api/import/preview" && request.method === "POST") {
    const payload = await readJson(request);
    const text = cleanRequired(payload.text, "CSV text");
    return json(await previewImport(text));
  }

  if (url.pathname === "/api/ai/suggest" && request.method === "POST") {
    const payload = (await readJson(request)) as unknown as AiSuggestionRequest;
    const provider = new MockAiProvider();
    return json(await provider.suggest(payload));
  }

  const resourceMatch = routeResource(url.pathname);
  if (!resourceMatch) {
    return notFound("API route not found.");
  }

  if (request.method === "GET" && !resourceMatch.id) {
    return json(await listResource(env.DB, resourceMatch.resource));
  }

  if (request.method === "POST" && !resourceMatch.id) {
    return json(await createResource(env.DB, resourceMatch.resource, await readJson(request)), 201);
  }

  if (request.method === "PUT" && resourceMatch.id) {
    return json(
      await updateResource(
        env.DB,
        resourceMatch.resource,
        resourceMatch.id,
        await readJson(request)
      )
    );
  }

  if (request.method === "DELETE" && resourceMatch.id) {
    await deleteResource(env.DB, resourceMatch.resource, resourceMatch.id);
    return json({ ok: true });
  }

  return badRequest("Unsupported method for this API route.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env);
      }
      return new Response("Static asset request should be handled by Cloudflare assets.", {
        status: 404
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected server error.";
      return json({ error: message }, 500);
    }
  }
};
