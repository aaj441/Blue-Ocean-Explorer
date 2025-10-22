#!/usr/bin/env node

/**
 * Railway Environment Variables Setup Script
 * Automatically sets up environment variables in Railway from .env.example
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkRailwayCLI() {
  try {
    execSync('railway --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function installRailwayCLI() {
  log('Installing Railway CLI...', 'yellow');
  try {
    execSync('curl -fsSL https://railway.app/install.sh | sh', { stdio: 'inherit' });
    log('Railway CLI installed successfully!', 'green');
    return true;
  } catch (error) {
    log('Failed to install Railway CLI', 'red');
    return false;
  }
}

function checkLogin() {
  try {
    execSync('railway whoami', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const variables = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (line.startsWith('#') || !line) return;
    
    const equalIndex = line.indexOf('=');
    if (equalIndex === -1) return;
    
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();
    
    // Skip placeholder values
    if (value.startsWith('your-') || 
        value.startsWith('sk_test_') || 
        value.startsWith('pk_test_') || 
        value.startsWith('whsec_') ||
        value === 'your-secure-admin-password' ||
        value === 'your-jwt-secret-key-min-32-chars' ||
        value === 'your-openrouter-api-key') {
      return;
    }
    
    variables[key] = value;
  });
  
  return variables;
}

function setEnvironmentVariables(variables) {
  log('Setting environment variables in Railway...', 'blue');
  
  Object.entries(variables).forEach(([key, value]) => {
    try {
      execSync(`railway variables set ${key}="${value}"`, { stdio: 'pipe' });
      log(`✅ Set ${key}`, 'green');
    } catch (error) {
      log(`❌ Failed to set ${key}: ${error.message}`, 'red');
    }
  });
}

function main() {
  log('🚀 Railway Environment Variables Setup', 'cyan');
  log('=====================================', 'cyan');
  
  // Check if .env.example exists
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    log('❌ .env.example file not found!', 'red');
    log('Please create .env.example with your environment variables.', 'yellow');
    process.exit(1);
  }
  
  // Check Railway CLI
  if (!checkRailwayCLI()) {
    log('Railway CLI not found. Installing...', 'yellow');
    if (!installRailwayCLI()) {
      log('Failed to install Railway CLI. Please install manually.', 'red');
      process.exit(1);
    }
  }
  
  // Check login status
  if (!checkLogin()) {
    log('Please log in to Railway first:', 'yellow');
    log('Run: railway login', 'blue');
    process.exit(1);
  }
  
  // Parse environment variables
  log('Parsing .env.example...', 'blue');
  const variables = parseEnvFile(envExamplePath);
  
  if (Object.keys(variables).length === 0) {
    log('No valid environment variables found in .env.example', 'yellow');
    log('Make sure to set actual values (not placeholders) in .env.example', 'yellow');
    process.exit(0);
  }
  
  log(`Found ${Object.keys(variables).length} environment variables to set`, 'green');
  
  // Set variables
  setEnvironmentVariables(variables);
  
  log('', 'reset');
  log('🎉 Environment variables setup complete!', 'green');
  log('', 'reset');
  log('Next steps:', 'blue');
  log('1. Check your Railway dashboard to verify variables', 'reset');
  log('2. Deploy your application: railway up', 'reset');
  log('3. Test your deployed application', 'reset');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, parseEnvFile, setEnvironmentVariables };