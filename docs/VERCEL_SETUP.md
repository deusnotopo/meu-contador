# 🔐 Vercel Deploy Preview Setup Guide

## Step-by-Step Instructions

### 1. Get Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your profile (bottom left)
3. Select **Settings**
4. Navigate to **Tokens** tab
5. Click **Create Token**
6. Name it: `meu-contador-github-actions`
7. Set scope: **Full Account**
8. Click **Create**
9. **Copy the token** (you won't see it again!)

---

### 2. Get Vercel Project IDs

#### Option A: From Vercel Dashboard

1. Go to your project in Vercel
2. Click **Settings**
3. Scroll to **General**
4. Copy:
   - **Project ID** (e.g., `prj_abc123...`)
   - **Team ID** / **Org ID** (e.g., `team_xyz789...`)

#### Option B: From `.vercel/project.json` (if deployed before)

```bash
# If you've deployed before, check this file:
cat .vercel/project.json
```

---

### 3. Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add these 3 secrets:

#### Secret 1: VERCEL_TOKEN

- **Name**: `VERCEL_TOKEN`
- **Value**: `[paste your token from step 1]`
- Click **Add secret**

#### Secret 2: VERCEL_ORG_ID

- **Name**: `VERCEL_ORG_ID`
- **Value**: `[paste your team/org ID]`
- Click **Add secret**

#### Secret 3: VERCEL_PROJECT_ID

- **Name**: `VERCEL_PROJECT_ID`
- **Value**: `[paste your project ID]`
- Click **Add secret**

---

### 4. Verify Setup

1. Create a test branch:

   ```bash
   git checkout -b test-deploy-preview
   ```

2. Make a small change (e.g., update README):

   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: verify deploy preview"
   ```

3. Push and create PR:

   ```bash
   git push origin test-deploy-preview
   ```

4. Go to GitHub and create a Pull Request

5. Check **Actions** tab - you should see:

   - ✅ CI/CD Pipeline running
   - ✅ Deploy Preview workflow running

6. After ~2-3 minutes, check PR comments for preview URL

---

### 5. Troubleshooting

#### Error: "Invalid token"

- Regenerate token in Vercel
- Make sure scope is "Full Account"
- Update GitHub secret

#### Error: "Project not found"

- Verify Project ID is correct
- Check if project exists in Vercel
- Ensure Org ID matches the project's team

#### Error: "Build failed"

- Check build logs in GitHub Actions
- Verify `npm run build` works locally
- Check environment variables

---

### 6. Optional: Add Build Environment Variables

If your app needs environment variables during build:

1. In Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Add your variables (e.g., `VITE_FIREBASE_API_KEY`)
3. Set scope to **Preview** (for PR previews)

---

## Quick Reference

### GitHub Secrets Needed

```
VERCEL_TOKEN          = [from Vercel Settings → Tokens]
VERCEL_ORG_ID         = [from Vercel Project Settings]
VERCEL_PROJECT_ID     = [from Vercel Project Settings]
```

### Workflow Files

- `.github/workflows/ci.yml` - Main CI/CD
- `.github/workflows/deploy-preview.yml` - Deploy previews

---

## Expected Behavior

### On Every PR:

1. ✅ CI/CD checks run (lint, type-check, build, test)
2. ✅ Deploy preview starts
3. ✅ Preview URL posted as PR comment
4. ✅ Status checks update

### Preview URL Format:

```
https://meu-contador-[branch-name]-[team].vercel.app
```

---

## Security Notes

- ✅ Tokens are encrypted in GitHub Secrets
- ✅ Only accessible by GitHub Actions
- ✅ Not visible in logs
- ✅ Can be rotated anytime

---

## Next Steps After Setup

1. ✅ Test with a PR
2. ✅ Verify preview deployment works
3. ✅ Share preview URLs with team
4. ✅ Celebrate! 🎉

---

**Need Help?**

- [Vercel GitHub Integration Docs](https://vercel.com/docs/git/vercel-for-github)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

**Estimated Time**: 10 minutes
