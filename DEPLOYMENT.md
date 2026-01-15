# Deploying to Vercel

This guide will walk you through deploying your AI Job Platform to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. A Supabase project set up
4. An OpenAI API key (optional, for AI matching features)

## Step 1: Push Your Code to GitHub

If you haven't already, initialize a git repository and push to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Step 2: Connect Your Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project

## Step 3: Configure Environment Variables

In the Vercel project settings, add the following environment variables:

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - Find this in: Supabase Dashboard → Settings → API → Project URL

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
  - Find this in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

### Optional Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required for AI matching features)
  - Get this from: [OpenAI Platform](https://platform.openai.com/api-keys)
  - The app will work without this, but AI matching features will be disabled

### How to Add Environment Variables in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add each variable:
   - **Key**: The environment variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The actual value
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

## Step 4: Deploy

1. After configuring environment variables, go to the **Deployments** tab
2. Click **Redeploy** on your latest deployment (if it exists) or push a new commit
3. Vercel will automatically build and deploy your application

## Step 5: Configure Supabase for Production

### Update Supabase Auth Settings

1. Go to your Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel deployment URL to:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: 
     - `https://your-project.vercel.app/auth/callback`
     - `https://your-project.vercel.app/**` (for wildcard matching)

### Database Setup

Make sure your production Supabase database has all the necessary tables and migrations applied. You can run migrations via:

1. Supabase SQL Editor, or
2. Supabase CLI: `supabase db push`

## Step 6: Verify Deployment

1. Visit your deployed URL: `https://your-project.vercel.app`
2. Test key features:
   - User authentication (login/signup)
   - Creating projects
   - Worker matching
   - Profile pages

## Additional Configuration

### Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's instructions to configure DNS

### Environment-Specific Variables

You can set different values for Production, Preview, and Development:
- Use Production values for your main deployment
- Use Preview values for pull request previews
- Use Development values for local development (though `.env.local` is preferred locally)

## Troubleshooting

### Build Errors

- Check the build logs in Vercel dashboard
- Ensure all environment variables are set correctly
- Verify your `package.json` has the correct build scripts

### Runtime Errors

- Check the function logs in Vercel dashboard
- Verify Supabase URLs and keys are correct
- Ensure your Supabase project allows connections from your Vercel domain

### Database Connection Issues

- Verify RLS (Row Level Security) policies are set correctly
- Check that your Supabase project is not paused (free tier pauses after inactivity)
- Ensure your database migrations have been applied

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to your main branch
- **Preview**: Every pull request gets its own preview URL
- **Development**: Can be configured for specific branches

## Monitoring

- View real-time logs in the Vercel dashboard
- Set up error tracking with Vercel's built-in analytics
- Monitor performance with Vercel Analytics (already included in your dependencies)

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
