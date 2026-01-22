<#
.SYNOPSIS
    Creates a named archive of current analysis reports.

.DESCRIPTION
    Bundles all current consolidated reports into a named archive folder,
    creates an archive-info.json metadata file, and optionally clears 
    the current reports after archiving.

.PARAMETER ArchiveName
    Name for the archive (e.g., "Q4-2025", "January-2026")

.PARAMETER Description
    Optional description for the archive

.PARAMETER ClearReports
    If specified, clears the current reports after archiving

.PARAMETER Push
    If specified, automatically commits and pushes the archive to GitHub

.EXAMPLE
    .\Create-Archive.ps1 -ArchiveName "January-2026" -Description "January 2026 analysis" -Push

.EXAMPLE
    .\Create-Archive.ps1 -ArchiveName "Q4-2025-Final" -ClearReports -Push
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ArchiveName,
    
    [Parameter(Mandatory = $false)]
    [string]$Description = "",
    
    [switch]$ClearReports,
    
    [switch]$Push
)

$ErrorActionPreference = "Stop"

# Paths
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot
$reportsDir = Join-Path $projectRoot "reports"
$consolidatedDir = Join-Path $reportsDir "consolidated"
$namedArchivesDir = Join-Path $reportsDir "named-archives"
$archiveDir = Join-Path $namedArchivesDir $ArchiveName
$archiveConsolidatedDir = Join-Path $archiveDir "consolidated"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "              CREATE ARCHIVE: $ArchiveName" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if archive already exists
if (Test-Path $archiveDir) {
    Write-Host "⚠️  Archive '$ArchiveName' already exists!" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to overwrite it? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "❌ Archive creation cancelled." -ForegroundColor Red
        exit 1
    }
    Remove-Item -Path $archiveDir -Recurse -Force
}

# Get consolidated reports
$consolidatedReports = Get-ChildItem -Path $consolidatedDir -Filter "ConsolidatedReport_*.json" -ErrorAction SilentlyContinue

if ($consolidatedReports.Count -eq 0) {
    Write-Host "❌ No consolidated reports found to archive!" -ForegroundColor Red
    Write-Host "   Run an analysis first using Run-BatchAnalysis.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "📁 Found $($consolidatedReports.Count) consolidated reports to archive" -ForegroundColor Green

# Create archive directories
New-Item -Path $archiveConsolidatedDir -ItemType Directory -Force | Out-Null
Write-Host "📂 Created archive directory: $archiveDir" -ForegroundColor Gray

# Copy consolidated reports
Write-Host "📋 Copying consolidated reports..." -ForegroundColor Gray
Copy-Item -Path "$consolidatedDir\ConsolidatedReport_*.json" -Destination $archiveConsolidatedDir -Force

# Copy summary files
$summaryFiles = @(
    "Batch-Analysis-Summary.csv",
    "Batch-Analysis-Summary.md",
    "CopilotDashboard.html"
)

foreach ($file in $summaryFiles) {
    $sourcePath = Join-Path $reportsDir $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $archiveDir -Force
        Write-Host "   Copied: $file" -ForegroundColor Gray
    }
}

# Copy Branch-Level-Summary files
$branchSummaries = Get-ChildItem -Path $reportsDir -Filter "Branch-Level-Summary_*.csv" -ErrorAction SilentlyContinue
foreach ($file in $branchSummaries) {
    Copy-Item -Path $file.FullName -Destination $archiveDir -Force
    Write-Host "   Copied: $($file.Name)" -ForegroundColor Gray
}

# Build reports list
$reportsList = @()
Get-ChildItem -Path $archiveConsolidatedDir -Filter "*.json" | ForEach-Object {
    $reportsList += $_.Name
}

# Create archive-info.json
$archiveInfo = @{
    name = $ArchiveName
    description = $Description
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd HH:mm:ss") + " UTC"
    reportCount = $consolidatedReports.Count
    reports = $reportsList
    createdBy = $env:USERNAME
}

$archiveInfoPath = Join-Path $archiveDir "archive-info.json"
$archiveInfo | ConvertTo-Json -Depth 10 | Set-Content $archiveInfoPath -Encoding UTF8
Write-Host "📄 Created archive-info.json" -ForegroundColor Gray

# Update index.json
Write-Host "📑 Updating archives index..." -ForegroundColor Gray
$indexPath = Join-Path $namedArchivesDir "index.json"
$archivesIndex = @()

# Read existing archives
Get-ChildItem -Path $namedArchivesDir -Directory | ForEach-Object {
    $infoPath = Join-Path $_.FullName "archive-info.json"
    if (Test-Path $infoPath) {
        $info = Get-Content $infoPath -Raw | ConvertFrom-Json
        $archivesIndex += $info
    }
}

# Sort by creation date (newest first)
$archivesIndex = $archivesIndex | Sort-Object -Property createdAt -Descending

# Write index
$archivesIndex | ConvertTo-Json -Depth 10 | Set-Content $indexPath -Encoding UTF8
Write-Host "   Index updated with $($archivesIndex.Count) archives" -ForegroundColor Gray

# Clear current reports if requested
if ($ClearReports) {
    Write-Host ""
    Write-Host "🗑️  Clearing current reports..." -ForegroundColor Yellow
    
    Remove-Item -Path "$consolidatedDir\ConsolidatedReport_*.json" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$consolidatedDir\*.json" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$reportsDir\Batch-Analysis-Summary.csv" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$reportsDir\Batch-Analysis-Summary.md" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$reportsDir\Branch-Level-Summary_*.csv" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$reportsDir\Consolidated-Analysis_*.json" -Force -ErrorAction SilentlyContinue
    
    Write-Host "   Current reports cleared" -ForegroundColor Gray
}

# Git commit and push if requested
if ($Push) {
    Write-Host ""
    Write-Host "📤 Committing and pushing to GitHub..." -ForegroundColor Cyan
    
    Push-Location $projectRoot
    try {
        git add "reports/named-archives/"
        if ($ClearReports) {
            git add "reports/consolidated/"
            git add "reports/Batch-Analysis-Summary.csv" 2>$null
            git add "reports/Batch-Analysis-Summary.md" 2>$null
        }
        
        $commitMessage = "Archive: $ArchiveName"
        if ($ClearReports) {
            $commitMessage += " (cleared current reports)"
        }
        
        git commit -m $commitMessage
        
        # Pull and push with retry
        for ($i = 1; $i -le 3; $i++) {
            git pull --rebase 2>$null
            $pushResult = git push 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Archive pushed to GitHub!" -ForegroundColor Green
                break
            }
            Write-Host "   Push attempt $i failed, retrying..." -ForegroundColor Yellow
        }
    }
    finally {
        Pop-Location
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "✅ Archive '$ArchiveName' created successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Archive location: $archiveDir" -ForegroundColor Gray
Write-Host "Reports archived: $($consolidatedReports.Count)" -ForegroundColor Gray
if (-not $Push) {
    Write-Host ""
    Write-Host "💡 To push to GitHub, run:" -ForegroundColor Yellow
    Write-Host "   git add reports/named-archives/; git commit -m 'Archive: $ArchiveName'; git push" -ForegroundColor Gray
}
Write-Host ""
