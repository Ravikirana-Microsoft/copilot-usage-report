# Copilot Usage Report Tool

A comprehensive PowerShell-based tool to analyze code authorship in Git repositories, determining which lines of code were AI-assisted (e.g., GitHub Copilot) versus human-written.

---

## 📋 Features

✅ **Multi-Repository Support** - Analyze multiple applications from a single config file  
✅ **Git Authentication Validation** - Verify access before analysis  
✅ **Automatic Clone/Pull** - Manages repository synchronization  
✅ **Date Range Filtering** - Analyze specific time periods or full history  
✅ **AI Detection** - 3-tier confidence assessment for AI-assisted code  
✅ **Multiple Report Formats** - CSV, JSON, and Markdown reports  
✅ **User-Level Analysis** - Per-user statistics and percentages  
✅ **Pattern-Based Detection** - Language-agnostic AI pattern recognition  

---

## 🚀 Quick Start

### 1. Configure Applications

Edit `config/config.csv`:

```csv
ApplicationName,GitUrl,Branches
MyApp,https://github.com/myorg/myapp.git,"dev,main"
AnotherApp,https://github.com/myorg/anotherapp.git,"main"
```

### 2. Validate Git Access

```powershell
.\scripts\Validate-GitAccess.ps1
```

### 3. Run Analysis

**Analyze all time:**
```powershell
.\scripts\Run-BatchAnalysis.ps1
```

**Analyze specific date range:**
```powershell
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-09-01" -EndDate "2026-01-07"
```

**Validate access only:**
```powershell
.\scripts\Run-BatchAnalysis.ps1 -ValidateOnly
```

---

## 📁 Project Structure

```
copilotusagereport/
├── config/
│   ├── config.csv              # Application configuration
│   └── README.md               # Configuration guide
├── scripts/
│   ├── Run-BatchAnalysis.ps1   # Main orchestration script
│   ├── Validate-GitAccess.ps1  # Git authentication checker
│   └── Analyze-CodeAuthorship.ps1  # Core analysis engine
├── reports/
│   └── [ApplicationName]/
│       ├── Analysis_[App]_[Timestamp].csv
│       ├── Analysis_[App]_[Timestamp].json
│       └── Analysis_[App]_[Timestamp].md
├── temp/
│   └── [cloned repositories]
└── README.md                   # This file
```

---

## 🔍 How It Works

### AI Detection Methodology

The tool uses a **3-tier confidence assessment** system:

#### Tier 1: Highest Confidence (99-100%)
- Explicit AI markers in commit messages
- GitHub Copilot mentions
- System-generated tags
- Co-authored-by: GitHub Copilot

#### Tier 2: High Confidence (85-95%)
- Advanced error handling patterns (`try-catch`, `ArgumentNullException`)
- Defensive programming (null checks, `ConfigureAwait(false)`)
- Modern async/await patterns
- TypeScript/React best practices (`interface Props`, `useState`, `useEffect`)
- Comprehensive logging patterns

#### Tier 3: Medium-High Confidence (70-85%)
- Modern language features (nullable types `?.`, `??`)
- Dependency injection patterns (`IOptions<T>`, `IConfiguration`)
- Functional programming patterns (arrow functions, `.map`, `.filter`)
- Modern Python features (`dataclass`, `async def`)

### Classification Rules

Code is classified as **AI-assisted** if:
- Confidence score ≥ 70%
- Multiple AI patterns detected across tiers
- Explicit AI markers found in commit messages

---

## 📊 Report Outputs

### CSV Report
Machine-readable data with columns:
- UserName, UserEmail
- TotalCommits, AICommits, HumanCommits
- AILinesAdded, HumanLinesAdded, TotalLinesAdded
- AIPercentage, AvgConfidenceScore

### JSON Report
Complete analysis data including:
- Application metadata
- Analysis period details
- Summary statistics
- Per-user detailed breakdown

### Markdown Report
Human-readable formatted report with:
- Executive summary
- User-level analysis table
- Methodology explanation
- Visual percentages

---

## 🎯 Use Cases

### Scenario 1: Team AI Adoption Metrics
```powershell
# Analyze last quarter
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-10-01" -EndDate "2025-12-31"
```

### Scenario 2: Individual Project Review
Edit `config/config.csv` to include only the target project, then run:
```powershell
.\scripts\Run-BatchAnalysis.ps1
```

### Scenario 3: Monthly Reports
```powershell
# September 2025
.\scripts\Run-BatchAnalysis.ps1 -StartDate "2025-09-01" -EndDate "2025-09-30"
```

### Scenario 4: Verify Repository Access
```powershell
.\scripts\Validate-GitAccess.ps1
```

---

## 🛠️ Requirements

- **PowerShell 5.1+** (Windows PowerShell or PowerShell Core)
- **Git** installed and configured
- **Git Authentication** configured (GitHub credentials, PAT, SSH keys, etc.)
- **Repository Access** - Read permissions for all configured repositories

---

## 🔧 Configuration

### config.csv Format

| Column | Description | Example |
|--------|-------------|---------|
| ApplicationName | Display name for the application | `CustomerPortal` |
| GitUrl | Full Git clone URL | `https://github.com/org/repo.git` |
| Branches | Comma-separated branch names (in quotes) | `"main,dev,feature"` |

### Example Configuration

```csv
ApplicationName,GitUrl,Branches
CustomerPortal,https://github.com/myorg/customer-portal.git,"main,develop"
AdminDashboard,https://github.com/myorg/admin-dashboard.git,"main"
APIGateway,https://github.com/myorg/api-gateway.git,"main,staging,production"
```

---

## 📖 Script Reference

### Run-BatchAnalysis.ps1

Main orchestration script that:
1. Validates Git access for all repositories
2. Clones/pulls latest code
3. Runs analysis for each application and branch
4. Generates consolidated summary

**Parameters:**
- `-ConfigPath` - Path to config.csv (default: `../config/config.csv`)
- `-StartDate` - Analysis start date (format: `yyyy-MM-dd`)
- `-EndDate` - Analysis end date (default: today)
- `-ValidateOnly` - Only validate Git access

### Validate-GitAccess.ps1

Checks Git authentication and generates validation report.

**Parameters:**
- `-ConfigPath` - Path to config.csv

**Outputs:**
- `reports/Git-Access-Validation-Report.csv`
- `reports/Git-Access-Validation-Report.md`

### Analyze-CodeAuthorship.ps1

Core analysis engine for a single repository/branch.

**Parameters:**
- `-RepoPath` - Local path to Git repository
- `-ApplicationName` - Name of the application
- `-Branch` - Branch to analyze
- `-StartDate` - Analysis start date (optional)
- `-EndDate` - Analysis end date (optional)
- `-OutputPath` - Reports output directory

---

## 🐛 Troubleshooting

### "Authentication failed"
**Solution:** Configure Git credentials:
```powershell
git config --global credential.helper manager
git credential-manager version
```

### "Repository not found"
**Solutions:**
- Verify the Git URL in `config.csv`
- Check repository permissions
- Ensure you have read access

### "No commits found"
**Solutions:**
- Verify the date range
- Check if the branch exists
- Ensure the branch has commits in the specified period

### Script execution errors
**Solution:** Enable script execution:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📈 Interpreting Results

### AI Percentage Interpretation

| AI % | Interpretation |
|------|----------------|
| 0-20% | Minimal AI assistance |
| 21-50% | Moderate AI assistance |
| 51-80% | High AI assistance |
| 81-100% | Predominantly AI-assisted |

### Confidence Score

Higher confidence scores (85-100%) indicate stronger evidence of AI-assisted code generation. Scores are averaged across all AI-detected commits per user.

---

## 🤝 Contributing

To extend the tool:

1. **Add new AI patterns** - Edit pattern arrays in `Analyze-CodeAuthorship.ps1`
2. **Support new languages** - Add language-specific patterns to tier arrays
3. **Custom reports** - Modify report generation sections

---

## 📝 License

This tool is provided as-is for internal use. Modify and distribute as needed within your organization.

---

## 🔗 Related Tools

- [GitHub Copilot](https://github.com/features/copilot)
- [Git](https://git-scm.com/)
- [PowerShell](https://docs.microsoft.com/powershell/)

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review script help: `Get-Help .\scripts\Run-BatchAnalysis.ps1 -Full`
3. Verify Git and PowerShell versions

---

**Last Updated:** January 2026  
**Version:** 1.0.0
