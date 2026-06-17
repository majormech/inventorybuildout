export type UseChoice = "Anchor" | "Life Safety" | "Other" | "Utility";

export type ApparatusType =
  | "Engine"
  | "Truck"
  | "Rescue"
  | "Battallion"
  | "Boat"
  | "Trailer"
  | "Chief Vehicle"
  | "Support Vehicle"
  | "Other";

export type CompartmentParentType = "apparatus" | "trailer" | "storage_area";

export type ValidationLevel = "error" | "warning";

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Station extends BaseEntity {
  station_number: string;
  station_name: string;
  address: string | null;
  notes: string | null;
}

export interface Apparatus extends BaseEntity {
  station_id: string;
  apparatus_name: string;
  apparatus_type: ApparatusType;
  in_service: boolean;
  notes: string | null;
}

export interface StorageArea extends BaseEntity {
  station_id: string;
  storage_name: string;
  description: string | null;
  notes: string | null;
}

export interface Trailer extends BaseEntity {
  station_id: string;
  trailer_name: string;
  trailer_type: string | null;
  in_service: boolean;
  notes: string | null;
}

export interface Compartment extends BaseEntity {
  parent_type: CompartmentParentType;
  parent_id: string;
  compartment_name: string;
  sort_order: number;
  notes: string | null;
}

export interface EquipmentItem extends BaseEntity {
  name: string;
  equipment_id: string;
  group_name: string | null;
  equipment_type: string | null;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  description: string | null;
  notes: string | null;
  use_choice: UseChoice | null;
  in_service: boolean;
  is_primary: boolean;
  ownership: string | null;
  station_id: string | null;
  apparatus_id: string | null;
  trailer_id: string | null;
  storage_area_id: string | null;
  compartment_id: string | null;
  parent_equipment_id: string | null;
  parent_equipment_name: string | null;
  parent_serial_number: string | null;
  assigned_unit: string | null;
  kit_reference_id: string | null;
  last_service_test_date: string | null;
  next_service_test_date: string | null;
  battery_type: string | null;
  battery_voltage: string | null;
  amp_hours: string | null;
  electronic_type: string | null;
  electronic_product_code: string | null;
  firmware_version: string | null;
  lot: string | null;
  raw_barcode_value: string | null;
}

export interface EquipmentTemplate extends BaseEntity {
  template_name: string;
  group_name: string | null;
  equipment_type: string | null;
  make: string | null;
  model: string | null;
  default_use_choice: UseChoice | null;
  default_description: string | null;
  default_notes: string | null;
  default_ownership: string | null;
  default_electronic_type: string | null;
}

export interface AuditLog extends BaseEntity {
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: string | null;
  after_json: string | null;
}

export interface FirstDueExportProfile extends BaseEntity {
  profile_name: string;
  column_mapping_json: string;
  rules_json: string | null;
}

export interface EquipmentExportRecord extends EquipmentItem {
  station_number: string | null;
  station_name: string | null;
  apparatus_name: string | null;
  storage_name: string | null;
  trailer_name: string | null;
  compartment_name: string | null;
}

export type FirstDueRow = Record<string, string>;

export interface ValidationIssue {
  level: ValidationLevel;
  code: string;
  field: string;
  message: string;
  row_id?: string;
}

export interface ValidationResult<T> {
  value: T;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ExportSummary {
  total_rows: number;
  valid_rows: number;
  rows_skipped: number;
  fields_truncated: number;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
}

export interface DashboardSummary {
  total_stations: number;
  total_apparatus: number;
  total_storage_areas: number;
  total_trailers: number;
  total_equipment: number;
  export_ready_rows: number;
  export_error_count: number;
  export_warning_count: number;
  recent_equipment: EquipmentItem[];
  top_issues: ValidationIssue[];
}

export interface BootstrapPayload {
  stations: Station[];
  apparatus: Apparatus[];
  storage_areas: StorageArea[];
  trailers: Trailer[];
  compartments: Compartment[];
  equipment_items: EquipmentItem[];
  equipment_templates: EquipmentTemplate[];
  dashboard: DashboardSummary;
}

export interface ExportFilters {
  station_id?: string;
  apparatus_id?: string;
  storage_area_id?: string;
  trailer_id?: string;
  group_name?: string;
  equipment_type?: string;
}

export interface ExportOptions {
  truncate_over_limit?: boolean;
  include_bom?: boolean;
}

export interface ExportPreviewResponse {
  columns: string[];
  rows: FirstDueRow[];
  csv: string;
  summary: ExportSummary;
}

export interface ImportPreviewRow {
  row_number: number;
  raw: Record<string, string>;
  cleaned: FirstDueRow;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ImportPreviewResponse {
  headers: string[];
  rows: ImportPreviewRow[];
}

export interface AiSuggestionRequest {
  text: string;
  target?: "equipment" | "notes" | "description" | "validation";
}

export interface AiSuggestionResponse {
  provider: string;
  suggestions: Record<string, string>;
  warnings: string[];
}
