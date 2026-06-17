PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  station_number TEXT NOT NULL UNIQUE,
  station_name TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS apparatus (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  apparatus_name TEXT NOT NULL,
  apparatus_type TEXT NOT NULL,
  in_service INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS storage_areas (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  storage_name TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trailers (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  trailer_name TEXT NOT NULL,
  trailer_type TEXT,
  in_service INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compartments (
  id TEXT PRIMARY KEY,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('apparatus', 'trailer', 'storage_area')),
  parent_id TEXT NOT NULL,
  compartment_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  equipment_id TEXT NOT NULL,
  group_name TEXT,
  equipment_type TEXT,
  make TEXT,
  model TEXT,
  serial_number TEXT,
  description TEXT,
  notes TEXT,
  use_choice TEXT CHECK (use_choice IN ('Anchor', 'Life Safety', 'Other', 'Utility') OR use_choice IS NULL),
  in_service INTEGER NOT NULL DEFAULT 1,
  is_primary INTEGER NOT NULL DEFAULT 0,
  ownership TEXT,
  station_id TEXT,
  apparatus_id TEXT,
  trailer_id TEXT,
  storage_area_id TEXT,
  compartment_id TEXT,
  parent_equipment_id TEXT,
  parent_equipment_name TEXT,
  parent_serial_number TEXT,
  assigned_unit TEXT,
  kit_reference_id TEXT,
  last_service_test_date TEXT,
  next_service_test_date TEXT,
  battery_type TEXT,
  battery_voltage TEXT,
  amp_hours TEXT,
  electronic_type TEXT,
  electronic_product_code TEXT,
  firmware_version TEXT,
  lot TEXT,
  raw_barcode_value TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL,
  FOREIGN KEY (apparatus_id) REFERENCES apparatus(id) ON DELETE SET NULL,
  FOREIGN KEY (trailer_id) REFERENCES trailers(id) ON DELETE SET NULL,
  FOREIGN KEY (storage_area_id) REFERENCES storage_areas(id) ON DELETE SET NULL,
  FOREIGN KEY (compartment_id) REFERENCES compartments(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_equipment_id) REFERENCES equipment_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS equipment_templates (
  id TEXT PRIMARY KEY,
  template_name TEXT NOT NULL,
  group_name TEXT,
  equipment_type TEXT,
  make TEXT,
  model TEXT,
  default_use_choice TEXT CHECK (default_use_choice IN ('Anchor', 'Life Safety', 'Other', 'Utility') OR default_use_choice IS NULL),
  default_description TEXT,
  default_notes TEXT,
  default_ownership TEXT,
  default_electronic_type TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS firstdue_export_profiles (
  id TEXT PRIMARY KEY,
  profile_name TEXT NOT NULL,
  column_mapping_json TEXT NOT NULL,
  rules_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_apparatus_station_id ON apparatus(station_id);
CREATE INDEX IF NOT EXISTS idx_storage_station_id ON storage_areas(station_id);
CREATE INDEX IF NOT EXISTS idx_trailers_station_id ON trailers(station_id);
CREATE INDEX IF NOT EXISTS idx_compartments_parent ON compartments(parent_type, parent_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_equipment_station_id ON equipment_items(station_id);
CREATE INDEX IF NOT EXISTS idx_equipment_apparatus_id ON equipment_items(apparatus_id);
CREATE INDEX IF NOT EXISTS idx_equipment_storage_area_id ON equipment_items(storage_area_id);
CREATE INDEX IF NOT EXISTS idx_equipment_trailer_id ON equipment_items(trailer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_compartment_id ON equipment_items(compartment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_parent_id ON equipment_items(parent_equipment_id);
