# 📊 Google Sheets Visitor Tracker — Setup Guide

Complete guide to set up a **free** Google Sheets backend that receives visitor
data from `visitor-tracker.js` on your portfolio site.

---

## Table of Contents

1. [Create the Google Sheet](#1-create-the-google-sheet)
2. [Add the Apps Script Backend](#2-add-the-apps-script-backend)
3. [Deploy as a Web App](#3-deploy-as-a-web-app)
4. [Connect to Your Portfolio](#4-connect-to-your-portfolio)
5. [Verify It Works](#5-verify-it-works)
6. [Download as Excel (.xlsx)](#6-download-as-excel-xlsx)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and click **Blank spreadsheet**.
2. Rename the sheet to **Portfolio Visitors** (or any name you like).
3. In **Row 1**, type these exact headers (one per column):

   | A | B | C | D | E | F | G | H | I | J |
   |---|---|---|---|---|---|---|---|---|---|
   | Timestamp | IP | City | Country | Browser | OS | Screen Resolution | Referrer | Page URL | Language |

4. **Bold** the header row and freeze it:
   *View → Freeze → 1 row*
5. (Optional) Resize columns for readability.

> **Tip:** The column order above must match the script. If you rearrange
> columns, update the `appendRow([ ... ])` call in the Apps Script accordingly.

---

## 2. Add the Apps Script Backend

1. In your Google Sheet, go to **Extensions → Apps Script**.
2. A new Apps Script editor tab will open with an empty `Code.gs` file.
3. **Delete** everything in the editor and paste the code below:

```javascript
/**
 * ============================================================
 *  Portfolio Visitor Tracker — Google Apps Script Backend
 * ============================================================
 *  Receives POST requests from visitor-tracker.js and appends
 *  each visit as a new row in the active Google Sheet.
 * ============================================================
 */

/**
 * Handles incoming POST requests.
 * @param {Object} e - The event object from the web app.
 * @returns {ContentService.TextOutput} JSON response.
 */
function doPost(e) {
  try {
    // ── Parse the incoming JSON body ────────────────────
    var data = JSON.parse(e.postData.contents);

    // ── Get the first sheet in this spreadsheet ─────────
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // ── Append a new row (column order matches headers) ─
    sheet.appendRow([
      data.timestamp        || new Date().toISOString(),  // A: Timestamp
      data.ip               || 'Unknown',                 // B: IP
      data.city             || 'Unknown',                 // C: City
      data.country          || 'Unknown',                 // D: Country
      data.browser          || 'Unknown',                 // E: Browser
      data.os               || 'Unknown',                 // F: OS
      data.screenResolution || 'Unknown',                 // G: Screen Resolution
      data.referrer         || 'Direct',                  // H: Referrer
      data.pageUrl          || 'Unknown',                 // I: Page URL
      data.language         || 'Unknown',                 // J: Language
    ]);

    // ── Return success response ─────────────────────────
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Visit logged successfully.',
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // ── Return error response ───────────────────────────
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString(),
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (optional — useful for quick health checks).
 * Visit the Web App URL in a browser to confirm it's alive.
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Visitor tracker backend is running.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Press **Ctrl + S** (or ⌘ + S on Mac) to save.
5. Name the project **Visitor Tracker** when prompted.

> **Note on CORS:** Google Apps Script Web Apps automatically handle
> cross-origin requests when deployed with **Access: Anyone**. The
> `visitor-tracker.js` script sends requests with `Content-Type: text/plain`
> specifically to avoid CORS preflight issues — no additional headers needed
> on the server side.

---

## 3. Deploy as a Web App

1. In the Apps Script editor, click the **Deploy** button (top right) →
   **New deployment**.
2. Click the ⚙️ gear icon next to "Select type" and choose **Web app**.
3. Fill in the deployment settings:

   | Setting | Value |
   |---|---|
   | **Description** | Portfolio Visitor Tracker v1 |
   | **Execute as** | **Me** (your Google account) |
   | **Who has access** | **Anyone** |

   > ⚠️ "Execute as: Me" means the script writes to your sheet using your
   > permissions. "Anyone" means any website (your portfolio) can send
   > data — no Google login required for visitors.

4. Click **Deploy**.
5. You'll be asked to **authorize** the script. Click **Authorize access**,
   choose your Google account, then:
   - If you see "Google hasn't verified this app", click **Advanced** →
     **Go to Visitor Tracker (unsafe)** → **Allow**.
   - This is safe — you wrote the code yourself.
6. After authorization, you'll see a **Web app URL** like:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
7. **Copy this URL** — you'll need it in the next step.

---

## 4. Connect to Your Portfolio

1. Open `visitor-tracker.js` in your code editor.
2. Find this line near the top:
   ```javascript
   const TRACKING_ENDPOINT = 'YOUR_GOOGLE_APPS_SCRIPT_URL';
   ```
3. Replace `YOUR_GOOGLE_APPS_SCRIPT_URL` with the URL you copied:
   ```javascript
   const TRACKING_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx.../exec';
   ```
4. Save the file.
5. Add the script to every page you want tracked (e.g. in your HTML `<head>`
   or before `</body>`):
   ```html
   <script src="visitor-tracker.js" defer></script>
   ```
6. **Deploy / push** your site (GitHub Pages, Netlify, etc.).

---

## 5. Verify It Works

1. Open your portfolio in a browser.
2. Wait 3–5 seconds (the geo-lookup takes a moment).
3. Go back to your **Google Sheet** — you should see a new row! 🎉
4. To test again in the same browser, open **DevTools → Application →
   Session Storage** and delete the `_vt_tracked` key, then refresh.

### Quick test from the terminal (optional)

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: text/plain" \
  -d '{"timestamp":"2026-06-08T12:00:00Z","ip":"1.2.3.4","city":"Test City","country":"Testland","browser":"curl","os":"CLI","screenResolution":"N/A","referrer":"terminal","pageUrl":"https://example.com","language":"en"}'
```

You should get back:
```json
{"status":"success","message":"Visit logged successfully."}
```

---

## 6. Download as Excel (.xlsx)

To export your visitor data as an Excel file:

### Option A — From the Google Sheets UI
1. Open your **Portfolio Visitors** Google Sheet.
2. Go to **File → Download → Microsoft Excel (.xlsx)**.
3. The file will download to your computer.

### Option B — Automated link
Replace `SPREADSHEET_ID` with your sheet's ID (the long string in the URL
`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`):

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=xlsx
```

Bookmark this link for one-click downloads.

---

## 7. Troubleshooting

| Problem | Solution |
|---|---|
| **No rows appearing** | Check that `TRACKING_ENDPOINT` is set correctly in `visitor-tracker.js`. Open DevTools → Network and look for the POST request. |
| **CORS errors in console** | Make sure the Web App is deployed with **Access: Anyone** and `Content-Type` is `text/plain` (not `application/json`). |
| **"Script function not found"** | Ensure the Apps Script file contains the `doPost` function and is saved. Re-deploy after changes. |
| **Data only appears after re-deploying** | After editing Apps Script code, you must create a **New deployment** or update the existing one (Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy). |
| **Tracking fires every page load** | Session storage may be blocked. This is expected in Incognito mode — the script handles it gracefully by continuing. |
| **Location shows "Unknown"** | The free ipapi.co API has rate limits (~1,000/day). If exceeded, the script falls back to 'Unknown'. Consider upgrading or using an alternative API. |
| **DNT users not tracked** | This is intentional. The script respects the Do Not Track header. |

---

## Architecture Overview

```
┌──────────────────────┐
│   Visitor's Browser  │
│  visitor-tracker.js  │
└─────────┬────────────┘
          │  1. Collect browser data
          │  2. Fetch geo from ipapi.co
          │  3. POST JSON payload
          ▼
┌──────────────────────┐
│  Google Apps Script   │
│  (Web App endpoint)  │
└─────────┬────────────┘
          │  4. Parse JSON
          │  5. Append row
          ▼
┌──────────────────────┐
│    Google Sheet       │
│  "Portfolio Visitors" │
│  (your analytics DB)  │
└──────────────────────┘
```

---

## Privacy Considerations

- **Do Not Track** is respected — visitors who enable DNT are never tracked.
- **No cookies** are used — only `sessionStorage` (cleared when the tab closes).
- **No fingerprinting** — only standard, non-identifying browser metadata.
- **IP addresses** come from a third-party API (ipapi.co); they are not
  extracted by your code.
- Consider adding a note in your portfolio's footer:
  > *"This site collects anonymous visit analytics (browser, OS, approximate
  > location). No personal data is stored. [Do Not Track](https://allaboutdnt.com/)
  > is respected."*

---

*Setup complete! Your visitor data will now flow into Google Sheets
automatically. Happy tracking! 📈*
