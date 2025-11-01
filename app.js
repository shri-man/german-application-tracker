    import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
    import { getFirestore, doc, collection, addDoc, setDoc, deleteDoc, onSnapshot, query, serverTimestamp, orderBy, updateDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

    const firebaseConfig = {
      apiKey: "AIzaSyDmAlSmn_dvqJ93HJTVQcsf09Iihrj8DxM",
      authDomain: "my-uni-tracker.firebaseapp.com",
      projectId: "my-uni-tracker",
      storageBucket: "my-uni-tracker.appspot.com",
      messagingSenderId: "916300544918",
      appId: "1:916300544918:web:ef2e150e438fb53529fbb7",
    };

    const appId = typeof __app_id !== "undefined" ? __app_id : "german-uni-tracker-app";

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    let currentUserId = null;
    let applicationsCollectionRef;
    let wishlistCollectionRef;
    let unsubscribeApplications = null;
    let unsubscribeWishlist = null;
    let currentApplications = [];

    const loginPage = document.getElementById("loginPage");
    const mainHeader = document.getElementById("mainHeader");
    const mainContent = document.getElementById("mainContent");
    const loginBtn = document.getElementById("loginBtn");
    const signupBtn = document.getElementById("signupBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const navLinks = document.querySelectorAll(".nav-link");
    const tabContents = document.querySelectorAll(".tab-content");
    const applicationModal = document.getElementById("applicationModal");
    const addApplicationBtn = document.getElementById("addApplicationBtn");
    const importBtn = document.getElementById("importBtn");
    const fileInput = document.getElementById("fileInput");
    const downloadExcelBtn = document.getElementById("downloadExcelBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const cancelModalBtn = document.getElementById("cancelModalBtn");
    const applicationForm = document.getElementById("applicationForm");
    const modalTitle = document.getElementById("modalTitle");
    const applicationIdInput = document.getElementById("applicationId");
    const loadingSpinner = document.getElementById("loadingSpinner");
    const confirmModal = document.getElementById("confirmModal");
    const confirmModalTitle = document.getElementById("confirmModalTitle");
    const confirmModalMessage = document.getElementById("confirmModalMessage");
    const confirmCancelBtn = document.getElementById("confirmCancelBtn");
    const confirmOkBtn = document.getElementById("confirmOkBtn");
    let confirmCallback = null;

    const mergeConflictModal = document.getElementById("mergeConflictModal");
    const existingDataContainer = document.getElementById("existingDataContainer");
    const importedDataContainer = document.getElementById("importedDataContainer");
    const keepExistingBtn = document.getElementById("keepExistingBtn");
    const updateWithImportedBtn = document.getElementById("updateWithImportedBtn");

    const wishlistDiv = document.getElementById("wishlist");
    const wishlistForm = document.getElementById("wishlistForm");
    const wishlistInput = document.getElementById("wishlistInput");
    const noWishlistText = document.getElementById("noWishlistText");

    const preparingTableContainer = document.getElementById("preparingTableContainer");
    const decidedTableContainer = document.getElementById("decidedTableContainer");
    const pendingTableContainer = document.getElementById("pendingTableContainer");

    // Requirements Modal Elements
    const requirementsModal = document.getElementById("requirementsModal");
    const requirementsModalTitle = document.getElementById("requirementsModalTitle");
    const requirementsModalInfo = document.getElementById("requirementsModalInfo");
    const closeRequirementsModalBtn = document.getElementById("closeRequirementsModalBtn");
    const requirementsForm = document.getElementById("requirementsForm");
    const requirementsAppId = document.getElementById("requirementsAppId");
    const requirementsText = document.getElementById("requirementsText");
    const cancelRequirementsBtn = document.getElementById("cancelRequirementsBtn");
    const saveRequirementsBtn = document.getElementById("saveRequirementsBtn");

    // --- Date helpers (local, calendar-day safe) ---
function parseYMDLocal(s) {
  // "YYYY-MM-DD" -> Date at local midnight (no timezone shift)
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d); // local midnight
}

function startOfTodayLocal() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate()); // local midnight
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Difference in **calendar** days (local), i.e. 0 = today, 1 = tomorrow, -1 = yesterday
function dayDiff(a, b) {
  return Math.floor((a.getTime() - b.getTime()) / MS_PER_DAY);
}

    function showLoginPage() {
      loginPage.style.display = "flex";
      mainHeader.style.display = "none";
      mainContent.style.display = "none";
      hideLoading();
    }

    function showAppPage(user) {
      loginPage.style.display = "none";
      mainHeader.style.display = "block";
      mainContent.style.display = "block";
      document.querySelectorAll(".userEmailDisplay").forEach((el) => {
        el.textContent = user.email;
      });
      handleInitialTab();
    }

    onAuthStateChanged(auth, (user) => {
      if (user) {
        showAppPage(user);
        initializeData(user);
      } else {
        if (unsubscribeApplications) unsubscribeApplications();
        if (unsubscribeWishlist) unsubscribeWishlist();
        showLoginPage();
      }
    });

    signupBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      if (!email || !password) return alertUser("Please enter email and password.", "error");
      showLoading();
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (error) {
        alertUser(getAuthErrorMessage(error.code), "error");
      } finally {
        hideLoading();
      }
    });

    loginBtn.addEventListener("click", async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      if (!email || !password) return alertUser("Please enter email and password.", "error");
      showLoading();
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (error) {
        alertUser(getAuthErrorMessage(error.code), "error");
      } finally {
        hideLoading();
      }
    });

    logoutBtn.addEventListener("click", () => signOut(auth));

    function getAuthErrorMessage(errorCode) {
      switch (errorCode) {
        case "auth/invalid-email":
          return "Please enter a valid email address.";
        case "auth/user-not-found":
        case "auth/wrong-password":
          return "Invalid email or password.";
        case "auth/email-already-in-use":
          return "An account with this email already exists.";
        case "auth/weak-password":
          return "Password should be at least 6 characters long.";
        default:
          return "An authentication error occurred. Please try again.";
      }
    }

    async function initializeData(user) {
      currentUserId = user.uid;
      const userApplicationsPath = `artifacts/${appId}/users/${currentUserId}/applications`;
      const userWishlistPath = `artifacts/${appId}/users/${currentUserId}/wishlist`;
      applicationsCollectionRef = collection(db, userApplicationsPath);
      wishlistCollectionRef = collection(db, userWishlistPath);

      if (unsubscribeApplications) unsubscribeApplications();
      if (unsubscribeWishlist) unsubscribeWishlist();

      showLoading();
      const qApps = query(
        applicationsCollectionRef,
        orderBy("uniName", "asc"),
        orderBy("courseAppliedFor", "asc")
      );
      unsubscribeApplications = onSnapshot(
        qApps,
        (querySnapshot) => {
          try {
            currentApplications = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            renderAllApplicationSections(currentApplications);
          } catch (e) {
            console.error("Render Error:", e);
            alertUser("A critical error occurred while displaying your applications.", "error");
          } finally {
            hideLoading();
          }
        },
        (error) => {
          console.error("Firestore snapshot error (Applications): ", error);
          alertUser(`Error fetching applications: ${error.message}`, "error");
          hideLoading();
        }
      );

      const qWishlist = query(wishlistCollectionRef, orderBy("createdAt", "desc"));
      unsubscribeWishlist = onSnapshot(
        qWishlist,
        (querySnapshot) => {
          const wishlistItems = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          renderWishlist(wishlistItems);
        },
        (error) => {
          console.error("Firestore snapshot error (Wishlist): ", error);
          alertUser(`Error fetching wishlist: ${error.message}`, "error");
        }
      );
    }

    function navigateToTab(tabName) {
      if (window.location.hash !== `#${tabName}`) window.location.hash = tabName;
      navLinks.forEach((link) => link.classList.toggle("nav-active", link.dataset.tab === tabName));
      tabContents.forEach((content) => content.classList.toggle("active", content.id === tabName));
    }

    function handleInitialTab() {
      const tabName = window.location.hash.substring(1) || "home";
      navigateToTab(tabName);
      navLinks.forEach((link) => link.classList.toggle("nav-active", link.dataset.tab === tabName));
    }

    function showLoading() { loadingSpinner.style.display = "block"; }
    function hideLoading() { loadingSpinner.style.display = "none"; }

    function openModal(appData = null, isNew = false) {
      applicationForm.reset();
      applicationIdInput.value = "";
      modalTitle.textContent = "Add New Application";
      if (appData) {
        if (!isNew) {
          modalTitle.textContent = "Edit Application";
          applicationIdInput.value = appData.id;
        }
        document.getElementById("uniName").value = appData.uniName || "";
        document.getElementById("courseAppliedFor").value = appData.courseAppliedFor || "";
        document.getElementById("status").value = appData.status || "Preparing";
        document.getElementById("deadlineFrom").value = appData.deadlineFrom || "";
        document.getElementById("deadlineTo").value = appData.deadlineTo || "";
        document.getElementById("vpdNeeded").checked = appData.vpdNeeded || false;
        document.getElementById("specialRequirementsInput").value = appData.requirements || "";
      }
      applicationModal.style.display = "block";
    }

    function closeModal() { applicationModal.style.display = "none"; }

    applicationForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentUserId) return alertUser("You must be logged in.", "error");
      showLoading();
      const id = applicationIdInput.value;
      const applicationData = {
        uniName: document.getElementById("uniName").value.trim(),
        courseAppliedFor: document.getElementById("courseAppliedFor").value.trim(),
        status: document.getElementById("status").value,
        deadlineFrom: document.getElementById("deadlineFrom").value,
        deadlineTo: document.getElementById("deadlineTo").value,
        vpdNeeded: document.getElementById("vpdNeeded").checked,
        requirements: document.getElementById("specialRequirementsInput").value.trim(),
        updatedAt: serverTimestamp(),
      };
      if (!id) applicationData.createdAt = serverTimestamp();
      try {
        if (id) {
          await setDoc(doc(applicationsCollectionRef, id), applicationData, { merge: true });
        } else {
          await addDoc(applicationsCollectionRef, applicationData);
        }
        alertUser("Application saved!", "success");
        closeModal();
      } catch (error) {
        alertUser(`Error saving application: ${error.message}`, "error");
      } finally {
        hideLoading();
      }
    });

    async function deleteApplication(id) {
      openConfirmModal("Delete Application", "Are you sure? This cannot be undone.", async () => {
        showLoading();
        try {
          await deleteDoc(doc(applicationsCollectionRef, id));
          alertUser("Application deleted.", "success");
        } catch (error) {
          alertUser(`Error deleting application: ${error.message}`, "error");
        } finally {
          hideLoading();
        }
      });
    }

    wishlistForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const uniName = wishlistInput.value.trim();
      if (uniName && currentUserId) {
        try {
          await addDoc(wishlistCollectionRef, { name: uniName, researched: false, createdAt: serverTimestamp() });
          wishlistInput.value = "";
        } catch (error) {
          alertUser(`Error adding to wishlist: ${error.message}`, "error");
        }
      }
    });

    async function updateWishlistItem(id, researched) {
      if (!currentUserId) return;
      try {
        await updateDoc(doc(wishlistCollectionRef, id), { researched });
      } catch (error) {
        alertUser(`Error updating wishlist: ${error.message}`, "error");
      }
    }

    async function deleteWishlistItem(id) {
      if (!currentUserId) return;
      try {
        await deleteDoc(doc(wishlistCollectionRef, id));
      } catch (error) {
        alertUser(`Error deleting from wishlist: ${error.message}`, "error");
      }
    }

    function downloadAsExcel() {
      if (currentApplications.length === 0) return alertUser("No applications to download.", "info");
      const dataToExport = currentApplications.map((app) => ({
        "University Name": app.uniName,
        "Course Applied For": app.courseAppliedFor,
        "Status": app.status,
        "VPD Needed": app.vpdNeeded ? "Yes" : "No",
        "Deadline From": app.deadlineFrom,
        "Deadline Until": app.deadlineTo,
        "Special Requirements": app.requirements,
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
      const cols = Object.keys(dataToExport[0]).map((key) => ({ wch: Math.max(20, ...dataToExport.map((row) => (row[key] ? row[key].toString().length : 0)), key.length) }));
      worksheet["!cols"] = cols;
      XLSX.writeFile(workbook, "My_UniTrack_Applications.xlsx");
    }

    function getDaysRemaining(deadlineFromString, deadlineToString, status) {
  // "Decided" statuses: don't show countdowns
  if (["Accepted", "Rejected", "Waitlisted"].includes(status)) {
    return { text: "Decided", colorClass: "text-text-light" };
  }

  const today = startOfTodayLocal();
  const fromDate = parseYMDLocal(deadlineFromString);
  const toDate = parseYMDLocal(deadlineToString);

  // Upcoming window not started yet
  if (fromDate && today < fromDate) {
    const d = dayDiff(fromDate, today); // >= 1
    if (d === 0) return { text: "Starts Today!", colorClass: "text-green-700 font-bold" };
    if (d === 1) return { text: "Starts in 1 day", colorClass: "text-green-600 font-semibold" };
    return { text: `Starts in ${d} days`, colorClass: "text-green-600 font-semibold" };
  }

  // Active / ending side
  if (toDate) {
    const d = dayDiff(toDate, today); // 0 today, >0 future, <0 past
    if (d < 0) {
      return {
        text: status === "Not Applied" ? "Deadline Passed" : `Overdue by ${Math.abs(d)} days`,
        colorClass: "text-brand-red font-semibold",
      };
    }
    if (d === 0) return { text: "Ends Today!", colorClass: "text-brand-red font-bold" };
    if (d === 1) return { text: "Ends in 1 day", colorClass: "text-red-500 font-semibold" };
    return { text: `Ends in ${d} days`, colorClass: "text-red-500 font-semibold" };
  }

  return { text: "N/A", colorClass: "text-text-light" };
}

    // ==========================
    // NEW: Section counts + layout
    // ==========================

    function setSectionHeader(sectionEl, title, count) {
      const h3 = sectionEl.querySelector("h3");
      if (h3) h3.textContent = `${title} (${count})`;
    }

    function renderAllApplicationSections(applications) {
      // Buckets
      const preparingApps = applications.filter((app) => app.status === "Preparing");
      const appliedApps = applications.filter((app) => app.status === "Applied");
      const acceptedApps = applications.filter((app) => app.status === "Accepted");
      const rejectedApps = applications.filter((app) => app.status === "Rejected");
      const notAppliedApps = applications.filter((app) => app.status === "Not Applied");

      // Update section headers with counts
      const preparingSection = document.getElementById("preparingSection");
      const pendingSection = document.getElementById("pendingSection"); // becomes "Applied"
      const decidedSection = document.getElementById("decidedSection"); // becomes "Not Applied"

      setSectionHeader(preparingSection, "Preparing", preparingApps.length);
      setSectionHeader(
        pendingSection,
        "Applied",
        appliedApps.length + acceptedApps.length + rejectedApps.length
      );
      setSectionHeader(decidedSection, "Not Applied", notAppliedApps.length);

      // Preparing — sorted by nearest deadline/date
      renderTableSection(preparingTableContainer, preparingApps, { sortByDeadline: true, decided: false });

      // Applied section with subsections: Applied, Accepted, Rejected
      pendingTableContainer.innerHTML = "";
      const appliedBlock = document.createElement("div");
      const acceptedBlock = document.createElement("div");
      const rejectedBlock = document.createElement("div");

      appliedBlock.innerHTML = `<h4 class="text-lg font-bold text-text-dark mb-3">Applied (${appliedApps.length})</h4>`;
      acceptedBlock.innerHTML = `<h4 class="text-lg font-bold text-text-dark mt-8 mb-3">Accepted (${acceptedApps.length})</h4>`;
      rejectedBlock.innerHTML = `<h4 class="text-lg font-bold text-text-dark mt-8 mb-3">Rejected (${rejectedApps.length})</h4>`;

      const appliedTableWrap = document.createElement("div");
      const acceptedTableWrap = document.createElement("div");
      const rejectedTableWrap = document.createElement("div");

      appliedBlock.appendChild(appliedTableWrap);
      acceptedBlock.appendChild(acceptedTableWrap);
      rejectedBlock.appendChild(rejectedTableWrap);

      renderTableSection(appliedTableWrap, appliedApps, { sortByDeadline: false, decided: false });
      renderTableSection(acceptedTableWrap, acceptedApps, { decided: true });
      renderTableSection(rejectedTableWrap, rejectedApps, { decided: true });

      pendingTableContainer.appendChild(appliedBlock);
      pendingTableContainer.appendChild(acceptedBlock);
      pendingTableContainer.appendChild(rejectedBlock);

      // Not Applied — separate section
      renderTableSection(decidedTableContainer, notAppliedApps, { sortByDeadline: false, decided: false });
    }

  function getGroupDeadlineStatus(apps, opts = {}) {
  const { decided = false } = opts;
  if (decided) {
    return { sortOrder: 3, sortDate: null, text: "Decided", colorClass: "text-text-light" };
  }

  const today = startOfTodayLocal();
  let earliestActiveEnd = null;
  let earliestUpcomingStart = null;

  for (const app of apps) {
    // Ignore decided apps within a group for "next deadline" calc
    if (["Accepted", "Rejected", "Waitlisted"].includes(app.status)) continue;

    const fromDate = parseYMDLocal(app.deadlineFrom);
    const toDate = parseYMDLocal(app.deadlineTo);

    // Upcoming window (has a start date in the future)
    if (fromDate && today < fromDate) {
      if (!earliestUpcomingStart || fromDate < earliestUpcomingStart) earliestUpcomingStart = fromDate;
      continue;
    }

    // Active window (today within [from,to] or only toDate in the future)
    if (toDate && today <= toDate) {
      if (!earliestActiveEnd || toDate < earliestActiveEnd) earliestActiveEnd = toDate;
    }
  }

  if (earliestActiveEnd) {
    const d = dayDiff(earliestActiveEnd, today);
    if (d === 0) {
      // Make "Ends Today!" sort to the very top
      return { sortOrder: 0, sortDate: today, text: "Ends Today!", colorClass: "text-brand-red font-bold" };
    }
    if (d === 1) {
      return { sortOrder: 1, sortDate: earliestActiveEnd, text: "Ends in 1 day", colorClass: "text-red-500 font-semibold" };
    }
    return { sortOrder: 1, sortDate: earliestActiveEnd, text: `Ends in ${d} days`, colorClass: "text-red-500 font-semibold" };
  }

  if (earliestUpcomingStart) {
    const d = dayDiff(earliestUpcomingStart, today);
    if (d === 0) {
      return { sortOrder: 2, sortDate: earliestUpcomingStart, text: "Starts Today!", colorClass: "text-green-700 font-bold" };
    }
    if (d === 1) {
      return { sortOrder: 2, sortDate: earliestUpcomingStart, text: "Starts in 1 day", colorClass: "text-green-600 font-semibold" };
    }
    return { sortOrder: 2, sortDate: earliestUpcomingStart, text: `Starts in ${d} days`, colorClass: "text-green-600 font-semibold" };
  }

  return { sortOrder: 3, sortDate: null, text: "N/A", colorClass: "text-text-light" };
}

    function renderTableSection(container, applications, opts = {}) {
      const { sortByDeadline = false, decided = false } = opts;
      container.innerHTML = "";
      const groupedApps = applications.reduce((acc, app) => {
        const uniName = app.uniName || "Unnamed University";
        if (!acc[uniName]) acc[uniName] = [];
        acc[uniName].push(app);
        return acc;
      }, {});
      if (Object.keys(groupedApps).length === 0) {
        container.innerHTML = `<div class="px-6 py-8 text-center text-text-light"><p>No applications in this section.</p></div>`;
        return;
      }
      const uniGroupsArray = Object.entries(groupedApps).map(([uniName, apps]) => ({ uniName, apps }));
      let sortedUniGroups;
      if (decided) {
        uniGroupsArray.sort((a, b) => a.uniName.localeCompare(b.uniName));
        sortedUniGroups = uniGroupsArray.map((group) => ({ ...group, deadlineStatus: getGroupDeadlineStatus(group.apps, { decided: true }) }));
      } else if (sortByDeadline) {
        sortedUniGroups = uniGroupsArray.map((group) => ({ ...group, deadlineStatus: getGroupDeadlineStatus(group.apps, { decided: false }) }));
        sortedUniGroups.sort((a, b) => {
          if (a.deadlineStatus.sortOrder !== b.deadlineStatus.sortOrder) {
            return a.deadlineStatus.sortOrder - b.deadlineStatus.sortOrder;
          }
          if (a.deadlineStatus.sortDate && b.deadlineStatus.sortDate) {
            return a.deadlineStatus.sortDate - b.deadlineStatus.sortDate;
          }
          return a.uniName.localeCompare(b.uniName);
        });
      } else {
        sortedUniGroups = uniGroupsArray
          .sort((a, b) => a.uniName.localeCompare(b.uniName))
          .map((group) => ({ ...group, deadlineStatus: getGroupDeadlineStatus(group.apps, { decided: false }) }));
      }

      const table = document.createElement("table");
      table.className = "min-w-full";
      const thead = document.createElement("thead");
      thead.className = "border-b border-gray-200";
      thead.innerHTML = `
        <tr>
          <th scope="col" class="pl-12 pr-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">University</th>
          <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Next Deadline</th>
          <th scope="col" class="px-6 py-4 text-left text-xs font-semibold text-text-light uppercase tracking-wider">Courses</th>
          <th scope="col" class="px-6 py-4 text-right text-xs font-semibold text-text-light uppercase tracking-wider"></th>
        </tr>`;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      tbody.className = "divide-y divide-gray-100";

      sortedUniGroups.forEach(({ uniName, apps, deadlineStatus }) => {
        const groupRow = tbody.insertRow();
        groupRow.className = "uni-group-row bg-white hover:bg-light-gray transition-colors";
        groupRow.dataset.uni = uniName;
        groupRow.innerHTML = `
          <td class="pl-6 pr-6 py-4 whitespace-nowrap text-sm font-bold text-text-dark">
            <div class="flex items-center">
              <svg class="arrow-icon w-4 h-4 mr-4 text-text-light transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
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

        const nestedTable = document.createElement("table");
        nestedTable.className = "min-w-full";
        nestedTable.innerHTML = `
          <thead class="sr-only"><tr><th>Course</th><th>Status</th><th>Deadline</th><th>Countdown</th><th>Requirements</th><th>Actions</th></tr></thead>
          <tbody class="divide-y divide-gray-200">
            ${apps
              .map((app) => {
                const fromDate = app.deadlineFrom
                  ? new Date(app.deadlineFrom + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : "N/A";
                const untilDate = app.deadlineTo
                  ? new Date(app.deadlineTo + "T00:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "N/A";
                const deadlineText = app.deadlineFrom && app.deadlineTo ? `${fromDate} - ${untilDate}` : app.deadlineTo || "N/A";
                const countdown = decided
                  ? { text: "Decided", colorClass: "text-text-light" }
                  : getDaysRemaining(app.deadlineFrom, app.deadlineTo, app.status);
                const vpdStatusHtml = app.vpdNeeded ? `<span class="font-bold text-brand-red ml-2">(VPD Needed)</span>` : "";
                return `
                  <tr class="bg-light-gray/50 hover:bg-light-gray">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text-dark w-1/4">${app.courseAppliedFor || ""} ${vpdStatusHtml}</td>
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
              })
              .join("")}
          </tbody>
        `;
        detailsCell.appendChild(nestedTable);

        groupRow.addEventListener("click", () => {
          groupRow.classList.toggle("expanded");
          detailsRow.classList.toggle("expanded");
        });
      });

      table.appendChild(tbody);
      container.appendChild(table);

      // Bind actions
      container.querySelectorAll(".edit-app-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const app = currentApplications.find((a) => a.id === e.target.dataset.id);
          if (app) openModal(app);
        });
      });
      container.querySelectorAll(".delete-app-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteApplication(e.target.dataset.id);
        });
      });
      container.querySelectorAll(".view-reqs-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const app = currentApplications.find((a) => a.id === e.target.dataset.id);
          if (app) openRequirementsModal(app);
        });
      });
    }

    function renderWishlist(items) {
      wishlistDiv.innerHTML = "";
      if (items.length > 0) {
        noWishlistText.style.display = "none";
        items.forEach((item) => {
          const div = document.createElement("div");
          div.className = "wishlist-item flex items-center justify-between";
          const id = `wishlist-${item.id}`;
          div.innerHTML = `
            <input type="checkbox" id="${id}" class="hidden" ${item.researched ? "checked" : ""}>
            <label for="${id}" class="flex items-center cursor-pointer text-text-dark w-full p-2 rounded-md hover:bg-light-gray">
              <span class="w-5 h-5 mr-3 rounded border-2 border-gray-300 flex items-center justify-center transition-all flex-shrink-0">
                <svg class="w-3 h-3 text-white transform scale-0 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </span>
              <span class="transition-colors">${item.name}</span>
            </label>
            <button class="delete-wishlist-item text-gray-400 hover:text-red-500 transition-colors ml-2 p-1 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>`;
          div.querySelector("input").addEventListener("change", (e) => updateWishlistItem(item.id, e.target.checked));
          div.querySelector(".delete-wishlist-item").addEventListener("click", () => deleteWishlistItem(item.id));
          wishlistDiv.appendChild(div);
        });
      } else {
        noWishlistText.style.display = "block";
      }
    }

    function openConfirmModal(title, message, callback) {
      confirmModalTitle.textContent = title;
      confirmModalMessage.textContent = message;
      confirmCallback = callback;
      confirmModal.style.display = "block";
    }
    function closeConfirmModal() {
      confirmModal.style.display = "none";
      confirmCallback = null;
    }
    function alertUser(message, type = "info") {
      const alertBox = document.createElement("div");
           Object.assign(alertBox.style, {
        position: "fixed",
        left: "50%",
        bottom: "20px",
        transform: "translateX(-50%)",
        padding: "12px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: "2000",
        fontSize: "14px",
        opacity: "0",
        color: "white",
        transition: "opacity 0.3s ease-in-out, bottom 0.3s ease-in-out",
        backgroundColor: type === "success" ? "#4CAF50" : type === "error" ? "#F44336" : "#2196F3",
      });
      alertBox.textContent = message;
      document.body.appendChild(alertBox);
      setTimeout(() => {
        alertBox.style.opacity = "1";
        alertBox.style.bottom = "30px";
      }, 10);
      setTimeout(() => {
        alertBox.style.opacity = "0";
        setTimeout(() => alertBox.remove(), 300);
      }, 3500);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in-section").forEach((section) => observer.observe(section));

    window.addEventListener("scroll", () => {
      mainHeader.classList.toggle("scrolled", window.scrollY > 10);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateToTab(e.target.dataset.tab);
      });
    });

    addApplicationBtn.addEventListener("click", () => openModal(null, true));
    importBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", handleFileUpload);
    downloadExcelBtn.addEventListener("click", downloadAsExcel);
    closeModalBtn.addEventListener("click", closeModal);
    cancelModalBtn.addEventListener("click", closeModal);

    confirmCancelBtn.addEventListener("click", closeConfirmModal);
    confirmOkBtn.addEventListener("click", () => {
      if (confirmCallback) confirmCallback();
      closeConfirmModal();
    });

    window.addEventListener("click", (e) => {
      if (e.target === applicationModal) closeModal();
      if (e.target === confirmModal) closeConfirmModal();
      if (e.target === mergeConflictModal) closeMergeConflictModal();
      if (e.target === requirementsModal) closeRequirementsModal();
    });

    // --- File Import & Merge Functions ---

    function handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      showLoading();
      const fileExtension = file.name.split(".").pop().toLowerCase();
      if (fileExtension === "xlsx") parseExcelDoc(file);
      else if (fileExtension === "docx") parseWordDoc(file);
      else {
        alertUser("Unsupported file type. Please upload .xlsx or .docx files.", "error");
        hideLoading();
      }
      event.target.value = "";
    }

    function parseExcelDoc(file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const textContent = workbook.SheetNames.map((name) => {
            const ws = workbook.Sheets[name];
            return XLSX.utils
              .sheet_to_json(ws, { header: 1 })
              .map((row) => row.join(" "))
              .join("\n");
          }).join("\n\n");
          await extractInfoWithGemini(textContent);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          alertUser("Could not parse the Excel file.", "error");
          hideLoading();
        }
      };
      reader.readAsArrayBuffer(file);
    }

    async function parseWordDoc(file) {
      try {
        const result = await docx.readArrayBuffer(file);
        await extractInfoWithGemini(result.value);
      } catch (error) {
        console.error("Error parsing Word file:", error);
        alertUser("Could not parse the Word file.", "error");
        hideLoading();
      }
    }

    function closeMergeConflictModal() {
      mergeConflictModal.style.display = "none";
    }

    function showMergeConflictModal(existingApp, importedData) {
      function renderData(container, data) {
        container.innerHTML = `
          <p><strong>Course:</strong> ${data.courseAppliedFor || "N/A"}</p>
          <p><strong>Status:</strong> ${data.status || "N/A"}</p>
          <p><strong>VPD Needed:</strong> ${data.vpdNeeded ? "Yes" : "No"}</p>
          <p><strong>Deadline From:</strong> ${data.deadlineFrom || "N/A"}</p>
          <p><strong>Deadline To:</strong> ${data.deadlineTo || "N/A"}</p>
          <p><strong>Requirements:</strong> ${data.requirements || "N/A"}</p>
        `;
      }

      renderData(existingDataContainer, existingApp);
      renderData(importedDataContainer, importedData);

      keepExistingBtn.onclick = closeMergeConflictModal;
      updateWithImportedBtn.onclick = async () => {
        showLoading();
        try {
          await setDoc(doc(applicationsCollectionRef, existingApp.id), importedData, { merge: true });
          alertUser("Application updated successfully!", "success");
        } catch (e) {
          alertUser("Failed to update application.", "error");
        } finally {
          closeMergeConflictModal();
          hideLoading();
        }
      };

      mergeConflictModal.style.display = "block";
    }

    async function extractInfoWithGemini(text) {
      alertUser("AI is analyzing your document...", "info");

      const prompt = `From the following text, extract the university name, course name, application deadline start and end dates, whether a VPD is needed, and a summary of requirements. The keys must be "uniName", "courseAppliedFor", "deadlineFrom", "deadlineTo", "vpdNeeded", and "requirements". The vpdNeeded key should be a boolean. Format ALL dates as YYYY-MM-DD. If info is missing, use an empty string or false. Text: \\n\\n${text}`;

      let chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = {
        contents: chatHistory,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              uniName: { type: "STRING" },
              courseAppliedFor: { type: "STRING" },
              deadlineFrom: { type: "STRING", description: "Date in YYYY-MM-DD format" },
              deadlineTo: { type: "STRING", description: "Date in YYYY-MM-DD format" },
              vpdNeeded: { type: "BOOLEAN" },
              requirements: { type: "STRING" },
            },
          },
        },
      };

      const apiKey = ""; // Add your Gemini API Key here
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const result = await response.json();

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts[0]) {
          const parsedJson = JSON.parse(result.candidates[0].content.parts[0].text);
          if (!parsedJson.uniName || !parsedJson.courseAppliedFor) {
            alertUser("AI could not identify a university and course name. Please add manually.", "error");
            hideLoading();
            return;
          }

          const existingApp = currentApplications.find(
            (app) =>
              app.uniName?.toLowerCase() === parsedJson.uniName.toLowerCase() &&
              app.courseAppliedFor?.toLowerCase() === parsedJson.courseAppliedFor.toLowerCase()
          );

          if (existingApp) {
            showMergeConflictModal(existingApp, parsedJson);
          } else {
            alertUser("Information extracted! Please review and save.", "success");
            openModal(parsedJson, true);
          }
        } else {
          throw new Error("No valid content received from AI.");
        }
      } catch (error) {
        console.error("Error with Gemini API:", error);
        alertUser("AI could not extract information. Please add manually.", "error");
      } finally {
        hideLoading();
      }
    }

    // --- Requirements Modal Functions ---

    function openRequirementsModal(app) {
      requirementsModalTitle.textContent = `Requirements for ${app.courseAppliedFor}`;
      requirementsModalInfo.textContent = `at ${app.uniName}`;
      requirementsAppId.value = app.id;
      requirementsText.value = app.requirements || "";
      requirementsModal.style.display = "block";
      requirementsText.focus();
    }

    function closeRequirementsModal() {
      requirementsModal.style.display = "none";
    }

    requirementsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      showLoading();
      const id = requirementsAppId.value;
      const newRequirements = requirementsText.value.trim();

      try {
        await updateDoc(doc(applicationsCollectionRef, id), { requirements: newRequirements });
        alertUser("Requirements updated successfully!", "success");
        closeRequirementsModal();
      } catch (error) {
        alertUser("Failed to save requirements.", "error");
        console.error("Error updating requirements: ", error);
      } finally {
        hideLoading();
      }
    });

    closeRequirementsModalBtn.addEventListener("click", closeRequirementsModal);
    cancelRequirementsBtn.addEventListener("click", closeRequirementsModal);
