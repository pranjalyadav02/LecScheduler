# Google Sheets Integration Setup Guide

## Step 1: Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (or create a new one)
3. Navigate to **APIs & Services** → **Library**
4. Search for "**Google Sheets API**"
5. Click **Enable**
6. Also enable "**Google Drive API**" (required for file permissions)

## Step 2: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in:
   - **Name**: `timetable-sheets-service`
   - **Description**: `Service account for creating timetable Google Sheets`
4. Click **Create and Continue**
5. Skip role assignment (click **Continue**)
6. Click **Done**

## Step 3: Generate Service Account Key

1. In the **Credentials** page, find your service account
2. Click on the service account email
3. Go to **Keys** tab
4. Click **Add Key** → **Create new key**
5. Select **JSON** format
6. Click **Create**
7. Save the downloaded JSON file securely

## Step 4: Add to Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (`lec-scheduler`)
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - **Value**: Copy/paste the **entire contents** of the JSON file
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**

## Step 5: Redeploy

```bash
npx vercel deploy --prod
```

## How It Works

1. **Admin uploads PDF** → Direct upload to `/api/processTimetable`
2. **API parses PDF** → Extracts lectures using advanced parser
3. **Creates Google Sheet** → Populates with all lecture data
4. **Makes sheet public** → Anyone with link can view (read-only)
5. **Stores in Firestore** → Lectures saved for app use
6. **Returns Sheet URL** → Admin sees link in dashboard

## What Gets Saved to Google Sheets

Each uploaded PDF creates a new Sheet with:

| Day | Start Time | End Time | Subject | Subject Code | Faculty | Room | Semester | Section |
|-----|------------|----------|---------|--------------|---------|------|----------|---------|
| MON | 11:00      | 13:00    | IWP     | IC-202C      | Ms. Modi| 201  | MCA SEM II | A     |

- **Headers in bold gray**
- **Publicly viewable** (read-only)
- **Permanent storage** (free unlimited)
- **Shareable link** for auditing

## Benefits

✅ **No Firebase Storage costs** - Eliminates payment requirement
✅ **Free unlimited storage** - Google Sheets has no size limits
✅ **Easy auditing** - Share link with faculty/admin
✅ **Manual corrections** - Edit directly in Sheet if needed
✅ **Automatic backup** - Data preserved even if app deleted

## Troubleshooting

### "GOOGLE_SERVICE_ACCOUNT_KEY not configured"

**Cause**: Environment variable not set or invalid JSON

**Fix**:
1. Verify the variable exists in Vercel settings
2. Check the JSON is valid (paste into JSONLint.com)
3. Redeploy after setting variable

### "Permission denied" when creating Sheet

**Cause**: Google Sheets API or Drive API not enabled

**Fix**:
1. Enable both APIs in Google Cloud Console
2. Wait 1-2 minutes for propagation
3. Try upload again

### Sheet is private/not accessible

**Cause**: Drive API permission creation failed

**Fix**:
- The code automatically makes sheets public
- If it fails, manually share the sheet to "Anyone with the link"

## Next Steps

After setup is complete:
1. Upload your PDF (`Updated_MCA_TT_Jan_May_12012026.pdf`)
2. Verify Sheet is created
3. Check that lectures appear in app
4. Share Sheet URL with team for review
