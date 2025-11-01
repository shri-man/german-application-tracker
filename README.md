# UniTrack — German University Application Tracker

A lightweight, Firebase-backed SPA to plan and track German university applications.

## Tech
- HTML + Tailwind (CDN, no build)
- Vanilla JS (ESM) + Firebase Auth & Firestore
- XLSX (SheetJS) import/export
- docx-preview for .docx parsing

## Features
- Email/password auth (Firebase)
- University wishlist with “researched” toggles
- Application CRUD with sections: Preparing, Applied, Accepted, Rejected, Not Applied
- Deadline window logic: Starts Today / Ends Today / Ends in N days (timezone-safe)
- Import (.xlsx/.docx) with AI extraction hook (Gemini; bring-your-own key)
- Conflict-aware merge modal
- Export to Excel

## Run
Open `index.html` in a browser (or via a simple static server).
Add your Gemini API key in `app.js` if you want AI extraction.

## Deploy
- GitHub Pages / Netlify / Vercel (static)
- Ensure Firebase auth domain includes your deployed origin
