// /src/main.js
import { auth, appId } from "./firebase.js";
import { el } from "./dom.js";
import { initNav, handleInitialTab } from "./navigation.js";
import { alertUser } from "./alerts.js";
import { setUser, unsub } from "./state.js";
import {
  initUserCollections, listenApplications, listenWishlist,
  saveApplication, addWishlistItem, removeApplication
} from "./data.js";
import {
  openModal, closeModal, openConfirmModal, closeConfirmModal,
  openRequirementsModal, closeRequirementsModal,
  showLoading, hideLoading, closeMergeConflictModal, bindConfirmModal
} from "./modals.js";
import { renderAllApplicationSections } from "./render.js";
import { initImporters } from "./importers.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// ---------- NAV & GLOBAL UI ----------
initNav();
bindConfirmModal();

// IntersectionObserver for fade-in sections (kept simple)
const observer = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("is-visible"); }),
  { threshold: 0.1 }
);
document.querySelectorAll(".fade-in-section").forEach((s) => observer.observe(s));

// ---------- AUTH BUTTONS ----------
function mapAuthError(code) {
  switch (code) {
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/user-not-found":
    case "auth/wrong-password": return "Invalid email or password.";
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/weak-password": return "Password should be at least 6 characters long.";
    default: return "An authentication error occurred. Please try again.";
  }
}

el.signupBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email || !password) return alertUser("Please enter email and password.", "error");
  showLoading();
  try { await createUserWithEmailAndPassword(auth, email, password); }
  catch (e) { alertUser(mapAuthError(e.code), "error"); }
  finally { hideLoading(); }
});

el.loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  if (!email || !password) return alertUser("Please enter email and password.", "error");
  showLoading();
  try { await signInWithEmailAndPassword(auth, email, password); }
  catch (e) { alertUser(mapAuthError(e.code), "error"); }
  finally { hideLoading(); }
});

el.logoutBtn.addEventListener("click", () => signOut(auth));

// ---------- APPLICATION MODAL ----------
el.closeModalBtn.addEventListener("click", closeModal);
el.cancelModalBtn.addEventListener("click", closeModal);

el.applicationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  const id = el.applicationIdInput.value;
  const payload = {
    uniName: document.getElementById("uniName").value.trim(),
    courseAppliedFor: document.getElementById("courseAppliedFor").value.trim(),
    status: document.getElementById("status").value,
    deadlineFrom: document.getElementById("deadlineFrom").value,
    deadlineTo: document.getElementById("deadlineTo").value,
    vpdNeeded: document.getElementById("vpdNeeded").checked,
    requirements: document.getElementById("specialRequirementsInput").value.trim(),
  };
  try {
    await saveApplication(id, payload);
    alertUser("Application saved!", "success");
    closeModal();
  } catch (err) {
    alertUser(`Error saving application: ${err.message}`, "error");
  } finally {
    hideLoading();
  }
});

el.addApplicationBtn.addEventListener("click", () => openModal(null, true));

// ---------- REQUIREMENTS MODAL ----------
el.closeRequirementsModalBtn.addEventListener("click", closeRequirementsModal);
el.cancelRequirementsBtn.addEventListener("click", closeRequirementsModal);
el.requirementsForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showLoading();
  try {
    const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js");
    const { db } = await import("./firebase.js");
    const id = el.requirementsAppId.value;
    await updateDoc(doc(db, `artifacts/${appId}/users/${(await import('./state.js')).currentUserId}/applications/${id}`), {
      requirements: el.requirementsText.value.trim(),
    });
    alertUser("Requirements updated successfully!", "success");
    closeRequirementsModal();
  } catch (err) {
    alertUser("Failed to save requirements.", "error");
    console.error(err);
  } finally {
    hideLoading();
  }
});

// ---------- CONFIRM MODAL BACKDROP CLOSE ----------
window.addEventListener("click", (e) => {
  if (e.target === el.applicationModal) closeModal();
  if (e.target === el.confirmModal) closeConfirmModal();
  if (e.target === el.mergeConflictModal) closeMergeConflictModal();
  if (e.target === el.requirementsModal) closeRequirementsModal();
});

// ---------- IMPORTERS ----------
initImporters(el.fileInput, el.importBtn);

// ---------- DOWNLOAD (XLSX) ----------
el.downloadExcelBtn.addEventListener("click", async () => {
  const { currentApplications } = await import("./state.js");
  if (!currentApplications.length) return alertUser("No applications to download.", "info");
  const data = currentApplications.map((app) => ({
    "University Name": app.uniName,
    "Course Applied For": app.courseAppliedFor,
    "Status": app.status,
    "VPD Needed": app.vpdNeeded ? "Yes" : "No",
    "Deadline From": app.deadlineFrom,
    "Deadline Until": app.deadlineTo,
    "Special Requirements": app.requirements,
  }));
  const wb = window.XLSX.utils.book_new();
  const ws = window.XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0]).map((key) => ({
    wch: Math.max(20, ...data.map((row) => (row[key] ? row[key].toString().length : 0)), key.length),
  }));
  window.XLSX.utils.book_append_sheet(wb, ws, "Applications");
  window.XLSX.writeFile(wb, "My_UniTrack_Applications.xlsx");
});

// ---------- WISHLIST ----------
el.wishlistForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = el.wishlistInput.value.trim();
  if (!name) return;
  try {
    await addWishlistItem(name);
    el.wishlistInput.value = "";
  } catch (err) {
    alertUser(`Error adding to wishlist: ${err.message}`, "error");
  }
});

// ---------- AUTH STATE ----------
onAuthStateChanged(auth, (user) => {
  if (user) {
    setUser(user.uid);
    el.loginPage.style.display = "none";
    el.mainHeader.style.display = "block";
    el.mainContent.style.display = "block";
    document.querySelectorAll(".userEmailDisplay").forEach((d) => (d.textContent = user.email));
    initUserCollections(user.uid, appId);
    listenApplications();
    listenWishlist();
    handleInitialTab();
  } else {
    if (unsub.apps) unsub.apps();
    if (unsub.wishlist) unsub.wishlist();
    el.loginPage.style.display = "flex";
    el.mainHeader.style.display = "none";
    el.mainContent.style.display = "none";
  }
});

// ---------- BACKUP: expose render in console (debug) ----------
window.__render = renderAllApplicationSections;
