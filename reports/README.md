# Analysis Reports

This folder contains all generated analysis reports.

## Report Structure

Reports are organized by application name:
```
reports/
├── ApplicationName1/
│   ├── Analysis_ApplicationName1_2026-01-08_10-30-45.csv
│   ├── Analysis_ApplicationName1_2026-01-08_10-30-45.json
│   └── Analysis_ApplicationName1_2026-01-08_10-30-45.md
├── ApplicationName2/
│   └── [similar structure]
├── Batch-Analysis-Summary.csv
├── Batch-Analysis-Summary.md
├── Git-Access-Validation-Report.csv
└── Git-Access-Validation-Report.md
```

## Report Types

### Per-Application Reports

Each application gets three report formats:

1. **CSV** (`Analysis_[App]_[Timestamp].csv`)
   - Machine-readable
   - Easy to import into Excel or other tools
   - Contains user-level statistics

2. **JSON** (`Analysis_[App]_[Timestamp].json`)
   - Complete data structure
   - Programmatic access
   - Includes metadata and detailed breakdown

3. **Markdown** (`Analysis_[App]_[Timestamp].md`)
   - Human-readable
   - Formatted tables
   - Methodology explanation

### Summary Reports

- **Batch-Analysis-Summary.csv** - Success/failure status for each analysis run
- **Batch-Analysis-Summary.md** - Formatted summary with statistics

### Validation Reports

- **Git-Access-Validation-Report.csv** - Repository access status
- **Git-Access-Validation-Report.md** - Formatted validation results

## Viewing Reports

### CSV Files
```powershell
Import-Csv ".\reports\ApplicationName\Analysis_[...].csv" | Format-Table
```

### JSON Files
```powershell
Get-Content ".\reports\ApplicationName\Analysis_[...].json" | ConvertFrom-Json
```

### Markdown Files
Open in any text editor or Markdown viewer for formatted display.

## Cleanup

To archive old reports:
```powershell
# Create archive folder
New-Item -ItemType Directory -Path ".\reports\archive" -Force

# Move old reports (example: older than 30 days)
Get-ChildItem -Path ".\reports" -Recurse -File | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
    Move-Item -Destination ".\reports\archive"
```
