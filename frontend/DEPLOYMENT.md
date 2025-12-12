# 🚀 AWS Amplify Deployment Guide

This guide walks you through deploying the SafeZone frontend to AWS Amplify with mock data mode for demonstrations.

## 📋 Prerequisites

- ✅ **GitHub Account**: Your code must be in a GitHub repository
- ✅ **AWS Account**: Sign up at [aws.amazon.com](https://aws.amazon.com)
- ✅ **Mapbox Token**: Get yours at [mapbox.com/account/access-tokens](https://account.mapbox.com/access-tokens/)

## 🎯 Why This Approach?

This deployment strategy is perfect for:
- **Quick demos** to professors or stakeholders
- **UI/UX showcases** without backend complexity  
- **Cost-free hosting** using AWS free tier
- **Stable demos** that work reliably

## 📦 Step 1: Push to GitHub

1. Initialize git repository (if not already done):
   ```bash
   cd c:\Users\nitin\Desktop\SafeZone\safezone-frontend
   git init
   git add .
   git commit -m "Initial commit for Amplify deployment"
   ```

2. Create a new repository on GitHub (e.g., `safezone-frontend`)

3. Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/safezone-frontend.git
   git branch -M main
   git push -u origin main
   ```

## ☁️ Step 2: Set Up AWS Amplify

1. **Go to AWS Amplify Console**
   - Visit [console.aws.amazon.com/amplify](https://console.aws.amazon.com/amplify)
   - Sign in with your AWS account

2. **Create New App**
   - Click **"Host web app"**
   - Select **"GitHub"** as your repository service
   - Click **"Continue"**

3. **Authorize GitHub**
   - AWS will ask permission to access your GitHub
   - Click **"Authorize AWS Amplify"**

4. **Select Repository**
   - Choose your repository: `YOUR_USERNAME/safezone-frontend`
   - Select branch: `main`
   - Click **"Next"**

## ⚙️ Step 3: Configure Build Settings

1. **App Name**: Enter `SafeZone-Frontend` (or your preferred name)

2. **Build and Test Settings**:
   - Amplify should auto-detect the `amplify.yml` file
   - If not, click **"Edit"** and paste:
   
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
           - cp db.json dist/db.json
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Advanced Settings** → **Environment Variables**:
   
   Click **"Add environment variable"** and add these:
   
   | Variable | Value |
   |----------|-------|
   | `VITE_API_MODE` | `json` |
   | `VITE_MAPBOX_TOKEN` | `your_actual_mapbox_token` |
   | `VITE_USE_MOCK_AUTH` | `true` |

   > **Important**: Replace `your_actual_mapbox_token` with your real Mapbox token!

4. Click **"Next"**

## 🎉 Step 4: Deploy

1. **Review Settings**: Double-check everything looks correct

2. **Click "Save and Deploy"**

3. **Wait for Build**: 
   - The build typically takes 3-5 minutes
   - You'll see stages: Provision → Build → Deploy → Verify
   - All stages should show ✅ when complete

4. **Get Your URL**:
   - Once deployed, you'll see a URL like: `https://main.d1a2b3c4d5e6f.amplifyapp.com`
   - Click it to view your live app! 🎊

## ✅ Step 5: Verify Deployment

Test these features to ensure everything works:

1. **Homepage Loads**
   - Navigate to your Amplify URL
   - Confirm the homepage displays correctly

2. **Submit Report**
   - Go to "Submit Report" page
   - Fill out and submit a test report
   - Should show success message

3. **Live Feed**
   - Navigate to "Live Feed"
   - Verify your test report appears in the list
   - Check filters and search work

4. **Route Planner**
   - Open "Route Planner" page
   - Confirm the Mapbox map renders
   - Verify incidents appear on the map

5. **Mock Authentication**
   - Click "Login"
   - Verify you can login (mock auth should work automatically)
   - Check admin features if applicable

## 🔧 Troubleshooting

### Build Fails

**Error**: `Module not found: Can't resolve 'mapbox-gl'`
- **Fix**: This shouldn't happen with `npm ci`, but if it does, check that `package.json` has all dependencies

**Error**: `VITE_MAPBOX_TOKEN is not defined`
- **Fix**: Add the environment variable in Amplify Console → App Settings → Environment Variables

### App Loads But Maps Don't Render

- **Cause**: Missing or invalid Mapbox token
- **Fix**: 
  1. Go to Amplify Console → App Settings → Environment Variables
  2. Update `VITE_MAPBOX_TOKEN` with valid token
  3. Click "Redeploy this version"

### API Calls Failing (404 errors)

- **Cause**: `db.json` not copied to `dist/`
- **Fix**: 
  1. Verify `amplify.yml` has `cp db.json dist/db.json` in build commands
  2. Redeploy

### Changes Not Reflecting

- **Cause**: Browser cache or Amplify cache
- **Fix**:
  1. Hard refresh browser (Ctrl + Shift + R)
  2. In Amplify Console, click "Redeploy this version"

## 💰 Cost Breakdown

AWS Amplify Free Tier (12 months):
- ✅ **Build minutes**: 1,000 minutes/month (plenty for this project)
- ✅ **Hosting**: 15 GB storage + 5 GB bandwidth/month
- ✅ **For 1 week demo**: Essentially **$0**

After free tier:
- ~$0.01 per build minute
- ~$0.15/GB bandwidth

**Expected cost for 1-week demo**: **$0.00** 🎉

## 🔄 Continuous Deployment

Every time you push to GitHub, Amplify will automatically:
1. Pull your latest code
2. Run the build
3. Deploy the new version
4. Make it live within 3-5 minutes

To disable auto-deploy:
1. Go to Amplify Console
2. App Settings → General
3. Turn off "Automatically deploy"

## 📝 Next Steps

- **Custom Domain**: Add your own domain in Amplify Console → Domain Management
- **Branch Deployments**: Set up staging/production branches
- **Access Control**: Add password protection via Amplify Console → Access Control
- **Performance Monitoring**: Enable analytics in Amplify Console

## 🎓 For Your Professor

When demonstrating:
1. Share the Amplify URL in your presentation/report
2. Explain this is a **production-hosted demo** (sounds impressive!)
3. Mention it uses AWS Amplify for **CI/CD** and **static hosting**
4. Highlight the **zero backend maintenance** while showcasing full features

---

**Need Help?** Check [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/) or open an issue on GitHub.
