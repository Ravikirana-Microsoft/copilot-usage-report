<#
.SYNOPSIS
    Validates Git authentication and access for all repositories in config.csv

.DESCRIPTION
    Checks if the current user has access to all Git repositories listed in the configuration file.
    Generates a validation report showing which repositories are accessible.

.PARAMETER ConfigPath
    Path to the config.csv file. Defaults to ../config/config.csv

.EXAMPLE
    .\Validate-GitAccess.ps1
    
.EXAMPLE
    .\Validate-GitAccess.ps1 -ConfigPath "C:\custom\path\config.csv"
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$ConfigPath = (Join-Path $PSScriptRoot "..\config\config.csv")
)

# Ensure config file exists
if (-not (Test-Path $ConfigPath)) {
    Write-Error "Configuration file not found: $ConfigPath"
    exit 1
}

Write-Host "`n=== Git Access Validation ===" -ForegroundColor Cyan
Write-Host "Configuration: $ConfigPath`n" -ForegroundColor Gray

# Read configuration
try {
    $config = Import-Csv -Path $ConfigPath
    Write-Host "Found $($config.Count) application(s) to validate`n" -ForegroundColor Green
} catch {
    Write-Error "Failed to read configuration file: $_"
    exit 1
}

# Validation results
$results = @()

foreach ($app in $config) {
    $appName = $app.ApplicationName
    $gitUrl = $app.GitUrl
    
    Write-Host "Validating: $appName" -ForegroundColor Yellow
    Write-Host "  Repository: $gitUrl" -ForegroundColor Gray
    
    $status = "Unknown"
    $errorMessage = ""
    $authenticated = $false
    
    try {
        # Test git ls-remote to check access without cloning
        $output = git ls-remote $gitUrl HEAD 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $status = "Success"
            $authenticated = $true
            Write-Host "  Status: ✓ Access granted" -ForegroundColor Green
        } else {
            $status = "Failed"
            $errorMessage = $output | Out-String
            Write-Host "  Status: ✗ Access denied" -ForegroundColor Red
            
            if ($errorMessage -like "*Authentication failed*" -or $errorMessage -like "*fatal: could not read*") {
                Write-Host "  Reason: Authentication required or invalid credentials" -ForegroundColor Red
            } elseif ($errorMessage -like "*Repository not found*") {
                Write-Host "  Reason: Repository does not exist or is private" -ForegroundColor Red
            } else {
                Write-Host "  Reason: $errorMessage" -ForegroundColor Red
            }
        }
    } catch {
        $status = "Error"
        $errorMessage = $_.Exception.Message
        Write-Host "  Status: ✗ Error occurred" -ForegroundColor Red
        Write-Host "  Reason: $errorMessage" -ForegroundColor Red
    }
    
    # Add to results
    $results += [PSCustomObject]@{
        ApplicationName = $appName
        GitUrl = $gitUrl
        Authenticated = $authenticated
        Status = $status
        ErrorMessage = $errorMessage
        ValidatedAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    
    Write-Host ""
}

# Summary
Write-Host "=== Validation Summary ===" -ForegroundColor Cyan
$successCount = ($results | Where-Object { $_.Authenticated }).Count
$failCount = ($results | Where-Object { -not $_.Authenticated }).Count

Write-Host "Total Applications: $($results.Count)" -ForegroundColor White
Write-Host "Accessible: $successCount" -ForegroundColor Green
Write-Host "Not Accessible: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

# Generate validation report
$reportPath = Join-Path $PSScriptRoot "..\reports\Git-Access-Validation-Report.csv"
$results | Export-Csv -Path $reportPath -NoTypeInformation -Force
Write-Host "`nValidation report saved: $reportPath" -ForegroundColor Green

# Generate markdown report
$mdReportPath = Join-Path $PSScriptRoot "..\reports\Git-Access-Validation-Report.md"
$mdContent = @"
# Git Access Validation Report

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Summary

- **Total Applications:** $($results.Count)
- **Accessible:** $successCount ✓
- **Not Accessible:** $failCount ✗

## Detailed Results

| Application | Repository | Status | Error |
|-------------|------------|--------|-------|
$(($results | ForEach-Object {
    $statusIcon = if ($_.Authenticated) { "✓" } else { "✗" }
    $statusText = if ($_.Authenticated) { "Success" } else { "Failed" }
    $errMsg = $_.ErrorMessage -replace "`n", " " -replace "`r", ""
    "| $($_.ApplicationName) | $($_.GitUrl) | $statusIcon $statusText | $errMsg |"
}) -join "`n")

## Authentication Guidance

If any repositories show "Not Accessible":

1. **Check Git Credentials:**
   - Ensure you're logged into Visual Studio or Git Credential Manager
   - Run: `git credential-manager version`

2. **Test Manual Access:**
   - Try cloning manually: ``git clone [repository-url]``

3. **Verify Permissions:**
   - Ensure your account has read access to the repositories
   - Contact repository administrators if needed

4. **GitHub Authentication:**
   - For GitHub, you may need a Personal Access Token (PAT)
   - Configure: ``git config --global credential.helper manager``

---
*Report generated by Git Access Validation Script*
"@

$mdContent | Out-File -FilePath $mdReportPath -Encoding UTF8 -Force
Write-Host "Markdown report saved: $mdReportPath" -ForegroundColor Green

# Return exit code based on results
if ($failCount -gt 0) {
    Write-Warning "`nSome repositories are not accessible. Please check authentication."
    exit 1
}

Write-Host "`n✓ All repositories are accessible!" -ForegroundColor Green
exit 0
