# CI/CD Pipeline Configuration

This directory contains GitHub Actions workflows for automated quality checks and deployments.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers**: Push to `main`/`develop`, Pull Requests

**Jobs**:

- **Quality Checks**

  - ESLint validation
  - TypeScript type checking
  - Frontend build verification
  - Unit tests execution
  - Build artifact upload

- **Backend Checks**

  - TypeScript type checking
  - Backend build verification

- **Security Audit**
  - npm audit for vulnerabilities
  - Dependency security scanning

**Status Badge**:

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/meu-contador/workflows/CI%2FCD%20Pipeline/badge.svg)
```

---

### 2. Deploy Preview (`deploy-preview.yml`)

**Triggers**: Pull Requests (opened, synchronized, reopened)

**Features**:

- Automatic Vercel preview deployment
- PR comment with preview URL
- Build verification before deploy

**Required Secrets**:

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

**Setup Instructions**:

1. Go to Vercel dashboard → Settings → Tokens
2. Create new token
3. Add secrets to GitHub: Settings → Secrets → Actions
4. Copy org ID and project ID from Vercel project settings

---

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
choco install act-cli  # Windows
brew install act       # macOS

# Run CI workflow
act push

# Run specific job
act -j quality-checks
```

---

## Workflow Status

Check workflow status at:
`https://github.com/YOUR_USERNAME/meu-contador/actions`

---

## Best Practices

1. **Always run locally first**: `npm run lint && npm run build`
2. **Keep workflows fast**: Use caching, parallel jobs
3. **Monitor workflow usage**: GitHub Actions has usage limits
4. **Update dependencies**: Keep actions up to date

---

## Troubleshooting

### Build fails on CI but works locally

- Check Node.js version match
- Verify environment variables
- Check for OS-specific issues

### Tests timeout

- Increase timeout in `vitest.config.ts`
- Use `--run` flag for CI (no watch mode)

### Cache issues

- Clear cache: Delete `.github/workflows` cache
- Verify `package-lock.json` is committed
