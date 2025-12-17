# Dependency Management Policy

## Package Manager

**We use `pnpm` exclusively.**

- ✅ **DO:** Use `pnpm install`, `pnpm add`, `pnpm remove`
- ❌ **DON'T:** Mix npm, yarn, or pnpm in the same project
- ✅ **COMMIT:** `pnpm-lock.yaml` to version control
- ❌ **IGNORE:** `package-lock.json` and `yarn.lock` (in `.gitignore`)

## Lock File Policy

### Commit Lock Files

```bash
# ✅ Always commit pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "chore: update dependencies"
```

### Why Commit Lock Files?

1. **Reproducible builds** - Same versions across all environments
2. **Security** - Lock files include integrity hashes
3. **CI/CD** - Ensures consistent builds in pipelines
4. **Team consistency** - Everyone uses same dependency versions

## Dependency Updates

### Automated Updates (Dependabot)

We use [Dependabot](./.github/dependabot.yml) for automated dependency checks:

- **Schedule:** Weekly (Monday 09:00)
- **Scope:** Minor and patch updates only
- **Major updates:** Manual review required
- **Limit:** 5 open PRs at a time

### Manual Updates

```bash
# Check outdated packages
pnpm outdated

# Update specific package
pnpm update <package-name>

# Update all packages (careful!)
pnpm update

# Update to latest (may break)
pnpm update --latest
```

### Security Updates

```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix
```

## Version Strategy

### Production Dependencies

- **Exact versions** for critical packages (Next.js, React)
- **Caret ranges** for stable packages (`^5.0.0`)
- **Review major updates** before merging

### Development Dependencies

- **More flexible** with version ranges
- **Update regularly** to get latest tooling

## Adding New Dependencies

### Before Adding

1. **Check alternatives** - Is there a lighter/better option?
2. **Check bundle size** - Use `pnpm analyze` to check impact
3. **Check maintenance** - Is package actively maintained?
4. **Check license** - Compatible with project license?

### Adding Process

```bash
# Add production dependency
pnpm add <package-name>

# Add development dependency
pnpm add -D <package-name>

# Add with specific version
pnpm add <package-name>@<version>
```

### After Adding

1. **Update `env.example.txt`** if package needs env vars
2. **Add to documentation** if it's a major addition
3. **Test thoroughly** before committing
4. **Commit lock file** with your changes

## Removing Dependencies

```bash
# Remove package
pnpm remove <package-name>

# Clean up unused dependencies
pnpm prune
```

## Dependency Groups

### Critical (Exact Versions)
- `next` - Framework
- `react` - Core library
- `typescript` - Language

### Important (Caret Ranges)
- `@tanstack/react-query` - State management
- `@supabase/supabase-js` - Database client
- `zod` - Validation

### Flexible (Latest Compatible)
- Dev tools
- Build tools
- Linters

## Best Practices

1. **Regular Updates** - Don't let dependencies get too outdated
2. **Security First** - Fix vulnerabilities immediately
3. **Test After Updates** - Run tests after dependency updates
4. **Document Changes** - Update CHANGELOG.md for major updates
5. **Review PRs** - Review Dependabot PRs carefully

## Troubleshooting

### Lock File Conflicts

```bash
# Regenerate lock file
rm pnpm-lock.yaml
pnpm install
```

### Version Mismatches

```bash
# Clear cache and reinstall
pnpm store prune
pnpm install
```

### Peer Dependency Warnings

```bash
# Check peer dependencies
pnpm list --depth=0

# Install missing peers
pnpm add <missing-peer>
```

---

**Last Updated:** $(date)

