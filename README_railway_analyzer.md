# Railway Deployment Failure Analyzer

A comprehensive Python script that analyzes Railway deployment failures across your GitHub repositories. This tool helps identify common deployment issues and provides specific remediation steps.

## Features

- **GitHub Integration**: Fetches all your repositories using GitHub API
- **Railway Integration**: Supports both Railway API and CLI for fetching deployment logs
- **Intelligent Analysis**: Detects common failure patterns with regex-based pattern matching
- **Detailed Reporting**: Generates comprehensive reports with remediation suggestions
- **Multiple Failure Types**: Covers environment variables, port binding, build failures, database issues, and more

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Railway CLI (optional, for CLI-based log fetching):
```bash
npm install -g @railway/cli
```

## Usage

Run the script:
```bash
python railway_deployment_analyzer.py
```

The script will prompt you for:
- GitHub Personal Access Token
- Railway API Token (optional)
- GitHub username

## Required Tokens

### GitHub Personal Access Token
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` scope
3. Copy the token (it won't be shown again)

### Railway API Token (Optional)
1. Go to Railway dashboard → Account settings → Tokens
2. Generate a new API token
3. Copy the token

If you don't provide a Railway token, the script will attempt to use the Railway CLI.

## Failure Patterns Detected

The analyzer detects these common deployment issues:

### Critical Issues
- **Missing Environment Variables**: OPENAI_API_KEY, DATABASE_URL, etc.
- **Port Binding Issues**: Server not binding to Railway's PORT variable
- **Build Failures**: npm/yarn/pnpm errors, TypeScript compilation issues
- **Database Connection**: Prisma errors, connection refused
- **File Not Found**: Missing modules, ENOENT errors
- **Permission Denied**: File access issues

### Warning Issues
- **Memory Limits**: Out of memory errors
- **Timeouts**: Request/connection timeouts

## Output

The script generates:
1. **Console Output**: Real-time analysis progress
2. **Detailed Report**: Comprehensive analysis with remediation steps
3. **Report File**: Saved as `railway_deployment_analysis_YYYYMMDD_HHMMSS.txt`

## Example Output

```
REPOSITORY: my-awesome-app
--------------------------------------------------
Status: FAILED
Last Deployment: 2024-01-15T10:30:00Z

Issues Found:
  1. [CRITICAL] Detected missing_env_vars issue
     Remediation: Add missing environment variables in Railway dashboard under Variables tab
     Affected Files: server.ts, config.js
  2. [CRITICAL] Detected port_binding issue
     Remediation: Ensure your app binds to the PORT environment variable (Railway sets this automatically)
```

## Troubleshooting

### Railway CLI Not Found
If you get "Railway CLI not found" errors:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link your project: `railway link`

### GitHub API Rate Limits
The script handles GitHub API rate limits automatically. If you hit limits:
1. Wait a few minutes and try again
2. Consider using a token with higher rate limits

### No Railway Projects Found
If no Railway projects are found:
1. Ensure your repositories are deployed to Railway
2. Check that project names match repository names
3. Verify your Railway token has proper permissions

## Customization

You can modify the `failure_patterns` dictionary in the script to add new failure patterns or adjust existing ones.

## Security Note

- Never commit your tokens to version control
- Use environment variables for production use
- Consider using a secrets management system for team environments

## License

This script is provided as-is for educational and debugging purposes.