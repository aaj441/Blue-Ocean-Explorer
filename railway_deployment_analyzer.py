#!/usr/bin/env python3
"""
Railway Deployment Failure Analyzer

A comprehensive tool to analyze Railway deployment failures across GitHub repositories.
Supports both Railway API and CLI integration for fetching deployment logs.

Usage:
    python railway_deployment_analyzer.py

Requirements:
    - GitHub Personal Access Token
    - Railway API Token (optional, will use CLI if not available)
    - Python packages: requests, subprocess, json, re, datetime
"""

import requests
import subprocess
import json
import re
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

class DeploymentStatus(Enum):
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"
    UNKNOWN = "unknown"

@dataclass
class DeploymentIssue:
    type: str
    severity: str  # "critical", "warning", "info"
    description: str
    remediation: str
    affected_files: List[str] = None

@dataclass
class RepoAnalysis:
    repo_name: str
    status: DeploymentStatus
    issues: List[DeploymentIssue]
    last_deployment: Optional[str] = None
    logs_preview: str = ""

class RailwayDeploymentAnalyzer:
    def __init__(self, github_token: str, railway_token: str = None):
        self.github_token = github_token
        self.railway_token = railway_token
        self.github_headers = {
            "Authorization": f"token {github_token}",
            "Accept": "application/vnd.github.v3+json",
        }
        self.railway_headers = {
            "Authorization": f"Bearer {railway_token}",
            "Content-Type": "application/json",
        } if railway_token else None
        
        # Common failure patterns and their remediation
        self.failure_patterns = {
            "missing_env_vars": {
                "patterns": [
                    r"missing environment variable",
                    r"environment variable.*not found",
                    r"process\.env\..*is undefined",
                    r"OPENAI_API_KEY.*not found",
                    r"DATABASE_URL.*not found",
                    r"RAILWAY_TOKEN.*not found"
                ],
                "severity": "critical",
                "remediation": "Add missing environment variables in Railway dashboard under Variables tab"
            },
            "port_binding": {
                "patterns": [
                    r"port binding.*failed",
                    r"port.*not bound",
                    r"listen.*EADDRINUSE",
                    r"address already in use",
                    r"port.*required by railway"
                ],
                "severity": "critical",
                "remediation": "Ensure your app binds to the PORT environment variable (Railway sets this automatically)"
            },
            "build_failure": {
                "patterns": [
                    r"build failed",
                    r"npm.*error",
                    r"yarn.*error",
                    r"pnpm.*error",
                    r"typescript.*error",
                    r"compilation.*error",
                    r"module.*not found",
                    r"dependency.*not found"
                ],
                "severity": "critical",
                "remediation": "Check package.json dependencies, run 'npm install' locally to verify, ensure all imports are correct"
            },
            "database_connection": {
                "patterns": [
                    r"database.*connection.*failed",
                    r"prisma.*error",
                    r"connection.*refused",
                    r"database.*not found",
                    r"authentication.*failed"
                ],
                "severity": "critical",
                "remediation": "Verify DATABASE_URL is correct, check database is running, ensure proper credentials"
            },
            "memory_limit": {
                "patterns": [
                    r"out of memory",
                    r"memory.*limit.*exceeded",
                    r"heap.*out.*of.*memory",
                    r"allocation.*failed"
                ],
                "severity": "warning",
                "remediation": "Optimize memory usage, consider upgrading Railway plan, add memory monitoring"
            },
            "timeout": {
                "patterns": [
                    r"timeout",
                    r"request.*timed.*out",
                    r"connection.*timeout",
                    r"operation.*timed.*out"
                ],
                "severity": "warning",
                "remediation": "Increase timeout settings, optimize slow operations, check external API responses"
            },
            "file_not_found": {
                "patterns": [
                    r"file.*not.*found",
                    r"cannot.*find.*module",
                    r"ENOENT",
                    r"no such file.*directory"
                ],
                "severity": "critical",
                "remediation": "Check file paths, ensure all required files are committed, verify build output includes all assets"
            },
            "permission_denied": {
                "patterns": [
                    r"permission.*denied",
                    r"EACCES",
                    r"access.*denied"
                ],
                "severity": "critical",
                "remediation": "Check file permissions, ensure Railway has proper access to required files"
            }
        }

    def get_github_repos(self, username: str) -> List[Dict]:
        """Fetch all repositories for a GitHub user."""
        print(f"Fetching repositories for user: {username}")
        
        repos = []
        page = 1
        per_page = 100
        
        while True:
            url = f"https://api.github.com/users/{username}/repos"
            params = {
                "per_page": per_page,
                "page": page,
                "type": "owner",
                "sort": "updated"
            }
            
            try:
                response = requests.get(url, headers=self.github_headers, params=params)
                response.raise_for_status()
                page_repos = response.json()
                
                if not page_repos:
                    break
                    
                repos.extend(page_repos)
                page += 1
                
                # GitHub API rate limiting
                if len(repos) >= 1000:  # Reasonable limit
                    break
                    
            except requests.exceptions.RequestException as e:
                print(f"Error fetching GitHub repos: {e}")
                break
                
        print(f"Found {len(repos)} repositories")
        return repos

    def get_railway_projects(self) -> List[Dict]:
        """Fetch Railway projects using API or CLI."""
        if self.railway_headers:
            return self._get_railway_projects_api()
        else:
            return self._get_railway_projects_cli()

    def _get_railway_projects_api(self) -> List[Dict]:
        """Fetch Railway projects using API."""
        try:
            url = "https://backboard.railway.app/graphql/v1"
            query = """
            query {
                me {
                    projects {
                        id
                        name
                        createdAt
                        updatedAt
                    }
                }
            }
            """
            
            response = requests.post(
                url,
                headers=self.railway_headers,
                json={"query": query}
            )
            response.raise_for_status()
            
            data = response.json()
            if "data" in data and "me" in data["data"]:
                return data["data"]["me"]["projects"]
            return []
            
        except Exception as e:
            print(f"Error fetching Railway projects via API: {e}")
            return []

    def _get_railway_projects_cli(self) -> List[Dict]:
        """Fetch Railway projects using CLI."""
        try:
            result = subprocess.run(
                ["railway", "status", "--json"],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return data.get("projects", [])
            else:
                print(f"Railway CLI error: {result.stderr}")
                return []
                
        except subprocess.TimeoutExpired:
            print("Railway CLI command timed out")
            return []
        except Exception as e:
            print(f"Error running Railway CLI: {e}")
            return []

    def get_railway_deployment_logs(self, project_name: str, project_id: str = None) -> str:
        """Fetch deployment logs for a Railway project."""
        if self.railway_headers and project_id:
            return self._get_railway_logs_api(project_id)
        else:
            return self._get_railway_logs_cli(project_name)

    def _get_railway_logs_api(self, project_id: str) -> str:
        """Fetch logs using Railway API."""
        try:
            # This is a simplified version - Railway's actual API structure may vary
            url = f"https://backboard.railway.app/graphql/v1"
            query = """
            query($projectId: String!) {
                project(id: $projectId) {
                    deployments {
                        id
                        status
                        createdAt
                        logs
                    }
                }
            }
            """
            
            response = requests.post(
                url,
                headers=self.railway_headers,
                json={
                    "query": query,
                    "variables": {"projectId": project_id}
                }
            )
            response.raise_for_status()
            
            data = response.json()
            if "data" in data and "project" in data["data"]:
                deployments = data["data"]["project"]["deployments"]
                if deployments:
                    latest = deployments[0]  # Assuming sorted by date
                    return latest.get("logs", "")
            return ""
            
        except Exception as e:
            print(f"Error fetching logs via API: {e}")
            return ""

    def _get_railway_logs_cli(self, project_name: str) -> str:
        """Fetch logs using Railway CLI."""
        try:
            # Try to get logs for the project
            result = subprocess.run(
                ["railway", "logs", "--project", project_name, "--tail", "100"],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            if result.returncode == 0:
                return result.stdout
            else:
                # Try alternative approach
                result = subprocess.run(
                    ["railway", "logs", "--tail", "100"],
                    capture_output=True,
                    text=True,
                    timeout=60
                )
                return result.stdout if result.returncode == 0 else result.stderr
                
        except subprocess.TimeoutExpired:
            return "CLI command timed out"
        except Exception as e:
            return f"CLI error: {str(e)}"

    def analyze_logs(self, logs: str, repo_name: str) -> List[DeploymentIssue]:
        """Analyze deployment logs for common failure patterns."""
        issues = []
        
        if not logs or logs.strip() == "":
            issues.append(DeploymentIssue(
                type="no_logs",
                severity="warning",
                description="No deployment logs available",
                remediation="Check Railway dashboard or ensure proper authentication"
            ))
            return issues

        logs_lower = logs.lower()
        
        # Check for each failure pattern
        for issue_type, config in self.failure_patterns.items():
            for pattern in config["patterns"]:
                if re.search(pattern, logs_lower, re.IGNORECASE):
                    issues.append(DeploymentIssue(
                        type=issue_type,
                        severity=config["severity"],
                        description=f"Detected {issue_type.replace('_', ' ')} issue",
                        remediation=config["remediation"],
                        affected_files=self._extract_affected_files(logs, pattern)
                    ))
                    break  # Only add one issue per type

        # Check for success indicators
        success_indicators = [
            "deployment successful",
            "build completed",
            "server started",
            "listening on port",
            "application ready"
        ]
        
        has_success = any(indicator in logs_lower for indicator in success_indicators)
        
        if not has_success and not issues:
            issues.append(DeploymentIssue(
                type="unknown_failure",
                severity="warning",
                description="No clear success or failure indicators found",
                remediation="Review logs manually in Railway dashboard"
            ))

        return issues

    def _extract_affected_files(self, logs: str, pattern: str) -> List[str]:
        """Extract file names mentioned in error logs."""
        files = []
        file_patterns = [
            r"file:?\s*([^\s\n]+)",
            r"at\s+([^\s\n]+\.(js|ts|jsx|tsx|py|java|cpp|c|h))",
            r"in\s+([^\s\n]+\.(js|ts|jsx|tsx|py|java|cpp|c|h))",
            r"([^\s\n]+\.(js|ts|jsx|tsx|py|java|cpp|c|h)):\d+"
        ]
        
        for file_pattern in file_patterns:
            matches = re.findall(file_pattern, logs, re.IGNORECASE)
            files.extend([match[0] if isinstance(match, tuple) else match for match in matches])
        
        return list(set(files))  # Remove duplicates

    def analyze_repo(self, repo: Dict, railway_projects: List[Dict]) -> RepoAnalysis:
        """Analyze a single repository for deployment issues."""
        repo_name = repo["name"]
        print(f"Analyzing repository: {repo_name}")
        
        # Try to find matching Railway project
        railway_project = None
        for project in railway_projects:
            if project["name"].lower() == repo_name.lower():
                railway_project = project
                break
        
        if not railway_project:
            return RepoAnalysis(
                repo_name=repo_name,
                status=DeploymentStatus.UNKNOWN,
                issues=[DeploymentIssue(
                    type="no_railway_project",
                    severity="info",
                    description="No matching Railway project found",
                    remediation="Deploy this repository to Railway or check project naming"
                )],
                logs_preview="No Railway project found"
            )
        
        # Get deployment logs
        logs = self.get_railway_deployment_logs(
            railway_project["name"], 
            railway_project.get("id")
        )
        
        # Analyze logs
        issues = self.analyze_logs(logs, repo_name)
        
        # Determine status
        if not issues or all(issue.severity == "info" for issue in issues):
            status = DeploymentStatus.SUCCESS
        elif any(issue.severity == "critical" for issue in issues):
            status = DeploymentStatus.FAILED
        else:
            status = DeploymentStatus.PENDING
        
        return RepoAnalysis(
            repo_name=repo_name,
            status=status,
            issues=issues,
            last_deployment=railway_project.get("updatedAt"),
            logs_preview=logs[:500] + "..." if len(logs) > 500 else logs
        )

    def generate_report(self, analyses: List[RepoAnalysis]) -> str:
        """Generate a comprehensive deployment analysis report."""
        report = []
        report.append("=" * 80)
        report.append("RAILWAY DEPLOYMENT FAILURE ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total Repositories Analyzed: {len(analyses)}")
        report.append("")
        
        # Summary statistics
        status_counts = {}
        critical_issues = 0
        warning_issues = 0
        
        for analysis in analyses:
            status_counts[analysis.status.value] = status_counts.get(analysis.status.value, 0) + 1
            for issue in analysis.issues:
                if issue.severity == "critical":
                    critical_issues += 1
                elif issue.severity == "warning":
                    warning_issues += 1
        
        report.append("SUMMARY:")
        report.append("-" * 40)
        for status, count in status_counts.items():
            report.append(f"  {status.upper()}: {count}")
        report.append(f"  Critical Issues: {critical_issues}")
        report.append(f"  Warning Issues: {warning_issues}")
        report.append("")
        
        # Detailed analysis for each repo
        for analysis in analyses:
            report.append(f"REPOSITORY: {analysis.repo_name}")
            report.append("-" * 50)
            report.append(f"Status: {analysis.status.value.upper()}")
            
            if analysis.last_deployment:
                report.append(f"Last Deployment: {analysis.last_deployment}")
            
            if analysis.issues:
                report.append("\nIssues Found:")
                for i, issue in enumerate(analysis.issues, 1):
                    report.append(f"  {i}. [{issue.severity.upper()}] {issue.description}")
                    report.append(f"     Remediation: {issue.remediation}")
                    if issue.affected_files:
                        report.append(f"     Affected Files: {', '.join(issue.affected_files)}")
            else:
                report.append("No issues detected - deployment appears successful!")
            
            if analysis.logs_preview:
                report.append(f"\nLogs Preview:")
                report.append("```")
                report.append(analysis.logs_preview)
                report.append("```")
            
            report.append("\n" + "=" * 80 + "\n")
        
        return "\n".join(report)

    def run_analysis(self, github_username: str) -> None:
        """Run the complete deployment analysis."""
        print("Starting Railway Deployment Analysis...")
        print("=" * 50)
        
        # Get GitHub repositories
        repos = self.get_github_repos(github_username)
        if not repos:
            print("No repositories found or error occurred.")
            return
        
        # Get Railway projects
        railway_projects = self.get_railway_projects()
        print(f"Found {len(railway_projects)} Railway projects")
        
        # Analyze each repository
        analyses = []
        for repo in repos:
            try:
                analysis = self.analyze_repo(repo, railway_projects)
                analyses.append(analysis)
            except Exception as e:
                print(f"Error analyzing {repo['name']}: {e}")
                analyses.append(RepoAnalysis(
                    repo_name=repo["name"],
                    status=DeploymentStatus.UNKNOWN,
                    issues=[DeploymentIssue(
                        type="analysis_error",
                        severity="warning",
                        description=f"Error during analysis: {str(e)}",
                        remediation="Check repository access and try again"
                    )]
                ))
        
        # Generate and display report
        report = self.generate_report(analyses)
        print("\n" + report)
        
        # Save report to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"railway_deployment_analysis_{timestamp}.txt"
        with open(filename, "w") as f:
            f.write(report)
        print(f"\nReport saved to: {filename}")

def main():
    """Main entry point for the script."""
    print("Railway Deployment Failure Analyzer")
    print("=" * 40)
    
    # Get credentials
    github_token = input("Enter your GitHub Personal Access Token: ").strip()
    if not github_token:
        print("GitHub token is required!")
        sys.exit(1)
    
    railway_token = input("Enter your Railway API Token (optional, press Enter to skip): ").strip()
    if not railway_token:
        print("No Railway token provided. Will attempt to use Railway CLI if available.")
    
    github_username = input("Enter your GitHub username: ").strip()
    if not github_username:
        print("GitHub username is required!")
        sys.exit(1)
    
    # Create analyzer and run analysis
    analyzer = RailwayDeploymentAnalyzer(github_token, railway_token)
    analyzer.run_analysis(github_username)

if __name__ == "__main__":
    main()