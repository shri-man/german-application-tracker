// /src/render.js
import { el } from "./dom.js";
import { startOfTodayLocal, parseYMDLocal, dayDiff } from "./dates.js";
import { alertUser } from "./alerts.js";
import { openModal, openRequirementsModal } from "./modals.js";
import { removeApplication } from "./data.js";
import { currentApplications } from "./state.js";

export function getDaysRemaining(deadlineFromString, deadlineToString, status) {
  if (["Accepted", "Rejected", "Waitlisted"].includes(status)) {
    return { text: "Decided", colorClass: "text-text-light" };
  }
  const today = startOfTodayLocal();
  const fromDate = parseYMDLocal(deadlineFromString);
  const toDate = parseYMDLocal(deadlineToString);

  if (fromDate && today < fromDate) {
    const d = dayDiff(fromDate, today);
    if (d === 0) return { text: "Starts Today!", colorClass: "text-green-700 font-bold" };
    if (d === 1) return { text: "Starts in 1 day", colorClass: "text-green-600 font-semibold" };
    return { text: `Starts in ${d} days`, colorClass: "text-green-600 font-semibold" };
  }

  if (toDate) {
    const d = dayDiff(toDate, today);
    if (d < 0) {
      return { text: status === "Not Applied" ? "Deadline Passed" : `Overdue by ${Math.abs(d)} days`,
               colorClass: "text-brand-red font-semibold" };
    }
    if (d === 0) return { text: "Ends Today!", colorClass: "text-brand-red font-bold" };
    if (d === 1) return { text: "Ends in 1 day", colorClass: "text-red-500 font-semibold" };
    return { text: `Ends in ${d} days`, colorClass: "text-red-500 font-semibold" };
  }

  return { text: "N/A", colorClass: "text-text-light" };
}

function getGroupDeadlineStatus(apps, { decided = false } = {}) {
  if (decided) return { sortOrder: 3, sortDate: null, text: "Decided", colorClass: "text-text-light" };

  const today = startOfTodayLocal();
  let earliestActiveEnd = null;
  let earliestUpcomingStart = null;

  for (const app of apps) {
    if (["Accepted", "Rejected", "Waitlisted"].includes(app.status)) continue;
    const fromDate = parseYMDLocal(app.deadlineFrom);
    const toDate = parseYMDLocal(app.deadlineTo);

    if (fromDate && today < fromDate) {
      if (!earliestUpcomingStart || fromDate < earliestUpcomingStart) earliestUpcomingStart = fromDate;
      continue;
    }
    if (toDate && today <= toDate) {
      if (!earliestActiveEnd || toDate < earliestActiveEnd) earliestActiveEnd = toDate;
    }
  }

  if (earliestActiveEnd) {
    const d = dayDiff(earliestActiveEnd, today);
    if (d === 0) return { sortOrder: 0, sortDate: today, text: "Ends Today!", colorClass: "text-brand-red font-bold" };
    if (d === 1) return { sortOrder: 1, sortDate: earliestActiveEnd, text: "Ends in 1 day", colorClass: "text-red-500 font-semibold" };
    return { sortOrder: 1, sortDate: earliestActiveEnd, text: `Ends in ${d} days`, colorClass: "text-red-500 font-semibold" };
  }

  if (earliestUpcomingStart) {
    const d = dayDiff(earliestUpcomingStart, today);
    if (d === 0) return { sortOrder: 2, sortDate: earliestUpcomingStart, text: "Starts Today!", colorClass: "text-green-700 font-bold" };
    if (d === 1) return { sortOrder: 2, sortDate: earliestUpcomingStart, text: "Starts in 1 day", colorClass: "text-green-600 font-semibold" };
    return { sortOrder: 2, sortDate: earliestUpcomingStart, text: `Starts in ${d} days`, colorClass: "text-green-600 font-semibold" };
  }

  return { sortOrder: 3, sortDate: null, text: "N/A", colorClass: "text-text-light" };
}

function setSectionHeader(sectionId, title, count) {
  const section = document.getElementById(sectionId);
  const h3 = section?.querySelector("h3");
  if (h3) h3.textContent = `${title} (${count})`;
}

export function renderAllApplicationSections(applications) {
  const preparingApps = applications.filter((a) => a.status === "Preparing");
  const appliedApps = applications.filter((a) => a.status === "Applied");
  const acceptedApps = applications.filter((a) => a.status === "Accepted");
  const rejectedApps = applications.filter((a) => a.status === "Rejected");
  const notAppliedApps = applications.filter((a) => a.status === "Not Applied");

  setSectionHeader("preparingSection", "Preparing", preparingApps.length);
  setSectionHeader("pendingSection", "Applied", appliedApps.length + acceptedApps.length + rejectedApps.length);
  setSectionHeader("decidedSection", "Not Applied", notAppliedApps.length);

  renderTableSection(el.preparingTable, preparingApps, { sortByDeadline: true, decided: false });

  el.pendingTable.innerHTML = "";
  const appliedBlock = document.createElement("div");
  const acceptedBlock = document.createElement("div");
  const rejectedBlock = document.createElement("div");
  appliedBlock.innerHTML = `<h4 class="text-lg font-bold text-text-dark mb-3">Applied (${appliedApps.length})</h4>`;
  acceptedBlock.innerHTML = `<h4 class="text-lg font-bold text-text-dark mt-8 mb-3">Accepted (${acceptedApps.length})</h4>`;
  rejectedBlock.innerHTML = `<h4 class="text-lg font-bold text-text-dark mt-8 mb-3">Rejected (${rejectedApps.length})</h4>`;

  const appliedWrap = document.createElement("div");
  const acceptedWrap = document.createElement("div");
  const rejectedWrap = document.createElement("div");
  appliedBlock.appendChild(appliedWrap);
  acceptedBlock.appendChild(acceptedWrap);
  rejectedBlock.appendChild(rejectedWrap);

  renderTableSection(appliedWrap, appliedApps, { sortByDeadline: false, decided: false });
  renderTableSection(acceptedWrap, acceptedApps, { decided: true });
  renderTableSection(rejectedWrap, rejectedApps, { decided: true });

  el.pendingTable.appendChild(appliedBlock);
  el.pendingTable.appendChild(acceptedBlock);
  el.pendingTable.appendChild(rejectedBlock);

  renderTableSection(el.decidedTable, notAppliedApps, { sortByDeadline: false, decided: false });
}

export function renderWishlist(items) {
  el.wishlistDiv.innerHTML = "";
  if (items.length === 0) {
    el.noWishlistText.style.display = "block";
    return;
  }
  el.noWishlistText.style.display = "none";
  items.forEach((item) => {
    const id = `wl-${item.id}`;
    const div = document.createElement("div");
    div.className = "wishlist-item flex items-center justify-between";
    div.innerHTML = `
      <input type="checkbox" id="${id}" class="hidden" ${item.researched ? "checked" : ""}>
      <label for="${id}" class="flex items-center cursor-pointer text-text-dark w-full p-2 rounded-md hover:bg-light-gray">
        <span class="w-5 h-5 mr-3 rounded border-2 border-gray-300 flex items-center justify-center transition-all flex-shrink-0">
          <svg class="w-3 h-3 text-white transform scale-0 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </span>
        <span class="transition-colors">${item.name}</span>
      </label>
      <button class="delete-wishlist-item text-gray-400 hover:text-red-500 transition-colors ml-2 p-1 flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;
    const checkbox = div.querySelector("input");
    const delBtn = div.querySelector(".delete-wishlist-item");

    checkbox.addEventListener("change", async () => {
      const { updateWishlistItem } = await import("./data.js");
      updateWishlistItem(item.id, checkbox.checked).catch((e) => alertUser(e.message, "error"));
    });
    delBtn.addEventListener("click", async () => {
      const { deleteWishlistItem } = await import("./data.js");
      deleteWishlistItem(item.id).catch((e) => alertUser(e.message, "error"));
    });
    el.wishlistDiv.appendChild(div);
  });
}

function renderTableSection(container, applications, { sortByDeadline = false, decided = false } = {}) {
  container.innerHTML = "";
  const grouped = applications.reduce((acc, app) => {
    const uni = app.uniName || "Unnamed University";
    (acc[uni] ||= []).push(app);
    return acc;
  }, {});
  const entries = Object.entries(grouped);
  if (entries.length === 0) {
    container.innerHTML = `<div class="px-6 py-8 text-center text-text-light"><p>No applications in this section.</p></div>`;
    return;
  }

  let groups = entries.map(([uniName, apps]) => ({
    uniName,
    apps,
    deadlineStatus: getGroupDeadlineStatus(apps, { decided }),
  }));

  if (decided) {
    groups.sort((a, b) => a.uniName.localeCompare(b.uniName));
  } else if (sortByDeadline) {
    groups.sort((a, b) => {
      if (a.deadlineStatus.sortOrder !== b.deadlineStatus.sortOrder) {
        return a.deadlineStatus.sortOrder - b.deadlineStatus.sortOrder;
      }
      if (a.deadlineStatus.sortDate && b.deadlineStatus.sortDate) {
        return a.deadlineStatus.sortDate - b.deadlineStatus.sortDate;
      }
      return a.uniName.localeCompare(b.uniName);
    });
  } else {
    groups.sort((a, b) => a.uniName.localeCompare(b.uniName));
  }

  const table = document.createElement("table");
  table.className = "min-w-full";
  table.innerHTML = `
    <thead class="border-b border-gray-200">
      <tr>
        <th class="pl-12 pr-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">University</th>
        <th class="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Next Deadline</th>
        <th class="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Courses</th>
        <th class="px-6 py-4 text-right text-xs font-semibold text-text-light uppercase tracking-wider"></th>
      </tr>
    </thead>
    <tbody class="divide-y divide-gray-100"></tbody>
  `;
  const tbody = table.querySelector("tbody");

  groups.forEach(({ uniName, apps, deadlineStatus }) => {
    const groupRow = tbody.insertRow();
    groupRow.className = "uni-group-row bg-white hover:bg-light-gray transition-colors";
    groupRow.innerHTML = `
      <td class="pl-6 pr-6 py-4 whitespace-nowrap text-sm font-bold text-text-dark">
        <div class="flex items-center">
          <svg class="arrow-icon w-4 h-4 mr-4 text-text-light transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
          ${uniName}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm ${deadlineStatus.colorClass}">${deadlineStatus.text}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">${apps.length} Application(s)</td>
      <td class="px-6 py-4"></td>
    `;

    const detailsRow = tbody.insertRow();
    detailsRow.className = "course-details-row";
    const detailsCell = detailsRow.insertCell();
    detailsCell.colSpan = 4;
    detailsCell.className = "p-0";

    const nested = document.createElement("table");
    nested.className = "min-w-full";
    nested.innerHTML = `
      <thead class="sr-only"><tr><th>Course</th><th>Status</th><th>Deadline</th><th>Countdown</th><th>Reqs</th><th>Actions</th></tr></thead>
      <tbody class="divide-y divide-gray-200">
        ${apps.map((app) => {
          const fromDate = app.deadlineFrom
            ? new Date(app.deadlineFrom + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
            : "N/A";
          const untilDate = app.deadlineTo
            ? new Date(app.deadlineTo + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : "N/A";
          const deadlineText = app.deadlineFrom && app.deadlineTo ? `${fromDate} - ${untilDate}` : app.deadlineTo || "N/A";
          const countdown = decided
            ? { text: "Decided", colorClass: "text-text-light" }
            : getDaysRemaining(app.deadlineFrom, app.deadlineTo, app.status);
          const vpd = app.vpdNeeded ? `<span class="font-bold text-brand-red ml-2">(VPD Needed)</span>` : "";
          return `
            <tr class="bg-light-gray/50 hover:bg-light-gray">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-dark w-1/4">${app.courseAppliedFor || ""} ${vpd}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">${app.status || "N/A"}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-text-light">${deadlineText}</td>
              <td class="px-4 py-4 whitespace-nowrap text-sm ${countdown.colorClass}">${countdown.text}</td>
              <td class="px-6 py-4 text-sm text-text-light">
                <button class="font-semibold text-brand-blue hover:text-dark-blue transition-colors view-reqs-btn" data-id="${app.id}">View / Edit</button>
              </td>
              <td class="px-6 py-4 text-right text-sm font-medium space-x-4">
                <button class="text-brand-blue hover:text-dark-blue font-semibold transition-colors edit-app-btn" data-id="${app.id}">Edit</button>
                <button class="text-red-600 hover:text-red-800 font-semibold transition-colors delete-app-btn" data-id="${app.id}">Delete</button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;
    detailsCell.appendChild(nested);

    groupRow.addEventListener("click", () => {
      groupRow.classList.toggle("expanded");
      const arrow = groupRow.querySelector(".arrow-icon");
      if (arrow) arrow.style.transform = groupRow.classList.contains("expanded") ? "rotate(90deg)" : "rotate(0deg)";
      detailsRow.classList.toggle("expanded");
    });
  });

  container.appendChild(table);

  // Bind nested actions
  container.querySelectorAll(".edit-app-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const app = currentApplications.find((a) => a.id === id);
      if (app) openModal(app);
    });
  });

  container.querySelectorAll(".delete-app-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await removeApplication(btn.dataset.id);
        alertUser("Application deleted.", "success");
      } catch (err) {
        alertUser(`Error deleting application: ${err.message}`, "error");
      }
    });
  });

  container.querySelectorAll(".view-reqs-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const app = currentApplications.find((a) => a.id === btn.dataset.id);
      if (app) openRequirementsModal(app);
    });
  });
}
