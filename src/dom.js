// /src/dom.js
export const el = {
  // Shell
  loginPage: document.getElementById("loginPage"),
  mainHeader: document.getElementById("mainHeader"),
  mainContent: document.getElementById("mainContent"),
  loadingSpinner: document.getElementById("loadingSpinner"),

  // Auth buttons
  loginBtn: document.getElementById("loginBtn"),
  signupBtn: document.getElementById("signupBtn"),
  logoutBtn: document.getElementById("logoutBtn"),

  // Nav
  navLinks: document.querySelectorAll(".nav-link"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Actions top bar
  importBtn: document.getElementById("importBtn"),
  fileInput: document.getElementById("fileInput"),
  downloadExcelBtn: document.getElementById("downloadExcelBtn"),
  addApplicationBtn: document.getElementById("addApplicationBtn"),

  // Tables
  preparingTable: document.getElementById("preparingTableContainer"),
  pendingTable: document.getElementById("pendingTableContainer"),
  decidedTable: document.getElementById("decidedTableContainer"),

  // Wishlist
  wishlistDiv: document.getElementById("wishlist"),
  wishlistForm: document.getElementById("wishlistForm"),
  wishlistInput: document.getElementById("wishlistInput"),
  noWishlistText: document.getElementById("noWishlistText"),

  // Application modal
  applicationModal: document.getElementById("applicationModal"),
  applicationForm: document.getElementById("applicationForm"),
  modalTitle: document.getElementById("modalTitle"),
  applicationIdInput: document.getElementById("applicationId"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelModalBtn: document.getElementById("cancelModalBtn"),

  // Confirm modal
  confirmModal: document.getElementById("confirmModal"),
  confirmModalTitle: document.getElementById("confirmModalTitle"),
  confirmModalMessage: document.getElementById("confirmModalMessage"),
  confirmCancelBtn: document.getElementById("confirmCancelBtn"),
  confirmOkBtn: document.getElementById("confirmOkBtn"),

  // Requirements modal
  requirementsModal: document.getElementById("requirementsModal"),
  requirementsModalTitle: document.getElementById("requirementsModalTitle"),
  requirementsModalInfo: document.getElementById("requirementsModalInfo"),
  closeRequirementsModalBtn: document.getElementById("closeRequirementsModalBtn"),
  requirementsForm: document.getElementById("requirementsForm"),
  requirementsAppId: document.getElementById("requirementsAppId"),
  requirementsText: document.getElementById("requirementsText"),
  cancelRequirementsBtn: document.getElementById("cancelRequirementsBtn"),
  saveRequirementsBtn: document.getElementById("saveRequirementsBtn"),

  // Merge modal
  mergeConflictModal: document.getElementById("mergeConflictModal"),
  existingDataContainer: document.getElementById("existingDataContainer"),
  importedDataContainer: document.getElementById("importedDataContainer"),
  keepExistingBtn: document.getElementById("keepExistingBtn"),
  updateWithImportedBtn: document.getElementById("updateWithImportedBtn"),
};
