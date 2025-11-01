// /src/modals.js
import { el } from "./dom.js";

export function showLoading() { el.loadingSpinner.style.display = "block"; }
export function hideLoading() { el.loadingSpinner.style.display = "none"; }

// --- Application Modal ---
export function openModal(appData = null, isNew = false) {
  el.applicationForm.reset();
  el.applicationIdInput.value = "";
  el.modalTitle.textContent = "Add New Application";

  if (appData) {
    if (!isNew) {
      el.modalTitle.textContent = "Edit Application";
      el.applicationIdInput.value = appData.id;
    }
    document.getElementById("uniName").value = appData.uniName || "";
    document.getElementById("courseAppliedFor").value = appData.courseAppliedFor || "";
    document.getElementById("status").value = appData.status || "Preparing";
    document.getElementById("deadlineFrom").value = appData.deadlineFrom || "";
    document.getElementById("deadlineTo").value = appData.deadlineTo || "";
    document.getElementById("vpdNeeded").checked = !!appData.vpdNeeded;
    document.getElementById("specialRequirementsInput").value = appData.requirements || "";
  }
  el.applicationModal.style.display = "block";
}

export function closeModal() { el.applicationModal.style.display = "none"; }

// --- Confirm Modal ---
let confirmCallback = null;

export function openConfirmModal(title, message, callback) {
  el.confirmModalTitle.textContent = title;
  el.confirmModalMessage.textContent = message;
  confirmCallback = callback;
  el.confirmModal.style.display = "block";
}

export function closeConfirmModal() {
  el.confirmModal.style.display = "none";
  confirmCallback = null;
}

export function bindConfirmModal() {
  el.confirmCancelBtn.addEventListener("click", closeConfirmModal);
  el.confirmOkBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
  });
}

// --- Requirements Modal ---
export function openRequirementsModal(app) {
  el.requirementsModalTitle.textContent = `Requirements for ${app.courseAppliedFor || ""}`;
  el.requirementsModalInfo.textContent = `at ${app.uniName || ""}`;
  el.requirementsAppId.value = app.id;
  el.requirementsText.value = app.requirements || "";
  el.requirementsModal.style.display = "block";
  el.requirementsText.focus();
}

export function closeRequirementsModal() {
  el.requirementsModal.style.display = "none";
}

// --- Merge Modal ---
export function closeMergeConflictModal() {
  el.mergeConflictModal.style.display = "none";
}

export function showMergeConflictModal(existingApp, importedData) {
  function render(container, data) {
    container.innerHTML = `
      <p><strong>Course:</strong> ${data.courseAppliedFor || "N/A"}</p>
      <p><strong>Status:</strong> ${data.status || "N/A"}</p>
      <p><strong>VPD Needed:</strong> ${data.vpdNeeded ? "Yes" : "No"}</p>
      <p><strong>Deadline From:</strong> ${data.deadlineFrom || "N/A"}</p>
      <p><strong>Deadline To:</strong> ${data.deadlineTo || "N/A"}</p>
      <p><strong>Requirements:</strong> ${data.requirements || "N/A"}</p>
    `;
  }
  render(el.existingDataContainer, existingApp);
  render(el.importedDataContainer, importedData);
  el.mergeConflictModal.style.display = "block";
}
