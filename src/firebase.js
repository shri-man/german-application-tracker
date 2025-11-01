// /src/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDmAlSmn_dvqJ93HJTVQcsf09Iihrj8DxM",
  authDomain: "my-uni-tracker.firebaseapp.com",
  projectId: "my-uni-tracker",
  storageBucket: "my-uni-tracker.appspot.com",
  messagingSenderId: "916300544918",
  appId: "1:916300544918:web:ef2e150e438fb53529fbb7",
};

export const appId =
  typeof window.__app_id !== "undefined" ? window.__app_id : "german-uni-tracker-app";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
