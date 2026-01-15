# GitHub Pipeline Setup Guide

This guide walks you through setting up the GitHub Actions pipeline to run Copilot usage analysis automatically.

## Files Changed

| File | Description |
|------|-------------|
| `.github/workflows/run-analysis.yml` | GitHub Actions workflow for running analysis |
| `.gitignore` | Updated to properly handle reports and temp folders |

---

## Step-by-Step Manual Setup

### Step 1: Push the Workflow File to GitHub

```bash
git add .github/workflows/run-analysis.yml
git add .gitignore
git commit -m "Add GitHub Actions workflow for Copilot usage analysis"
git push origin main
```

---

### Step 2: Enable GitHub Pages (for Dashboard Access)

1. Go to your repository on GitHub: https://github.com/Ravikirana-Microsoft/copilot-usage-report

2. Click **Settings** (gear icon in the top menu)

3. In the left sidebar, click **Pages** (under "Code and automation")

4. Under **"Build and deployment"**:
   - **Source**: Select **"GitHub Actions"**
   
5. Click **Save**

> ✅ After the first workflow run, your dashboard will be available at:
> **https://ravikirana-microsoft.github.io/copilot-usage-report/**

---

### Step 3: (Optional) Add Personal Access Token for Private Repos

> ⚠️ **Only needed if analyzing PRIVATE repositories**
> 
> The repositories in your `config.csv` are PUBLIC, so this step is optional.

If you need to analyze private repositories:

1. Go to **GitHub** → Click your profile picture → **Settings**

2. Scroll down and click **Developer settings** (left sidebar, bottom)

3. Click **Personal access tokens** → **Fine-grained tokens** → **Generate new token**

4. Configure the token:
   - **Token name**: `copilot-analysis-token`
   - **Expiration**: 90 days (or custom)
   - **Repository access**: Select repositories you want to analyze
   - **Permissions**: 
     - Contents: **Read-only**
     - Metadata: **Read-only**

5. Click **Generate token** and **copy the token**

6. Add the token to your repository:
   - Go to your repository → **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - **Name**: `REPO_ACCESS_TOKEN`
   - **Secret**: Paste your token
   - Click **Add secret**

---

### Step 4: Run the Workflow

1. Go to your repository on GitHub

2. Click the **Actions** tab

3. In the left sidebar, click **"Copilot Usage Analysis"**

4. Click the **"Run workflow"** button (dropdown on the right)

5. Fill in the optional parameters:
   | Parameter | Description | Example |
   |-----------|-------------|---------|
   | Analysis name | Friendly name for dashboard | `January2026` |
   | Start date | Filter commits from this date | `2026-01-01` |
   | End date | Filter commits until this date | `2026-01-15` |
   | Full analysis | Ignore incremental, reanalyze all | `true` |

6. Click **"Run workflow"** (green button)

7. Wait for the workflow to complete (click on the running workflow to see progress)

---

### Step 5: Access the Dashboard

After the workflow completes successfully, you have **3 ways** to access the dashboard:

#### Option A: GitHub Pages URL (Recommended)
Visit: **https://ravikirana-microsoft.github.io/copilot-usage-report/**

#### Option B: Download Artifact
1. Go to **Actions** → Click on the completed workflow run
2. Scroll down to **Artifacts**
3. Download **"copilot-dashboard"**
4. Extract and open `CopilotDashboard.html` in a browser

#### Option C: View in Repository
The dashboard is committed to the repository at `reports/CopilotDashboard.html`

---

## Workflow Features

| Feature | Description |
|---------|-------------|
| **Manual Trigger** | Run on-demand via "Run workflow" button |
| **Scheduled Runs** | Uncomment the `schedule` section for automatic weekly runs |
| **Incremental Analysis** | Only analyzes new commits (faster) |
| **Full Analysis** | Option to re-analyze all commits |
| **Date Filtering** | Analyze specific date ranges |
| **Auto-commit** | Reports are automatically pushed back to the repo |
| **GitHub Pages** | Dashboard is deployed for easy web access |

---

## Troubleshooting

### Workflow fails with "Permission denied"
- Ensure the workflow has `contents: write` permission
- Check repository Settings → Actions → General → Workflow permissions → Select "Read and write permissions"

### Cannot access GitHub Pages
- Ensure Pages is enabled (Step 2)
- Wait a few minutes after the first deployment
- Check Settings → Pages for the URL

### Analysis takes too long
- The first run analyzes all commits (can take 30+ minutes)
- Subsequent runs are faster (incremental analysis)
- Use date filters to limit the analysis scope

### Git authentication errors
- For public repos: No token needed, uses `GITHUB_TOKEN`
- For private repos: Add `REPO_ACCESS_TOKEN` secret (Step 3)

---

## Optional: Enable Scheduled Runs

To run the analysis automatically every week, edit `.github/workflows/run-analysis.yml` and uncomment:

```yaml
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
```

Common cron schedules:
- `'0 9 * * 1'` - Every Monday at 9 AM UTC
- `'0 0 1 * *'` - First day of every month at midnight
- `'0 9 * * 0'` - Every Sunday at 9 AM UTC
