# DevNet Quick Start — Environment Setup

> **Get your development environment ready for the DevNet implementation in 15 minutes**

## Overview

This guide helps you set up your development environment before starting the DevNet implementation phases. Complete this setup once, then proceed to the [User Execution Guide](USER-EXECUTION-GUIDE.md) for the full implementation.

## Prerequisites Check

### Required Software
Verify you have the following installed:

```bash
# Check Node.js version (need 22+ LTS)
node --version

# Check pnpm version (need 10.14.0+)
pnpm --version

# Check Git version
git --version

# Check Docker (optional but recommended)
docker --version
```

### Install Missing Tools

**Node.js 22 LTS:**
```bash
# Using nvm (recommended)
nvm install 22
nvm use 22

# Or download from: https://nodejs.org/
```

**pnpm Package Manager:**
```bash
# Install pnpm globally
npm install -g pnpm@latest

# Verify installation
pnpm --version
```

**Git:**
```bash
# macOS (using Homebrew)
brew install git

# Ubuntu/Debian
sudo apt-get install git

# Or download from: https://git-scm.com/
```

**Docker (Optional but Recommended):**
```bash
# macOS/Windows: Download Docker Desktop
# Linux: Install Docker Engine
# See: https://docs.docker.com/get-docker/
```

## Environment Configuration

### 1. Create Directory Structure
```bash
# Create the workspace directories
mkdir -p ~/Projects/devnet ~/Projects/devnet.starter

# Verify structure
ls ~/Projects/
# Should show: devnet  devnet.starter
```

### 2. Set Environment Variables
Add these to your shell profile (`~/.bashrc`, `~/.zshrc`, or `~/.profile`):

```bash
# DevNet Environment Configuration
export DEVNET_HOME="$HOME/Projects/devnet"
export ENGINEERING_OS_HOME="$HOME/Projects/devnet.starter"
export DEVNET_GIT_REMOTE="git@github.com:YOUR_USERNAME/devnet.git"  # Update this

# Optional: API and Web ports (defaults are fine)
export DEVNET_PORT_API="4000"
export DEVNET_PORT_WEB="4001"

# Optional: Verification mode
export VERIFICATION_MODE="blocking"
```

**⚠️ Important**: Replace `YOUR_USERNAME` with your actual GitHub username or organization.

### 3. Reload Environment
```bash
# Reload your shell configuration
source ~/.bashrc  # or ~/.zshrc, ~/.profile
```

### 4. Verify Environment Setup
```bash
echo "Environment Check:"
echo "- DEVNET_HOME: ${DEVNET_HOME}"
echo "- ENGINEERING_OS_HOME: ${ENGINEERING_OS_HOME}"
echo "- DEVNET_GIT_REMOTE: ${DEVNET_GIT_REMOTE}"
```

## Git Configuration

### 1. Configure Git Identity
```bash
# Set your Git identity (if not already done)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 2. GitHub Repository Setup
Create your DevNet repository on GitHub:

1. Go to [GitHub](https://github.com) and create a new repository named `devnet`
2. Leave it empty (no README, .gitignore, or license)
3. Copy the SSH clone URL: `git@github.com:YOUR_USERNAME/devnet.git`
4. Update your `DEVNET_GIT_REMOTE` environment variable with this URL

### 3. SSH Key Setup (if needed)
```bash
# Check if you have SSH keys
ls -la ~/.ssh/

# If no id_rsa.pub or id_ed25519.pub, generate new key
ssh-keygen -t ed25519 -C "your.email@example.com"

# Add key to ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copy public key to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy output and add to GitHub → Settings → SSH and GPG keys
```

## IDE Setup (Optional but Recommended)

### VS Code Extensions
If using VS Code, install these recommended extensions:

```bash
# Install VS Code extensions via command line
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-playwright.playwright
code --install-extension ms-vscode.vscode-json
```

Or search and install manually:
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- Playwright Test for VS Code
- JSON Language Features

### VS Code Settings
Create `.vscode/settings.json` in your workspace with recommended settings:

```json
{
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  }
}
```

## Database Setup (Optional for Phase A-C)

### PostgreSQL with Docker
```bash
# Create docker-compose.yml for local development
cat > ~/Projects/devnet-db.yml << 'EOF'
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
docker-compose -f ~/Projects/devnet-db.yml up -d

# Verify connection
psql "postgresql://devnet_dev_user:devnet_pwd@localhost:5432/devnet_dev_db" -c "SELECT version();"
```

## Verification Checklist

Run this comprehensive check before starting Phase A:

```bash
echo "🔍 DevNet Environment Verification:"
echo ""

# Tool versions
echo "📦 Tool Versions:"
echo "- Node: $(node --version)"
echo "- pnpm: $(pnpm --version)"
echo "- Git: $(git --version | head -1)"
echo "- Docker: $(docker --version 2>/dev/null || echo 'Not installed')"
echo ""

# Environment variables
echo "🌍 Environment Variables:"
echo "- DEVNET_HOME: ${DEVNET_HOME:-'❌ NOT SET'}"
echo "- ENGINEERING_OS_HOME: ${ENGINEERING_OS_HOME:-'❌ NOT SET'}"
echo "- DEVNET_GIT_REMOTE: ${DEVNET_GIT_REMOTE:-'❌ NOT SET'}"
echo ""

# Directory structure
echo "📁 Directory Structure:"
echo "- DevNet workspace: $([ -d "${DEVNET_HOME}" ] && echo '✅ exists' || echo '❌ missing')"
echo "- DevNet starter: $([ -d "${ENGINEERING_OS_HOME}" ] && echo '✅ exists' || echo '❌ missing')"
echo ""

# Git configuration
echo "⚙️  Git Configuration:"
echo "- Name: $(git config --global user.name || echo '❌ not set')"
echo "- Email: $(git config --global user.email || echo '❌ not set')"
echo "- SSH key: $([ -f ~/.ssh/id_rsa.pub ] || [ -f ~/.ssh/id_ed25519.pub ] && echo '✅ found' || echo '⚠️  setup recommended')"
echo ""

# Network connectivity
echo "🌐 Connectivity:"
echo "- GitHub access: $(ssh -T git@github.com 2>&1 | grep -q 'successfully authenticated' && echo '✅ SSH working' || echo '⚠️  check SSH setup')"
echo "- NPM registry: $(npm ping >/dev/null 2>&1 && echo '✅ accessible' || echo '❌ connection issues')"
echo ""

# Ready status
if [ -n "${DEVNET_HOME}" ] && [ -n "${DEVNET_GIT_REMOTE}" ] && command -v node >/dev/null && command -v pnpm >/dev/null; then
  echo "✅ READY TO START PHASE A!"
  echo ""
  echo "Next steps:"
  echo "1. Open the USER-EXECUTION-GUIDE.md"
  echo "2. Begin with Phase A: Foundation"
else
  echo "❌ Setup incomplete. Review failed items above."
fi
```

## Expected Output
You should see:
- ✅ All tool versions showing Node 22+, pnpm 10.14+
- ✅ All environment variables set
- ✅ Directory structure created
- ✅ Git configured with name and email
- ✅ SSH access to GitHub working
- ✅ "READY TO START PHASE A!" message

## Troubleshooting

### Common Issues

**Node version too old:**
```bash
# Update Node using nvm
nvm install 22
nvm alias default 22
```

**pnpm not found after installation:**
```bash
# Restart terminal or reload shell
source ~/.bashrc  # or ~/.zshrc
```

**SSH authentication to GitHub failing:**
```bash
# Test SSH connection
ssh -T git@github.com

# If it fails, check SSH key setup:
cat ~/.ssh/id_ed25519.pub  # Copy to GitHub Settings → SSH Keys
```

**Environment variables not persisting:**
```bash
# Make sure you're editing the correct shell profile
echo $SHELL

# For zsh users: edit ~/.zshrc
# For bash users: edit ~/.bashrc
# Then restart terminal or run: source ~/.zshrc
```

### Getting Help

**Documentation:**
- [USER-EXECUTION-GUIDE.md](USER-EXECUTION-GUIDE.md) - Main implementation guide
- [Phase A Instructions](phases/phase-a-user-instructions.md) - First implementation phase

**External Resources:**
- [Node.js Installation](https://nodejs.org/)
- [pnpm Installation](https://pnpm.io/installation)
- [Git Setup](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [SSH Key Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

---

## Next Steps

Once your environment verification shows "READY TO START PHASE A!", proceed to:

**👉 [USER-EXECUTION-GUIDE.md](USER-EXECUTION-GUIDE.md)**

This will guide you through the complete DevNet implementation across all 5 phases:
- **Phase A**: Engineering OS Foundation
- **Phase B**: Architecture Spine
- **Phase C**: Domain Capability Waves
- **Phase D**: Delivery Layers
- **Phase E**: Production Hardening

**Estimated Total Time**: 20-30 hours across all phases
**Result**: Production-ready SaaS application with enterprise capabilities

---

**Ready to build something amazing?** Let's go! 🚀