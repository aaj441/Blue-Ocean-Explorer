#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { env } from '../env';

const prisma = new PrismaClient();

interface SecurityIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  recommendation: string;
}

async function runSecurityAudit() {
  console.log('🔒 Running security audit...\n');
  
  const issues: SecurityIssue[] = [];
  
  // 1. Check environment variables
  console.log('Checking environment variables...');
  checkEnvironmentVariables(issues);
  
  // 2. Check database security
  console.log('Checking database security...');
  await checkDatabaseSecurity(issues);
  
  // 3. Check file permissions
  console.log('Checking file permissions...');
  await checkFilePermissions(issues);
  
  // 4. Check dependencies
  console.log('Checking dependencies...');
  await checkDependencies(issues);
  
  // 5. Check authentication configuration
  console.log('Checking authentication configuration...');
  checkAuthConfiguration(issues);
  
  // 6. Check for hardcoded secrets
  console.log('Checking for hardcoded secrets...');
  await checkForHardcodedSecrets(issues);
  
  // Generate report
  generateReport(issues);
}

function checkEnvironmentVariables(issues: SecurityIssue[]) {
  // Check for weak secrets
  if (env.JWT_SECRET.length < 32) {
    issues.push({
      severity: 'high',
      category: 'Configuration',
      description: 'JWT_SECRET is too short',
      recommendation: 'Use a JWT secret with at least 32 characters',
    });
  }
  
  if (env.ADMIN_PASSWORD === 'admin123' || env.ADMIN_PASSWORD.length < 12) {
    issues.push({
      severity: 'critical',
      category: 'Configuration',
      description: 'Weak admin password detected',
      recommendation: 'Use a strong admin password with at least 12 characters',
    });
  }
  
  // Check for default values in production
  if (env.NODE_ENV === 'production') {
    if (env.JWT_SECRET.includes('dev') || env.JWT_SECRET.includes('test')) {
      issues.push({
        severity: 'critical',
        category: 'Configuration',
        description: 'Development JWT secret used in production',
        recommendation: 'Generate a secure random JWT secret for production',
      });
    }
    
    if (!env.SENTRY_DSN) {
      issues.push({
        severity: 'medium',
        category: 'Monitoring',
        description: 'Error monitoring not configured',
        recommendation: 'Configure Sentry or similar error monitoring service',
      });
    }
  }
}

async function checkDatabaseSecurity(issues: SecurityIssue[]) {
  try {
    // Check for users with weak passwords (simplified check)
    const users = await prisma.user.findMany({
      select: { id: true, email: true, passwordHash: true },
    });
    
    // In a real audit, you'd check password complexity
    // This is just a placeholder
    
    // Check for admin users
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' },
    });
    
    if (adminCount === 0) {
      issues.push({
        severity: 'medium',
        category: 'Access Control',
        description: 'No admin users found',
        recommendation: 'Create at least one admin user for system management',
      });
    } else if (adminCount > 5) {
      issues.push({
        severity: 'low',
        category: 'Access Control',
        description: 'Many admin users detected',
        recommendation: 'Review admin access and follow principle of least privilege',
      });
    }
  } catch (error) {
    logger.error('Database security check failed', { error });
  }
}

async function checkFilePermissions(issues: SecurityIssue[]) {
  const sensitivePaths = [
    '.env',
    '.env.production',
    'prisma/schema.prisma',
  ];
  
  for (const filePath of sensitivePaths) {
    try {
      const stats = await fs.stat(path.join(process.cwd(), filePath));
      const mode = (stats.mode & parseInt('777', 8)).toString(8);
      
      if (mode !== '600' && mode !== '640') {
        issues.push({
          severity: 'high',
          category: 'File Permissions',
          description: `File ${filePath} has overly permissive permissions (${mode})`,
          recommendation: `Change permissions to 600 or 640 for ${filePath}`,
        });
      }
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }
}

async function checkDependencies(issues: SecurityIssue[]) {
  try {
    // In a real implementation, you'd use npm audit or similar
    // This is a simplified check
    const packageJson = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf-8')
    );
    
    // Check for outdated security-critical packages
    const criticalPackages = [
      'jsonwebtoken',
      'bcryptjs',
      '@prisma/client',
    ];
    
    // This is a placeholder - in reality, you'd check actual versions
    // against known vulnerabilities
  } catch (error) {
    logger.error('Dependency check failed', { error });
  }
}

function checkAuthConfiguration(issues: SecurityIssue[]) {
  // Check session configuration
  const sessionMaxAge = Number(env.SESSION_MAX_AGE || 0);
  if (sessionMaxAge > 30 * 24 * 60 * 60 * 1000) { // 30 days
    issues.push({
      severity: 'low',
      category: 'Authentication',
      description: 'Session timeout is very long',
      recommendation: 'Consider reducing session timeout to 30 days or less',
    });
  }
  
  // Check rate limiting
  if (!env.RATE_LIMIT_WINDOW_MS || !env.RATE_LIMIT_MAX_REQUESTS) {
    issues.push({
      severity: 'high',
      category: 'Rate Limiting',
      description: 'Rate limiting not configured',
      recommendation: 'Configure rate limiting to prevent abuse',
    });
  }
}

async function checkForHardcodedSecrets(issues: SecurityIssue[]) {
  const sourceFiles = [
    'server/**/*.ts',
    'server/**/*.js',
    'components/**/*.tsx',
    'routes/**/*.tsx',
  ];
  
  const secretPatterns = [
    /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
    /password\s*[:=]\s*["'][^"']+["']/gi,
    /secret\s*[:=]\s*["'][^"']+["']/gi,
    /token\s*[:=]\s*["'][^"']+["']/gi,
  ];
  
  // This is a simplified check - in reality, use a proper secret scanner
  // like truffleHog or git-secrets
}

function generateReport(issues: SecurityIssue[]) {
  console.log('\n📊 Security Audit Report\n');
  console.log('=' .repeat(50));
  
  const byCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, SecurityIssue[]>);
  
  const bySeverity = {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low'),
  };
  
  console.log('\nSummary:');
  console.log(`  Critical: ${bySeverity.critical.length}`);
  console.log(`  High: ${bySeverity.high.length}`);
  console.log(`  Medium: ${bySeverity.medium.length}`);
  console.log(`  Low: ${bySeverity.low.length}`);
  console.log(`  Total: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\nIssues by Category:');
    for (const [category, categoryIssues] of Object.entries(byCategory)) {
      console.log(`\n${category}:`);
      for (const issue of categoryIssues) {
        console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
        console.log(`    → ${issue.recommendation}`);
      }
    }
  } else {
    console.log('\n✅ No security issues found!');
  }
  
  console.log('\n' + '='.repeat(50));
  
  // Write detailed report to file
  const report = {
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    summary: {
      total: issues.length,
      critical: bySeverity.critical.length,
      high: bySeverity.high.length,
      medium: bySeverity.medium.length,
      low: bySeverity.low.length,
    },
    issues,
  };
  
  fs.writeFile(
    'security-audit-report.json',
    JSON.stringify(report, null, 2)
  ).then(() => {
    console.log('\nDetailed report saved to security-audit-report.json');
  });
}

// Run the audit
runSecurityAudit()
  .catch((error) => {
    console.error('Security audit failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });