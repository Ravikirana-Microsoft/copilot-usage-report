<#
.SYNOPSIS
    Syncs config.json to config.csv for backward compatibility with analysis scripts.

.DESCRIPTION
    This script reads the config.json file and generates a config.csv file that can be
    used by the analysis scripts. It ensures that both config files stay in sync.

.PARAMETER ConfigJsonPath
    Path to the config.json file (relative to project root)

.PARAMETER ConfigCsvPath
    Path to the config.csv file (relative to project root)

.EXAMPLE
    .\Sync-ConfigJsonToCsv.ps1
    
.EXAMPLE
    .\Sync-ConfigJsonToCsv.ps1 -ConfigJsonPath "config/config.json" -ConfigCsvPath "config/config.csv"
#>

param(
    [string]$ConfigJsonPath = "config/config.json",
    [string]$ConfigCsvPath = "config/config.csv"
)

$ErrorActionPreference = "Stop"

# Determine paths
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptRoot

$jsonPath = Join-Path $projectRoot $ConfigJsonPath
$csvPath = Join-Path $projectRoot $ConfigCsvPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Config JSON to CSV Sync" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if JSON exists
if (-not (Test-Path $jsonPath)) {
    Write-Error "Config JSON not found: $jsonPath"
    exit 1
}

Write-Host "Reading config from: $jsonPath" -ForegroundColor Yellow

# Read JSON config
$configJson = Get-Content $jsonPath -Raw | ConvertFrom-Json

if (-not $configJson.repositories) {
    Write-Error "No repositories found in config.json"
    exit 1
}

Write-Host "Found $($configJson.repositories.Count) repositories in JSON" -ForegroundColor Gray

# Convert to CSV format
$csvData = @()
$enabledCount = 0
$disabledCount = 0

foreach ($repo in $configJson.repositories) {
    # Only include enabled repositories
    if ($repo.enabled -eq $true) {
        $enabledCount++
        
        # Handle branches - can be array or string
        $branches = if ($repo.branches -is [array]) {
            $repo.branches -join ","
        } else {
            $repo.branches
        }
        
        # Handle excludePaths - can be array, null, or string
        $excludePaths = ""
        if ($repo.excludePaths) {
            if ($repo.excludePaths -is [array]) {
                $excludePaths = $repo.excludePaths -join ","
            } else {
                $excludePaths = $repo.excludePaths
            }
        }
        
        $csvData += [PSCustomObject]@{
            ApplicationName  = $repo.applicationName
            GitUrl          = $repo.gitUrl
            Branches        = $branches
            ExcludePaths    = $excludePaths
            Owner           = if ($repo.owner) { $repo.owner } else { "" }
            Team            = if ($repo.team) { $repo.team } else { "" }
            TargetAIPercent = if ($repo.targetAIPercent) { $repo.targetAIPercent } else { 25 }
            Enabled         = "true"
        }
    } else {
        $disabledCount++
    }
}

Write-Host "  - Enabled: $enabledCount" -ForegroundColor Green
Write-Host "  - Disabled: $disabledCount (excluded from CSV)" -ForegroundColor DarkGray
Write-Host ""

# Write CSV file
Write-Host "Writing CSV to: $csvPath" -ForegroundColor Yellow

$csvData | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "✅ Config synced successfully!" -ForegroundColor Green
Write-Host ""

# Display summary table
Write-Host "Repositories in CSV:" -ForegroundColor Cyan
Write-Host "--------------------" -ForegroundColor Cyan
$csvData | Select-Object ApplicationName, Branches, Team | Format-Table -AutoSize

Write-Host ""
Write-Host "Config sync complete. Analysis scripts will use the updated CSV." -ForegroundColor Gray
