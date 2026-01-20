<#
.SYNOPSIS
    Analyzes code authorship to determine AI-assisted vs human-written code

.DESCRIPTION
    Analyzes Git commits to identify which lines of code were written by AI assistance (like GitHub Copilot)
    versus human-written code. Uses sophisticated 5-tier pattern detection and confidence scoring.
    
    Supports manual AI attribution overrides via config/ai-attribution.csv for cases where AI-generated
    code cannot be detected automatically (e.g., Copilot Chat without git trailers).

.PARAMETER RepoPath
    Path to the Git repository to analyze

.PARAMETER ApplicationName
    Name of the application being analyzed

.PARAMETER Branch
    Git branch to analyze

.PARAMETER StartDate
    Start date for analysis (format: yyyy-MM-dd). If not provided, analyzes all history.

.PARAMETER EndDate
    End date for analysis (format: yyyy-MM-dd). If not provided, uses current date.

.PARAMETER OutputPath
    Path where reports will be saved

.PARAMETER IncludeTestFiles
    When specified, includes test files in AI pattern analysis (by default test files are excluded to reduce false positives)

.PARAMETER AIAttributionPath
    Path to AI attribution CSV file for manual overrides. Default: config/ai-attribution.csv

.EXAMPLE
    .\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "main"
    
.EXAMPLE
    .\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "main" -StartDate "2025-09-01" -EndDate "2026-01-07"

.EXAMPLE
    .\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "main" -PreviousDataPath "reports\archive\Analysis.json"
    # Incremental analysis: merges with previous data

.EXAMPLE
    .\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "test-branch" -IncludeTestFiles
    # Analyze including test files (for branches with AI-generated tests)

.EXAMPLE
    .\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "test-branch" -IncludeTestFiles
    # Analyze including test files for AI pattern detection
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$RepoPath,
    
    [Parameter(Mandatory=$true)]
    [string]$ApplicationName,
    
    [Parameter(Mandatory=$true)]
    [string]$Branch,
    
    [Parameter()]
    [string]$StartDate,
    
    [Parameter()]
    [string]$EndDate,
    
    [Parameter()]
    [string]$OutputPath = (Join-Path $PSScriptRoot "..\reports"),
    
    [Parameter()]
    [string]$PreviousDataPath,
    
    [Parameter()]
    [switch]$IncludeTestFiles = $false,
    
    [Parameter()]
    [string]$AIAttributionPath = (Join-Path $PSScriptRoot "..\config\ai-attribution.csv")
)

# Change to repository directory
Push-Location $RepoPath

try {
    Write-Host "`n=== Analyzing Code Authorship ===" -ForegroundColor Cyan
    Write-Host "Application: $ApplicationName" -ForegroundColor Yellow
    Write-Host "Branch: $Branch" -ForegroundColor Yellow
    Write-Host "Repository: $RepoPath" -ForegroundColor Gray
    
    # Display date range info
    $dateRangeMsg = if ($StartDate -and $EndDate) {
        "Date Range: $StartDate to $EndDate"
    } elseif ($StartDate) {
        "Date Range: $StartDate to Present"
    } elseif ($EndDate) {
        "Date Range: Beginning to $EndDate"
    } else {
        "Date Range: All Time (No date filter)"
    }
    Write-Host "$dateRangeMsg`n" -ForegroundColor Magenta

    # Sync repository - fetch and pull latest
    Write-Host "Syncing repository..." -ForegroundColor Gray
    git fetch --all --prune 2>&1 | Out-Null
    
    # Checkout branch
    git checkout $Branch 2>&1 | Out-Null
    git pull origin $Branch 2>&1 | Out-Null
    Write-Host "Repository synced successfully`n" -ForegroundColor Green

    # =====================================================
    # INCREMENTAL ANALYSIS: Load previous data if available
    # =====================================================
    $previousCommits = @()
    $previousCommitHashes = @{}
    $lastAnalyzedCommit = $null
    $previousFileTypeStats = @{}
    
    if ($PreviousDataPath -and (Test-Path $PreviousDataPath)) {
        Write-Host "Loading previous analysis data for incremental mode..." -ForegroundColor Cyan
        try {
            $previousData = Get-Content $PreviousDataPath -Raw | ConvertFrom-Json
            if ($previousData.Commits) {
                $previousCommits = $previousData.Commits
                foreach ($c in $previousCommits) {
                    $previousCommitHashes[$c.Hash] = $true
                }
                # Get the most recent commit hash from previous data
                if ($previousCommits.Count -gt 0) {
                    $lastAnalyzedCommit = $previousCommits[0].Hash
                }
                Write-Host "  Loaded $($previousCommits.Count) previously analyzed commits" -ForegroundColor Green
                Write-Host "  Last analyzed commit: $($lastAnalyzedCommit.Substring(0, 8))..." -ForegroundColor Gray
            }
            # Load previous file type breakdown for merging
            if ($previousData.FileTypeBreakdown) {
                foreach ($ft in $previousData.FileTypeBreakdown) {
                    $previousFileTypeStats[$ft.Extension] = @{
                        TotalLines = [int]$ft.TotalLines
                        AILines = [int]$ft.AILines
                        Files = [int]$ft.FileCount
                    }
                }
                Write-Host "  Loaded file type data for $($previousFileTypeStats.Count) extensions" -ForegroundColor Gray
            }
        } catch {
            Write-Warning "Failed to load previous data: $_"
            $previousCommits = @()
        }
    }

    # =====================================================
    # AI ATTRIBUTION: Load manual AI attribution config
    # =====================================================
    $aiAttributionOverrides = @{}
    if ($AIAttributionPath -and (Test-Path $AIAttributionPath)) {
        Write-Host "Loading AI attribution configuration..." -ForegroundColor Cyan
        try {
            $attributionData = Import-Csv $AIAttributionPath | Where-Object { $_.ApplicationName -eq $ApplicationName }
            foreach ($attr in $attributionData) {
                $key = if ($attr.Branch) { $attr.Branch } else { "default" }
                $aiAttributionOverrides[$key] = @{
                    PRNumber = $attr.PRNumber
                    AIPercentage = [int]$attr.AIPercentage
                    StartDate = $attr.StartDate
                    EndDate = $attr.EndDate
                    Notes = $attr.Notes
                }
                Write-Host "  Found AI attribution for branch '$key': $($attr.AIPercentage)% AI" -ForegroundColor Yellow
            }
        } catch {
            Write-Warning "Failed to load AI attribution config: $_"
        }
    }
    
    # Check if current branch has an AI attribution override
    $branchAttribution = $null
    if ($aiAttributionOverrides.ContainsKey($Branch)) {
        $branchAttribution = $aiAttributionOverrides[$Branch]
        Write-Host "  AI Attribution Override Active: $($branchAttribution.AIPercentage)% for branch '$Branch'" -ForegroundColor Magenta
        Write-Host "  Reason: $($branchAttribution.Notes)" -ForegroundColor Gray
    }

    # Build git log command with date filtering
    # --no-merges: Exclude merge commits - we only want actual code commits, not PR merges
    $gitLogCmd = "git log $Branch --no-merges --numstat --pretty=format:'COMMIT:%H|%an|%ae|%ad|%s'"
    
    # INCREMENTAL: If we have previous data, only get commits since last analyzed
    if ($lastAnalyzedCommit -and -not $StartDate) {
        $gitLogCmd += " $lastAnalyzedCommit..HEAD"
        Write-Host "Incremental mode: Fetching commits since $($lastAnalyzedCommit.Substring(0, 8))..." -ForegroundColor Cyan
    } else {
        if ($StartDate) {
            $gitLogCmd += " --since='$StartDate'"
            Write-Host "Filtering from: $StartDate" -ForegroundColor Gray
        }
        if ($EndDate) {
            $gitLogCmd += " --until='$EndDate'"
            Write-Host "Filtering until: $EndDate" -ForegroundColor Gray
        }
    }
    
    Write-Host ""

    # Get commit data
    Write-Host "Fetching commit history for branch: $Branch..." -ForegroundColor Gray
    $gitOutput = Invoke-Expression $gitLogCmd
    
    # Track if this is incremental with no new commits
    $noNewCommits = $false
    if (-not $gitOutput) {
        if ($previousCommits.Count -gt 0) {
            # Incremental mode with no new commits - use previous data only
            Write-Host "No new commits found. Using $($previousCommits.Count) previously analyzed commits." -ForegroundColor Yellow
            $noNewCommits = $true
        } else {
            Write-Warning "No commits found for the specified criteria on branch $Branch"
            return
        }
    }

    # =====================================================
    # IMPROVED 5-TIER AI DETECTION WITH WEIGHTED SCORING
    # =====================================================
    
    # Git Trailers - Definitive AI markers in commit metadata
    # IMPORTANT: Patterns must be specific to avoid false positives on human names/emails
    $gitTrailers = @(
        'Co-authored-by:.*[Cc]opilot',
        'Co-authored-by:\s*AI\s',                    # Standalone "AI" as author name
        'Co-authored-by:.*\bAI\s*<',                 # AI followed by email bracket
        'Co-authored-by:.*[Gg]ithub.*[Aa]ssistant',
        'Signed-off-by:.*[Cc]opilot',
        'Generated-by:.*[Cc]opilot',
        'AI-assisted:\s*true'
    )

    # Tier 1 (99-100%): Explicit AI/Copilot markers - Weight: 100
    $tier1Patterns = @(
        @{ Pattern = 'GitHub Copilot'; Weight = 100 },
        @{ Pattern = 'Generated by Copilot'; Weight = 100 },
        @{ Pattern = 'Co-authored-by:.*[Cc]opilot'; Weight = 100 },
        @{ Pattern = '\[AI\]'; Weight = 100 },
        @{ Pattern = '\[copilot\]'; Weight = 100 },
        @{ Pattern = '#\s*AI generated'; Weight = 100 },
        @{ Pattern = '//\s*copilot'; Weight = 100 },
        @{ Pattern = 'auto-generated'; Weight = 95 },
        @{ Pattern = '@ai-assisted'; Weight = 100 },
        @{ Pattern = 'AI-generated'; Weight = 100 },
        @{ Pattern = '<author>System Generated</author>'; Weight = 100 }
    )

    # Tier 2 (90-98%): Strong AI signatures - Weight: 15-25
    # These are patterns that AI commonly produces but humans rarely write this way
    $tier2Patterns = @(
        # AI-style verbose inline comments
        @{ Pattern = '//\s*[A-Z][a-z]+\s+the\s+\w+\s+(to|from|for|with)\s+'; Weight = 20 },
        @{ Pattern = '#\s*[A-Z][a-z]+\s+the\s+\w+\s+(to|from|for|with)\s+'; Weight = 20 },
        
        # AI's comprehensive error handling blocks
        @{ Pattern = 'try\s*\{[\s\S]{50,}catch[\s\S]{20,}finally'; Weight = 18 },
        @{ Pattern = 'ArgumentNullException.*nameof'; Weight = 15 },
        @{ Pattern = 'if\s*\(\s*string\.IsNullOrEmpty\s*\([^)]+\)\s*\)\s*throw'; Weight = 18 },
        @{ Pattern = 'if\s*\(\s*string\.IsNullOrWhiteSpace\s*\([^)]+\)\s*\)\s*throw'; Weight = 18 },
        
        # AI placeholder naming patterns
        @{ Pattern = '\$result\d+'; Weight = 15 },
        @{ Pattern = '\$response\d+'; Weight = 15 },
        @{ Pattern = '\$data\d+'; Weight = 12 },
        @{ Pattern = 'var result\d*\s*='; Weight = 12 },
        @{ Pattern = 'const response\d*\s*='; Weight = 12 },
        
        # Comprehensive parameter validation (AI signature)
        @{ Pattern = 'throw new ArgumentException\(.*paramName'; Weight = 18 },
        @{ Pattern = '\.ConfigureAwait\(false\)'; Weight = 15 },
        
        # AI-style region comments
        @{ Pattern = '#region\s+\w+\s+\w+\s+\w+'; Weight = 12 },
        
        # Redux Toolkit patterns (very common in AI-generated React code)
        @{ Pattern = 'createAsyncThunk\s*\('; Weight = 18 },
        @{ Pattern = 'extraReducers:\s*\(builder\)'; Weight = 20 },
        @{ Pattern = '\.addCase\(\w+\.(pending|fulfilled|rejected)'; Weight = 15 },
        @{ Pattern = 'createSlice\s*\(\s*\{'; Weight = 15 },
        
        # Python Unit Test AI patterns (Copilot-generated test code)
        @{ Pattern = 'mock\.patch\s*\([''"][\w.]+[''"]'; Weight = 18 },
        @{ Pattern = 'sys\.modules\s*\[[''"][\w.]+[''"]'; Weight = 20 },
        @{ Pattern = '@patch\s*\([''"][\w.]+[''"]'; Weight = 15 },
        @{ Pattern = 'MagicMock\s*\(\s*\)'; Weight = 15 },
        @{ Pattern = 'mock_\w+\s*=\s*MagicMock'; Weight = 18 },
        @{ Pattern = 'assert_called_once_with\s*\('; Weight = 12 },
        @{ Pattern = 'return_value\s*=\s*\{'; Weight = 15 },
        @{ Pattern = 'side_effect\s*=\s*\['; Weight = 15 }
    )

    # Tier 3 (80-89%): High confidence patterns - Weight: 8-14
    # Patterns that suggest AI but could also be experienced developers
    $tier3Patterns = @(
        # Structured exception handling
        @{ Pattern = 'catch\s*\(\s*Exception\s+\w+\s*\)\s*\{[\s\S]*?throw;'; Weight = 12 },
        @{ Pattern = '\?\?\s*throw\s+new'; Weight = 10 },
        
        # Advanced async with specific patterns
        @{ Pattern = 'await\s+Task\.WhenAll'; Weight = 10 },
        @{ Pattern = 'await\s+Task\.WhenAny'; Weight = 10 },
        @{ Pattern = 'async\s+Task<[^>]+>\s+\w+Async\s*\('; Weight = 8 },
        
        # React with generics (more specific)
        @{ Pattern = 'useCallback<[^>]+>\s*\('; Weight = 10 },
        @{ Pattern = 'useMemo<[^>]+>\s*\('; Weight = 10 },
        @{ Pattern = 'React\.FC<\w+Props>'; Weight = 8 },
        
        # Comprehensive logging patterns
        @{ Pattern = '_logger\.Log(Information|Warning|Error|Debug)\([^)]*\$"'; Weight = 10 },
        @{ Pattern = 'ILogger<\w+>\s+_logger'; Weight = 8 },
        
        # Python comprehensive type hints
        @{ Pattern = 'def\s+\w+\([^)]*:\s*\w+[^)]*\)\s*->\s*\w+:'; Weight = 8 },
        @{ Pattern = 'from\s+typing\s+import\s+[A-Z]\w+,\s*[A-Z]\w+'; Weight = 10 },
        
        # Redux Toolkit additional patterns
        @{ Pattern = 'type\s+PayloadAction<'; Weight = 10 },
        @{ Pattern = 'state\.\w+\s*=\s*action\.payload'; Weight = 8 },
        @{ Pattern = 'useAppDispatch|useAppSelector'; Weight = 8 },
        @{ Pattern = '\.unwrap\(\)\.then\('; Weight = 12 },
        @{ Pattern = 'dispatch\(\w+\(\)\)'; Weight = 8 },
        
        # HTTP client patterns (AI loves axios/fetch abstractions)
        @{ Pattern = 'httpClient\.\w+\s*\('; Weight = 10 },
        @{ Pattern = 'axiosInstance\.\w+\s*\('; Weight = 10 }
    )

    # Tier 4 (70-79%): Moderate indicators - Weight: 4-7
    # Common modern patterns - need multiple matches
    $tier4Patterns = @(
        # Standard modern syntax (low weight individually)
        @{ Pattern = '\?\?\.'; Weight = 5 },
        @{ Pattern = '\?\?='; Weight = 5 },
        @{ Pattern = 'record\s+\w+\s*\('; Weight = 5 },
        
        # DI patterns
        @{ Pattern = 'IOptions<\w+>'; Weight = 4 },
        @{ Pattern = 'AddScoped<\w+,\s*\w+>'; Weight = 4 },
        @{ Pattern = 'AddTransient<\w+,\s*\w+>'; Weight = 4 },
        @{ Pattern = 'AddSingleton<\w+,\s*\w+>'; Weight = 4 },
        
        # Modern JS/TS
        @{ Pattern = 'interface\s+\w+Props\s*\{'; Weight = 5 },
        @{ Pattern = 'useState<[^>]+>\('; Weight = 5 },
        @{ Pattern = 'useEffect\(\s*\(\)\s*=>\s*\{'; Weight = 5 },
        
        # Python
        @{ Pattern = 'Optional\[\w+\]'; Weight = 5 },
        @{ Pattern = '@dataclass'; Weight = 5 },
        @{ Pattern = 'async\s+def\s+\w+'; Weight = 4 },
        
        # Redux/State management patterns
        @{ Pattern = 'initialState:\s*\w+State'; Weight = 6 },
        @{ Pattern = 'reducers:\s*\{'; Weight = 5 },
        @{ Pattern = 'import\s*\{[^}]*createSlice[^}]*\}'; Weight = 6 },
        @{ Pattern = 'export\s+const\s+\w+Slice\s*='; Weight = 7 },
        @{ Pattern = 'memo\(\s*\(\s*\{'; Weight = 5 },
        @{ Pattern = 'useCallback\(\s*async'; Weight = 6 }
    )

    # Tier 5 (60-69%): Weak indicators - Weight: 2-3
    # Very common patterns - need many matches
    $tier5Patterns = @(
        @{ Pattern = '\?\.\w+'; Weight = 2 },
        @{ Pattern = '\?\?'; Weight = 2 },
        @{ Pattern = 'await\s+\w+'; Weight = 2 },
        @{ Pattern = '\.map\(\w+\s*=>'; Weight = 2 },
        @{ Pattern = '\.filter\(\w+\s*=>'; Weight = 2 },
        @{ Pattern = '\.reduce\(\s*\('; Weight = 2 },
        @{ Pattern = 'const\s+\w+\s*=\s*async'; Weight = 3 },
        @{ Pattern = '@property'; Weight = 2 },
        @{ Pattern = 'f"[^"]*\{\w+\}[^"]*"'; Weight = 2 },
        @{ Pattern = 'List\[\w+\]'; Weight = 2 },
        @{ Pattern = 'Dict\[\w+,\s*\w+\]'; Weight = 2 }
    )

    # Scoring thresholds (weighted)
    $tier1Threshold = 90   # Any Tier 1 match = definitive
    $tier2Threshold = 40   # Weighted score needed for Tier 2
    $tier3Threshold = 30   # Weighted score needed for Tier 3
    $tier4Threshold = 25   # Weighted score needed for Tier 4
    $tier5Threshold = 15   # Weighted score needed for Tier 5

    # ADVANCED: Files to exclude from AI pattern analysis
    # NOTE: Empty by default - all files are analyzed. Add patterns here if needed:
    # Example patterns:
    #   '\.test\.'       - Test files
    #   '\.spec\.'       - Spec files
    #   'tests?/'         - Test directories
    #   '__tests__/'      - Jest test directories
    #   'package-lock\.json' - Lock files
    $excludeFilePatterns = @(
        # Add exclusion patterns here if needed
    )

    # ADVANCED: Commit message patterns that indicate non-AI commits
    $humanCommitPatterns = @(
        'Merge\s+(branch|pull)',
        'Revert\s+"',
        'Update\s+\w+\.md',
        'bump\s+version',
        'release\s+v?\d',
        'hotfix',
        'cherry-pick'
    )

    # ADVANCED: Commit message patterns that suggest AI involvement
    $aiCommitMessagePatterns = @(
        @{ Pattern = 'Add\s+\w+\s+\w+\s+for\s+'; Weight = 8 },   # AI-style: "Add error handling for..."
        @{ Pattern = 'Implement\s+\w+\s+\w+'; Weight = 8 },     # AI-style: "Implement user authentication"
        @{ Pattern = 'Create\s+\w+\s+component'; Weight = 10 },  # AI-style React
        @{ Pattern = 'Refactor\s+\w+\s+to\s+use'; Weight = 8 },  # AI-style refactoring
        @{ Pattern = 'Update\s+\w+\s+to\s+handle'; Weight = 6 }  # AI-style updates
    )

    # Parse commits
    Write-Host "Parsing commits and analyzing patterns..." -ForegroundColor Gray
    $commits = @()
    $currentCommit = $null
    $files = @()
    
    # IMPROVEMENT: Track file type statistics
    $fileTypeStats = @{}

    # Add progress counter for parsing
    $lineCount = ($gitOutput | Measure-Object).Count
    $processedLines = 0
    
    foreach ($line in $gitOutput) {
        $processedLines++
        if ($processedLines % 500 -eq 0) {
            Write-Host "  Parsing line $processedLines of $lineCount..." -ForegroundColor DarkGray
        }
        
        if ($line -match '^COMMIT:(.+)\|(.+)\|(.+)\|(.+)\|(.+)$') {
            # Save previous commit
            if ($currentCommit) {
                $currentCommit.Files = $files
                $commits += $currentCommit
            }
            
            # Get commit hash, author, email, date and message IMMEDIATELY after match
            # IMPORTANT: Must capture before any other -match operations that overwrite $matches
            $commitHash = $matches[1]
            $authorName = $matches[2]
            $authorEmail = $matches[3]
            $commitDate = $matches[4]
            $commitMessage = $matches[5]
            
            # Quick check: Only fetch full message if message hints at AI (optimization)
            $fullCommitMsg = $commitMessage
            $hasAITrailer = $false
            
            # Only fetch full commit body if the subject line suggests AI involvement
            $shouldFetchFull = $commitMessage -match '(?i)copilot|AI|generated|automated|auto-fix'
            if ($shouldFetchFull) {
                $fullCommitMsg = git log -1 --format="%B" $commitHash 2>$null
                
                # Check for git trailers (Co-authored-by, etc.)
                foreach ($trailer in $gitTrailers) {
                    if ($fullCommitMsg -match $trailer) {
                        $hasAITrailer = $true
                        break
                    }
                }
            }
            
            # Get author name and validate (skip commits with empty/null authors like merge commits)
            if ([string]::IsNullOrWhiteSpace($authorName) -or $authorName -eq 'null' -or $authorName -eq 'Unknown') {
                # Skip this commit - it's likely a merge commit or has invalid author
                # Set currentCommit to null so subsequent file lines are also skipped
                $currentCommit = $null
                $files = @()
                continue
            }
            
            # Start new commit
            $currentCommit = [PSCustomObject]@{
                Hash = $commitHash
                Author = $authorName.Trim()
                Email = $authorEmail
                Date = $commitDate
                Message = $commitMessage
                FullMessage = $fullCommitMsg
                HasAITrailer = $hasAITrailer
                Files = @()
                LinesAdded = 0
                LinesDeleted = 0
                IsAI = $false
                ConfidenceScore = 0
                ConfidenceTier = ""
                TierNumber = 0
                WeightedScore = 0
            }
            $files = @()
            
        } elseif (($line -match '^(\d+|-)\s+(\d+|-)\s+(.+)$' -or $line -match '^(\d+|-)\t(\d+|-)\t(.+)$') -and $currentCommit) {
            # File change line - only process if we have a valid current commit
            # Note: git numstat uses tabs, but some terminals may convert to spaces
            $added = if ($matches[1] -eq '-') { 0 } else { [int]$matches[1] }
            $deleted = if ($matches[2] -eq '-') { 0 } else { [int]$matches[2] }
            $filePath = $matches[3]
            
            # IMPROVEMENT: Track file type statistics
            $fileExt = if ($filePath -match '\.([^.]+)$') { $matches[1].ToLower() } else { 'other' }
            if (-not $fileTypeStats.ContainsKey($fileExt)) {
                $fileTypeStats[$fileExt] = @{ TotalLines = 0; AILines = 0; Files = 0 }
            }
            $fileTypeStats[$fileExt].TotalLines += $added
            $fileTypeStats[$fileExt].Files++
            
            $files += [PSCustomObject]@{
                Path = $filePath
                LinesAdded = $added
                LinesDeleted = $deleted
                FileExtension = $fileExt
            }
            
            $currentCommit.LinesAdded += $added
            $currentCommit.LinesDeleted += $deleted
        }
    }
    
    # Add last commit
    if ($currentCommit) {
        $currentCommit.Files = $files
        $commits += $currentCommit
    }

    # Show new commits found
    $newCommitsCount = $commits.Count
    if ($noNewCommits) {
        $newCommitsCount = 0
        $commits = @()
    }
    Write-Host "Found $newCommitsCount new commits on branch $Branch" -ForegroundColor Green

    # =====================================================
    # INCREMENTAL: Merge with previous commits
    # =====================================================
    if ($previousCommits.Count -gt 0) {
        Write-Host "Merging with $($previousCommits.Count) previously analyzed commits..." -ForegroundColor Cyan
    }

    # Analyze each commit for AI patterns using ADVANCED weighted 5-tier model
    Write-Host "Analyzing AI patterns using ADVANCED weighted 5-Tier model..." -ForegroundColor Gray
    $processedCount = 0
    $totalCommits = $commits.Count
    $lastReportTime = Get-Date
    
    foreach ($commit in $commits) {
        $processedCount++
        
        # Report progress every 100 commits or every 5 seconds
        $currentTime = Get-Date
        if ($processedCount % 100 -eq 0 -or ($currentTime - $lastReportTime).TotalSeconds -ge 5) {
            $pct = [math]::Round(($processedCount / $totalCommits) * 100, 1)
            Write-Host "Analyzing commits [$processedCount of $totalCommits] ($pct%)" -ForegroundColor DarkCyan -NoNewline
            Write-Host "`r" -NoNewline
            $lastReportTime = $currentTime
        }
        
        # ADVANCED: Skip merge/revert commits (definitive human)
        $isHumanCommit = $false
        foreach ($pattern in $humanCommitPatterns) {
            if ($commit.Message -match $pattern) {
                $isHumanCommit = $true
                break
            }
        }
        if ($isHumanCommit) {
            $commit.IsAI = $false
            $commit.ConfidenceScore = 0
            $commit.ConfidenceTier = "Human Written (Merge/Revert)"
            $commit.TierNumber = 0
            $commit.WeightedScore = 0
            continue
        }
        
        # Priority 0: Check for Git trailers (definitive)
        if ($commit.HasAITrailer) {
            $commit.IsAI = $true
            $commit.ConfidenceScore = 100
            $commit.ConfidenceTier = "Tier 1: Definitive AI - Git Trailer (100 percent)"
            $commit.TierNumber = 1
            $commit.WeightedScore = 100
            continue
        }
        
        # Tier 1: Check commit message for explicit AI markers
        $tier1Match = $false
        foreach ($patternObj in $tier1Patterns) {
            if ($commit.Message -match $patternObj.Pattern -or $commit.FullMessage -match $patternObj.Pattern) {
                $commit.IsAI = $true
                $commit.ConfidenceScore = $patternObj.Weight
                $commit.ConfidenceTier = "Tier 1: Definitive AI (99-100 percent)"
                $commit.TierNumber = 1
                $commit.WeightedScore = $patternObj.Weight
                $tier1Match = $true
                break
            }
        }
        
        if ($tier1Match) { continue }
        
        # ADVANCED: Analyze commit message for AI-style patterns (bonus score)
        $commitMsgScore = 0
        foreach ($patternObj in $aiCommitMessagePatterns) {
            if ($commit.Message -match $patternObj.Pattern) {
                $commitMsgScore += $patternObj.Weight
            }
        }
        
        # IMPROVED: Analyze DIFF content (only changed lines), not entire file
        $weightedScore = 0
        $tier2Score = 0
        $tier3Score = 0
        $tier4Score = 0
        $tier5Score = 0
        $totalAddedLines = 0
        $codeFilesAnalyzed = 0
        $testFilesSkipped = 0
        
        foreach ($file in $commit.Files) {
            # Skip non-code files
            if ($file.Path -match '\.(md|txt|json|xml|yml|yaml|png|jpg|gif|svg|ico|woff|ttf|eot|lock|sum|min\.js|min\.css)$') {
                continue
            }
            
            # ADVANCED: Skip test files (high false-positive rate) - unless IncludeTestFiles is set
            $isTestFile = $false
            if (-not $IncludeTestFiles) {
                foreach ($excludePattern in $excludeFilePatterns) {
                    if ($file.Path -match $excludePattern) {
                        $isTestFile = $true
                        $testFilesSkipped++
                        break
                    }
                }
            }
            if ($isTestFile) { continue }
            
            try {
                # CRITICAL IMPROVEMENT: Get only the DIFF (changed lines), not entire file
                # Skip binary files and very large changes that can hang
                $statInfoRaw = git diff-tree --numstat -r $commit.Hash -- $file.Path 2>$null
                # git diff-tree returns array: [0]=commit hash, [1]=numstat line - join for consistent matching
                $statInfo = if ($statInfoRaw -is [array]) { $statInfoRaw -join "`n" } else { $statInfoRaw }
                
                if ($statInfo -match '^-\t-\t' -or $statInfo -match '\n-\t-\t') {
                    # Binary file - skip
                    continue
                }
                # Match numstat format: <added>\t<deleted>\t<filepath>
                if ($statInfo -match '(\d+)\t(\d+)\t') {
                    $linesAdded = [int]$matches[1]
                    $linesRemoved = [int]$matches[2]
                    # Skip files with more than 5000 lines changed (likely auto-generated)
                    if (($linesAdded + $linesRemoved) -gt 5000) {
                        continue
                    }
                }
                
                $diffContent = git show $commit.Hash --format="" -- $file.Path 2>$null
                
                if ($diffContent) {
                    # Extract only ADDED lines (starting with +, but not +++)
                    $addedLines = ($diffContent | Where-Object { $_ -match '^\+[^+]' }) -join "`n"
                    $lineCount = ($addedLines -split "`n").Count
                    $totalAddedLines += $lineCount
                    $codeFilesAnalyzed++
                    
                    if ($addedLines) {
                        # Check Tier 2 patterns (weighted)
                        foreach ($patternObj in $tier2Patterns) {
                            $matches = [regex]::Matches($addedLines, $patternObj.Pattern)
                            if ($matches.Count -gt 0) {
                                $tier2Score += ($patternObj.Weight * [Math]::Min($matches.Count, 3))
                            }
                        }
                        
                        # Check Tier 3 patterns (weighted)
                        foreach ($patternObj in $tier3Patterns) {
                            $matches = [regex]::Matches($addedLines, $patternObj.Pattern)
                            if ($matches.Count -gt 0) {
                                $tier3Score += ($patternObj.Weight * [Math]::Min($matches.Count, 3))
                            }
                        }
                        
                        # Check Tier 4 patterns (weighted)
                        foreach ($patternObj in $tier4Patterns) {
                            $matches = [regex]::Matches($addedLines, $patternObj.Pattern)
                            if ($matches.Count -gt 0) {
                                $tier4Score += ($patternObj.Weight * [Math]::Min($matches.Count, 2))
                            }
                        }
                        
                        # Check Tier 5 patterns (weighted)
                        foreach ($patternObj in $tier5Patterns) {
                            $matches = [regex]::Matches($addedLines, $patternObj.Pattern)
                            if ($matches.Count -gt 0) {
                                $tier5Score += ($patternObj.Weight * [Math]::Min($matches.Count, 2))
                            }
                        }
                    }
                }
            } catch {
                # File might not exist in this commit
            }
        }
        
        # Add commit message score bonus
        $weightedScore = $tier2Score + $tier3Score + $tier4Score + $tier5Score + $commitMsgScore
        $commit.WeightedScore = $weightedScore
        
        # ADVANCED: Calculate pattern density (patterns per 100 lines)
        $patternDensity = if ($totalAddedLines -gt 0) { 
            ($weightedScore / $totalAddedLines) * 100 
        } else { 0 }
        
        # ADVANCED: Normalize score based on commit size
        # Large commits (>500 lines) get reduced score to prevent false positives
        # Very small commits (<10 lines) also get reduced confidence
        $sizeFactor = 1.0
        if ($totalAddedLines -gt 1000) {
            $sizeFactor = 0.5  # Large commits: 50% score reduction
        } elseif ($totalAddedLines -gt 500) {
            $sizeFactor = 0.7  # Medium-large commits: 30% reduction
        } elseif ($totalAddedLines -lt 10) {
            $sizeFactor = 0.6  # Tiny commits: 40% reduction
        }
        
        $normalizedScore = [Math]::Floor($weightedScore * $sizeFactor)
        
        # ADVANCED: If all/mostly test files, reduce confidence further (only when test files are excluded)
        if (-not $IncludeTestFiles -and $codeFilesAnalyzed -eq 0 -and $testFilesSkipped -gt 0) {
            # Only test files in this commit - mark as human (unless IncludeTestFiles is set)
            $commit.IsAI = $false
            $commit.ConfidenceScore = 0
            $commit.ConfidenceTier = "Human Written (Test Files Only)"
            $commit.TierNumber = 0
            continue
        }
        
        # Determine AI confidence based on WEIGHTED pattern matches with density check
        # ADVANCED: Require both score threshold AND minimum pattern density
        $minDensity = 2.0  # Minimum patterns per 100 lines
        
        if ($tier2Score -ge $tier2Threshold -and $patternDensity -ge $minDensity) {
            $commit.IsAI = $true
            $commit.ConfidenceScore = [Math]::Min(98, 90 + [Math]::Floor($tier2Score / 10))
            $commit.ConfidenceTier = "Tier 2: Very High Confidence (90-98 percent)"
            $commit.TierNumber = 2
        } elseif (($tier3Score -ge $tier3Threshold -or ($tier3Score + $tier2Score) -ge 35) -and $patternDensity -ge $minDensity) {
            $commit.IsAI = $true
            $commit.ConfidenceScore = [Math]::Min(89, 80 + [Math]::Floor(($tier3Score + $tier2Score) / 8))
            $commit.ConfidenceTier = "Tier 3: High Confidence (80-89 percent)"
            $commit.TierNumber = 3
        } elseif (($tier4Score -ge $tier4Threshold -or $normalizedScore -ge 30) -and $patternDensity -ge 1.5) {
            $commit.IsAI = $true
            $commit.ConfidenceScore = [Math]::Min(79, 70 + [Math]::Floor($normalizedScore / 10))
            $commit.ConfidenceTier = "Tier 4: Moderate Confidence (70-79 percent)"
            $commit.TierNumber = 4
        } elseif (($tier5Score -ge $tier5Threshold -or $normalizedScore -ge 20) -and $patternDensity -ge 1.0) {
            $commit.IsAI = $true
            $commit.ConfidenceScore = [Math]::Min(69, 60 + [Math]::Floor($normalizedScore / 6))
            $commit.ConfidenceTier = "Tier 5: Low Confidence (60-69 percent)"
            $commit.TierNumber = 5
        } else {
            $commit.IsAI = $false
            $commit.ConfidenceScore = 0
            $commit.ConfidenceTier = "Human Written"
            $commit.TierNumber = 0
        }
        
        # IMPROVEMENT: Update file type AI lines tracking
        if ($commit.IsAI) {
            foreach ($file in $commit.Files) {
                if ($fileTypeStats.ContainsKey($file.FileExtension)) {
                    $fileTypeStats[$file.FileExtension].AILines += $file.LinesAdded
                }
            }
        }
    }
    
    Write-Progress -Activity "Analyzing commits" -Completed

    # =====================================================
    # MERGE: Combine new commits with previous commits
    # Filter previous commits by date range if specified
    # =====================================================
    if ($previousCommits.Count -gt 0) {
        # Convert previous commits to proper objects
        $previousCommitObjects = @()
        $filteredCount = 0
        $excludedCount = 0
        
        # Parse start/end dates once
        $startDateTime = $null
        $endDateTime = $null
        if ($StartDate) {
            $startDateTime = [DateTime]::Parse($StartDate)
        }
        if ($EndDate) {
            $endDateTime = [DateTime]::Parse($EndDate).AddDays(1)  # Include end date
        }
        
        foreach ($pc in $previousCommits) {
            # Filter by date range if specified
            $includeCommit = $true
            if ($StartDate -or $EndDate) {
                try {
                    # Git date format: "Mon Dec 29 12:42:42 2025 +0530"
                    # Try multiple parsing methods
                    $commitDate = $null
                    $dateString = $pc.Date
                    
                    # Method 1: Try standard parsing
                    try {
                        $commitDate = [DateTime]::Parse($dateString)
                    } catch {
                        # Method 2: Parse Git format "Day Mon DD HH:MM:SS YYYY +ZZZZ"
                        if ($dateString -match '(\w{3})\s+(\w{3})\s+(\d{1,2})\s+(\d{2}:\d{2}:\d{2})\s+(\d{4})') {
                            $month = $Matches[2]
                            $day = $Matches[3]
                            $time = $Matches[4]
                            $year = $Matches[5]
                            $parsableDate = "$month $day, $year $time"
                            $commitDate = [DateTime]::Parse($parsableDate)
                        }
                    }
                    
                    if ($commitDate) {
                        if ($startDateTime -and $commitDate -lt $startDateTime) {
                            $includeCommit = $false
                        }
                        if ($endDateTime -and $includeCommit -and $commitDate -ge $endDateTime) {
                            $includeCommit = $false
                        }
                    }
                } catch {
                    # If date parsing fails, include the commit
                    $includeCommit = $true
                }
            }
            
            if ($includeCommit) {
                $commitObj = [PSCustomObject]@{
                    Hash = $pc.Hash
                    Author = $pc.Author
                    Date = $pc.Date
                    Message = $pc.Message
                    LinesAdded = $pc.LinesAdded
                    LinesDeleted = $pc.LinesDeleted
                    IsAI = $pc.IsAI
                    ConfidenceScore = $pc.ConfidenceScore
                    ConfidenceTier = $pc.ConfidenceTier
                    TierNumber = $pc.TierNumber
                }
                $previousCommitObjects += $commitObj
                $filteredCount++
            } else {
                $excludedCount++
            }
        }
        
        # Show filtering info if date range was applied
        if (($StartDate -or $EndDate) -and $excludedCount -gt 0) {
            Write-Host "  Filtered previous commits by date range: $filteredCount included, $excludedCount excluded" -ForegroundColor Yellow
        }
        
        # Merge: new commits first, then previous commits (chronological order)
        # IMPORTANT: Deduplicate by commit hash to avoid counting same commit twice
        $allCommits = @()
        $seenHashes = @{}
        
        # Add new commits first (they take priority)
        foreach ($c in $commits) {
            if (-not $seenHashes.ContainsKey($c.Hash)) {
                $allCommits += $c
                $seenHashes[$c.Hash] = $true
            }
        }
        
        # Add previous commits only if not already seen
        $duplicatesSkipped = 0
        foreach ($pc in $previousCommitObjects) {
            if (-not $seenHashes.ContainsKey($pc.Hash)) {
                $allCommits += $pc
                $seenHashes[$pc.Hash] = $true
            } else {
                $duplicatesSkipped++
            }
        }
        
        $commits = $allCommits
        
        if ($duplicatesSkipped -gt 0) {
            Write-Host "  Skipped $duplicatesSkipped duplicate commits" -ForegroundColor Gray
        }
        Write-Host "  Total unique commits after merge: $($commits.Count) (New: $newCommitsCount, Previous: $($filteredCount - $duplicatesSkipped))" -ForegroundColor Green
    }
    Write-Host ""

    # Aggregate by user
    Write-Host "Aggregating results by user..." -ForegroundColor Gray
    $userStats = @{}
    
    foreach ($commit in $commits) {
        # Skip commits with null/empty authors
        if ([string]::IsNullOrWhiteSpace($commit.Author) -or $commit.Author -eq 'null' -or $commit.Author -eq 'Unknown') {
            continue
        }
        
        $userKey = "$($commit.Author)___$($commit.Email)"
        
        if (-not $userStats.ContainsKey($userKey)) {
            $userStats[$userKey] = [PSCustomObject]@{
                UserName = $commit.Author
                UserEmail = $commit.Email
                TotalCommits = 0
                AICommits = 0
                HumanCommits = 0
                AILinesAdded = 0
                AILinesDeleted = 0
                HumanLinesAdded = 0
                HumanLinesDeleted = 0
                TotalLinesAdded = 0
                TotalLinesDeleted = 0
                AIPercentage = 0
                AvgConfidenceScore = 0
                ConfidenceScores = @()
                Tier1Commits = 0
                Tier2Commits = 0
                Tier3Commits = 0
                Tier4Commits = 0
                Tier5Commits = 0
            }
        }
        
        $user = $userStats[$userKey]
        $user.TotalCommits++
        $user.TotalLinesAdded += $commit.LinesAdded
        $user.TotalLinesDeleted += $commit.LinesDeleted
        
        if ($commit.IsAI) {
            $user.AICommits++
            $user.AILinesAdded += $commit.LinesAdded
            $user.AILinesDeleted += $commit.LinesDeleted
            $user.ConfidenceScores += $commit.ConfidenceScore
            
            # Track tier distribution
            switch ($commit.TierNumber) {
                1 { $user.Tier1Commits++ }
                2 { $user.Tier2Commits++ }
                3 { $user.Tier3Commits++ }
                4 { $user.Tier4Commits++ }
                5 { $user.Tier5Commits++ }
            }
        } else {
            $user.HumanCommits++
            $user.HumanLinesAdded += $commit.LinesAdded
            $user.HumanLinesDeleted += $commit.LinesDeleted
        }
    }
    
    # Calculate percentages
    foreach ($user in $userStats.Values) {
        if ($user.TotalLinesAdded -gt 0) {
            $user.AIPercentage = [Math]::Round(($user.AILinesAdded / $user.TotalLinesAdded) * 100, 2)
        }
        if ($user.ConfidenceScores.Count -gt 0) {
            $user.AvgConfidenceScore = [Math]::Round(($user.ConfidenceScores | Measure-Object -Average).Average, 2)
        }
    }

    # Calculate branch-level statistics
    $branchStats = [PSCustomObject]@{
        Branch = $Branch
        TotalCommits = $commits.Count
        AICommits = ($commits | Where-Object IsAI).Count
        HumanCommits = ($commits | Where-Object { -not $_.IsAI }).Count
        TotalLinesAdded = ($commits | Measure-Object -Property LinesAdded -Sum).Sum
        TotalLinesDeleted = ($commits | Measure-Object -Property LinesDeleted -Sum).Sum
        AILinesAdded = ($commits | Where-Object IsAI | Measure-Object -Property LinesAdded -Sum).Sum
        AILinesDeleted = ($commits | Where-Object IsAI | Measure-Object -Property LinesDeleted -Sum).Sum
        Tier1Commits = ($commits | Where-Object { $_.TierNumber -eq 1 }).Count
        Tier2Commits = ($commits | Where-Object { $_.TierNumber -eq 2 }).Count
        Tier3Commits = ($commits | Where-Object { $_.TierNumber -eq 3 }).Count
        Tier4Commits = ($commits | Where-Object { $_.TierNumber -eq 4 }).Count
        Tier5Commits = ($commits | Where-Object { $_.TierNumber -eq 5 }).Count
        UniqueContributors = $userStats.Count
    }
    
    $branchStats | Add-Member -NotePropertyName "AIPercentage" -NotePropertyValue $(
        if ($branchStats.TotalLinesAdded -gt 0) { 
            [Math]::Round(($branchStats.AILinesAdded / $branchStats.TotalLinesAdded) * 100, 2) 
        } else { 0 }
    )
    
    $branchStats | Add-Member -NotePropertyName "HumanLinesAdded" -NotePropertyValue $(
        $branchStats.TotalLinesAdded - $branchStats.AILinesAdded
    )
    
    # =====================================================
    # AI ATTRIBUTION OVERRIDE: Apply manual attribution if configured
    # =====================================================
    $attributionApplied = $false
    if ($branchAttribution -and $branchStats.TotalLinesAdded -gt 0) {
        $overrideAIPercentage = $branchAttribution.AIPercentage
        $originalAIPercentage = $branchStats.AIPercentage
        $originalAILines = $branchStats.AILinesAdded
        
        # Calculate new AI lines based on override percentage
        $newAILines = [Math]::Round($branchStats.TotalLinesAdded * ($overrideAIPercentage / 100))
        
        # Update branch stats
        $branchStats.AILinesAdded = $newAILines
        $branchStats.AIPercentage = $overrideAIPercentage
        $branchStats.HumanLinesAdded = $branchStats.TotalLinesAdded - $newAILines
        
        $attributionApplied = $true
        Write-Host "`n[AI Attribution Override Applied]" -ForegroundColor Magenta
        Write-Host "  Original detection: $originalAIPercentage% AI ($originalAILines lines)" -ForegroundColor Gray
        Write-Host "  Override applied: $overrideAIPercentage% AI ($newAILines lines)" -ForegroundColor Yellow
        Write-Host "  Reason: $($branchAttribution.Notes)" -ForegroundColor Cyan
    }

    # IMPROVEMENT: Merge previous file type stats with new ones
    if ($previousFileTypeStats.Count -gt 0) {
        Write-Host "Merging file type statistics with previous data..." -ForegroundColor Cyan
        foreach ($ext in $previousFileTypeStats.Keys) {
            if ($fileTypeStats.ContainsKey($ext)) {
                # Add to existing
                $fileTypeStats[$ext].TotalLines += $previousFileTypeStats[$ext].TotalLines
                $fileTypeStats[$ext].AILines += $previousFileTypeStats[$ext].AILines
                $fileTypeStats[$ext].Files += $previousFileTypeStats[$ext].Files
            } else {
                # Copy from previous
                $fileTypeStats[$ext] = $previousFileTypeStats[$ext].Clone()
            }
        }
    }
    
    # IMPROVEMENT: Calculate file type breakdown
    $fileTypeBreakdown = $fileTypeStats.GetEnumerator() | 
        Where-Object { $_.Value.TotalLines -gt 0 } |
        Sort-Object { $_.Value.TotalLines } -Descending |
        ForEach-Object {
            [PSCustomObject]@{
                Extension = $_.Key
                TotalLines = $_.Value.TotalLines
                AILines = $_.Value.AILines
                AIPercentage = [Math]::Round(($_.Value.AILines / [Math]::Max(1, $_.Value.TotalLines)) * 100, 2)
                FileCount = $_.Value.Files
            }
        }

    # Generate reports
    $timestamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
    $appReportPath = Join-Path $OutputPath $ApplicationName
    $branchReportPath = Join-Path $appReportPath $Branch
    
    if (-not (Test-Path $branchReportPath)) {
        New-Item -ItemType Directory -Path $branchReportPath -Force | Out-Null
    }

    Write-Host "`nGenerating reports..." -ForegroundColor Gray

    # CSV Report - User Level
    $csvPath = Join-Path $branchReportPath "UserAnalysis_${Branch}_${timestamp}.csv"
    $userStats.Values | Select-Object UserName, UserEmail, TotalCommits, AICommits, HumanCommits, 
        AILinesAdded, HumanLinesAdded, TotalLinesAdded, AIPercentage, AvgConfidenceScore,
        Tier1Commits, Tier2Commits, Tier3Commits, Tier4Commits, Tier5Commits | 
        Export-Csv -Path $csvPath -NoTypeInformation

    # CSV Report - Branch Level
    $branchCsvPath = Join-Path $branchReportPath "BranchAnalysis_${Branch}_${timestamp}.csv"
    $branchStats | Export-Csv -Path $branchCsvPath -NoTypeInformation
    
    # IMPROVEMENT: CSV Report - File Type Breakdown
    $fileTypeCsvPath = Join-Path $branchReportPath "FileTypeAnalysis_${Branch}_${timestamp}.csv"
    $fileTypeBreakdown | Export-Csv -Path $fileTypeCsvPath -NoTypeInformation

    # JSON Report - Complete Details with IMPROVED metadata
    $jsonPath = Join-Path $branchReportPath "Analysis_${Branch}_${timestamp}.json"
    $jsonData = @{
        # IMPROVEMENT: Add comprehensive metadata
        Metadata = @{
            GeneratedBy = "Copilot Usage Report Tool v2.0"
            AnalysisMethod = "5-Tier Weighted Pattern Detection"
            ScriptVersion = "2.0.0"
            GeneratedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            PowerShellVersion = $PSVersionTable.PSVersion.ToString()
            IncludeTestFiles = $IncludeTestFiles.IsPresent
        }
        ApplicationName = $ApplicationName
        Branch = $Branch
        AnalysisPeriod = @{
            StartDate = if ($StartDate) { $StartDate } else { "All Time" }
            EndDate = if ($EndDate) { $EndDate } else { "Present" }
            FilterApplied = ($StartDate -or $EndDate)
        }
        # AI Attribution Override info
        AIAttributionOverride = @{
            Applied = $attributionApplied
            OverridePercentage = if ($branchAttribution) { $branchAttribution.AIPercentage } else { $null }
            Notes = if ($branchAttribution) { $branchAttribution.Notes } else { $null }
        }
        GeneratedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        BranchStatistics = $branchStats
        TierDistribution = @{
            Tier1_Definitive = $branchStats.Tier1Commits
            Tier2_VeryHigh = $branchStats.Tier2Commits
            Tier3_High = $branchStats.Tier3Commits
            Tier4_Moderate = $branchStats.Tier4Commits
            Tier5_Low = $branchStats.Tier5Commits
            Human = $branchStats.HumanCommits
        }
        # IMPROVEMENT: Add file type breakdown to JSON
        FileTypeBreakdown = @($fileTypeBreakdown)
        Users = $userStats.Values
        Commits = $commits | Select-Object Hash, Author, Date, Message, LinesAdded, LinesDeleted, IsAI, ConfidenceScore, ConfidenceTier, TierNumber
    }
    $jsonData | ConvertTo-Json -Depth 10 | Out-File -FilePath $jsonPath -Encoding UTF8

    # Markdown Report with Branch-Level Details
    $mdPath = Join-Path $branchReportPath "Analysis_${Branch}_${timestamp}.md"
    
    $totalAILines = $branchStats.AILinesAdded
    $totalLines = $branchStats.TotalLinesAdded
    $overallAIPercentage = $branchStats.AIPercentage
    $humanPercentage = [Math]::Round(100 - $overallAIPercentage, 2)
    
    $mdContent = @"
# Code Authorship Analysis Report
## $ApplicationName - Branch: $Branch

**Analysis Period:** $(if ($StartDate) { $StartDate } else { "All time" }) to $(if ($EndDate) { $EndDate } else { "Present" })  
**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
$(if ($attributionApplied) {
@"

> ⚠️ **AI Attribution Override Applied**  
> This branch has a manual AI attribution override: **$($branchAttribution.AIPercentage)% AI**  
> Reason: $($branchAttribution.Notes)
"@
})

---

## Branch-Level Summary

| Metric | Value |
|--------|-------|
| **Branch** | $Branch |
| **Total Commits** | $($branchStats.TotalCommits) |
| **AI-Assisted Commits** | $($branchStats.AICommits) |
| **Human Commits** | $($branchStats.HumanCommits) |
| **Total Lines Added** | $totalLines |
| **AI-Assisted Lines** | $totalAILines ($overallAIPercentage%) |
| **Human-Written Lines** | $($branchStats.HumanLinesAdded) ($humanPercentage%) |
| **Unique Contributors** | $($branchStats.UniqueContributors) |

---

## 5-Tier Confidence Distribution

| Tier | Description | Confidence Range | Commits | Percentage |
|------|-------------|------------------|---------|------------|
| **Tier 1** | Definitive AI | 99-100% | $($branchStats.Tier1Commits) | $([Math]::Round(($branchStats.Tier1Commits / [Math]::Max(1, $branchStats.TotalCommits)) * 100, 1))% |
| **Tier 2** | Very High Confidence | 90-98% | $($branchStats.Tier2Commits) | $([Math]::Round(($branchStats.Tier2Commits / [Math]::Max(1, $branchStats.TotalCommits)) * 100, 1))% |
| **Tier 3** | High Confidence | 80-89% | $($branchStats.Tier3Commits) | $([Math]::Round(($branchStats.Tier3Commits / [Math]::Max(1, $branchStats.TotalCommits)) * 100, 1))% |
| **Tier 4** | Moderate Confidence | 70-79% | $($branchStats.Tier4Commits) | $([Math]::Round(($branchStats.Tier4Commits / [Math]::Max(1, $branchStats.TotalCommits)) * 100, 1))% |
| **Tier 5** | Low Confidence | 60-69% | $($branchStats.Tier5Commits) | $([Math]::Round(($branchStats.Tier5Commits / [Math]::Max(1, $branchStats.TotalCommits)) * 100, 1))% |
| **Human** | No AI Detected | N/A | $($branchStats.HumanCommits) | $([Math]::Round(($branchStats.HumanCommits / [Math]::Max(1, $branchStats.TotalCommits)) * 100, 1))% |

---

## User Analysis

| User | Total Lines | AI Lines | AI % | Human Lines | Commits | Avg Confidence | T1 | T2 | T3 | T4 | T5 |
|------|-------------|----------|------|-------------|---------|----------------|----|----|----|----|-----|
$(($userStats.Values | Sort-Object TotalLinesAdded -Descending | ForEach-Object {
    "| $($_.UserName) | $($_.TotalLinesAdded) | $($_.AILinesAdded) | $($_.AIPercentage)% | $($_.HumanLinesAdded) | $($_.TotalCommits) | $($_.AvgConfidenceScore)% | $($_.Tier1Commits) | $($_.Tier2Commits) | $($_.Tier3Commits) | $($_.Tier4Commits) | $($_.Tier5Commits) |"
}) -join "`n")

---

## Methodology

### 5-Tier AI Detection Model

This analysis uses a **5-tier confidence assessment** system for improved granularity:

#### Tier 1: Definitive AI (99-100%)
- Explicit AI markers in commit messages (GitHub Copilot, AI-generated)
- System-generated tags
- Co-authored-by: GitHub Copilot

#### Tier 2: Very High Confidence (90-98%)
- Comprehensive error handling with finally blocks
- Advanced async patterns (Task.WhenAll, Task.WhenAny)
- Sophisticated type annotations
- React hooks with generics (useCallback<T>, useMemo<T>)

#### Tier 3: High Confidence (80-89%)
- Standard error handling patterns
- Modern async/await usage
- TypeScript type guards
- Python type hints with Optional

#### Tier 4: Moderate Confidence (70-79%)
- Null coalescing operators
- Basic dependency injection
- Arrow functions and lambdas
- Modern language features

#### Tier 5: Low Confidence (60-69%)
- Documentation patterns
- Decorators and attributes
- Template literals
- General modern syntax

### Classification Criteria

Code is classified as **AI-assisted** if:
- Confidence score >= 60%
- Multiple AI patterns detected across tiers
- Pattern density exceeds threshold

---

*Report generated by Copilot Usage Report Tool - 5-Tier Analysis Model*
"@

    $mdContent | Out-File -FilePath $mdPath -Encoding UTF8

    Write-Host "`n=== Reports Generated for Branch: $Branch ===" -ForegroundColor Green
    Write-Host "User Analysis CSV: $csvPath" -ForegroundColor Gray
    Write-Host "Branch Analysis CSV: $branchCsvPath" -ForegroundColor Gray
    Write-Host "Full JSON Report: $jsonPath" -ForegroundColor Gray
    Write-Host "Markdown Report: $mdPath" -ForegroundColor Gray

    Write-Host "`n=== Branch Analysis Complete ===" -ForegroundColor Green
    Write-Host "Branch: $Branch" -ForegroundColor Cyan
    Write-Host "Total Commits: $($branchStats.TotalCommits)" -ForegroundColor White
    Write-Host "AI-Assisted: $overallAIPercentage%" -ForegroundColor Cyan
    Write-Host "Human-Written: $humanPercentage%" -ForegroundColor Cyan
    Write-Host "Tier Distribution: T1=$($branchStats.Tier1Commits) T2=$($branchStats.Tier2Commits) T3=$($branchStats.Tier3Commits) T4=$($branchStats.Tier4Commits) T5=$($branchStats.Tier5Commits)" -ForegroundColor Yellow

    # Return branch stats for consolidation
    return $branchStats

} finally {
    Pop-Location
}
