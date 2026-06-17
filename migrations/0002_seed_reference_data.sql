INSERT OR IGNORE INTO stations (id, station_number, station_name, address, notes)
VALUES
  ('station-1', '1', 'Decatur Fire Department Station 1', '', ''),
  ('station-2', '2', 'Decatur Fire Department Station 2', '', ''),
  ('station-3', '3', 'Decatur Fire Department Station 3', '', ''),
  ('station-4', '4', 'Decatur Fire Department Station 4', '', ''),
  ('station-5', '5', 'Decatur Fire Department Station 5', '', ''),
  ('station-6', '6', 'Decatur Fire Department Station 6', '', ''),
  ('station-7', '7', 'Decatur Fire Department Station 7', '', '');

INSERT OR IGNORE INTO storage_areas (id, station_id, storage_name, description, notes)
VALUES
  ('storage-scba-room', 'station-1', 'SCBA Room', 'Station 1 breathing air storage', ''),
  ('storage-gold-room', 'station-1', 'Gold Room', 'Station 1 secure inventory room', ''),
  ('storage-dive-room', 'station-1', 'Dive Room', 'Station 1 dive support storage', ''),
  ('storage-hose-tower', 'station-1', 'Hose Tower', 'Station 1 hose and ladder staging', ''),
  ('storage-basement', 'station-1', 'Basement Storage', 'Station 1 lower-level storage', ''),
  ('storage-inspector-office', 'station-1', 'Inspector''s Office', 'Station 1 inspection support room', ''),
  ('storage-rtc-storage', 'station-2', 'RTC Storage', 'Station 2 rescue task cache', '');

INSERT OR IGNORE INTO apparatus (id, station_id, apparatus_name, apparatus_type, in_service, notes)
VALUES
  ('apparatus-engine-1', 'station-1', 'Engine 1', 'Engine', 1, ''),
  ('apparatus-truck-1', 'station-1', 'Truck 1', 'Truck', 1, ''),
  ('apparatus-truck-3', 'station-1', 'Truck 3', 'Truck', 1, ''),
  ('apparatus-rescue-1', 'station-1', 'Rescue 1', 'Rescue', 1, ''),
  ('apparatus-battallion-1', 'station-1', 'Battallion 1', 'Battallion', 1, ''),
  ('apparatus-truck-2', 'station-2', 'Truck 2', 'Truck', 1, ''),
  ('apparatus-engine-10', 'station-2', 'Engine 10', 'Engine', 1, ''),
  ('apparatus-engine-3', 'station-3', 'Engine 3', 'Engine', 1, ''),
  ('apparatus-engine-4', 'station-4', 'Engine 4', 'Engine', 1, ''),
  ('apparatus-engine-5', 'station-5', 'Engine 5', 'Engine', 1, ''),
  ('apparatus-engine-6', 'station-6', 'Engine 6', 'Engine', 1, ''),
  ('apparatus-engine-7', 'station-7', 'Engine 7', 'Engine', 1, '');

INSERT OR IGNORE INTO equipment_templates (
  id,
  template_name,
  group_name,
  equipment_type,
  make,
  model,
  default_use_choice,
  default_description,
  default_notes,
  default_ownership,
  default_electronic_type
)
VALUES
  (
    'template-lifepak-35-monitor',
    'LIFEPAK 35 Monitor',
    'EMS',
    'Cardiac Monitor',
    'Stryker',
    'LIFEPAK 35',
    'Life Safety',
    'Portable cardiac monitor and defibrillator for front-line apparatus.',
    '',
    'Department',
    'Monitor'
  ),
  (
    'template-lifepak-flex-battery',
    'LIFEPAK FLEX Battery',
    'EMS',
    'Battery',
    'Stryker',
    'LIFEPAK FLEX',
    'Life Safety',
    'Rechargeable battery for LIFEPAK monitor kits.',
    '',
    'Department',
    'Battery'
  ),
  (
    'template-draeger-gas-monitor',
    'Draeger Gas Monitor',
    'HazMat',
    'Gas Monitor',
    'Draeger',
    'X-am 2800',
    'Life Safety',
    'Multi-gas detector used for atmosphere monitoring.',
    '',
    'Department',
    'Detector'
  ),
  (
    'template-motorola-radio',
    'Motorola Radio',
    'Communications',
    'Portable Radio',
    'Motorola',
    'APX',
    'Life Safety',
    'Portable radio assigned to front-line crews.',
    '',
    'Department',
    'Radio'
  );
