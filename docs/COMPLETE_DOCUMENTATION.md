# Copilot Usage Report - Complete Documentation

A comprehensive tool for analyzing GitHub Copilot usage across repositories using a **5-Tier AI Detection Model**.

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Running the Analysis](#running-the-analysis)
5. [Dashboard Guide](#dashboard-guide)
6. [Report Files](#report-files)
7. [5-Tier AI Detection Model](#5-tier-ai-detection-model)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This tool analyzes Git commit history to detect AI-assisted code contributions (GitHub Copilot, ChatGPT, etc.) and generates comprehensive reports with:

- **Branch-level analysis** - AI usage per branch
- **User-level analysis** - AI usage per contributor
- **File type breakdown** - AI usage by programming language
- **Historical trends** - AI adoption over time
- **Interactive dashboard** - Visual charts and tables

### Key Features

| Feature | Description |
|---------|-------------|
| 5-Tier Detection | Confidence-based AI classification (Tier 1-5) |
| Batch Processing | Analyze multiple repositories at once |
| Interactive Dashboard | Chart.js powered visualizations |
| Export Options | CSV, JSON, Markdown, Excel reports |
| Historical Tracking | Compare AI usage across time periods |
| Leaderboard | Gamified view of top AI users |
| Alerts System | Automatic threshold monitoring |

### New Features (January 2026)

| Feature | Description |
|---------|-------------|
| **Incremental Analysis** | Only analyze new commits since last run (much faster re-runs) |
| **Parallel Processing** | `-Parallel -MaxParallel N` for concurrent execution |
| **Full Analysis Mode** | `-FullAnalysis` to force complete re-analysis |
| **Report Comparison** | `-CompareWith` to compare current vs previous report |
| **Dashboard Search/Filter** | Search by app/branch/author, filter by AI%/Tier |
| **Excel Export** | Export filtered tables to CSV or Excel (.xls) |

---

## Quick Start

### Prerequisites

- **PowerShell 7+** (Windows/Linux/macOS)
- **Git** installed and configured
- **Python 3** (for local HTTP server - optional)

### Basic Usage

```powershell
# Navigate to the project folder
cd c:\workspace\copilot\copilotusagereport

# Run analysis for ALL TIME (no date filter)
.\scripts\Run-BatchAnalysis.ps1

# View the dashboard (Option 1: Direct file - basic view)
Start-Process ".\reports\CopilotDashboard.html"

# View the dashboard (Option 2: HTTP Server - RECOMMENDED for full features)
cd .\reports
python -m http.server 8080
# Then open browser: http://localhost:8080/CopilotDashboard.html
```

---

## Viewing Reports with Python HTTP Server

### Why Use HTTP Server?

| Feature | Direct File (file://) | HTTP Server (http://) |
|---------|----------------------|----------------------|
| Basic Dashboard | ✅ Works | ✅ Works |
| Historical Trend Chart | ❌ Limited | ✅ Full support |
| Load Archived Reports | ❌ No | ✅ Yes |
| Report Selector Dropdown | ❌ Limited | ✅ Full support |
| Export to PDF | ⚠️ May have issues | ✅ Works |

### Starting the HTTP Server

**Step 1: Open PowerShell and navigate to reports folder**
```powershell
cd c:\workspace\copilot\copilotusagereport\reports
```

**Step 2: Start Python HTTP server**
```powershell
python -m http.server 8080
```

**Step 3: Open browser**
```
http://localhost:8080/CopilotDashboard.html
```

### Quick One-Liner Command
```powershell
cd c:\workspace\copilot\copilotusagereport\reports; python -m http.server 8080
```

### Stopping the Server
- Press `Ctrl+C` in the PowerShell window
- Or close the terminal

### Troubleshooting HTTP Server

**Error: "python is not recognized"**
```powershell
# Try python3 instead
python3 -m http.server 8080

# Or use full path (Windows)
C:\Python311\python.exe -m http.server 8080
```

**Error: "Port 8080 already in use"**
```powershell
# Use a different port
python -m http.server 8081

# Or kill existing process
Get-Process -Name python | Stop-Process -Force
```

**Error: 404 Not Found**
```powershell
# Make sure you're in the reports folder, NOT the root folder
cd c:\workspace\copilot\copilotusagereport\reports  # ✅ Correct
# NOT: cd c:\workspace\copilot\copilotusagereport    # ❌ Wrong
```

---

## Configuration

### Config File Location

```
copilotusagereport/
└── config/
    └── config.csv    ← Main configuration file
```

### Config File Format

| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `ApplicationName` | ✅ | Display name for the repository | `CCSA` |
| `GitUrl` | ✅ | Git clone URL | `https://github.com/org/repo.git` |
| `Branches` | ✅ | Comma-separated branch list | `"dev,main"` |
| `ExcludePaths` | ❌ | Glob patterns to exclude | `"docs/*,*.md,tests/*"` |
| `Owner` | ❌ | Team/owner identifier | `Team-Backend` |
| `Team` | ❌ | Department/team name | `AI Platform` |
| `TargetAIPercent` | ❌ | Target AI usage percentage | `25` |

### Example Config

```csv
ApplicationName,GitUrl,Branches,ExcludePaths,Owner,Team,TargetAIPercent
CCSA,https://github.com/microsoft/customer-chatbot-solution-accelerator.git,"dev,main","docs/*,*.md,tests/*",Team-CCSA,AI Platform,25
Container Migration,https://github.com/microsoft/Container-Migration-Solution-Accelerator.git,"dev,main","docs/*,*.md,tests/*",Team-Container,Cloud Migration,25
```

---

## Running the Analysis

### Main Script: `Run-BatchAnalysis.ps1`

Located at: `scripts/Run-BatchAnalysis.ps1`

### Command Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `-ConfigPath` | String | No | `../config/config.csv` | Path to configuration file |
| `-StartDate` | String | No | None (all time) | Start date filter (yyyy-MM-dd) |
| `-EndDate` | String | No | Today | End date filter (yyyy-MM-dd) |
| `-AnalysisName` | String | No | Auto-generated | Friendly name for this analysis (e.g., "November2025", "Q4-Release") - appears in dashboard dropdown and trend chart |
| `-ValidateOnly` | Switch | No | False | Only validate Git access, don't analyze |
| `-FullAnalysis` | Switch | No | False | Force full re-analysis, ignoring incremental tracking |
| `-Parallel` | Switch | No | False | Enable parallel processing (requires PowerShell 7+) |
| `-MaxParallel` | Integer | No | 4 | Maximum parallel threads (only with `-Parallel`) |
| `-CompareWith` | String | No | None | Path to previous report JSON for comparison |

### Usage Examples

#### 1. Analyze All History (No Date Filter)
```powershell
.\scripts\Run-BatchAnalysis.ps1
```
Analyzes **all commits** in the repository history.

#### 2. Analyze Specific Date Range
```powershell
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-10-01" -EndDate "2025-10-31"
```
Analyzes commits from October 1-31, 2025 only.

#### 3. Analyze From Start Date to Today
```powershell
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-01-01"
```
Analyzes commits from January 1, 2025 to today.

#### 4. Monthly Analysis (for trends)
```powershell
# October 2025
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-10-01" -EndDate "2025-10-31" -AnalysisName "October2025"

# November 2025
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-11-01" -EndDate "2025-11-30" -AnalysisName "November2025"

# December 2025
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-12-01" -EndDate "2025-12-31" -AnalysisName "December2025"
```

#### 5. Validate Git Access Only
```powershell
.\scripts\Run-BatchAnalysis.ps1 -ValidateOnly
```
Tests repository access without running analysis.

#### 6. Custom Config File
```powershell
.\scripts\Run-BatchAnalysis.ps1 -ConfigPath "C:\path\to\custom-config.csv"
```

#### 7. Incremental Analysis (Default - NEW)
```powershell
# Only analyzes NEW commits since last run
.\scripts\Run-BatchAnalysis.ps1
```
Incrementally analyzes only commits since the last analysis, merging with previous results.

#### 8. Force Full Re-Analysis (NEW)
```powershell
.\scripts\Run-BatchAnalysis.ps1 -FullAnalysis
```
Forces complete re-analysis of all commits, ignoring incremental tracking.

#### 9. Parallel Processing (NEW)
```powershell
# Run with 6 parallel threads
.\scripts\Run-BatchAnalysis.ps1 -Parallel -MaxParallel 6
```
Analyzes repositories in parallel for faster execution. Requires PowerShell 7+.

#### 10. Compare with Previous Report (NEW)
```powershell
.\scripts\Run-BatchAnalysis.ps1 -CompareWith "reports\consolidated\ConsolidatedReport_2025-12-01.json"
```
Generates a comparison report showing changes between the previous and current analysis.

#### 11. Combined New Features (NEW)
```powershell
.\scripts\Run-BatchAnalysis.ps1 `
    -FullAnalysis `
    -Parallel -MaxParallel 8 `
    -CompareWith "reports\consolidated\Previous.json" `
    -AnalysisName "January2026"
```
Full parallel analysis with comparison and custom name.

### What Happens During Analysis

```
Step 1: Validate Git Access
    └── Tests connectivity to all repositories in config

Step 2: Sync Repositories
    └── Fetches latest commits (or clones if new)

Step 3: Analyze Code Authorship
    └── Runs 5-Tier AI detection on each branch
    └── Analyzes commit messages and code patterns

Step 4: Generate Reports
    └── Creates CSV, JSON, Markdown files per branch

Step 5: Consolidate
    └── Merges all branch reports into single JSON

Step 6: Update Dashboard
    └── Embeds latest data into HTML dashboard
```

---

## Dashboard Guide

### Accessing the Dashboard

**Option 1: Direct File Access**
```powershell
Start-Process ".\reports\CopilotDashboard.html"
```

**Option 2: HTTP Server (Required for full features)**
```powershell
cd .\reports
python -m http.server 8080
# Then open: http://localhost:8080/CopilotDashboard.html
```

> ⚠️ **Note**: Historical trend chart requires HTTP server to load archived reports.

---

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Copilot Usage Analysis Dashboard                           │
│  [Report Selector ▼]  [🔄 Refresh] [📥 CSV] [📄 PDF]        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ AI %     │ │ Human %  │ │ Commits  │ │ Users    │       │
│  │ 32.16%   │ │ 67.84%   │ │ 987      │ │ 25       │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│  [Overview] [Applications] [Branches] [Users] [Commits]     │
│  [Compare Repos] [Leaderboard] [🔍 PR Analysis]              │
├─────────────────────────────────────────────────────────────┤
│                     < Chart Content >                       │
└─────────────────────────────────────────────────────────────┘
```

### New Dashboard Features (January 2026)

#### Search & Filter (Branches and Commits tabs)

| Feature | Location | Description |
|---------|----------|-------------|
| **Search Box** | Branches/Commits tab | Search by application, branch, author, or message |
| **AI% Filter** | Branches tab | Filter: High (≥50%), Medium (20-49%), Low (<20%) |
| **Tier Filter** | Commits tab | Filter by Tier 1-5 |
| **Results Count** | Below toolbar | Shows "Showing X of Y" count |
| **Text Highlighting** | Table cells | Highlights matching search terms |

#### Export Buttons (Branches and Commits tabs)

| Button | Format | Description |
|--------|--------|-------------|
| **Export CSV** | `.csv` | Downloads filtered data as CSV |
| **Export Excel** | `.xls` | Downloads filtered data as Excel file |

> **Note**: Export only includes visible (filtered) rows.

---

### Tab 1: 📊 Overview

The main dashboard view with summary metrics and charts.

#### Summary Cards

| Card | What It Shows |
|------|---------------|
| **AI-Assisted** | Percentage and count of AI-generated code lines |
| **Human-Written** | Percentage and count of human-written code lines |
| **Total Commits** | Total commits analyzed (with AI commit count) |
| **Contributors** | Number of unique commit authors |

#### Charts Explained

| Chart | Purpose | How to Read |
|-------|---------|-------------|
| **AI vs Human Distribution** | Doughnut chart showing overall ratio | Blue = AI, Green = Human |
| **5-Tier Confidence** | Bar chart of commits by tier | Higher tiers = More confident AI detection |
| **AI by Application** | Compare repos horizontally | Longer bar = More AI usage |
| **Top Contributors** | Top 5 AI-using developers | Shows who uses Copilot most |
| **File Type Breakdown** | AI usage by file extension | Stacked bars: Blue=AI, Green=Human |
| **Historical Trend** | AI % over time | Line shows adoption trend |

---

### Tab 2: 📱 Applications

Application-level summary showing each repository's metrics.

**Each Card Shows:**
- Repository name
- Branches analyzed
- Total commits
- AI commits count
- AI percentage (with progress bar)
- Tier distribution as badges

---

### Tab 3: 🌿 Branches

Detailed branch-level analysis in table format with search/filter and export capabilities.

#### Toolbar Features (NEW)

| Feature | Description |
|---------|-------------|
| **Search Box** | Filter by application or branch name |
| **AI% Filter** | Dropdown: All, High (≥50%), Medium (20-49%), Low (<20%) |
| **Export CSV** | Download filtered results as CSV |
| **Export Excel** | Download filtered results as Excel |
| **Results Count** | Shows "Showing X of Y branches" |

#### Table Columns

| Column | Description |
|--------|-------------|
| **Application** | Repository name |
| **Branch** | Git branch (dev, main, feature, etc.) |
| **Total Commits** | All commits in date range |
| **AI Commits** | Commits with AI detection |
| **AI Lines** | Lines from AI-assisted commits |
| **AI %** | Percentage of AI code |
| **Tier Distribution** | Badges showing T1, T2, T3, T4, T5 counts |

**Tier Badges:**
- 🔴 T1 = Definitive AI (99-100%)
- 🟠 T2 = Very High (90-98%)
- 🟡 T3 = High (80-89%)
- 🔵 T4 = Moderate (70-79%)
- 🟢 T5 = Low (60-69%)

---

### Tab 4: 👥 Users

Per-contributor Copilot usage analysis.

**Metrics per User:**
- User name/email
- Total commits made
- AI-assisted commits
- Total lines contributed
- AI-assisted lines
- AI usage percentage
- Visual progress bar

**Use This To:**
- Identify power users of Copilot
- Find team members who may need Copilot training
- Track individual adoption

---

### Tab 5: 📝 Commits

Table of all AI-detected commits (Tier 1-5 only) with search/filter and export capabilities.

#### Toolbar Features (NEW)

| Feature | Description |
|---------|-------------|
| **Search Box** | Filter by author name or commit message |
| **Tier Filter** | Dropdown: All, Tier 1-5 individually |
| **Export CSV** | Download filtered results as CSV |
| **Export Excel** | Download filtered results as Excel |
| **Results Count** | Shows "Showing X of Y commits" |

#### Table Columns

| Column | Description |
|--------|-------------|
| **Author** | Commit author name |
| **Message** | Commit message (hover for full text) |
| **Date** | When commit was made |
| **Lines Added** | Size of commit in lines |
| **Confidence** | AI detection score (60-100%) |
| **Tier** | Classification tier with colored badge |

**Use This To:**
- Audit AI detection accuracy
- Review high-confidence detections
- Understand AI usage patterns

---

### Tab 6: 🔄 Compare Repos

Side-by-side repository comparison view.

#### Comparison Cards

Each repository gets a card showing:
```
┌─────────────────────────────────┐
│ 🏆 Repository Name              │  ← Trophy if highest AI %
├─────────────────────────────────┤
│  32.5%    │    487             │
│  AI Usage │  Total Commits      │
├─────────────────────────────────┤
│    52     │   64,311           │
│ AI Commits│  AI Lines           │
├─────────────────────────────────┤
│ ████████░░░░░░░ 32.5%          │  ← Progress bar
├─────────────────────────────────┤
│ Branches: dev, main             │
└─────────────────────────────────┘
```

#### Comparison Bar Chart

Stacked bar chart showing:
- **Blue bars** = AI-assisted lines per repo
- **Green bars** = Human-written lines per repo

**Use This To:**
- Compare team/project AI adoption
- Identify which repos need more Copilot training
- Track relative progress

---

### Tab 7: 🏆 Leaderboard

Gamified view ranking top AI-using contributors.

#### Rankings Display

```
🥇 #1  John Smith                    28,450
       52 commits | 25 AI commits    AI Lines (45.2%)
       
🥈 #2  Jane Doe                      15,230
       38 commits | 18 AI commits    AI Lines (38.5%)
       
🥉 #3  Bob Wilson                    12,100
       45 commits | 15 AI commits    AI Lines (32.1%)
```

**Styling:**
- 🥇 Gold border and gradient for #1
- 🥈 Silver border and gradient for #2
- 🥉 Bronze border and gradient for #3
- Standard styling for #4-10

#### Alerts Section

Automatic threshold monitoring system:

| Alert Type | Icon | Condition | Action |
|------------|------|-----------|--------|
| **Target Achieved** | ✅ | Overall AI % ≥ Target | Celebrate! |
| **Below Target** | ⚠️ | Overall AI % < Target | Review adoption |
| **Low Adoption** | 🔴 | Branch < 10% AI (10+ commits) | Training needed |
| **High Adoption** | 🌟 | Branch ≥ 40% AI | Best practice |
| **Tier 1 Detected** | 🎯 | Definitive AI commits found | Review commits |
| **No AI Usage** | ❌ | Zero AI commits | Enable Copilot |

**Use This To:**
- Encourage friendly competition
- Recognize top adopters
- Identify training opportunities

---

### Dashboard Controls

| Control | Location | Function |
|---------|----------|----------|
| **Report Selector** | Top-right dropdown | Switch between archived reports |
| **🔄 Refresh** | Top-right button | Reload current data |
| **📥 CSV** | Top-right button | Download all data as CSV |
| **📄 PDF** | Top-right button | Generate PDF report |

---

## Report Files

### Folder Structure

```
reports/
├── CopilotDashboard.html              # Interactive dashboard
├── Batch-Analysis-Summary.md          # Executive summary (Markdown)
├── Batch-Analysis-Summary.csv         # Summary metrics (CSV)
├── Branch-Level-Summary_*.csv         # All branches overview
├── Git-Access-Validation-Report.csv   # Access test results
├── Git-Access-Validation-Report.md    # Access test report
│
├── consolidated/                       # Dashboard data files
│   ├── ConsolidatedReport_2026-01-12_12-19-21.json  (latest)
│   ├── ConsolidatedReport_2026-01-12_11-31-28.json
│   └── ...                             # Historical reports
│
├── CCSA/                               # Per-application folders
│   ├── dev/                            # Per-branch folders
│   │   ├── Analysis_dev_*.json         # Full commit data
│   │   ├── Analysis_dev_*.md           # Markdown report
│   │   ├── UserAnalysis_dev_*.csv      # User metrics
│   │   ├── BranchAnalysis_dev_*.csv    # Branch summary
│   │   ├── FileTypeAnalysis_dev_*.csv  # File type breakdown
│   │   └── archive/                    # Previous reports
│   └── main/
│       └── ...
│
├── Container Migration/
│   └── ...
│
└── archive/                            # Dashboard snapshots
    └── 2026-01-12_10-47-53/
        └── CopilotDashboard.html
```

### File Descriptions

| File | Format | Purpose |
|------|--------|---------|
| `Analysis_*.json` | JSON | Complete commit-level data with AI scores, patterns, tiers |
| `Analysis_*.md` | Markdown | Human-readable branch report |
| `UserAnalysis_*.csv` | CSV | Per-user statistics (import to Excel) |
| `BranchAnalysis_*.csv` | CSV | Branch-level summary |
| `FileTypeAnalysis_*.csv` | CSV | AI usage by file extension |
| `ConsolidatedReport_*.json` | JSON | All branches merged for dashboard |
| `Batch-Analysis-Summary.md` | Markdown | Executive summary for management |

---

## 5-Tier AI Detection Model

### How Detection Works

The model analyzes multiple signals to classify commits:

```
┌─────────────────────────────────────────────────┐
│                 Commit Analysis                  │
├─────────────────────────────────────────────────┤
│  1. Commit Message Keywords                     │
│     - "copilot", "ai", "generated", "gpt"       │
│                                                 │
│  2. Code Patterns                               │
│     - AI-typical formatting                     │
│     - Generated comments                        │
│     - Boilerplate structure                     │
│                                                 │
│  3. Commit Size                                 │
│     - Large uniform additions                   │
│     - Multiple files with similar patterns      │
│                                                 │
│  4. Code Comments                               │
│     - Documentation style                       │
│     - Parameter descriptions                    │
├─────────────────────────────────────────────────┤
│         ↓ Calculate Confidence Score ↓          │
├─────────────────────────────────────────────────┤
│  Score ≥ 99%  →  Tier 1 (Definitive)           │
│  Score 90-98% →  Tier 2 (Very High)            │
│  Score 80-89% →  Tier 3 (High)                 │
│  Score 70-79% →  Tier 4 (Moderate)             │
│  Score 60-69% →  Tier 5 (Low)                  │
│  Score < 60%  →  Human (No AI)                 │
└─────────────────────────────────────────────────┘
```

### Tier Definitions

| Tier | Score | Confidence | Typical Indicators |
|------|-------|------------|---------------------|
| **1** | 99-100% | Definitive | Explicit "copilot" or "AI generated" in commit message |
| **2** | 90-98% | Very High | Multiple strong AI patterns, AI-style comments |
| **3** | 80-89% | High | Clear AI formatting, boilerplate code |
| **4** | 70-79% | Moderate | Some AI patterns, possible assistance |
| **5** | 60-69% | Low | Weak indicators, possible false positive |
| **Human** | <60% | None | Normal development patterns |

### Detection Patterns

**Message Keywords (Weighted):**
- `copilot` → Very high weight
- `ai generated` → Very high weight
- `chatgpt`, `gpt-4` → High weight
- `auto-generated` → Medium weight
- `generated code` → Medium weight

**Code Patterns:**
- Large single-file commits with uniform style
- Extensive inline documentation
- Complete function implementations in one commit
- Standard boilerplate patterns

---

## Troubleshooting

### Common Issues

#### 1. "Repository not accessible"

**Problem:** Cannot connect to Git repository

**Solution:**
```powershell
# Test Git authentication
git ls-remote https://github.com/org/repo.git

# Run validation only mode
.\scripts\Run-BatchAnalysis.ps1 -ValidateOnly

# Check credentials
git config --global credential.helper
```

#### 2. Dashboard shows "No data" or empty tiles

**Problem:** Dashboard loads but displays no information

**Solutions:**
1. Ensure analysis completed successfully (check terminal output)
2. Verify `reports/consolidated/ConsolidatedReport_*.json` exists
3. Clear browser cache (Ctrl+Shift+R)
4. Try HTTP server method instead of file:// protocol

#### 3. HTTP Server 404 Error

**Problem:** Server running but pages not found

**Solution:**
```powershell
# MUST run from reports directory
cd c:\workspace\copilot\copilotusagereport\reports
python -m http.server 8080

# NOT from root folder!
```

#### 4. Historical Trend Chart Empty

**Problem:** Trend chart shows no data points

**Solutions:**
1. Trend requires multiple report runs
2. Run analysis with different date ranges:
   ```powershell
   .\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-10-01" -EndDate "2025-10-31"
   .\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-11-01" -EndDate "2025-11-30"
   ```
3. Check `reports/consolidated/` has multiple JSON files

#### 5. PowerShell Execution Policy Error

**Problem:** Script cannot be run due to execution policy

**Solution:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 6. Analysis Stuck or Slow

**Problem:** Analysis takes too long or hangs

**Solutions:**
1. Large repos take time (1000+ commits = 5-10 minutes)
2. Check network connectivity
3. Use date range to limit commits:
   ```powershell
   .\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-12-01"
   ```

---

## Best Practices

### For Accurate AI Detection

1. **Run full history first** - Establish baseline
2. **Use consistent schedules** - Weekly/monthly for trends
3. **Review Tier 1 commits** - Verify high-confidence detections
4. **Encourage commit messages** - "Used Copilot" improves detection

### For Team Adoption Tracking

1. Set realistic `TargetAIPercent` (start with 20-25%)
2. Monitor Alerts section weekly
3. Use Leaderboard for friendly competition
4. Share Compare Repos view in team meetings

### For Report Management

1. Archive old reports periodically
2. Run fresh all-time analysis quarterly
3. Keep date-ranged reports for trend analysis

---

## Script Reference

### Available Scripts

| Script | Purpose | Location |
|--------|---------|----------|
| `Run-BatchAnalysis.ps1` | Main batch processor | `scripts/` |
| `Analyze-CodeAuthorship.ps1` | Core analysis engine | `scripts/` |
| `Validate-GitAccess.ps1` | Repository access tester | `scripts/` |
| `Generate-ConsolidatedReport.ps1` | Merge branch reports | `scripts/reporting/` |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial release with 5-Tier model |
| 1.1 | 2026-01-12 | Added File Type Analysis |
| 1.2 | 2026-01-12 | Added Comparison, Leaderboard, Alerts |
| 1.3 | 2026-01-12 | Added Team config, TargetAIPercent |

---

*Copilot Usage Report Tool - Analyze your AI-assisted development*
