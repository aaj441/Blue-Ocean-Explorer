#!/bin/bash

# Railway Deployment Automation Script
# This script automates the setup and deployment of your Node.js app to Railway

set -e  # Exit on any error

echo "🚀 Railway Deployment Automation Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        curl -fsSL https://railway.app/install.sh | sh
        export PATH="$HOME/.railway/bin:$PATH"
        print_success "Railway CLI installed"
    else
        print_success "Railway CLI found"
    fi
}

# Ensure all required files exist
ensure_config_files() {
    print_status "Ensuring Railway configuration files..."
    
    # Procfile
    if [ ! -f Procfile ]; then
        echo "web: pnpm start" > Procfile
        print_success "Created Procfile"
    else
        print_success "Procfile already exists"
    fi
    
    # .env.example
    if [ ! -f .env.example ]; then
        cat > .env.example << 'EOF'
# Railway Environment Variables Template
NODE_ENV=production
BASE_URL=https://your-app.railway.app
BASE_URL_OTHER_PORT=http://localhost:3000
ADMIN_PASSWORD=your-secure-admin-password
JWT_SECRET=your-jwt-secret-key-min-32-chars
OPENROUTER_API_KEY=your-openrouter-api-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
DEFAULT_COMMISSION_RATE=0.70
REFERRAL_REWARD_AMOUNT=10
PORT=3000
EOF
        print_success "Created .env.example"
    else
        print_success ".env.example already exists"
    fi
    
    # railway.json
    if [ ! -f railway.json ]; then
        cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
        print_success "Created railway.json"
    else
        print_success "railway.json already exists"
    fi
}

# Validate package.json
validate_package_json() {
    print_status "Validating package.json..."
    
    if [ ! -f package.json ]; then
        print_error "package.json not found!"
        exit 1
    fi
    
    # Check for required scripts
    if ! grep -q '"start":' package.json; then
        print_error "Missing 'start' script in package.json"
        exit 1
    fi
    
    if ! grep -q '"build":' package.json; then
        print_error "Missing 'build' script in package.json"
        exit 1
    fi
    
    print_success "package.json validation passed"
}

# Install dependencies and build
build_application() {
    print_status "Installing dependencies and building application..."
    
    # Install dependencies
    pnpm install
    
    # Type check
    print_status "Running type check..."
    pnpm typecheck
    
    # Lint
    print_status "Running linter..."
    pnpm lint
    
    # Build
    print_status "Building application..."
    pnpm build
    
    print_success "Application built successfully"
}

# Set up Railway project
setup_railway_project() {
    print_status "Setting up Railway project..."
    
    # Login to Railway (if not already logged in)
    if ! railway whoami &> /dev/null; then
        print_warning "Please log in to Railway:"
        railway login
    fi
    
    # Initialize Railway project if not already initialized
    if [ ! -f .railway/project.json ]; then
        print_status "Initializing Railway project..."
        railway init
    fi
    
    print_success "Railway project setup complete"
}

# Set environment variables
set_environment_variables() {
    print_status "Setting up environment variables..."
    
    # Read .env.example and set variables
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ $key =~ ^[[:space:]]*# ]] || [[ -z $key ]]; then
            continue
        fi
        
        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Skip if value is a placeholder
        if [[ $value =~ ^your- ]] || [[ $value =~ ^sk_test_ ]] || [[ $value =~ ^pk_test_ ]] || [[ $value =~ ^whsec_ ]]; then
            print_warning "Skipping placeholder variable: $key"
            continue
        fi
        
        # Set the variable
        railway variables set "$key=$value"
        print_success "Set $key"
    done < .env.example
    
    print_success "Environment variables configured"
}

# Deploy to Railway
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    railway up
    
    print_success "Deployment initiated! Check Railway dashboard for progress."
}

# Main execution
main() {
    echo
    print_status "Starting Railway deployment automation..."
    echo
    
    # Check prerequisites
    check_railway_cli
    ensure_config_files
    validate_package_json
    build_application
    
    echo
    print_status "Configuration complete! Choose your next step:"
    echo "1. Setup Railway project and deploy"
    echo "2. Just setup Railway project (no deploy)"
    echo "3. Just deploy (assumes project already setup)"
    echo "4. Exit"
    echo
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            setup_railway_project
            set_environment_variables
            deploy_to_railway
            ;;
        2)
            setup_railway_project
            set_environment_variables
            print_success "Railway project setup complete. Run 'railway up' to deploy."
            ;;
        3)
            deploy_to_railway
            ;;
        4)
            print_success "Exiting. Run this script again when ready to deploy."
            exit 0
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    echo
    print_success "Railway deployment automation complete! 🎉"
    echo
    print_status "Next steps:"
    echo "1. Check your Railway dashboard for deployment status"
    echo "2. Update environment variables in Railway dashboard if needed"
    echo "3. Test your deployed application"
    echo
}

# Run main function
main "$@"