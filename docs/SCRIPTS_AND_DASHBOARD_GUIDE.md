# Copilot Usage Report - Complete Technical Guide

## Table of Contents

1. [Overview](#overview)
2. [Scripts Documentation](#scripts-documentation)
   - [Validate-GitAccess.ps1](#validate-gitaccessps1)
   - [Analyze-CodeAuthorship.ps1](#analyze-codeauthorshipps1)
   - [Run-BatchAnalysis.ps1](#run-batchanalysisps1)
3. [5-Tier AI Detection Model](#5-tier-ai-detection-model)
   - [Tier 1: Definitive AI (99-100%)](#tier-1-definitive-ai-99-100)
   - [Tier 2: Very High Confidence (90-98%)](#tier-2-very-high-confidence-90-98)
   - [Tier 3: High Confidence (80-89%)](#tier-3-high-confidence-80-89)
   - [Tier 4: Moderate Confidence (70-79%)](#tier-4-moderate-confidence-70-79)
   - [Tier 5: Low Confidence (60-69%)](#tier-5-low-confidence-60-69)
4. [Dashboard Components](#dashboard-components)
   - [Overview View](#overview-view)
   - [Applications View](#applications-view)
   - [Branches View](#branches-view)
   - [Contributors View](#contributors-view)
   - [Commits View](#commits-view)
   - [File Types View](#file-types-view)
   - [Tiers View](#tiers-view)
5. [Business Value and Use Cases](#business-value-and-use-cases)

---

## Overview

The Copilot Usage Report system is a comprehensive solution for measuring and visualizing AI-assisted code authorship across multiple Git repositories. It uses sophisticated pattern detection to identify code written with GitHub Copilot or other AI assistants, providing actionable insights into AI adoption across your organization.

### Understanding AI Commits vs Human (Manual) Commits

#### What is an AI Commit?

An **AI Commit** is a Git commit where the code changes show patterns indicating they were written with assistance from AI tools like GitHub Copilot, ChatGPT, or other AI coding assistants.

**Characteristics of AI Commits:**
- Contains code patterns typical of AI generation (verbose comments, comprehensive error handling)
- May have explicit AI markers (`Co-authored-by: GitHub Copilot`)
- Shows consistent formatting and documentation style
- Often includes complete, well-structured code blocks
- Exhibits patterns from the 5-tier detection model

**How AI Commits are Identified:**
1. **Explicit Markers** (100% confident): Git trailers or comments explicitly mentioning AI
2. **Pattern Analysis** (60-99% confident): Code patterns weighted and scored
3. **Statistical Thresholds**: Commits exceeding score thresholds are classified as AI

#### What is a Human (Manual) Commit?

A **Human Commit** (also called Manual Commit) is a Git commit where the code changes appear to be written entirely by a human developer without AI assistance.

**Characteristics of Human Commits:**
- Natural coding style with personal preferences
- Variable documentation and commenting patterns
- May contain shortcuts, abbreviations, or personal conventions
- Shows incremental changes and iterative development
- Lacks the consistent "AI signature" patterns

**How Human Commits are Identified:**
- Commit score falls below minimum thresholds
- Insufficient pattern density (patterns per 100 lines)
- No explicit AI markers detected
- Merge commits and reverts are automatically classified as human

#### Classification Summary

| Commit Type | Detection Method | Confidence |
|-------------|------------------|------------|
| **AI Commit** | Explicit markers (trailers, tags) | 99-100% |
| **AI Commit** | High pattern score (Tier 2-3) | 80-98% |
| **AI Commit** | Moderate pattern score (Tier 4-5) | 60-79% |
| **Human Commit** | Score below threshold | N/A |
| **Human Commit** | Merge/revert commits | Automatic |
| **Human Commit** | Insufficient pattern density | N/A |

#### Example Comparison

**AI Commit Example:**
```typescript
// Initialize the authentication service with proper configuration
// This function handles user login with comprehensive error handling
export const authenticateUser = async (
  credentials: UserCredentials
): Promise<AuthResult> => {
  if (!credentials.username || !credentials.password) {
    throw new ArgumentError('Credentials are required');
  }
  
  try {
    const response = await authApi.login(credentials);
    return { success: true, token: response.data.token };
  } catch (error) {
    console.error('Authentication failed:', error.message);
    return { success: false, error: error.message };
  }
};
```
*Why AI: Verbose comments, comprehensive error handling, full type annotations, consistent structure*

**Human Commit Example:**
```typescript
// login
export async function login(creds) {
  const res = await api.login(creds);
  return res.data;
}
```
*Why Human: Minimal comments, abbreviated names, simpler structure, no error handling*

### Key Features

- **Multi-repository analysis**: Analyze multiple repositories and branches simultaneously
- **5-Tier confidence model**: Accurate classification of AI vs human-written code
- **Incremental analysis**: Only processes new commits since last run
- **Parallel processing**: Fast analysis using multi-threaded execution
- **Interactive dashboard**: React-based visualization with Fluent UI components

---

## Scripts Documentation

### Validate-GitAccess.ps1

**Purpose**: Validates Git authentication and repository access before running analysis.

**Location**: `scripts/Validate-GitAccess.ps1`

#### What It Does

1. Reads the `config/config.csv` file containing repository configurations
2. Tests access to each repository using `git ls-remote`
3. Generates a validation report showing accessible vs inaccessible repositories

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `-ConfigPath` | String | No | Path to config.csv file (default: `../config/config.csv`) |

#### Usage Examples

```powershell
# Basic validation
.\Validate-GitAccess.ps1

# Custom config path
.\Validate-GitAccess.ps1 -ConfigPath "C:\custom\config.csv"
```

#### Output Files

- `reports/Git-Access-Validation-Report.csv` - CSV format validation results
- `reports/Git-Access-Validation-Report.md` - Markdown format report with guidance

#### Why It's Important

- **Pre-flight check**: Ensures all repositories are accessible before running time-consuming analysis
- **Authentication troubleshooting**: Identifies credential issues early
- **Permission verification**: Confirms read access to all required repositories

---

### Analyze-CodeAuthorship.ps1

**Purpose**: Core analysis script that examines Git commits to determine AI-assisted vs human-written code.

**Location**: `scripts/Analyze-CodeAuthorship.ps1`

#### What It Does

1. **Repository sync**: Fetches and pulls latest changes from the repository
2. **Commit extraction**: Retrieves commit history with file change statistics
3. **Pattern analysis**: Applies the 5-tier AI detection model to each commit
4. **Statistical calculation**: Computes AI percentages at commit, user, and file-type levels
5. **Report generation**: Creates detailed JSON and CSV reports

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `-RepoPath` | String | Yes | Path to the Git repository to analyze |
| `-ApplicationName` | String | Yes | Name of the application (for reporting) |
| `-Branch` | String | Yes | Git branch to analyze |
| `-StartDate` | String | No | Start date (yyyy-MM-dd format) |
| `-EndDate` | String | No | End date (yyyy-MM-dd format) |
| `-OutputPath` | String | No | Output directory for reports |
| `-PreviousDataPath` | String | No | Path to previous analysis for incremental mode |
| `-IncludeTestFiles` | Switch | No | Include test files in pattern analysis |
| `-AIAttributionPath` | String | No | Path to manual AI attribution overrides |

#### Usage Examples

```powershell
# Basic analysis
.\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "main"

# Date-filtered analysis
.\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "main" -StartDate "2025-01-01" -EndDate "2025-12-31"

# Incremental analysis
.\Analyze-CodeAuthorship.ps1 -RepoPath "C:\repos\myapp" -ApplicationName "MyApp" -Branch "main" -PreviousDataPath "reports\archive\Analysis.json"
```

#### Analysis Process Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analyze-CodeAuthorship.ps1                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Sync Repository (git fetch, checkout, pull)                 │
│                          ↓                                       │
│  2. Load Previous Data (for incremental mode)                   │
│                          ↓                                       │
│  3. Load AI Attribution Overrides (config/ai-attribution.csv)   │
│                          ↓                                       │
│  4. Extract Commits (git log --numstat)                         │
│                          ↓                                       │
│  5. For Each Commit:                                            │
│     ├── Check Git Trailers (Co-authored-by: Copilot)           │
│     ├── Check Tier 1 Patterns (explicit AI markers)            │
│     ├── Extract Diff Content (added lines only)                │
│     ├── Apply Tier 2-5 Pattern Matching                        │
│     ├── Calculate Weighted Score                               │
│     ├── Apply Size Normalization                               │
│     └── Assign Confidence Tier                                 │
│                          ↓                                       │
│  6. Aggregate Statistics (per user, file type, application)    │
│                          ↓                                       │
│  7. Generate Reports (JSON, CSV)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### Run-BatchAnalysis.ps1

**Purpose**: Orchestrates analysis across multiple repositories defined in config.csv.

**Location**: `scripts/Run-BatchAnalysis.ps1`

#### What It Does

1. **Configuration loading**: Reads repository list from config.csv
2. **Batch processing**: Iterates through all repositories/branches
3. **Report consolidation**: Combines individual reports into consolidated output
4. **Dashboard integration**: Generates data for the React dashboard

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `-ConfigPath` | String | No | Path to config.csv file |
| `-StartDate` | String | No | Analysis start date |
| `-EndDate` | String | No | Analysis end date |
| `-AnalysisName` | String | No | Friendly name for this analysis run |
| `-ValidateOnly` | Switch | No | Only validate Git access |
| `-FullAnalysis` | Switch | No | Force full re-analysis (ignore incremental) |
| `-Parallel` | Switch | No | Enable parallel processing |
| `-MaxParallel` | Int | No | Maximum parallel threads (default: 4) |
| `-CompareWith` | String | No | Previous report for comparison |
| `-IncludeTestFiles` | Switch | No | Include test files in analysis |

#### Usage Examples

```powershell
# Basic batch analysis (incremental)
.\Run-BatchAnalysis.ps1

# Full analysis with name
.\Run-BatchAnalysis.ps1 -FullAnalysis -AnalysisName "Q1-2026"

# Parallel processing
.\Run-BatchAnalysis.ps1 -Parallel -MaxParallel 8

# Date-filtered analysis
.\Run-BatchAnalysis.ps1 -StartDate "2025-11-01" -EndDate "2025-11-30" -AnalysisName "November2025"

# Validation only
.\Run-BatchAnalysis.ps1 -ValidateOnly
```

#### Output Structure

```
reports/
├── consolidated/
│   └── ConsolidatedReport_2026-01-27_12-00-00.json
├── [ApplicationName]/
│   ├── CodeAuthorship_[Branch]_[Date].json
│   └── CodeAuthorship_[Branch]_[Date].csv
└── archive/
    └── [Date]/
        └── ... (archived reports)
```

---

## 5-Tier AI Detection Model

The analysis uses a sophisticated weighted pattern-matching system to classify commits into 5 confidence tiers. This model balances accuracy with practical applicability.

### How Scoring Works

1. **Pattern Detection**: Each tier has specific patterns with assigned weights
2. **Weighted Score Calculation**: Sum of (pattern matches × weight)
3. **Pattern Density**: Patterns per 100 lines of code
4. **Size Normalization**: Large commits get reduced scores to prevent false positives
5. **Tier Assignment**: Based on weighted score thresholds

### Tier 1: Definitive AI (99-100%)

**What It Detects**: Explicit AI markers that are 100% reliable indicators of AI-generated code.

**Detection Methods**:

| Pattern | Weight | Description |
|---------|--------|-------------|
| Git Trailers | 100 | `Co-authored-by:.*Copilot` in commit metadata |
| Explicit Tags | 100 | `[AI]`, `[copilot]`, `#AI generated` in code |
| Auto-generated | 95 | `auto-generated`, `Generated by Copilot` comments |
| AI Attribution | 100 | `@ai-assisted`, `AI-generated` markers |

**Example Patterns**:
```javascript
// copilot-generated
// [AI] Generated function
// Co-authored-by: GitHub Copilot <copilot@github.com>
```

**Confidence Level**: 99-100% certain this is AI-generated code.

---

### Tier 2: Very High Confidence (90-98%)

**What It Detects**: Strong AI signatures that are rarely written manually by developers.

**Detection Methods** (Weight: 15-25):

| Pattern Category | Examples | Why It's AI |
|------------------|----------|-------------|
| **Verbose inline comments** | `// Initialize the configuration for the service` | AI explains obvious code |
| **Comprehensive error handling** | `try { ... } catch { ... } finally { ... }` with 50+ lines | Overly thorough blocks |
| **Parameter validation** | `ArgumentNullException` with `nameof` | AI-style defensive coding |
| **Redux Toolkit patterns** | `createAsyncThunk`, `extraReducers: (builder)` | Consistent boilerplate |
| **Python mock patterns** | `@patch`, `MagicMock()`, `mock.patch` | AI-generated tests |

**Example Code** (AI signature):
```typescript
// Initialize the user authentication service with configuration
const authService = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await api.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

**Confidence Level**: 90-98% - Very likely AI-generated due to distinctive patterns.

---

### Tier 3: High Confidence (80-89%)

**What It Detects**: Patterns that suggest AI but could also be written by experienced developers.

**Detection Methods** (Weight: 8-14):

| Pattern Category | Examples | Notes |
|------------------|----------|-------|
| **Advanced async patterns** | `Task.WhenAll`, `Task.WhenAny` | Common in AI-generated code |
| **React with generics** | `useCallback<T>()`, `useMemo<T>()` | Type-safe hooks |
| **Comprehensive logging** | `_logger.LogInformation($"...")` | Structured logging patterns |
| **Python type hints** | `def func(x: int) -> str:` | Full type annotations |
| **State management** | `useAppDispatch`, `useAppSelector` | Redux hooks usage |

**Example Code**:
```csharp
public async Task<Result<User>> GetUserAsync(int userId)
{
    _logger.LogInformation($"Fetching user with ID: {userId}");
    
    var result = await Task.WhenAll(
        _userRepository.GetByIdAsync(userId),
        _profileRepository.GetByUserIdAsync(userId)
    );
    
    return Result.Success(result);
}
```

**Confidence Level**: 80-89% - High likelihood of AI assistance.

---

### Tier 4: Moderate Confidence (70-79%)

**What It Detects**: Common modern patterns that need multiple matches to indicate AI.

**Detection Methods** (Weight: 4-7):

| Pattern Category | Examples | Notes |
|------------------|----------|-------|
| **Modern syntax** | `??=`, `?.`, `record` types | C# 9+ features |
| **Dependency injection** | `AddScoped<T>`, `IOptions<T>` | .NET DI patterns |
| **React patterns** | `useState<T>`, `useEffect(() => {})` | Standard hooks |
| **Python modern** | `Optional[]`, `@dataclass` | Type hints and decorators |

**Scoring**: Requires multiple pattern matches to reach threshold.

**Confidence Level**: 70-79% - Moderate indication of AI involvement.

---

### Tier 5: Low Confidence (60-69%)

**What It Detects**: Very common patterns that individually are inconclusive but accumulate.

**Detection Methods** (Weight: 2-3):

| Pattern | Examples |
|---------|----------|
| Optional chaining | `?.property` |
| Nullish coalescing | `??` |
| Array methods | `.map()`, `.filter()`, `.reduce()` |
| Async/await | `await something` |
| Python f-strings | `f"text {var}"` |

**Scoring**: Many matches required to reach threshold.

**Confidence Level**: 60-69% - Weak indication, could easily be human code.

---

### Human Written (0%)

Code is classified as **human written** when:

- No significant pattern matches are detected
- Pattern density is below minimum thresholds
- Commit is a merge/revert (automatically excluded)
- Only test files with no other patterns (when `IncludeTestFiles` is off)

---

## Dashboard Components

### Overview View

The main dashboard landing page showing aggregate statistics.

#### Components Displayed

| Component | Data Shown | Business Value |
|-----------|------------|----------------|
| **Total Commits Card** | Count with AI% progress bar | Quick view of overall commit volume and AI adoption |
| **Total Lines Card** | Line count with AI% | Measures code volume and AI contribution |
| **Contributors Card** | Unique contributor count | Team size visibility |
| **Applications Card** | Total applications analyzed | Portfolio scope |
| **AI Commit % Doughnut** | Visual percentage | At-a-glance AI adoption rate |
| **Commit Distribution Pie** | AI vs Human split | Comparative visual |
| **Tier Distribution Doughnut** | Apps by tier | Adoption level breakdown |
| **Historical Trend Line Chart** | AI % across all reports | Tracks AI adoption over multiple analysis runs |
| **Top Applications Bar Chart** | Top 10 apps by commits | Identify most active projects |
| **Top Contributors Bar Chart** | Top 10 contributors | Recognize AI adopters |

#### Key Metrics Explained

- **AI Percentage**: `(AI Commits / Total Commits) × 100`
- **Lines AI Percentage**: `(AI Lines / Total Lines) × 100`
- **Progress Bar Colors**: Blue (#00bcf2) for AI, Gray (#6b7280) for Human

#### Historical Trend Chart - How It Works

The **AI Usage Trend Over Time** chart aggregates data from **all historical reports** in the `reports/consolidated` folder, not just the currently selected report. This allows you to:

- **Track AI adoption over time** - See how AI usage evolves across multiple analysis runs
- **Compare different time periods** - Each point on the chart represents a separate analysis run
- **Measure progress** - Visualize whether AI adoption is increasing or decreasing

**Data Source:**
- Fetches summary statistics from all reports in `public/reports/`
- Shows up to 24 most recent reports for performance
- Falls back to monthly grouping of current report commits if no historical data

**Best Practice:** Run analysis regularly (weekly/monthly) with descriptive `-AnalysisName` parameters to build meaningful historical trends:
```powershell
.\scripts\Run-BatchAnalysis.ps1 -AnalysisName "January2026-Week1"
.\scripts\Run-BatchAnalysis.ps1 -AnalysisName "January2026-Week2"
```

---

### Applications View

Detailed breakdown by application/repository.

#### Components

| Component | Purpose |
|-----------|---------|
| **Stats Row** | Total apps, average AI%, total commits |
| **Applications Bar Chart** | AI vs Human commits per app |
| **Tier Distribution Bar** | Apps grouped by tier |
| **Sortable Table** | Full application list with all metrics |

#### Sortable Columns

- AI Percentage
- Total Commits
- AI Commits
- Application Name

#### Use Cases

- **Identify high-performers**: Apps with >80% AI adoption
- **Find improvement targets**: Apps with low AI usage
- **Resource allocation**: Prioritize training for low-adoption teams

---

### Branches View

Analysis at the branch level within applications.

#### Components

| Component | Purpose |
|-----------|---------|
| **Branch Table** | All branches with metrics |
| **Branch Comparison** | Side-by-side branch analysis |

#### Key Metrics

- Branch name
- Total commits
- AI commits / Human commits
- AI percentage
- Assigned tier

#### Use Cases

- **Feature branch analysis**: Compare AI usage on feature vs main branches
- **Release tracking**: Monitor AI adoption in release branches
- **Team patterns**: Identify teams that prefer AI-assisted development

---

### Contributors View

Individual developer analysis.

#### Components

| Component | Purpose |
|-----------|---------|
| **Top Contributors Chart** | Bar chart of most active contributors |
| **Contributor Table** | Full list with all metrics |
| **Per-Application Breakdown** | Which apps each contributor works on |

#### Key Metrics Per Contributor

- Total commits
- AI-assisted commits
- Human commits
- AI percentage
- Lines added (AI vs Human)
- Applications contributed to

#### Use Cases

- **Training needs**: Identify developers who could benefit from Copilot training
- **Champions identification**: Find AI adoption leaders for peer mentoring
- **Workload distribution**: See commit patterns across team

---

### Commits View

Granular commit-level analysis.

#### Components

| Component | Purpose |
|-----------|---------|
| **Commit Table** | Full commit history with AI classification |
| **Filters** | Filter by AI/Human, Tier, Date range |

#### Data Per Commit

| Field | Description |
|-------|-------------|
| Hash | Git commit hash (short) |
| Author | Commit author name |
| Date | Commit timestamp |
| Message | Commit message (truncated) |
| Lines Added | Number of lines added |
| Is AI | Boolean classification |
| Confidence Score | 0-100 percentage |
| Tier | T1-T5 or Human |

#### Use Cases

- **Audit trail**: Review specific commits for AI attribution
- **Pattern verification**: Validate AI detection accuracy
- **Detailed analysis**: Deep dive into specific time periods

---

### File Types View

Analysis by programming language/file extension.

#### Components

| Component | Purpose |
|-----------|---------|
| **File Type Bar Chart** | AI vs Human lines by extension |
| **File Type Table** | Detailed breakdown by extension |

#### Metrics Per File Type

- Extension (e.g., `.ts`, `.py`, `.cs`)
- File count
- Total lines
- AI lines
- Human lines
- AI percentage

#### Use Cases

- **Language patterns**: See which languages have highest AI adoption
- **Technology stack insights**: Understand where AI helps most
- **Quality focus**: Prioritize reviews for high-AI file types

---

### Tiers View

Visual breakdown of the 5-tier classification system.

#### Components

| Component | Purpose |
|-----------|---------|
| **Tier Stats Row** | Summary of high vs low adoption apps |
| **Tier Doughnut Chart** | Visual distribution |
| **Tier Bar Chart** | Count per tier |
| **Tier Table** | Details for each tier |
| **Applications by Tier** | List apps in each tier category |

#### Tier Ranges

| Tier | AI Percentage Range | Classification |
|------|---------------------|----------------|
| Tier 1 | 0-20% | Very Low AI Adoption |
| Tier 2 | 21-40% | Low AI Adoption |
| Tier 3 | 41-60% | Moderate AI Adoption |
| Tier 4 | 61-80% | High AI Adoption |
| Tier 5 | 81-100% | Very High AI Adoption |

#### Use Cases

- **Portfolio health**: Overall view of AI adoption levels
- **Goal setting**: Target specific tier improvements
- **Executive reporting**: Simple visualization for leadership

---

## Business Value and Use Cases

### 1. Measuring AI Adoption ROI

**Challenge**: Organizations investing in GitHub Copilot need to measure return on investment.

**Solution**: The dashboard provides:
- Quantified AI code contribution percentages
- Trend analysis showing adoption growth over time
- Per-developer and per-application metrics

**Key Metrics to Track**:
- Overall AI percentage (target: 60%+)
- Month-over-month growth in AI adoption
- Number of applications reaching Tier 4-5

---

### 2. Identifying Training Needs

**Challenge**: Not all developers adopt AI tools equally.

**Solution**: The Contributors View reveals:
- Developers with low AI usage who may benefit from training
- Champions who can mentor others
- Teams that are lagging in adoption

**Action Items**:
- Schedule Copilot training for <30% AI usage developers
- Pair low adopters with high adopters
- Celebrate and recognize AI champions

---

### 3. Code Quality Insights

**Challenge**: Understanding where AI helps most in your codebase.

**Solution**: The File Types View shows:
- Languages where AI generates most code
- Potential areas for increased AI utilization
- File types that may need more human review

**Quality Considerations**:
- High AI % in test files → Validate test coverage quality
- High AI % in configuration files → Review for accuracy
- Low AI % in boilerplate code → Training opportunity

---

### 4. Executive Reporting

**Challenge**: Leadership needs simple, actionable metrics.

**Solution**: The Overview and Tiers Views provide:
- Single-number AI adoption percentage
- Trend charts showing progress over time
- Tier distribution for quick health assessment

**Recommended KPIs for Leadership**:
| KPI | Target | Description |
|-----|--------|-------------|
| Overall AI % | 60%+ | Organization-wide adoption |
| Tier 4-5 Apps | 70%+ | Percentage of high-adoption apps |
| Monthly Growth | 5%+ | Month-over-month improvement |

---

### 5. Compliance and Auditing

**Challenge**: Some organizations need to track AI usage for compliance.

**Solution**: The system provides:
- Commit-level attribution (AI vs Human)
- Confidence scoring for transparency
- Historical reports for audit trails

**Compliance Features**:
- Full commit history with AI classification
- Exportable reports (JSON, CSV)
- Manual override capability via `ai-attribution.csv`

---

### 6. Continuous Improvement

**Challenge**: Maintaining and improving AI adoption over time.

**Solution**: Use the system for:
- Monthly or quarterly analysis runs
- Comparison reports between time periods
- Trend identification and goal setting

**Recommended Cadence**:
| Frequency | Analysis Type | Purpose |
|-----------|---------------|---------|
| Weekly | Incremental | Monitor recent activity |
| Monthly | Full (date-filtered) | Monthly reporting |
| Quarterly | Full + Comparison | QBR metrics |
| Annually | Full historical | Year-end assessment |

---

## Appendix: Configuration Files

### config/config.csv

Defines repositories to analyze:

```csv
ApplicationName,GitUrl,LocalPath,Branch
MyApp,https://github.com/org/myapp,C:\repos\myapp,main
OtherApp,https://github.com/org/other,C:\repos\other,develop
```

### config/ai-attribution.csv

Manual overrides for AI attribution:

```csv
ApplicationName,Branch,PRNumber,AIPercentage,StartDate,EndDate,Notes
MyApp,feature-branch,,85,2025-01-01,2025-12-31,Copilot Chat used extensively
```

---

## Conclusion

The Copilot Usage Report system provides comprehensive insights into AI-assisted code authorship across your organization. By leveraging the 5-tier detection model, you can accurately measure AI adoption, identify improvement opportunities, and demonstrate ROI on your GitHub Copilot investment.

**Next Steps**:
1. Configure your repositories in `config/config.csv`
2. Run `.\Validate-GitAccess.ps1` to verify access
3. Execute `.\Run-BatchAnalysis.ps1` for your first analysis
4. Open the dashboard to explore your results
5. Set up regular analysis schedules for trend tracking

---

*Document generated: January 2026*  
*Version: 1.0*
