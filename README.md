Decatur Fire Department Inventory Staging
Inventory staging web app for Decatur Fire Department that helps build, clean, validate, and export equipment inventory records for First Due bulk import. This app is a staging tool, not a First Due replacement.
Current Milestone
This repo currently implements the Phase 1 foundation plus shared export validation:
React + Vite frontend with a mobile-friendly shell
Cloudflare Worker API scaffold
Cloudflare D1 schema migrations
Seed data for stations, apparatus, storage areas, and starter equipment templates
CRUD screens for stations, apparatus, storage areas, trailers, compartments, equipment, and templates
First Due export preview with validation summary and CSV download
CSV import preview/cleanup screen
Mock AI suggestion endpoint and UI
Shared validation and export utilities with initial tests
The next recommended phase is Phase 2: apparatus cabinet/compartment builder improvements, including layout cloning, easier compartment reordering, and direct move/reassign flows.
Tech Stack
TypeScript
React + Vite
Cloudflare Workers API
Cloudflare D1
Clean responsive CSS
Vitest for utility tests
Repo Layout
.
|-- migrations/              D1 schema + seed SQL
|-- shared/                  shared First Due types, validators, CSV helpers
|-- src/                     React frontend
|-- tests/                   validation/export tests
|-- worker/                  Cloudflare Worker API
|-- package.json
|-- vite.config.ts
`-- wrangler.jsonc
Local Setup
1. Install dependencies
npm install
2. Create the D1 database
wrangler d1 create dfd_inventory
After Cloudflare returns the database ID, replace the placeholder database_id in [wrangler.jsonc](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/wrangler.jsonc).
3. Apply local migrations and seed data
npm run db:migrate:local
The seed data is included as migrations/0002_seed_reference_data.sql, so applying migrations also loads the starter records.
4. Start local development
npm run dev
The Vite app and Cloudflare integration run together through the Cloudflare Vite plugin. Open the local URL printed by Vite.
5. Run tests
npm run test
Cloudflare Deployment
1. Apply remote migrations
npm run db:migrate:remote
2. Deploy
npm run deploy
The deploy script builds the frontend and then deploys the Worker with static assets configured through wrangler.jsonc.
Seed Data Included
Stations
Stations 1 through 7 are seeded.
Storage Areas
Station 1: SCBA Room, Gold Room, Dive Room, Hose Tower, Basement Storage, Inspector's Office
Station 2: RTC Storage
Apparatus
Station 1: Engine 1, Truck 1, Truck 3, Rescue 1, Battallion 1
Station 2: Truck 2, Engine 10
Station 3: Engine 3
Station 4: Engine 4
Station 5: Engine 5
Station 6: Engine 6
Station 7: Engine 7
Starter Templates
LIFEPAK 35 Monitor
LIFEPAK FLEX Battery
Draeger Gas Monitor
Motorola Radio
First Due / DFD Rules Built In
The shared utilities in [`shared/validation.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/validation.ts) and [`shared/export.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/export.ts) currently enforce or normalize:
General fields max length: 255
NOTES max length: 250
Service test dates exported as MM/DD/YYYY
USE limited to Anchor, Life Safety, Other, Utility
Invalid or blank USE values corrected from equipment context
Apparatus abbreviations expanded, like E-1 -> Engine 1
Battalion 1 exported as Battallion 1
Leading zeroes preserved as string values
Blank export rows removed
Extra tabs, spaces, and line breaks cleaned before export
UTF-8 BOM CSV export for Excel-friendly review
What Works in This Checkpoint
Create and edit a station
Create and edit apparatus, storage areas, trailers, compartments, equipment, and templates
Assign equipment to an apparatus compartment
Assign equipment to a station storage area
Associate accessory equipment to a parent item with parent metadata fields
Review raw barcode values with manual approval before applying parsed serial numbers
Preview First Due CSV exports with errors and warnings
Preview imported CSV cleanup without saving
What Is Intentionally Left For The Next Phase
Apparatus compartment drag-sort and layout cloning
Faster move/reassign workflows between compartments
Live camera barcode scanning flow
Persisted import-save workflow with richer audit review
Workers AI provider implementation behind environment config
Expanded end-to-end browser verification and deployment polish
Updating First Due Rules Later
The fastest files to update when First Due rules change are:
[`shared/firstdueColumns.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/firstdueColumns.ts)
[`shared/validation.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/validation.ts)
[`shared/export.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/export.ts)
[`migrations/0002_seed_reference_data.sql`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/migrations/0002_seed_reference_data.sql)
Those files control column headers, export transforms, validation rules, and starter reference data.
