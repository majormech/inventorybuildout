- `NOTES` max length: 250
- Service test dates exported as `MM/DD/YYYY`
- `USE` limited to `Anchor`, `Life Safety`, `Other`, `Utility`
- Invalid or blank `USE` values corrected from equipment context
- Apparatus abbreviations expanded, like `E-1 -> Engine 1`
- `Battalion 1` exported as `Battallion 1`
- Leading zeroes preserved as string values
- Blank export rows removed
- Extra tabs, spaces, and line breaks cleaned before export
- UTF-8 BOM CSV export for Excel-friendly review

## What Works in This Checkpoint

- Create and edit a station
- Create and edit apparatus, storage areas, trailers, compartments, equipment, and templates
- Assign equipment to an apparatus compartment
- Assign equipment to a station storage area
- Associate accessory equipment to a parent item with parent metadata fields
- Review raw barcode values with manual approval before applying parsed serial numbers
- Preview First Due CSV exports with errors and warnings
- Preview imported CSV cleanup without saving

## What Is Intentionally Left For The Next Phase

- Apparatus compartment drag-sort and layout cloning
- Faster move/reassign workflows between compartments
- Live camera barcode scanning flow
- Persisted import-save workflow with richer audit review
- Workers AI provider implementation behind environment config
- Expanded end-to-end browser verification

## Updating First Due Rules Later

The fastest files to update when First Due rules change are:

- [`shared/firstdueColumns.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/firstdueColumns.ts)
- [`shared/validation.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/validation.ts)
- [`shared/export.ts`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/shared/export.ts)
- [`migrations/0002_seed_reference_data.sql`](/C:/Users/kicki/OneDrive/Documents/inventorybuildout/migrations/0002_seed_reference_data.sql)

Those files control column headers, export transforms, validation rules, and starter reference data.
