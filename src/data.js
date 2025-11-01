// /src/data.js
import { db } from "./firebase.js";
import { setApplications, setUnsub, unsub } from "./state.js";
import { alertUser } from "./alerts.js";
import { renderAllApplicationSections, renderWishlist } from "./render.js";
import {
  collection, onSnapshot, query, orderBy, doc,
  addDoc, setDoc, deleteDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

let applicationsRef, wishlistRef;

export function initUserCollections(uid, appId) {
  const appsPath = `artifacts/${appId}/users/${uid}/applications`;
  const wlPath   = `artifacts/${appId}/users/${uid}/wishlist`;
  applicationsRef = collection(db, appsPath);
  wishlistRef     = collection(db, wlPath);
}

/**
 * Start Apps listener. Calls onFirstSnapshot() exactly once
 * (success or error) so main.js can hide the loader.
 */
export function listenApplications(onFirstSnapshot) {
  if (!applicationsRef) return;

  // clean old listener if any
  if (unsub.apps) unsub.apps();

  const qApps = query(
    applicationsRef,
    orderBy("uniName", "asc"),
    orderBy("courseAppliedFor", "asc")
  );

  let firstDone = false;
  const markFirst = () => {
    if (!firstDone) {
      firstDone = true;
      onFirstSnapshot && onFirstSnapshot();
    }
  };

  const stop = onSnapshot(
    qApps,
    (snap) => {
      try {
        const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setApplications(apps);
        renderAllApplicationSections(apps);
      } finally {
        markFirst();
      }
    },
    (err) => {
      alertUser(`Error fetching applications: ${err.message}`, "error");
      markFirst();
    }
  );

  setUnsub("apps", stop);
}

/**
 * Start Wishlist listener. Same one-shot callback.
 */
export function listenWishlist(onFirstSnapshot) {
  if (!wishlistRef) return;

  if (unsub.wishlist) unsub.wishlist();

  const qW = query(wishlistRef, orderBy("createdAt", "desc"));

  let firstDone = false;
  const markFirst = () => {
    if (!firstDone) {
      firstDone = true;
      onFirstSnapshot && onFirstSnapshot();
    }
  };

  const stop = onSnapshot(
    qW,
    (snap) => {
      try {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderWishlist(items);
      } finally {
        markFirst();
      }
    },
    (err) => {
      alertUser(`Error fetching wishlist: ${err.message}`, "error");
      markFirst();
    }
  );

  setUnsub("wishlist", stop);
}

// ---------- CRUD ----------
export async function saveApplication(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (!id) payload.createdAt = serverTimestamp();
  return id
    ? setDoc(doc(applicationsRef, id), payload, { merge: true })
    : addDoc(applicationsRef, payload);
}

export async function removeApplication(id) {
  return deleteDoc(doc(applicationsRef, id));
}

export async function addWishlistItem(name) {
  return addDoc(wishlistRef, { name, researched: false, createdAt: serverTimestamp() });
}

export async function updateWishlistItem(id, researched) {
  return updateDoc(doc(wishlistRef, id), { researched });
}

export async function deleteWishlistItem(id) {
  return deleteDoc(doc(wishlistRef, id));
}
