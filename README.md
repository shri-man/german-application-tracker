# 🎓 UniTrack — German University Application Tracker

**Live Demo:** [🔗 UniTrack on GitHub Pages](https://shri-man.github.io/UniTrack/)  
**Tech Stack:** `HTML5` · `Tailwind CSS` · `JavaScript (ES Modules)` · `Firebase (Auth & Firestore)` · `SheetJS (XLSX)` · `docx-preview`

---

## 🧭 Overview
UniTrack is a **personal university application tracker** built for international students applying to **German universities**.  
It helps you organize every step — from preparing documents to tracking deadlines — in one smart, responsive web app.

---

## ✨ Features

| Category | Description |
|-----------|-------------|
| 🔐 **Authentication** | Firebase Email/Password login & signup |
| 🗂️ **Applications Dashboard** | Add, edit, and track university applications grouped by status |
| ⏳ **Deadline Intelligence** | Dynamic “Starts in / Ends in” countdown and progress indicator |
| 📋 **Wishlist** | Maintain a research wishlist of universities |
| 📤 **Import/Export** | Import from `.xlsx` or `.docx` (via SheetJS & docx-preview) and export all applications to Excel |
| ⚙️ **Requirements Editor** | Inline modal for editing course-specific requirements |
| 🪄 **Merge Conflict Resolver** | Detects duplicates during import and lets you choose which record to keep |
| ⚡ **Real-Time Sync** | Firestore live updates keep all lists current |
| 🎨 **Responsive UI** | Built with Tailwind CSS and Inter font for a clean, minimal design |
| 🚀 **Deployment Ready** | Works as a static SPA on GitHub Pages with favicon and asset caching |

---

## 🏗️ Architecture

```text
src/
├── main.js             # App entry, auth state management, event wiring
├── data.js             # Firestore listeners & CRUD logic
├── render.js           # Dynamic table & modal rendering
├── modals.js           # Application, confirmation & requirements modals
├── navigation.js       # Tab and route management
├── alerts.js           # Toast notifications and alert system
├── importers.js        # Excel/Word import handling (SheetJS + docx-preview)
├── firebase.js         # Firebase config & exports
├── state.js            # Global app state and unsub references
├── dom.js              # Cached element references
└── dates.js            # Deadline & date utilities
Fully modular ES-Module design → easy to extend and debug.

All UI state handled via DOM + Firestore snapshot listeners (no external framework).

Real-time loading gate ensures spinner hides only after all data loads.

🧠 Design Highlights
“Starts in / Ends in” logic correctly handles edge cases (same-day, ongoing, expired).

Responsive tables & modals adapt to both mobile and desktop.

Progress wheel visually shows how far through the application window you are.

Merge Conflict Modal helps safely import data without duplicates.

Wishlists & Applications are stored in separate Firestore subcollections.

⚙️ Setup (Developer Mode)
1. Clone the repo
bash
Copy code
git clone https://github.com/shri-man/german-application-tracker.git
cd german-application-tracker
2. Add Firebase config
Edit src/firebase.js with your own Firebase project credentials:

js
Copy code
// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_APP.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = "YOUR_APP_ID";
3. Run locally
Open index.html with Live Server (VS Code extension) or:

bash
Copy code
npx serve
Then visit http://localhost:3000 (or the printed port).

4. Deploy to GitHub Pages
Push to your repo’s main branch → GitHub Pages → set branch: main / (root)
URL: https://<username>.github.io/german-application-tracker/

🧩 Optional: Tailwind Production Build
To remove the CDN warning and shrink CSS:

bash
Copy code
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
Then:

bash
Copy code
npx tailwindcss -i ./src/tailwind.css -o ./assets/tailwind.css --minify
Update <head>:

html
Copy code
<link rel="stylesheet" href="./assets/tailwind.css" />
🧭 Roadmap
 Add filters & search to Applications table

 Add Google Sign-In authentication

 Offline cache (Service Worker)

 Dark mode toggle

 Integration with AI assistant (Gemini API) for auto-requirement extraction

 Export to PDF

