# Configuration

## config.csv Format

| Column | Description | Example |
|--------|-------------|---------|
| ApplicationName | Name of your application | `CCSA` |
| GitUrl | Git repository URL | `https://github.com/microsoft/repo.git` |
| Branches | Comma-separated branch names | `"dev,main"` |

## Adding New Applications

1. Open `config.csv`
2. Add a new row with your application details
3. Ensure branches are comma-separated within quotes
4. Save the file

## Example Entry

```csv
MyApp,https://github.com/myorg/myrepo.git,"feature,main,develop"
```
