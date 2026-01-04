# Quick Guide: Push Workflow File to GitHub

Workflow file sudah di-commit lokal tapi belum bisa di-push karena butuh `workflow` scope.

## Cara Termudah: Via GitHub Web Interface

1. **Buka file lokal**:
   ```bash
   cat .github/workflows/ci.yml
   ```

2. **Copy seluruh isi file**

3. **Buka GitHub**:
   - Go to: https://github.com/andrimuhyidin/aerotravel-apps
   - Click "Add file" → "Create new file"
   - Path: `.github/workflows/ci.yml`
   - Paste content
   - Commit message: `ci: add GitHub Actions workflow for quality gates`
   - Click "Commit new file"

## Atau: Update Git Credentials

```bash
# 1. Generate Personal Access Token
# Go to: https://github.com/settings/tokens
# Select scopes: ✅ repo, ✅ workflow

# 2. Update remote URL
git remote set-url origin https://YOUR_TOKEN@github.com/andrimuhyidin/aerotravel-apps.git

# 3. Push workflow file
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow"
git push origin main
```

## Verifikasi

Setelah push, check:
- https://github.com/andrimuhyidin/aerotravel-apps/actions
- Workflow harusnya otomatis run

