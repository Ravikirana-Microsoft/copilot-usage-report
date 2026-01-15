# Temporary Repository Storage

This folder is used to clone and store Git repositories during analysis.

## Contents

Repositories will be automatically cloned to this location when running the batch analysis script.

Example structure after running analysis:
```
temp/
├── customer-chatbot-solution-accelerator/
├── Container-Migration-Solution-Accelerator/
└── [other-repositories]/
```

## Cleanup

You can safely delete repositories from this folder. They will be re-cloned on the next analysis run.

To clean up all cloned repositories:
```powershell
Remove-Item .\temp\* -Recurse -Force
```

## Note

- This folder is excluded from version control
- Repositories are automatically pulled/updated on each run
- No manual intervention needed
