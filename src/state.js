// /src/state.js
export let currentUserId = null;
export let currentApplications = [];

export const unsub = { apps: null, wishlist: null };

export function setUser(id) { currentUserId = id; }
export function setApplications(arr) { currentApplications = Array.isArray(arr) ? arr : []; }
export function setUnsub(which, fn) { unsub[which] = fn; }
