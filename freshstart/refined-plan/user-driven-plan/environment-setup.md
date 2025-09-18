# Environment Setup Guide

> **Complete environment configuration for DevNet implementation**

## Prerequisites

### Required Software

**Node.js 22 LTS or higher:**
```bash
# Check current version
node --version

# Install via nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 22
nvm use 22
nvm alias default 22

# Or download from: https://nodejs.org/
```

**pnpm 10.14.0 or higher:**
```bash
# Install pnpm globally
npm install -g pnpm@latest

# Verify installation
pnpm --version
```

**Git (any recent version):**
```bash
# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Or download from: https://git-scm.com/
```

**Docker (optional but recommended):**
```bash
# macOS/Windows: Download Docker Desktop from https://docs.docker.com/get-docker/
# Linux: Install Docker Engine

# Verify installation
docker --version
```

## Environment Variables

### Required Configuration

Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# DevNet Core Configuration
export DEVNET_HOME="$HOME/Projects/devnet"
export ENGINEERING_OS_HOME="$HOME/Projects/devnet.starter"
export DEVNET_GIT_REMOTE="git@github.com:YOUR_USERNAME/devnet.git"  # Update this!

# Optional Configuration
export DEVNET_PORT_API="4000"
export DEVNET_PORT_WEB="4001"
export VERIFICATION_MODE="blocking"

# Development Environment (optional)
export NODE_ENV="development"
export DEBUG="devnet:*"
```

**⚠️ Important**: Replace `YOUR_USERNAME` with your actual GitHub username or organization.

### Reload Environment

```bash
# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc, ~/.profile

# Verify variables are set
echo $DEVNET_HOME
echo $DEVNET_GIT_REMOTE
```

## Directory Structure

### Create Workspace Directories

```bash
# Create required directories
mkdir -p ~/Projects/devnet ~/Projects/devnet.starter

# Verify structure
ls ~/Projects/
# Should show: devnet  devnet.starter
```

### Verify Current Location

You should currently be in the starter/reference repository:

```bash
# Check current location
pwd
# Should be something like: /Users/yourname/Projects/devnet.starter

# Verify this is the reference repository
ls freshstart/refined-plan/
# Should show: implementation-plan.md, phases/, user-driven-plan/, etc.
```

## Git Configuration

### Global Git Setup

```bash
# Set your Git identity (if not already configured)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Verify configuration
git config --global --list | grep user
```

### GitHub Repository Setup

1. **Create Repository**:
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name it `devnet`
   - Keep it empty (no README, .gitignore, or license)
   - Click "Create repository"

2. **Copy SSH URL**:
   - Copy the SSH clone URL: `git@github.com:YOUR_USERNAME/devnet.git`
   - Update your `DEVNET_GIT_REMOTE` environment variable

3. **Test Access**:
   ```bash
   # Test SSH access to GitHub
   ssh -T git@github.com
   # Should show: "Hi username! You've successfully authenticated..."
   ```

### SSH Key Setup (if needed)

```bash
# Check if you have SSH keys
ls -la ~/.ssh/
# Look for: id_rsa.pub, id_ed25519.pub, or similar

# If no SSH key exists, generate one
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy the output and add it to GitHub → Settings → SSH and GPG keys
```

## Database Setup (Optional)

### PostgreSQL with Docker

```bash
# Create docker-compose file for local development
cat > ~/Projects/devnet-database.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: devnet_dev_db
      POSTGRES_USER: devnet_dev_user
      POSTGRES_PASSWORD: devnet_pwd
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker-compose -f ~/Projects/devnet-database.yml up -d

# Test connection
psql "postgresql://devnet_dev_user:devnet_pwd@localhost:5432/devnet_dev_db" -c "SELECT version();"
```

### Database Environment Variables

Add to your shell profile:

```bash
# Database Configuration
export DATABASE_URL="postgresql://devnet_dev_user:devnet_pwd@localhost:5432/devnet_dev_db"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
export DATABASE_NAME="devnet_dev_db"
export DATABASE_USER="devnet_dev_user"
export DATABASE_PASSWORD="devnet_pwd"
```

## IDE Configuration

### VS Code Setup (Recommended)

**Install Extensions:**
```bash
# Install VS Code extensions via command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-playwright.playwright
code --install-extension ms-vscode.vscode-json
code --install-extension biomejs.biome
```

**Workspace Settings** - Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "auto"
}
```

### Other IDEs

**WebStorm/IntelliJ**:
- Install Biome plugin
- Configure TypeScript service
- Enable ESLint/Prettier integration

**Vim/Neovim**:
- Install TypeScript language server
- Configure Biome and Prettier
- Set up file watchers

## Development Tools

### Essential Tools

```bash
# Install global development utilities
pnpm add -g @biomejs/biome
pnpm add -g typescript
pnpm add -g @playwright/test

# Verify installations
biome --version
tsc --version
npx playwright --version
```

### Optional Tools

```bash
# Useful development tools
pnpm add -g nodemon
pnpm add -g concurrently
pnpm add -g cross-env
```

## Network Configuration

### Port Allocation

Default ports used by DevNet:
- **3000**: Next.js development server
- **4000**: API server (DEVNET_PORT_API)
- **4001**: Alternative web port (DEVNET_PORT_WEB)
- **5432**: PostgreSQL database

### Firewall Configuration

Ensure these ports are available:

```bash
# Check if ports are in use
lsof -i :3000
lsof -i :4000
lsof -i :5432

# Should return nothing if ports are free
```

## Verification Checklist

### Complete Environment Check

```bash
echo "🔍 DevNet Environment Verification:"
echo ""

# Tool versions
echo "📦 Required Tools:"
echo "- Node: $(node --version 2>/dev/null || echo '❌ NOT INSTALLED')"
echo "- pnpm: $(pnpm --version 2>/dev/null || echo '❌ NOT INSTALLED')"
echo "- Git: $(git --version 2>/dev/null | head -1 || echo '❌ NOT INSTALLED')"
echo "- Docker: $(docker --version 2>/dev/null || echo '⚠️ OPTIONAL')"
echo ""

# Environment variables
echo "🌍 Environment Variables:"
echo "- DEVNET_HOME: ${DEVNET_HOME:-'❌ NOT SET'}"
echo "- ENGINEERING_OS_HOME: ${ENGINEERING_OS_HOME:-'❌ NOT SET'}"
echo "- DEVNET_GIT_REMOTE: ${DEVNET_GIT_REMOTE:-'❌ NOT SET'}"
echo ""

# Directory structure
echo "📁 Directory Structure:"
echo "- DevNet workspace: $([ -d "${DEVNET_HOME}" ] && echo '✅ EXISTS' || echo '❌ MISSING')"
echo "- Starter reference: $([ -d "${ENGINEERING_OS_HOME}" ] && echo '✅ EXISTS' || echo '❌ MISSING')"
echo "- Current location: $(pwd)"
echo ""

# Git configuration
echo "⚙️ Git Configuration:"
echo "- Name: $(git config --global user.name 2>/dev/null || echo '❌ NOT SET')"
echo "- Email: $(git config --global user.email 2>/dev/null || echo '❌ NOT SET')"
echo "- SSH key: $([ -f ~/.ssh/id_rsa.pub ] || [ -f ~/.ssh/id_ed25519.pub ] && echo '✅ EXISTS' || echo '⚠️ MISSING')"
echo ""

# Network connectivity
echo "🌐 Connectivity:"
echo "- GitHub SSH: $(ssh -T git@github.com 2>&1 | grep -q 'successfully authenticated' && echo '✅ WORKING' || echo '❌ FAILED')"
echo "- NPM registry: $(npm ping >/dev/null 2>&1 && echo '✅ ACCESSIBLE' || echo '❌ BLOCKED')"
echo ""

# Database (optional)
if command -v psql >/dev/null 2>&1 && [ -n "${DATABASE_URL}" ]; then
  echo "🗄️ Database:"
  echo "- PostgreSQL: $(psql "${DATABASE_URL}" -c 'SELECT version();' >/dev/null 2>&1 && echo '✅ CONNECTED' || echo '❌ FAILED')"
  echo ""
fi

# Ready status
echo "🎯 Ready Status:"
if [ -n "${DEVNET_HOME}" ] && [ -n "${DEVNET_GIT_REMOTE}" ] && command -v node >/dev/null && command -v pnpm >/dev/null; then
  echo "✅ READY TO START IMPLEMENTATION!"
  echo ""
  echo "Next steps:"
  echo "1. Open the EXECUTION-GUIDE.md"
  echo "2. Begin with Phase A: Foundation"
else
  echo "❌ SETUP INCOMPLETE"
  echo "Review the failed items above and complete setup."
fi
```

### Expected Output

You should see:
- ✅ All required tools installed with correct versions
- ✅ All environment variables set
- ✅ Directory structure created
- ✅ Git configured with identity
- ✅ SSH access to GitHub working
- ✅ "READY TO START IMPLEMENTATION!" message

## Troubleshooting

### Common Issues

**Node version too old:**
```bash
# Update Node using nvm
nvm install 22
nvm alias default 22
nvm use 22
```

**pnpm command not found:**
```bash
# Restart terminal or reload shell
source ~/.bashrc  # or ~/.zshrc

# Or reinstall pnpm
npm install -g pnpm@latest
```

**SSH authentication failing:**
```bash
# Test SSH connection
ssh -T git@github.com

# If it fails, check SSH key:
cat ~/.ssh/id_ed25519.pub  # Copy to GitHub Settings → SSH Keys

# Or generate new key:
ssh-keygen -t ed25519 -C "your.email@example.com"
```

**Environment variables not persisting:**
```bash
# Check which shell you're using
echo $SHELL

# Edit the correct file:
# For bash: ~/.bashrc
# For zsh: ~/.zshrc
# For fish: ~/.config/fish/config.fish

# Then restart terminal or:
source ~/.bashrc  # or appropriate file
```

**Port conflicts:**
```bash
# Find process using port
lsof -i :3000
lsof -i :4000

# Kill process if needed
kill -9 <PID>

# Or change port in environment variables
export DEVNET_PORT_API="4002"
export DEVNET_PORT_WEB="4003"
```

**Database connection issues:**
```bash
# Start database
docker-compose -f ~/Projects/devnet-database.yml up -d

# Check database logs
docker-compose -f ~/Projects/devnet-database.yml logs postgres

# Reset database
docker-compose -f ~/Projects/devnet-database.yml down -v
docker-compose -f ~/Projects/devnet-database.yml up -d
```

### Getting Additional Help

**Documentation Resources:**
- [Node.js Installation Guide](https://nodejs.org/)
- [pnpm Installation](https://pnpm.io/installation)
- [Git Setup Guide](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [SSH Key Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

**DevNet Specific:**
- Check the troubleshooting.md guide
- Review recovery-procedures.md for rollback steps
- Refer to the main EXECUTION-GUIDE.md for implementation guidance

---

## Next Steps

Once your environment verification shows "READY TO START IMPLEMENTATION!", proceed to:

**👉 [EXECUTION-GUIDE.md](EXECUTION-GUIDE.md)**

This will guide you through the complete DevNet implementation across all 5 phases, using the smart prompts designed to leverage the dispatcher system for efficient, reliable execution.

**Ready to build something amazing?** Let's go! 🚀