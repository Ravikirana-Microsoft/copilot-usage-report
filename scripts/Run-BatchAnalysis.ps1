<#
.SYNOPSIS
    Batch processes multiple Git repositories for code authorship analysis

.DESCRIPTION
    Reads configuration from config.csv and analyzes all specified repositories and branches.
    Automatically syncs (fetch/pull) repositories, validates access, and generates comprehensive reports
    with branch-level details using a 5-tier AI detection model.
    
    Supports incremental analysis (only new commits), parallel processing, and report comparison.

.PARAMETER ConfigPath
    Path to the config.csv file. Defaults to ../config/config.csv

.PARAMETER StartDate
    Start date for analysis (format: yyyy-MM-dd). Optional - if not provided, analyzes all time.

.PARAMETER EndDate
    End date for analysis (format: yyyy-MM-dd). Optional, defaults to today.

.PARAMETER ValidateOnly
    Only validate Git access without running analysis

.PARAMETER AnalysisName
    A friendly name for this analysis run (e.g., "December2025", "Q4-Release"). 
    This name appears in the dashboard dropdown and trend chart for easy identification.

.PARAMETER FullAnalysis
    Force full re-analysis of all commits, ignoring incremental tracking.
    By default, only new commits since the last analysis are processed.

.PARAMETER Parallel
    Enable parallel processing of repositories for faster analysis.
    Uses PowerShell 7+ parallel execution.

.PARAMETER MaxParallel
    Maximum number of parallel threads (default: 4). Only used with -Parallel.

.PARAMETER CompareWith
    Path to a previous consolidated report JSON to compare with current analysis.
    Generates a comparison report showing changes between runs.

.EXAMPLE
    .\Run-BatchAnalysis.ps1
    # Runs incremental analysis for ALL TIME (only new commits)
    
.EXAMPLE
    .\Run-BatchAnalysis.ps1 -FullAnalysis
    # Forces full re-analysis of all commits
    
.EXAMPLE
    .\Run-BatchAnalysis.ps1 -Parallel -MaxParallel 6
    # Runs analysis in parallel with 6 threads
    
.EXAMPLE
    .\Run-BatchAnalysis.ps1 -CompareWith "reports\consolidated\ConsolidatedReport_2025-12-01.json"
    # Compares current analysis with previous report

.EXAMPLE
    .\Run-BatchAnalysis.ps1 -StartDate "2025-12-01" -EndDate "2025-12-31" -AnalysisName "December2025"
    # Runs analysis with a friendly name for dashboard display
    
.EXAMPLE
    .\Run-BatchAnalysis.ps1 -ValidateOnly
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$ConfigPath = (Join-Path $PSScriptRoot "..\config\config.csv"),
    
    [Parameter()]
    [string]$StartDate,
    
    [Parameter()]
    [string]$EndDate,
    
    [Parameter()]
    [string]$AnalysisName,
    
    [Parameter()]
    [switch]$ValidateOnly,
    
    [Parameter()]
    [switch]$FullAnalysis,
    
    [Parameter()]
    [switch]$Parallel,
    
    [Parameter()]
    [int]$MaxParallel = 4,
    
    [Parameter()]
    [string]$CompareWith,
    
    [Parameter()]
    [switch]$IncludeTestFiles,
    
    [Parameter()]
    [string]$ApplicationName,
    
    [Parameter()]
    [string]$BranchFilter
)

$ErrorActionPreference = "Stop"

# Set default AnalysisName to current date-time if not provided
if (-not $AnalysisName) {
    $AnalysisName = Get-Date -Format "yyyy-MM-dd_HH-mm"
}

# =====================================================
# METADATA TRACKING FUNCTIONS FOR INCREMENTAL ANALYSIS
# =====================================================

$metadataPath = Join-Path (Split-Path $PSScriptRoot -Parent) "config\analysis-metadata.json"

function Get-AnalysisMetadata {
    if (Test-Path $metadataPath) {
        try {
            return Get-Content $metadataPath -Raw | ConvertFrom-Json -AsHashtable
        } catch {
            return @{}
        }
    }
    return @{}
}

function Save-AnalysisMetadata {
    param([hashtable]$Metadata)
    $Metadata | ConvertTo-Json -Depth 10 | Out-File -FilePath $metadataPath -Encoding UTF8
}

function Get-LastAnalyzedCommit {
    param([string]$Application, [string]$Branch)
    $metadata = Get-AnalysisMetadata
    $key = "$Application|$Branch"
    if ($metadata.ContainsKey($key)) {
        return $metadata[$key]
    }
    return $null
}

function Set-LastAnalyzedCommit {
    param([string]$Application, [string]$Branch, [string]$CommitHash, [string]$Timestamp)
    $metadata = Get-AnalysisMetadata
    $key = "$Application|$Branch"
    $metadata[$key] = @{
        LastCommit = $CommitHash
        LastAnalysis = $Timestamp
        AnalysisName = $AnalysisName
    }
    Save-AnalysisMetadata -Metadata $metadata
}

# =====================================================
# VALIDATE DATE PARAMETERS EARLY
# =====================================================
function Test-ValidDate {
    param([string]$DateString, [string]$ParameterName)
    
    if ([string]::IsNullOrWhiteSpace($DateString)) {
        return $true  # Empty is OK (optional parameter)
    }
    
    try {
        $parsedDate = [DateTime]::Parse($DateString)
        return $true
    } catch {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "                    DATE VALIDATION ERROR" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Host "Invalid date provided for -${ParameterName}: '$DateString'" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Please use a valid date format (yyyy-MM-dd). Examples:" -ForegroundColor Cyan
        Write-Host "  - 2025-12-01 (December 1, 2025)" -ForegroundColor Gray
        Write-Host "  - 2025-11-30 (November 30, 2025 - Note: November has 30 days)" -ForegroundColor Gray
        Write-Host "  - 2025-02-28 (February 28, 2025)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "Common mistakes:" -ForegroundColor Yellow
        Write-Host "  - November 31 does not exist (use November 30)" -ForegroundColor Gray
        Write-Host "  - February 30/31 does not exist (use February 28 or 29)" -ForegroundColor Gray
        Write-Host "  - April/June/September 31 does not exist (use 30)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        return $false
    }
}

# Validate StartDate
if ($StartDate -and -not (Test-ValidDate -DateString $StartDate -ParameterName "StartDate")) {
    exit 1
}

# Validate EndDate
if ($EndDate -and -not (Test-ValidDate -DateString $EndDate -ParameterName "EndDate")) {
    exit 1
}

# Validate date range logic (EndDate should not be before StartDate)
if ($StartDate -and $EndDate) {
    $start = [DateTime]::Parse($StartDate)
    $end = [DateTime]::Parse($EndDate)
    if ($end -lt $start) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "                    DATE RANGE ERROR" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Host "EndDate ($EndDate) cannot be before StartDate ($StartDate)" -ForegroundColor Red
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        exit 1
    }
}

# Determine date range display
$dateRangeDisplay = if ($StartDate -and $EndDate) {
    "$StartDate to $EndDate"
} elseif ($StartDate) {
    "$StartDate to Present"
} elseif ($EndDate) {
    "Beginning to $EndDate"
} else {
    "All Time (No date filter)"
}

# Determine analysis name (use provided name or generate default)
$analysisDisplayName = if ($AnalysisName) {
    $AnalysisName
} else {
    # Auto-generate from date range
    if ($StartDate -and $EndDate) {
        $startMonth = (Get-Date $StartDate).ToString("MMM")
        $endMonth = (Get-Date $EndDate).ToString("MMM-yyyy")
        "$startMonth-$endMonth"
    } elseif ($StartDate) {
        "From-$(Get-Date $StartDate -Format 'MMM-yyyy')"
    } else {
        "AllTime"
    }
}

# Start timing
$scriptStartTime = Get-Date

Write-Host @"

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     Copilot Usage Report - Batch Analysis (5-Tier)        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "Analysis Name: $analysisDisplayName" -ForegroundColor Yellow
Write-Host "Analysis Period: $dateRangeDisplay" -ForegroundColor Magenta

# Display mode indicators
$modeText = @()
if ($FullAnalysis) {
    $modeText += "Full Analysis (re-analyzing all commits)"
} else {
    $modeText += "Incremental Analysis (new commits only)"
}
if ($Parallel) {
    $modeText += "Parallel Processing ($MaxParallel threads)"
}
if ($CompareWith) {
    $modeText += "Comparison Mode (vs previous report)"
}
Write-Host "Mode: $($modeText -join ' | ')`n" -ForegroundColor DarkCyan

# Ensure config exists
if (-not (Test-Path $ConfigPath)) {
    Write-Error "Configuration file not found: $ConfigPath"
    exit 1
}

# Read configuration
Write-Host "Reading configuration..." -ForegroundColor Yellow
$allConfig = Import-Csv -Path $ConfigPath

# Filter to only enabled applications
$config = $allConfig | Where-Object { 
    $_.Enabled -eq 'true' -or $_.Enabled -eq 'True' -or $_.Enabled -eq $true 
}

# Apply ApplicationName filter if specified
if ($ApplicationName) {
    $config = $config | Where-Object { $_.ApplicationName -eq $ApplicationName }
    Write-Host "Filtering to application: $ApplicationName" -ForegroundColor Cyan
}

$disabledCount = ($allConfig | Where-Object { $_.Enabled -ne 'true' -and $_.Enabled -ne 'True' -and $_.Enabled -ne $true }).Count

if ($config.Count -eq 0) {
    Write-Error "No enabled applications found in configuration file"
    Write-Host "Tip: Set Enabled=true for applications you want to analyze" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found $($config.Count) enabled application(s) to process" -ForegroundColor Green
if ($disabledCount -gt 0) {
    Write-Host "Skipping $disabledCount disabled application(s)" -ForegroundColor DarkGray
}
Write-Host ""

# Setup paths
$scriptRoot = $PSScriptRoot
$tempPath = Join-Path (Split-Path $scriptRoot -Parent) "temp"
$reportsPath = Join-Path (Split-Path $scriptRoot -Parent) "reports"
$validateScript = Join-Path $scriptRoot "Validate-GitAccess.ps1"
$analyzeScript = Join-Path $scriptRoot "Analyze-CodeAuthorship.ps1"

# Create directories
if (-not (Test-Path $tempPath)) {
    New-Item -ItemType Directory -Path $tempPath -Force | Out-Null
}
if (-not (Test-Path $reportsPath)) {
    New-Item -ItemType Directory -Path $reportsPath -Force | Out-Null
}

# Step 1: Validate Git Access
Write-Host "═══ Step 1: Validating Git Access ═══`n" -ForegroundColor Cyan
& $validateScript -ConfigPath $ConfigPath

if ($LASTEXITCODE -ne 0) {
    Write-Error "Git access validation failed. Please resolve authentication issues before proceeding."
    exit 1
}

if ($ValidateOnly) {
    $scriptEndTime = Get-Date
    $elapsed = $scriptEndTime - $scriptStartTime
    $elapsedFormatted = "{0:D2}h {1:D2}m {2:D2}s" -f [int]$elapsed.TotalHours, $elapsed.Minutes, $elapsed.Seconds
    Write-Host "`nValidation complete. Exiting as requested." -ForegroundColor Green
    Write-Host "Total Time Elapsed: $elapsedFormatted" -ForegroundColor Magenta
    exit 0
}

# Step 2: Sync Repositories (Fetch/Pull instead of Clone)
Write-Host "`n═══ Step 2: Syncing Repositories ═══`n" -ForegroundColor Cyan

foreach ($app in $config) {
    $appName = $app.ApplicationName
    $gitUrl = $app.GitUrl
    $repoName = ($gitUrl -split '/')[-1] -replace '\.git$', ''
    $repoPath = Join-Path $tempPath $repoName
    
    Write-Host "Processing: $appName" -ForegroundColor Yellow
    Write-Host "  Repository: $repoName" -ForegroundColor Gray
    
    if (Test-Path $repoPath) {
        Write-Host "  Status: Repository exists, syncing (fetch/pull)..." -ForegroundColor Gray
        Push-Location $repoPath
        try {
            # Fetch all branches and prune deleted ones
            git fetch --all --prune 2>&1 | Out-Null
            
            # Get current branch
            $currentBranch = git rev-parse --abbrev-ref HEAD 2>&1
            
            # Pull latest for current branch
            git pull origin $currentBranch 2>&1 | Out-Null
            
            Write-Host "  ✓ Synced successfully" -ForegroundColor Green
        } catch {
            Write-Warning "  Failed to sync repository: $_"
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "  Status: Repository not found, cloning..." -ForegroundColor Gray
        try {
            git clone $gitUrl $repoPath 2>&1 | Out-Null
            Write-Host "  ✓ Cloned successfully" -ForegroundColor Green
        } catch {
            Write-Error "  Failed to clone repository: $_"
            continue
        }
    }
    Write-Host ""
}

# Step 3: Run Analysis
$incrementalMode = -not $FullAnalysis
$modeLabel = if ($incrementalMode) { "Incremental (new commits only)" } else { "Full (all commits)" }
Write-Host "═══ Step 3: Analyzing Code Authorship (5-Tier Model) - $modeLabel ═══`n" -ForegroundColor Cyan

$analysisResults = [System.Collections.Concurrent.ConcurrentBag[object]]::new()
$branchResults = [System.Collections.Concurrent.ConcurrentBag[object]]::new()
$successCount = 0
$failCount = 0
$skippedCount = 0
$newCommitsAnalyzed = 0
$previousCommitsLoaded = 0

# Build list of analysis tasks
$analysisTasks = @()
foreach ($app in $config) {
    $appName = $app.ApplicationName
    $gitUrl = $app.GitUrl
    $branches = $app.Branches -split ',' | ForEach-Object { $_.Trim().Trim('"') }
    $excludePaths = if ($app.PSObject.Properties['ExcludePaths']) { $app.ExcludePaths } else { "" }
    $owner = if ($app.PSObject.Properties['Owner']) { $app.Owner } else { "Unknown" }
    $repoName = ($gitUrl -split '/')[-1] -replace '\.git$', ''
    $repoPath = Join-Path $tempPath $repoName
    
    if (-not (Test-Path $repoPath)) {
        Write-Warning "Repository not found: $repoPath. Skipping $appName"
        $failCount++
        continue
    }
    
    foreach ($branch in $branches) {
        # Apply BranchFilter if specified
        if ($BranchFilter -and $branch -ne $BranchFilter) {
            continue
        }
        $analysisTasks += @{
            AppName = $appName
            Branch = $branch
            RepoPath = $repoPath
            Owner = $owner
            ExcludePaths = $excludePaths
        }
    }
}

# Function to process a single analysis task
$processAnalysisTask = {
    param($task, $reportsPath, $analyzeScript, $StartDate, $EndDate, $incrementalMode, $metadataPath, $AnalysisName, $FullAnalysis, $IncludeTestFiles)
    
    $appName = $task.AppName
    $branch = $task.Branch
    $repoPath = $task.RepoPath
    
    $result = @{
        Application = $appName
        Branch = $branch
        Status = "Pending"
        NewCommits = 0
        PreviousCommits = 0
        BranchStats = $null
        Error = $null
    }
    
    try {
        # Archive previous branch reports
        $branchFolder = Join-Path (Join-Path $reportsPath $appName) $branch
        if (Test-Path $branchFolder) {
            $branchArchiveFolder = Join-Path $branchFolder "archive"
            if (-not (Test-Path $branchArchiveFolder)) {
                New-Item -ItemType Directory -Path $branchArchiveFolder -Force | Out-Null
            }
            $archiveTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
            $archiveRunFolder = Join-Path $branchArchiveFolder $archiveTimestamp
            $itemsToArchive = Get-ChildItem -Path $branchFolder -File -Force -ErrorAction SilentlyContinue
            if ($itemsToArchive.Count -gt 0) {
                New-Item -ItemType Directory -Path $archiveRunFolder -Force | Out-Null
                foreach ($item in $itemsToArchive) {
                    Move-Item -Path $item.FullName -Destination $archiveRunFolder -Force
                }
            }
        }
        
        # Build parameters
        $params = @{
            RepoPath = $repoPath
            ApplicationName = $appName
            Branch = $branch
            OutputPath = $reportsPath
        }
        
        if ($StartDate) { $params['StartDate'] = $StartDate }
        if ($EndDate) { $params['EndDate'] = $EndDate }
        if ($IncludeTestFiles) { $params['IncludeTestFiles'] = $true }
        
        # INCREMENTAL ANALYSIS: Check for previous analysis data
        if ($incrementalMode -and -not $FullAnalysis) {
            # Look for previous analysis JSON
            $prevJsonPath = Join-Path $branchFolder "archive"
            $prevJson = $null
            if (Test-Path $prevJsonPath) {
                $archiveFolders = Get-ChildItem -Path $prevJsonPath -Directory | Sort-Object Name -Descending | Select-Object -First 1
                if ($archiveFolders) {
                    $prevJsonFile = Get-ChildItem -Path $archiveFolders.FullName -Filter "Analysis_*.json" -ErrorAction SilentlyContinue | Select-Object -First 1
                    if ($prevJsonFile) {
                        $prevJson = Get-Content $prevJsonFile.FullName -Raw | ConvertFrom-Json
                        $params['PreviousDataPath'] = $prevJsonFile.FullName
                        $result.PreviousCommits = $prevJson.Commits.Count
                    }
                }
            }
        }
        
        # Run analysis
        $branchStats = & $analyzeScript @params
        
        if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
            $result.Status = "Success"
            $result.BranchStats = $branchStats
            if ($branchStats) {
                $result.NewCommits = $branchStats.TotalCommits
            }
        } else {
            $result.Status = "Failed"
            $result.Error = "Exit code: $LASTEXITCODE"
        }
    } catch {
        $result.Status = "Error"
        $result.Error = $_.Exception.Message
    }
    
    return $result
}

# Execute analysis tasks (parallel or sequential)
if ($Parallel -and $PSVersionTable.PSVersion.Major -ge 7) {
    Write-Host "Running analysis in PARALLEL mode ($MaxParallel threads)..." -ForegroundColor Yellow
    Write-Host ""
    
    $taskResults = $analysisTasks | ForEach-Object -Parallel {
        $task = $_
        $reportsPath = $using:reportsPath
        $analyzeScript = $using:analyzeScript
        $StartDate = $using:StartDate
        $EndDate = $using:EndDate
        $incrementalMode = $using:incrementalMode
        $metadataPath = $using:metadataPath
        $AnalysisName = $using:AnalysisName
        $FullAnalysis = $using:FullAnalysis
        $IncludeTestFiles = $using:IncludeTestFiles
        
        # Inline processing logic (cannot use $using: with scriptblock)
        $appName = $task.AppName
        $branch = $task.Branch
        $repoPath = $task.RepoPath
        
        $result = @{
            Application = $appName
            Branch = $branch
            Status = "Pending"
            NewCommits = 0
            PreviousCommits = 0
            BranchStats = $null
            Error = $null
        }
        
        try {
            # Archive previous branch reports
            $branchFolder = Join-Path (Join-Path $reportsPath $appName) $branch
            if (Test-Path $branchFolder) {
                $branchArchiveFolder = Join-Path $branchFolder "archive"
                if (-not (Test-Path $branchArchiveFolder)) {
                    New-Item -ItemType Directory -Path $branchArchiveFolder -Force | Out-Null
                }
                $archiveTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
                $archiveRunFolder = Join-Path $branchArchiveFolder $archiveTimestamp
                $itemsToArchive = Get-ChildItem -Path $branchFolder -File -Force -ErrorAction SilentlyContinue
                if ($itemsToArchive.Count -gt 0) {
                    New-Item -ItemType Directory -Path $archiveRunFolder -Force | Out-Null
                    foreach ($item in $itemsToArchive) {
                        Move-Item -Path $item.FullName -Destination $archiveRunFolder -Force
                    }
                }
            }
            
            # Build parameters
            $params = @{
                RepoPath = $repoPath
                ApplicationName = $appName
                Branch = $branch
                OutputPath = $reportsPath
            }
            
            if ($StartDate) { $params['StartDate'] = $StartDate }
            if ($EndDate) { $params['EndDate'] = $EndDate }
            if ($IncludeTestFiles) { $params['IncludeTestFiles'] = $true }
            
            # INCREMENTAL ANALYSIS: Check for previous analysis data
            if ($incrementalMode -and -not $FullAnalysis) {
                $prevJsonPath = Join-Path $branchFolder "archive"
                if (Test-Path $prevJsonPath) {
                    $archiveFolders = Get-ChildItem -Path $prevJsonPath -Directory | Sort-Object Name -Descending | Select-Object -First 1
                    if ($archiveFolders) {
                        $prevJsonFile = Get-ChildItem -Path $archiveFolders.FullName -Filter "Analysis_*.json" -ErrorAction SilentlyContinue | Select-Object -First 1
                        if ($prevJsonFile) {
                            $prevJson = Get-Content $prevJsonFile.FullName -Raw | ConvertFrom-Json
                            $params['PreviousDataPath'] = $prevJsonFile.FullName
                            $result.PreviousCommits = $prevJson.Commits.Count
                        }
                    }
                }
            }
            
            # Run analysis
            $branchStats = & $analyzeScript @params
            
            if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
                $result.Status = "Success"
                $result.BranchStats = $branchStats
                if ($branchStats) {
                    $result.NewCommits = $branchStats.TotalCommits
                }
            } else {
                $result.Status = "Failed"
                $result.Error = "Exit code: $LASTEXITCODE"
            }
        } catch {
            $result.Status = "Error"
            $result.Error = $_.Exception.Message
        }
        
        return $result
    } -ThrottleLimit $MaxParallel
    
    # Process results
    foreach ($taskResult in $taskResults) {
        if ($taskResult.Status -eq "Success") {
            $successCount++
            $newCommitsAnalyzed += $taskResult.NewCommits
            $previousCommitsLoaded += $taskResult.PreviousCommits
            
            $analysisResults.Add([PSCustomObject]@{
                Application = $taskResult.Application
                Branch = $taskResult.Branch
                Status = "Success"
                Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            })
            
            if ($taskResult.BranchStats) {
                $branchResults.Add([PSCustomObject]@{
                    Application = $taskResult.Application
                    Branch = $taskResult.Branch
                    TotalCommits = $taskResult.BranchStats.TotalCommits
                    AICommits = $taskResult.BranchStats.AICommits
                    HumanCommits = $taskResult.BranchStats.HumanCommits
                    TotalLinesAdded = $taskResult.BranchStats.TotalLinesAdded
                    AILinesAdded = $taskResult.BranchStats.AILinesAdded
                    HumanLinesAdded = $taskResult.BranchStats.HumanLinesAdded
                    AIPercentage = $taskResult.BranchStats.AIPercentage
                    Tier1 = $taskResult.BranchStats.Tier1Commits
                    Tier2 = $taskResult.BranchStats.Tier2Commits
                    Tier3 = $taskResult.BranchStats.Tier3Commits
                    Tier4 = $taskResult.BranchStats.Tier4Commits
                    Tier5 = $taskResult.BranchStats.Tier5Commits
                    UniqueContributors = $taskResult.BranchStats.UniqueContributors
                })
            }
            
            Write-Host "  ✓ $($taskResult.Application) / $($taskResult.Branch) - $($taskResult.NewCommits) commits analyzed" -ForegroundColor Green
        } else {
            $failCount++
            Write-Host "  ✗ $($taskResult.Application) / $($taskResult.Branch) - $($taskResult.Error)" -ForegroundColor Red
            
            $analysisResults.Add([PSCustomObject]@{
                Application = $taskResult.Application
                Branch = $taskResult.Branch
                Status = $taskResult.Status
                Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            })
        }
    }
    
    Write-Host ""
} else {
    # Sequential processing (original behavior with enhancements)
    foreach ($task in $analysisTasks) {
        $appName = $task.AppName
        $branch = $task.Branch
        $repoPath = $task.RepoPath
        $owner = $task.Owner
        
        Write-Host "Analyzing: $appName" -ForegroundColor Yellow
        Write-Host "  Branch: $branch" -ForegroundColor Gray
        Write-Host "  Owner: $owner" -ForegroundColor Gray
        Write-Host "  Date Range: $dateRangeDisplay" -ForegroundColor Gray
        
        Write-Host "    Processing branch: $branch" -ForegroundColor Gray
        
        # Archive previous branch reports
        $branchFolder = Join-Path (Join-Path $reportsPath $appName) $branch
        if (Test-Path $branchFolder) {
            $branchArchiveFolder = Join-Path $branchFolder "archive"
            if (-not (Test-Path $branchArchiveFolder)) {
                New-Item -ItemType Directory -Path $branchArchiveFolder -Force | Out-Null
            }
            $archiveTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
            $archiveRunFolder = Join-Path $branchArchiveFolder $archiveTimestamp
            $itemsToArchive = Get-ChildItem -Path $branchFolder -File -Force -ErrorAction SilentlyContinue
            if ($itemsToArchive.Count -gt 0) {
                New-Item -ItemType Directory -Path $archiveRunFolder -Force | Out-Null
                Write-Host "      Archiving previous reports to: $branch\archive\$archiveTimestamp" -ForegroundColor DarkGray
                foreach ($item in $itemsToArchive) {
                    Move-Item -Path $item.FullName -Destination $archiveRunFolder -Force
                }
            }
        }
        
        try {
            # Build parameters
            $params = @{
                RepoPath = $repoPath
                ApplicationName = $appName
                Branch = $branch
                OutputPath = $reportsPath
            }
            
            if ($StartDate) { $params['StartDate'] = $StartDate }
            if ($EndDate) { $params['EndDate'] = $EndDate }
            if ($IncludeTestFiles) { $params['IncludeTestFiles'] = $true }
            
            # INCREMENTAL ANALYSIS: Check for previous analysis data
            $prevCommitsCount = 0
            if ($incrementalMode -and -not $FullAnalysis) {
                $prevJsonPath = Join-Path $branchFolder "archive"
                if (Test-Path $prevJsonPath) {
                    $archiveFolders = Get-ChildItem -Path $prevJsonPath -Directory | Sort-Object Name -Descending | Select-Object -First 1
                    if ($archiveFolders) {
                        $prevJsonFile = Get-ChildItem -Path $archiveFolders.FullName -Filter "Analysis_*.json" -ErrorAction SilentlyContinue | Select-Object -First 1
                        if ($prevJsonFile) {
                            $params['PreviousDataPath'] = $prevJsonFile.FullName
                            $prevData = Get-Content $prevJsonFile.FullName -Raw | ConvertFrom-Json
                            $prevCommitsCount = $prevData.Commits.Count
                            Write-Host "      Incremental mode: Loading $prevCommitsCount previous commits" -ForegroundColor DarkCyan
                        }
                    }
                }
            }
            
            # Run analysis
            $branchStats = & $analyzeScript @params
            
            if ($LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE) {
                Write-Host "      ✓ Analysis complete" -ForegroundColor Green
                $successCount++
                $newCommitsAnalyzed += ($branchStats.TotalCommits - $prevCommitsCount)
                $previousCommitsLoaded += $prevCommitsCount
                
                $analysisResults.Add([PSCustomObject]@{
                    Application = $appName
                    Branch = $branch
                    Status = "Success"
                    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                })
                
                if ($branchStats) {
                    $branchResults.Add([PSCustomObject]@{
                        Application = $appName
                        Branch = $branch
                        TotalCommits = $branchStats.TotalCommits
                        AICommits = $branchStats.AICommits
                        HumanCommits = $branchStats.HumanCommits
                        TotalLinesAdded = $branchStats.TotalLinesAdded
                        AILinesAdded = $branchStats.AILinesAdded
                        HumanLinesAdded = $branchStats.HumanLinesAdded
                        AIPercentage = $branchStats.AIPercentage
                        Tier1 = $branchStats.Tier1Commits
                        Tier2 = $branchStats.Tier2Commits
                        Tier3 = $branchStats.Tier3Commits
                        Tier4 = $branchStats.Tier4Commits
                        Tier5 = $branchStats.Tier5Commits
                        UniqueContributors = $branchStats.UniqueContributors
                    })
                }
            } else {
                Write-Warning "      Analysis failed with exit code: $LASTEXITCODE"
                $failCount++
                
                $analysisResults.Add([PSCustomObject]@{
                    Application = $appName
                    Branch = $branch
                    Status = "Failed"
                    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                })
            }
        } catch {
            Write-Warning "      Error during analysis: $_"
            $failCount++
            
            $analysisResults.Add([PSCustomObject]@{
                Application = $appName
                Branch = $branch
                Status = "Error: $_"
                Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            })
        }
        
        Write-Host ""
    }
}

# Convert ConcurrentBag to arrays for processing
$branchResults = @($branchResults.ToArray())
$analysisResults = @($analysisResults.ToArray())

# Generate Application-Level Summaries
Write-Host "Generating application-level summaries..." -ForegroundColor Gray
$uniqueApps = $branchResults | Select-Object -ExpandProperty Application -Unique
foreach ($appName in $uniqueApps) {
    $appBranchResults = $branchResults | Where-Object { $_.Application -eq $appName }
    if ($appBranchResults -and $appBranchResults.Count -gt 0) {
        $appFolder = Join-Path $reportsPath $appName
        if (-not (Test-Path $appFolder)) {
            New-Item -ItemType Directory -Path $appFolder -Force | Out-Null
        }
        
        # Calculate application-level statistics
        $appTotalCommits = ($appBranchResults | Measure-Object -Property TotalCommits -Sum).Sum
        $appAICommits = ($appBranchResults | Measure-Object -Property AICommits -Sum).Sum
        $appHumanCommits = ($appBranchResults | Measure-Object -Property HumanCommits -Sum).Sum
        $appTotalLines = ($appBranchResults | Measure-Object -Property TotalLinesAdded -Sum).Sum
        $appAILines = ($appBranchResults | Measure-Object -Property AILinesAdded -Sum).Sum
        $appHumanLines = ($appBranchResults | Measure-Object -Property HumanLinesAdded -Sum).Sum
        $appAIPercent = if ($appTotalLines -gt 0) { [Math]::Round(($appAILines / $appTotalLines) * 100, 2) } else { 0 }
        $appHumanPercent = [Math]::Round(100 - $appAIPercent, 2)
        
        # Tier totals for the application
        $appTier1 = ($appBranchResults | Measure-Object -Property Tier1 -Sum).Sum
        $appTier2 = ($appBranchResults | Measure-Object -Property Tier2 -Sum).Sum
        $appTier3 = ($appBranchResults | Measure-Object -Property Tier3 -Sum).Sum
        $appTier4 = ($appBranchResults | Measure-Object -Property Tier4 -Sum).Sum
        $appTier5 = ($appBranchResults | Measure-Object -Property Tier5 -Sum).Sum
        $appTotalAITierCommits = $appTier1 + $appTier2 + $appTier3 + $appTier4 + $appTier5
        
        # Unique contributors across all branches
        $appContributors = ($appBranchResults | Measure-Object -Property UniqueContributors -Sum).Sum
        
        # Generate application summary markdown
        $appSummaryPath = Join-Path $appFolder "$($appName)_Summary.md"
        $appTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        
        $appSummaryContent = @"
# $appName - Application Summary

> Consolidated analysis across all branches using 5-Tier AI Detection Model

**Generated:** $appTimestamp  
**Analysis Period:** $dateRangeDisplay

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Application** | $appName |
| **Branches Analyzed** | $($appBranchResults.Count) |
| **Total Contributors** | $appContributors |
| **Overall AI Usage** | **$appAIPercent%** |

---

## Overall Statistics

### Code Attribution

| Category | Lines | Percentage | Commits |
|----------|-------|------------|---------|
| **AI-Assisted** | $appAILines | $appAIPercent% | $appAICommits |
| **Human-Written** | $appHumanLines | $appHumanPercent% | $appHumanCommits |
| **Total** | $appTotalLines | 100% | $appTotalCommits |

### Visual Summary

``````
AI-Assisted:   $('█' * [Math]::Floor($appAIPercent / 5))$('░' * (20 - [Math]::Floor($appAIPercent / 5))) $appAIPercent%
Human-Written: $('█' * [Math]::Floor($appHumanPercent / 5))$('░' * (20 - [Math]::Floor($appHumanPercent / 5))) $appHumanPercent%
``````

---

## 5-Tier Confidence Distribution

| Tier | Confidence | Description | Commits | Percentage |
|------|------------|-------------|---------|------------|
| **Tier 1** | 99-100% | Definitive AI markers | $appTier1 | $(if ($appTotalAITierCommits -gt 0) { [Math]::Round(($appTier1 / $appTotalAITierCommits) * 100, 1) } else { 0 })% |
| **Tier 2** | 90-98% | Very high confidence | $appTier2 | $(if ($appTotalAITierCommits -gt 0) { [Math]::Round(($appTier2 / $appTotalAITierCommits) * 100, 1) } else { 0 })% |
| **Tier 3** | 80-89% | High confidence | $appTier3 | $(if ($appTotalAITierCommits -gt 0) { [Math]::Round(($appTier3 / $appTotalAITierCommits) * 100, 1) } else { 0 })% |
| **Tier 4** | 70-79% | Moderate confidence | $appTier4 | $(if ($appTotalAITierCommits -gt 0) { [Math]::Round(($appTier4 / $appTotalAITierCommits) * 100, 1) } else { 0 })% |
| **Tier 5** | 60-69% | Low confidence | $appTier5 | $(if ($appTotalAITierCommits -gt 0) { [Math]::Round(($appTier5 / $appTotalAITierCommits) * 100, 1) } else { 0 })% |
| **Human** | <60% | No AI detected | $appHumanCommits | $(if ($appTotalCommits -gt 0) { [Math]::Round(($appHumanCommits / $appTotalCommits) * 100, 1) } else { 0 })% |

---

## Branch-Level Breakdown

| Branch | Commits | AI Commits | AI Lines | AI % | T1 | T2 | T3 | T4 | T5 | Contributors |
|--------|---------|------------|----------|------|----|----|----|----|-----|--------------|
$(($appBranchResults | ForEach-Object {
    "| **$($_.Branch)** | $($_.TotalCommits) | $($_.AICommits) | $($_.AILinesAdded) | $($_.AIPercentage)% | $($_.Tier1) | $($_.Tier2) | $($_.Tier3) | $($_.Tier4) | $($_.Tier5) | $($_.UniqueContributors) |"
}) -join "`n")

---

## Branch Reports

$(($appBranchResults | ForEach-Object {
    $branchFolder = $_.Branch -replace '[\\/:*?"<>|]', '_'
    "- **$($_.Branch)**: [$branchFolder/]($branchFolder/) - AI: $($_.AIPercentage)%"
}) -join "`n")

---

## Key Insights

$(if ($appAIPercent -ge 80) {
@"
### High AI Adoption
This application shows **strong AI-assisted development** with $appAIPercent% of code attributed to AI tools.
- Tier 1-2 (High confidence AI): $($appTier1 + $appTier2) commits
- Primary development appears to leverage Copilot effectively
"@
} elseif ($appAIPercent -ge 50) {
@"
### Balanced Development
This application shows **balanced AI-human collaboration** with $appAIPercent% AI-assisted code.
- Mix of AI-assisted and human-written code
- AI tools supplementing developer productivity
"@
} else {
@"
### Human-Centric Development
This application is **primarily human-written** with only $appAIPercent% AI-assisted code.
- Most commits are traditional human development
- AI tools used selectively or minimally
"@
})

---

*Generated by Copilot Usage Report Tool - 5-Tier Analysis Model*
"@

        $appSummaryContent | Out-File -FilePath $appSummaryPath -Encoding UTF8
        Write-Host "    Application summary saved: $appSummaryPath" -ForegroundColor Cyan
    }
}

# Generate Consolidated Reports
Write-Host "═══ Step 4: Generating Consolidated Reports ═══`n" -ForegroundColor Cyan

# Archive previous reports-level files (excluding index.md and application folders)
$reportsArchiveFolder = Join-Path $reportsPath "archive"
if (-not (Test-Path $reportsArchiveFolder)) {
    New-Item -ItemType Directory -Path $reportsArchiveFolder -Force | Out-Null
}

# Get files to archive (exclude: index.md, archive folder, and application folders)
$appFolderNames = $config | ForEach-Object { $_.ApplicationName }
$filesToArchive = Get-ChildItem -Path $reportsPath -File -Force | Where-Object { 
    $_.Name -ne "index.md" -and 
    $_.Name -ne "README.md" -and
    $_.Name -ne "CopilotDashboard.html" -and
    $_.Name -ne "Git-Access-Validation-Report.csv" -and
    $_.Name -ne "Git-Access-Validation-Report.md"
}

if ($filesToArchive.Count -gt 0) {
    $archiveTimestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $archiveRunFolder = Join-Path $reportsArchiveFolder $archiveTimestamp
    New-Item -ItemType Directory -Path $archiveRunFolder -Force | Out-Null
    Write-Host "Archiving previous consolidated reports to: archive\$archiveTimestamp" -ForegroundColor DarkGray
    
    foreach ($file in $filesToArchive) {
        Move-Item -Path $file.FullName -Destination $archiveRunFolder -Force
    }
}

$timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'

# Summary CSV
$summaryPath = Join-Path $reportsPath "Batch-Analysis-Summary.csv"
$analysisResults | Export-Csv -Path $summaryPath -NoTypeInformation -Force

# Branch-Level Consolidated CSV
$branchSummaryPath = Join-Path $reportsPath "Branch-Level-Summary_${timestamp}.csv"
if ($branchResults.Count -gt 0) {
    $branchResults | Export-Csv -Path $branchSummaryPath -NoTypeInformation -Force
    Write-Host "Branch-level summary saved: $branchSummaryPath" -ForegroundColor Green
}

# Aggregate File Type Statistics from all branch reports
Write-Host "Aggregating file type statistics..." -ForegroundColor Gray
$aggregatedFileTypes = @{}

foreach ($br in $branchResults) {
    $appFolder = $br.Application -replace '[\\/:*?"<>|]', '_'
    $branchFolder = $br.Branch -replace '[\\/:*?"<>|]', '_'
    $branchReportPath = Join-Path $reportsPath $appFolder $branchFolder
    
    $latestJson = Get-ChildItem -Path $branchReportPath -Filter "Analysis_*.json" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($latestJson) {
        try {
            $jsonObject = Get-Content $latestJson.FullName -Raw | ConvertFrom-Json
            if ($jsonObject.FileTypeBreakdown) {
                foreach ($ft in $jsonObject.FileTypeBreakdown) {
                    $ext = $ft.Extension
                    if (-not $aggregatedFileTypes.ContainsKey($ext)) {
                        $aggregatedFileTypes[$ext] = @{ TotalLines = 0; AILines = 0; FileCount = 0 }
                    }
                    $aggregatedFileTypes[$ext].TotalLines += [int]$ft.TotalLines
                    $aggregatedFileTypes[$ext].AILines += [int]$ft.AILines
                    $aggregatedFileTypes[$ext].FileCount += [int]$ft.FileCount
                }
            }
        } catch {
            # Skip if can't parse
        }
    }
}

# Convert aggregated file types to sorted array
$fileTypeAnalysis = $aggregatedFileTypes.GetEnumerator() | 
    Where-Object { $_.Value.TotalLines -gt 0 } |
    Sort-Object { $_.Value.TotalLines } -Descending |
    ForEach-Object {
        [PSCustomObject]@{
            Extension = $_.Key
            TotalLines = $_.Value.TotalLines
            AILines = $_.Value.AILines
            AIPercentage = [Math]::Round(($_.Value.AILines / [Math]::Max(1, $_.Value.TotalLines)) * 100, 2)
            FileCount = $_.Value.FileCount
        }
    }

if ($aggregatedFileTypes.Count -gt 0) {
    Write-Host "  Aggregated $($aggregatedFileTypes.Count) file types from all branches" -ForegroundColor Green
}

# Consolidated JSON Report
$jsonSummaryPath = Join-Path $reportsPath "Consolidated-Analysis_${timestamp}.json"
$consolidatedJson = @{
    GeneratedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    AnalysisPeriod = @{
        StartDate = if ($StartDate) { $StartDate } else { "All Time" }
        EndDate = if ($EndDate) { $EndDate } else { "Present" }
        FilterApplied = ($StartDate -or $EndDate)
    }
    Summary = @{
        TotalApplications = $config.Count
        SuccessfulAnalyses = $successCount
        FailedAnalyses = $failCount
        TotalBranches = $branchResults.Count
    }
    OverallStatistics = @{
        TotalCommits = ($branchResults | Measure-Object -Property TotalCommits -Sum).Sum
        TotalAICommits = ($branchResults | Measure-Object -Property AICommits -Sum).Sum
        TotalHumanCommits = ($branchResults | Measure-Object -Property HumanCommits -Sum).Sum
        TotalLinesAdded = ($branchResults | Measure-Object -Property TotalLinesAdded -Sum).Sum
        TotalAILinesAdded = ($branchResults | Measure-Object -Property AILinesAdded -Sum).Sum
        TotalTier1 = ($branchResults | Measure-Object -Property Tier1 -Sum).Sum
        TotalTier2 = ($branchResults | Measure-Object -Property Tier2 -Sum).Sum
        TotalTier3 = ($branchResults | Measure-Object -Property Tier3 -Sum).Sum
        TotalTier4 = ($branchResults | Measure-Object -Property Tier4 -Sum).Sum
        TotalTier5 = ($branchResults | Measure-Object -Property Tier5 -Sum).Sum
    }
    FileTypeAnalysis = @($fileTypeAnalysis)
    BranchDetails = $branchResults
    AnalysisResults = $analysisResults
}
$consolidatedJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonSummaryPath -Encoding UTF8
Write-Host "Consolidated JSON saved: $jsonSummaryPath" -ForegroundColor Green

# Generate consolidated markdown summary with branch details
$mdSummaryPath = Join-Path $reportsPath "Batch-Analysis-Summary.md"

# Calculate overall stats
$totalCommits = ($branchResults | Measure-Object -Property TotalCommits -Sum).Sum
$totalAICommits = ($branchResults | Measure-Object -Property AICommits -Sum).Sum
$totalLines = ($branchResults | Measure-Object -Property TotalLinesAdded -Sum).Sum
$totalAILines = ($branchResults | Measure-Object -Property AILinesAdded -Sum).Sum
$overallAIPercent = if ($totalLines -gt 0) { [Math]::Round(($totalAILines / $totalLines) * 100, 2) } else { 0 }

$mdContent = @"
# Batch Analysis Summary - 5-Tier Model

**Analysis Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Period:** $dateRangeDisplay

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Applications Processed** | $($config.Count) |
| **Successful Analyses** | $successCount |
| **Failed Analyses** | $failCount |
| **Total Branches Analyzed** | $($branchResults.Count) |

---

## Overall Statistics (All Branches Combined)

| Metric | Value |
|--------|-------|
| **Total Commits** | $totalCommits |
| **AI-Assisted Commits** | $totalAICommits |
| **Human Commits** | $($totalCommits - $totalAICommits) |
| **Total Lines Added** | $totalLines |
| **AI-Assisted Lines** | $totalAILines ($overallAIPercent%) |
| **Human-Written Lines** | $($totalLines - $totalAILines) ($([Math]::Round(100 - $overallAIPercent, 2))%) |

---

## 5-Tier Distribution (Overall)

| Tier | Description | Commits |
|------|-------------|---------|
| **Tier 1** | Definitive AI (99-100%) | $(($branchResults | Measure-Object -Property Tier1 -Sum).Sum) |
| **Tier 2** | Very High Confidence (90-98%) | $(($branchResults | Measure-Object -Property Tier2 -Sum).Sum) |
| **Tier 3** | High Confidence (80-89%) | $(($branchResults | Measure-Object -Property Tier3 -Sum).Sum) |
| **Tier 4** | Moderate Confidence (70-79%) | $(($branchResults | Measure-Object -Property Tier4 -Sum).Sum) |
| **Tier 5** | Low Confidence (60-69%) | $(($branchResults | Measure-Object -Property Tier5 -Sum).Sum) |
| **Human** | No AI Detected | $($totalCommits - $totalAICommits) |

---

## Branch-Level Details

| Application | Branch | Commits | AI Commits | AI Lines | AI % | T1 | T2 | T3 | T4 | T5 | Contributors |
|-------------|--------|---------|------------|----------|------|----|----|----|----|-----|--------------|
$(($branchResults | ForEach-Object {
    "| $($_.Application) | $($_.Branch) | $($_.TotalCommits) | $($_.AICommits) | $($_.AILinesAdded) | $($_.AIPercentage)% | $($_.Tier1) | $($_.Tier2) | $($_.Tier3) | $($_.Tier4) | $($_.Tier5) | $($_.UniqueContributors) |"
}) -join "`n")

---

## Analysis Status

| Application | Branch | Status | Timestamp |
|-------------|--------|--------|-----------|
$(($analysisResults | ForEach-Object {
    $statusIcon = if ($_.Status -eq "Success") { "✓" } else { "✗" }
    "| $($_.Application) | $($_.Branch) | $statusIcon $($_.Status) | $($_.Timestamp) |"
}) -join "`n")

---

## Reports Location

All detailed reports are available in: ``$reportsPath``

### Report Structure

Each application has reports organized by branch:
- ``[Application]/[Branch]/UserAnalysis_[Branch]_[timestamp].csv`` - User-level statistics
- ``[Application]/[Branch]/BranchAnalysis_[Branch]_[timestamp].csv`` - Branch summary
- ``[Application]/[Branch]/Analysis_[Branch]_[timestamp].json`` - Complete JSON data
- ``[Application]/[Branch]/Analysis_[Branch]_[timestamp].md`` - Human-readable report

### Consolidated Reports
- ``Branch-Level-Summary_[timestamp].csv`` - All branches in one file
- ``Consolidated-Analysis_[timestamp].json`` - Full JSON with all data

---

## Methodology

### 5-Tier Confidence Model

| Tier | Confidence | Description |
|------|------------|-------------|
| 1 | 99-100% | Explicit AI markers (Copilot mentions, AI tags) |
| 2 | 90-98% | Strong AI signatures (advanced patterns) |
| 3 | 80-89% | Common AI-generated patterns |
| 4 | 70-79% | Moderate AI indicators |
| 5 | 60-69% | Weak AI indicators |

---

*Generated by Copilot Usage Report Tool - 5-Tier Analysis Model*
"@

$mdContent | Out-File -FilePath $mdSummaryPath -Encoding UTF8
Write-Host "Markdown summary saved: $mdSummaryPath" -ForegroundColor Green

# =====================================================
# Generate/Update index.md with Application-Level Stats
# =====================================================
Write-Host "Updating index.md..." -ForegroundColor Gray

$indexPath = Join-Path $reportsPath "index.md"

# Calculate Application-Level Statistics
$appStats = @{}
foreach ($br in $branchResults) {
    $appName = $br.Application
    if (-not $appStats.ContainsKey($appName)) {
        $appStats[$appName] = @{
            TotalCommits = 0
            AICommits = 0
            HumanCommits = 0
            TotalLinesAdded = 0
            AILinesAdded = 0
            Branches = @()
        }
    }
    $appStats[$appName].TotalCommits += $br.TotalCommits
    $appStats[$appName].AICommits += $br.AICommits
    $appStats[$appName].HumanCommits += $br.HumanCommits
    $appStats[$appName].TotalLinesAdded += $br.TotalLinesAdded
    $appStats[$appName].AILinesAdded += $br.AILinesAdded
    $appStats[$appName].Branches += $br.Branch
}

# Calculate AI percentage for each application
$appSummaryRows = @()
foreach ($appName in $appStats.Keys | Sort-Object) {
    $app = $appStats[$appName]
    $aiPercent = if ($app.TotalLinesAdded -gt 0) { 
        [Math]::Round(($app.AILinesAdded / $app.TotalLinesAdded) * 100, 2) 
    } else { 0 }
    
    $appSummaryRows += [PSCustomObject]@{
        Application = $appName
        AIPercentage = $aiPercent
        TotalCommits = $app.TotalCommits
        AICommits = $app.AICommits
        HumanCommits = $app.HumanCommits
        TotalLines = $app.TotalLinesAdded
        AILines = $app.AILinesAdded
        Branches = ($app.Branches -join ", ")
    }
}

# Read existing index.md to preserve history
$existingHistory = @()
if (Test-Path $indexPath) {
    $existingContent = Get-Content $indexPath -Raw
    
    # Extract existing history rows (lines starting with | after the history table header)
    $lines = $existingContent -split "`n"
    $inHistorySection = $false
    foreach ($line in $lines) {
        if ($line -match '^\| Run Date') {
            $inHistorySection = $true
            continue  # Skip header row
        }
        if ($inHistorySection -and $line -match '^\|[-|\s]+$') {
            continue  # Skip separator row
        }
        if ($inHistorySection -and $line -match '^\| \d{4}-\d{2}-\d{2}') {
            $existingHistory += $line.Trim()
        }
        if ($inHistorySection -and $line -match '^---') {
            break  # End of history section
        }
    }
}

# Create new history row
$runDate = Get-Date -Format "yyyy-MM-dd HH:mm"
$newHistoryRow = "| $runDate | $dateRangeDisplay | $($config.Count) | $($branchResults.Count) | $overallAIPercent% | [Summary](Batch-Analysis-Summary.md), [JSON](Consolidated-Analysis_${timestamp}.json) |"

# Combine new + existing history (keep last 20 runs)
$allHistoryRows = @($newHistoryRow)
if ($existingHistory.Count -gt 0) {
    $allHistoryRows += $existingHistory | Select-Object -First 19
}
$historySection = $allHistoryRows -join "`n"

# Build application reports section
$appReportsSection = ""
foreach ($appName in $appStats.Keys | Sort-Object) {
    $appFolder = $appName -replace '[\\/:*?"<>|]', '_'
    $appReportsSection += "`n#### $appName`n`n"
    
    foreach ($branch in ($branchResults | Where-Object { $_.Application -eq $appName } | Select-Object -ExpandProperty Branch -Unique)) {
        $branchFolder = $branch -replace '[\\/:*?"<>|]', '_'
        $appReportsSection += "- **$branch Branch**: [$appName/$branch]($appFolder/$branchFolder/)`n"
    }
    $appReportsSection += "`n"
}

# Add timestamp to current reports
$appReportsSection += "`n**Latest Reports (${runDate}):**`n`n"
foreach ($br in $branchResults) {
    $appFolder = $br.Application -replace '[\\/:*?"<>|]', '_'
    $branchFolder = $br.Branch -replace '[\\/:*?"<>|]', '_'
    $appReportsSection += "- [$($br.Application) - $($br.Branch)]($appFolder/$branchFolder/) - AI: $($br.AIPercentage)%`n"
}

# Build the complete index.md
$indexContent = @"
# Copilot Usage Report - Analysis Index

> Auto-generated index of all analysis reports with application-level AI usage statistics.
> 
> **Last Updated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## Application-Level AI Usage Summary

| Application | AI Usage % | Total Commits | AI Commits | Human Commits | Total Lines | AI Lines | Branches |
|-------------|------------|---------------|------------|---------------|-------------|----------|----------|
$(($appSummaryRows | ForEach-Object {
    "| **$($_.Application)** | **$($_.AIPercentage)%** | $($_.TotalCommits) | $($_.AICommits) | $($_.HumanCommits) | $($_.TotalLines) | $($_.AILines) | $($_.Branches) |"
}) -join "`n")

### Overall AI Usage: **$overallAIPercent%**

---

## Analysis History

### Recent Runs

| Run Date | Period | Applications | Branches | Overall AI % | Reports |
|----------|--------|--------------|----------|--------------|---------|
$historySection

---

## Report Links

### By Application
$appReportsSection

---

## Quick Links

- [Batch Analysis Summary](Batch-Analysis-Summary.md)
- [Branch-Level Summary CSV](Branch-Level-Summary_${timestamp}.csv)
- [Consolidated Analysis JSON](Consolidated-Analysis_${timestamp}.json)
- [Git Access Validation Report](Git-Access-Validation-Report.md)

---

## 5-Tier Confidence Model

| Tier | Confidence Range | Description |
|------|-----------------|-------------|
| **Tier 1** | 99-100% | Definitive AI markers (Copilot mentions, AI tags) |
| **Tier 2** | 90-98% | Strong AI signatures (advanced patterns) |
| **Tier 3** | 80-89% | Common AI-generated patterns |
| **Tier 4** | 70-79% | Moderate AI indicators |
| **Tier 5** | 60-69% | Weak AI indicators |

---

*This index is automatically updated on each analysis run.*
*Generated by Copilot Usage Report Tool*
"@

$indexContent | Out-File -FilePath $indexPath -Encoding UTF8
Write-Host "Index updated: $indexPath" -ForegroundColor Green

# =====================================================
# Generate Consolidated JSON for Dashboard
# =====================================================
Write-Host "Generating Dashboard Data..." -ForegroundColor Gray

$consolidatedFolder = Join-Path $reportsPath "consolidated"
if (-not (Test-Path $consolidatedFolder)) {
    New-Item -ItemType Directory -Path $consolidatedFolder -Force | Out-Null
}

# Collect all branch JSON files into a single consolidated report
# Parse each JSON, add ApplicationName, and convert back to JSON
$dashboardJsonParts = @()
foreach ($br in $branchResults) {
    $appFolder = $br.Application -replace '[\\/:*?"<>|]', '_'
    $branchFolder = $br.Branch -replace '[\\/:*?"<>|]', '_'
    $branchReportPath = Join-Path $reportsPath $appFolder $branchFolder
    
    # Find the latest Analysis JSON file
    $latestJson = Get-ChildItem -Path $branchReportPath -Filter "Analysis_*.json" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 1
    
    if ($latestJson) {
        try {
            # Parse JSON, add ApplicationName, and convert back
            $jsonObject = Get-Content $latestJson.FullName -Raw | ConvertFrom-Json
            # Add ApplicationName to the object
            $jsonObject | Add-Member -NotePropertyName "ApplicationName" -NotePropertyValue $br.Application -Force
            # Convert back to JSON with proper depth to preserve nested structure
            $jsonWithAppName = $jsonObject | ConvertTo-Json -Depth 20 -Compress:$false
            $dashboardJsonParts += $jsonWithAppName.Trim()
        } catch {
            Write-Warning "Could not parse: $($latestJson.FullName)"
        }
    }
}

# Save consolidated dashboard JSON by manually creating the array with metadata
$dashboardJsonPath = Join-Path $consolidatedFolder "ConsolidatedReport_${timestamp}.json"

# Aggregate file type statistics for dashboard
$dashboardFileTypes = @{}
foreach ($jsonPart in $dashboardJsonParts) {
    try {
        $obj = $jsonPart | ConvertFrom-Json
        if ($obj.FileTypeBreakdown) {
            foreach ($ft in $obj.FileTypeBreakdown) {
                $ext = $ft.Extension
                if (-not $dashboardFileTypes.ContainsKey($ext)) {
                    $dashboardFileTypes[$ext] = @{ TotalLines = 0; AILines = 0; FileCount = 0 }
                }
                $dashboardFileTypes[$ext].TotalLines += [int]$ft.TotalLines
                $dashboardFileTypes[$ext].AILines += [int]$ft.AILines
                $dashboardFileTypes[$ext].FileCount += [int]$ft.FileCount
            }
        }
    } catch { }
}

# Convert to array format for JSON
$fileTypeArray = $dashboardFileTypes.GetEnumerator() | 
    Where-Object { $_.Value.TotalLines -gt 0 } |
    Sort-Object { $_.Value.TotalLines } -Descending |
    ForEach-Object {
        @{
            Extension = $_.Key
            TotalLines = $_.Value.TotalLines
            AILines = $_.Value.AILines
            AIPercentage = [Math]::Round(($_.Value.AILines / [Math]::Max(1, $_.Value.TotalLines)) * 100, 2)
            FileCount = $_.Value.FileCount
        }
    }

$fileTypeJson = if ($fileTypeArray.Count -gt 0) {
    ($fileTypeArray | ConvertTo-Json -Compress:$false)
} else {
    "[]"
}

# Create wrapper object with metadata and data array
$consolidatedWithMetadata = @"
{
  "_metadata": {
    "analysisName": "$analysisDisplayName",
    "timestamp": "$timestamp",
    "timestampUTC": "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') UTC",
    "dateRange": "$dateRangeDisplay"
  },
  "fileTypeAnalysis": $fileTypeJson,
  "data": [
$($dashboardJsonParts -join ",`n")
  ]
}
"@

$consolidatedWithMetadata | Out-File -FilePath $dashboardJsonPath -Encoding UTF8
Write-Host "Dashboard data saved: $dashboardJsonPath" -ForegroundColor Green

# =====================================================
# UPDATE INDEX.JSON: Regenerate index from actual files in consolidated folder
# =====================================================
$indexJsonPath = Join-Path $consolidatedFolder "index.json"
$consolidatedReports = Get-ChildItem -Path $consolidatedFolder -Filter "ConsolidatedReport_*.json" -ErrorAction SilentlyContinue | 
    Sort-Object LastWriteTime -Descending

$indexReports = @()
$isFirst = $true
foreach ($reportFile in $consolidatedReports) {
    try {
        $reportContent = Get-Content $reportFile.FullName -Raw | ConvertFrom-Json
        $indexEntry = @{
            filename = $reportFile.Name
            name = if ($reportContent._metadata.analysisName) { $reportContent._metadata.analysisName } else { "Analysis" }
            date = if ($reportContent._metadata.timestampUTC) { $reportContent._metadata.timestampUTC } else { $reportFile.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss") }
            dateRange = if ($reportContent._metadata.dateRange) { $reportContent._metadata.dateRange } else { "Unknown" }
        }
        if ($isFirst) {
            $indexEntry.isLatest = $true
            $isFirst = $false
        }
        $indexReports += $indexEntry
    } catch {
        Write-Warning "Could not parse $($reportFile.Name) for index: $_"
    }
}

$indexData = @{
    reports = $indexReports
    lastUpdated = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}
$indexData | ConvertTo-Json -Depth 5 | Out-File -FilePath $indexJsonPath -Encoding UTF8
Write-Host "Index updated: $indexJsonPath ($($indexReports.Count) reports)" -ForegroundColor Green

# =====================================================
# COMPARE REPORTS: Generate comparison if -CompareWith provided
# =====================================================
$comparisonReport = $null
if ($CompareWith -and (Test-Path $CompareWith)) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "                    REPORT COMPARISON" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        $previousReport = Get-Content $CompareWith -Raw | ConvertFrom-Json
        $currentReport = $consolidatedWithMetadata | ConvertFrom-Json
        
        $previousData = if ($previousReport.data) { $previousReport.data } else { @($previousReport) }
        $currentData = if ($currentReport.data) { $currentReport.data } else { @($currentReport) }
        
        Write-Host "Comparing with: $CompareWith" -ForegroundColor Cyan
        Write-Host ""
        
        # Calculate totals for previous report
        $prevTotalCommits = 0
        $prevAICommits = 0
        $prevTotalLines = 0
        $prevAILines = 0
        foreach ($app in $previousData) {
            $prevTotalCommits += [int]($app.TotalCommits ?? 0)
            $prevAICommits += [int]($app.AICommits ?? 0)
            $prevTotalLines += [int]($app.TotalLinesAdded ?? 0)
            $prevAILines += [int]($app.AILinesAdded ?? 0)
        }
        
        # Calculate totals for current report
        $currTotalCommits = 0
        $currAICommits = 0
        $currTotalLines = 0
        $currAILines = 0
        foreach ($app in $currentData) {
            $currTotalCommits += [int]($app.TotalCommits ?? 0)
            $currAICommits += [int]($app.AICommits ?? 0)
            $currTotalLines += [int]($app.TotalLinesAdded ?? 0)
            $currAILines += [int]($app.AILinesAdded ?? 0)
        }
        
        # Calculate AI percentages
        $prevAIPercent = if ($prevTotalCommits -gt 0) { [math]::Round(($prevAICommits / $prevTotalCommits) * 100, 1) } else { 0 }
        $currAIPercent = if ($currTotalCommits -gt 0) { [math]::Round(($currAICommits / $currTotalCommits) * 100, 1) } else { 0 }
        
        # Calculate changes
        $commitChange = $currTotalCommits - $prevTotalCommits
        $aiCommitChange = $currAICommits - $prevAICommits
        $lineChange = $currTotalLines - $prevTotalLines
        $aiLineChange = $currAILines - $prevAILines
        $aiPercentChange = $currAIPercent - $prevAIPercent
        
        # Format change indicators
        function Format-Change($value) {
            if ($value -gt 0) { return "+$value" }
            return "$value"
        }
        
        function Get-ChangeColor($value) {
            if ($value -gt 0) { return "Green" }
            if ($value -lt 0) { return "Red" }
            return "Gray"
        }
        
        Write-Host "┌─────────────────────────────────────────────────────────┐" -ForegroundColor DarkGray
        Write-Host "│  Metric              │  Previous  │  Current   │ Change │" -ForegroundColor DarkGray
        Write-Host "├─────────────────────────────────────────────────────────┤" -ForegroundColor DarkGray
        Write-Host ("│  Total Commits       │  {0,8}  │  {1,8}  │ {2,6} │" -f $prevTotalCommits, $currTotalCommits, (Format-Change $commitChange)) -ForegroundColor $(Get-ChangeColor $commitChange)
        Write-Host ("│  AI Commits          │  {0,8}  │  {1,8}  │ {2,6} │" -f $prevAICommits, $currAICommits, (Format-Change $aiCommitChange)) -ForegroundColor $(Get-ChangeColor $aiCommitChange)
        Write-Host ("│  AI Percentage       │  {0,7}%  │  {1,7}%  │ {2,5}% │" -f $prevAIPercent, $currAIPercent, (Format-Change $aiPercentChange)) -ForegroundColor $(Get-ChangeColor $aiPercentChange)
        Write-Host ("│  Total Lines Added   │  {0,8}  │  {1,8}  │ {2,6} │" -f $prevTotalLines, $currTotalLines, (Format-Change $lineChange)) -ForegroundColor $(Get-ChangeColor $lineChange)
        Write-Host ("│  AI Lines Added      │  {0,8}  │  {1,8}  │ {2,6} │" -f $prevAILines, $currAILines, (Format-Change $aiLineChange)) -ForegroundColor $(Get-ChangeColor $aiLineChange)
        Write-Host "└─────────────────────────────────────────────────────────┘" -ForegroundColor DarkGray
        
        # Per-application comparison
        Write-Host ""
        Write-Host "Per-Application Changes:" -ForegroundColor White
        Write-Host ""
        
        foreach ($currApp in $currentData) {
            $appName = $currApp.ApplicationName
            $prevApp = $previousData | Where-Object { $_.ApplicationName -eq $appName }
            
            $prevAppAI = if ($prevApp) { [decimal]($prevApp.AIPercentage ?? 0) } else { 0 }
            $currAppAI = [decimal]($currApp.AIPercentage ?? 0)
            $appChange = [math]::Round($currAppAI - $prevAppAI, 1)
            
            $changeIndicator = if ($appChange -gt 0) { "▲" } elseif ($appChange -lt 0) { "▼" } else { "─" }
            $changeColor = Get-ChangeColor $appChange
            
            if ($prevApp) {
                Write-Host "  $appName : ${prevAppAI}% → ${currAppAI}% ($changeIndicator $(Format-Change $appChange)%)" -ForegroundColor $changeColor
            } else {
                Write-Host "  $appName : NEW (${currAppAI}%)" -ForegroundColor Cyan
            }
        }
        
        # Check for removed applications
        foreach ($prevApp in $previousData) {
            $appName = $prevApp.ApplicationName
            $currApp = $currentData | Where-Object { $_.ApplicationName -eq $appName }
            if (-not $currApp) {
                Write-Host "  $appName : REMOVED (was $($prevApp.AIPercentage)%)" -ForegroundColor DarkGray
            }
        }
        
        Write-Host ""
        
        # Save comparison report
        $comparisonReport = [PSCustomObject]@{
            ComparisonTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            PreviousReportPath = $CompareWith
            CurrentReportPath = $dashboardJsonPath
            Summary = @{
                PreviousTotalCommits = $prevTotalCommits
                CurrentTotalCommits = $currTotalCommits
                CommitChange = $commitChange
                PreviousAICommits = $prevAICommits
                CurrentAICommits = $currAICommits
                AICommitChange = $aiCommitChange
                PreviousAIPercent = $prevAIPercent
                CurrentAIPercent = $currAIPercent
                AIPercentChange = $aiPercentChange
            }
        }
        
        $comparisonPath = Join-Path $consolidatedFolder "ComparisonReport_${timestamp}.json"
        $comparisonReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $comparisonPath -Encoding UTF8
        Write-Host "Comparison report saved: $comparisonPath" -ForegroundColor Green
        
    } catch {
        Write-Warning "Could not compare reports: $_"
    }
} elseif ($CompareWith) {
    Write-Warning "Previous report not found: $CompareWith"
}

# =====================================================
# Update Dashboard HTML with Latest Report Paths
# =====================================================
$dashboardHtmlPath = Join-Path $reportsPath "CopilotDashboard.html"
if (Test-Path $dashboardHtmlPath) {
    Write-Host "Updating Dashboard HTML..." -ForegroundColor Gray
    
    # Get all archived reports for dropdown - extract analysis name from each JSON
    $archivedReports = Get-ChildItem -Path $consolidatedFolder -Filter "ConsolidatedReport_*.json" -ErrorAction SilentlyContinue | 
        Sort-Object LastWriteTime -Descending | 
        ForEach-Object {
            $dateMatch = $_.BaseName -replace 'ConsolidatedReport_', ''
            $displayTimestamp = $dateMatch -replace '_', ' ' -replace '-(\d{2})-(\d{2})-(\d{2})$', ' $1:$2:$3'
            
            # Try to read analysis name from metadata
            $reportAnalysisName = $null
            try {
                $jsonContent = Get-Content $_.FullName -Raw | ConvertFrom-Json
                if ($jsonContent._metadata -and $jsonContent._metadata.analysisName) {
                    $reportAnalysisName = $jsonContent._metadata.analysisName
                }
            } catch { }
            
            # Build display label: "AnalysisName - Timestamp (UTC)" or just timestamp for old reports
            $displayLabel = if ($reportAnalysisName) {
                "$reportAnalysisName - $displayTimestamp (UTC)"
            } else {
                $displayTimestamp
            }
            
            # Add Latest tag
            $displayLabel += $(if ($_.Name -eq "ConsolidatedReport_${timestamp}.json") { " (Latest)" } else { "" })
            
            # Store analysis name separately for trend chart
            @{
                label = $displayLabel
                path = "consolidated/$($_.Name)"
                analysisName = if ($reportAnalysisName) { $reportAnalysisName } else { $displayTimestamp.Split(' ')[0] }
            }
        }
    
    # Build the JavaScript config string
    $jsArchivedReports = ($archivedReports | ForEach-Object {
        "                { label: `"$($_.label)`", path: `"$($_.path)`", analysisName: `"$($_.analysisName)`" }"
    }) -join ",`n"
    
    $newConfig = @"
        // ============================================
        // REPORT CONFIGURATION - AUTO-UPDATED BY SCRIPT
        // ============================================
        const REPORT_CONFIG = {
            // Latest report path (auto-updated)
            latestReport: "consolidated/ConsolidatedReport_${timestamp}.json",
            
            // Available archived reports (auto-updated)
            archivedReports: [
$jsArchivedReports
            ],
            
            // Last updated timestamp
            lastUpdated: "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        };
        // ============================================
"@
    
    # Read current dashboard content
    $dashboardContent = Get-Content $dashboardHtmlPath -Raw
    
    # Replace the config section
    $configPattern = '(?s)        // ============================================\s*\n        // REPORT CONFIGURATION - AUTO-UPDATED BY SCRIPT\s*\n        // ============================================\s*\n        const REPORT_CONFIG = \{.*?\};?\s*\n        // ============================================'
    
    if ($dashboardContent -match $configPattern) {
        $dashboardContent = $dashboardContent -replace $configPattern, $newConfig
        
        # Also update embedded data for offline/local file access
        $embeddedDataSection = @"

        // ============================================
        // EMBEDDED DATA - AUTO-GENERATED BY SCRIPT
        // This allows the dashboard to work without an HTTP server
        // ============================================
        const EMBEDDED_DATA = $consolidatedWithMetadata;
        // ============================================

        let currentData = null;
"@
        
        $embeddedPattern = '(?s)        // ============================================\s*\n        // EMBEDDED DATA - AUTO-GENERATED BY SCRIPT\s*\n.*?// ============================================\s*\n\s*let currentData = null;'
        
        if ($dashboardContent -match $embeddedPattern) {
            $dashboardContent = $dashboardContent -replace $embeddedPattern, $embeddedDataSection
            Write-Host "Dashboard embedded data updated" -ForegroundColor Green
        } else {
            # Fallback: insert after config if embedded section doesn't exist
            $insertPattern = '// ============================================\s+let currentData = null;'
            if ($dashboardContent -match $insertPattern) {
                $dashboardContent = $dashboardContent -replace $insertPattern, $embeddedDataSection
                Write-Host "Dashboard embedded data inserted" -ForegroundColor Green
            }
        }
        
        $dashboardContent | Out-File -FilePath $dashboardHtmlPath -Encoding UTF8 -NoNewline
        Write-Host "Dashboard HTML updated with latest report paths" -ForegroundColor Green
    } else {
        Write-Warning "Could not find config section in Dashboard HTML - manual update may be needed"
    }
}

# Final Summary Output
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    ANALYSIS SUMMARY" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Analysis Period: $dateRangeDisplay" -ForegroundColor Magenta
Write-Host ""
Write-Host "Applications Processed: $($config.Count)" -ForegroundColor White
Write-Host "Branches Analyzed: $($branchResults.Count)" -ForegroundColor White
Write-Host "Successful Analyses: $successCount" -ForegroundColor Green
Write-Host "Failed Analyses: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
Write-Host ""
Write-Host "Overall AI Usage: $overallAIPercent%" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reports Location: $reportsPath" -ForegroundColor Yellow
Write-Host ""

# Calculate and display elapsed time
$scriptEndTime = Get-Date
$elapsed = $scriptEndTime - $scriptStartTime
$elapsedFormatted = "{0:D2}h {1:D2}m {2:D2}s" -f [int]$elapsed.TotalHours, $elapsed.Minutes, $elapsed.Seconds
Write-Host "Total Time Elapsed: $elapsedFormatted" -ForegroundColor Magenta
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    BATCH ANALYSIS COMPLETE" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Exit with appropriate code
if ($failCount -gt 0) {
    exit 1
} else {
    exit 0
}
