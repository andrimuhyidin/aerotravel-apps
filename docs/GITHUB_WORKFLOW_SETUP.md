# GitHub Actions Workflow Setup Guide

**Issue**: GitHub OAuth App tidak memiliki `workflow` scope untuk push workflow files.

## Solution: Manual Push via GitHub Web Interface

### Option 1: Push via GitHub Web (Recommended)

1. **Buka GitHub Repository**:
   - Go to: https://github.com/andrimuhyidin/aerotravel-apps
   - Navigate to: `.github/workflows/` folder

2. **Create New File**:
   - Click "Add file" → "Create new file"
   - Path: `.github/workflows/ci.yml`
   - Copy content from: `.github/workflows/ci.yml` (local file)
   - Commit message: `ci: add GitHub Actions workflow for quality gates`
   - Click "Commit new file"

### Option 2: Update GitHub Token (For CLI)

1. **Generate Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes:
     - ✅ `repo` (full control)
     - ✅ `workflow` (update GitHub Action workflows)
   - Generate and copy token

2. **Update Git Credential**:
   ```bash
   git remote set-url origin https://YOUR_TOKEN@github.com/andrimuhyidin/aerotravel-apps.git
   git push origin main
   ```

3. **Or Use SSH** (if SSH key is set up):
   ```bash
   git remote set-url origin git@github.com:andrimuhyidin/aerotravel-apps.git
   git push origin main
   ```

### Option 3: Use GitHub CLI

```bash
# Install GitHub CLI if not installed
brew install gh

# Authenticate
gh auth login

# Push workflow file
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow"
git push origin main
```

---

## Current Status

✅ **Workflow file created**: `.github/workflows/ci.yml`  
⏳ **Pending**: Push to GitHub (requires workflow scope)  
✅ **Content ready**: All workflow steps configured

---

## Workflow Features

Once pushed, the workflow will:

1. ✅ Run on every push to `main` and `dev` branches
2. ✅ Run on every pull request
3. ✅ Type check with TypeScript
4. ✅ Lint code
5. ✅ Run unit tests with coverage
6. ✅ Check coverage threshold (80%)
7. ✅ Security audit
8. ✅ Upload coverage reports
9. ✅ Comment PRs with coverage stats

---

## Verification

After pushing workflow file:

1. Go to: https://github.com/andrimuhyidin/aerotravel-apps/actions
2. Check if workflow runs successfully
3. Verify all steps pass

---

**Note**: Workflow file is already committed locally. Just needs to be pushed to GitHub.

