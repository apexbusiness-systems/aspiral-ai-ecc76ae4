# 🔧 Supabase Setup Guide for aSpiral

## Critical Fixes Applied ✅

### Bug 1: Missing Environment Variables
**Status:** ✅ **FIXED** - Template created, awaiting your credentials

**What was wrong:**
- No `.env` file existed
- `.env.example` didn't document Supabase variables
- Supabase client couldn't initialize

**What was fixed:**
- ✅ Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to `.env.example`
- ✅ Created `.env` file with placeholders
- ✅ Verified `.env` is gitignored (already was)

### Bug 2: Subscription Access
**Status:** ✅ **ALREADY PROTECTED** - Code uses optional chaining correctly

**What we found:**
- `AuthContext.tsx` already uses `subscription?.unsubscribe?.()` (line 111)
- All subscription access is properly guarded
- No unsafe `.subscription` access found

---

## 🚨 REQUIRED ACTIONS FOR YOU

### Step 1: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project (or create one)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Project API Key** → `anon` `public` (the long JWT token)

### Step 2: Update Local `.env` File

Open `.env` and replace the placeholders:

```env
VITE_SUPABASE_URL=https://YOUR_ACTUAL_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_ACTUAL_KEY
```

### Step 3: Update Production Environment (CRITICAL!)

**For Vercel:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add these variables:
   - `VITE_SUPABASE_URL` = your project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your anon key
3. **Redeploy** (env vars only apply to new builds)

**For Netlify:**
1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add the same two variables
3. **Trigger a new deploy**

**For Other Hosts:**
- Add the same env vars to your hosting platform
- **Always redeploy** after adding env vars

### Step 4: Test Everything

**Local test:**
```bash
npm run dev
# Open http://localhost:5173
# Check browser console - should be no Supabase errors
# Try sign up/login
```

**Production test:**
1. Hard refresh your site (Ctrl+Shift+R)
2. Open browser console (F12)
3. Should see no errors
4. Test authentication flows

---

## 🔍 How to Verify It's Working

### Success Indicators ✅
- No `[Supabase] Client not initialized` errors in console
- No `Cannot read properties of undefined (reading 'subscription')` errors
- Sign up/login flows work
- Console shows successful Supabase connection

### Still Broken? 🔧

**If you see "Client not initialized":**
- Check `.env` file has correct values (no placeholders)
- Verify URL starts with `https://` and ends with `.supabase.co`
- Restart dev server (`npm run dev`)

**If production still fails:**
- Verify env vars are set in hosting platform
- **Redeploy** (don't just update vars - must trigger new build)
- Check deployment logs for errors
- Hard refresh browser (Ctrl+Shift+R)

---

## 📝 What Was Already Correct

The codebase was already well-structured:
- ✅ Using `VITE_` prefix correctly (`src/integrations/supabase/client.ts:5-6`)
- ✅ Defensive mock client when vars missing
- ✅ Optional chaining on subscription access
- ✅ Proper error logging

**The only issue was missing environment variables!**

---

## 🎯 Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| Code fixes | ✅ Done | None - already correct |
| .env template | ✅ Done | **Fill in your credentials** |
| Local .env | ⚠️ TODO | **Add your Supabase keys** |
| Production vars | ⚠️ TODO | **Add to hosting + redeploy** |

**Total time to complete: 5 minutes**

Once you add your actual Supabase credentials locally and in production, both bugs will be completely resolved.
