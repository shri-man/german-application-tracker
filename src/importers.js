// /src/importers.js
import { alertUser } from "./alerts.js";
import { openModal, showMergeConflictModal, showLoading, hideLoading } from "./modals.js";
import { currentApplications } from "./state.js";

const XLSX = window.XLSX; // from CDN in <head>
const docx = window.docx; // from docx-preview CDN (exposes "docx")

export function initImporters(fileInputEl, importBtnEl) {
  importBtnEl.addEventListener("click", () => fileInputEl.click());
  fileInputEl.addEventListener("change", handleFileUpload);
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  showLoading();
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "xlsx") parseExcelDoc(file);
  else if (ext === "docx") parseWordDoc(file);
  else {
    alertUser("Unsupported file type. Please upload .xlsx or .docx files.", "error");
    hideLoading();
  }
  event.target.value = "";
}

function parseExcelDoc(file) {
  if (!XLSX) { alertUser("XLSX library not loaded.", "error"); hideLoading(); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const textContent = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        return XLSX.utils
          .sheet_to_json(ws, { header: 1 })
          .map((row) => row.join(" "))
          .join("\n");
      }).join("\n\n");
      await extractInfoWithGemini(textContent);
    } catch (err) {
      console.error(err);
      alertUser("Could not parse the Excel file.", "error");
      hideLoading();
    }
  };
  reader.readAsArrayBuffer(file);
}

async function parseWordDoc(file) {
  if (!docx) { alertUser("DOCX library not loaded.", "error"); hideLoading(); return; }
  try {
    const result = await docx.readArrayBuffer(file);
    await extractInfoWithGemini(result.value);
  } catch (err) {
    console.error(err);
    alertUser("Could not parse the Word file.", "error");
    hideLoading();
  }
}

async function extractInfoWithGemini(text) {
  alertUser("AI is analyzing your document...", "info");

  const prompt =
    `From the following text, extract the university name, course name, application deadline start and end dates, whether a VPD is needed, and a summary of requirements. The keys must be "uniName", "courseAppliedFor", "deadlineFrom", "deadlineTo", "vpdNeeded", and "requirements". The vpdNeeded key should be a boolean. Format ALL dates as YYYY-MM-DD. If info is missing, use an empty string or false. Text:\n\n${text}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          uniName: { type: "STRING" },
          courseAppliedFor: { type: "STRING" },
          deadlineFrom: { type: "STRING" },
          deadlineTo: { type: "STRING" },
          vpdNeeded: { type: "BOOLEAN" },
          requirements: { type: "STRING" },
        },
      },
    },
  };

  const apiKey = ""; // <-- Put your Gemini API key here if you want this feature
  if (!apiKey) {
    alertUser("Gemini API key missing. Add it in /src/importers.js to enable AI import.", "error");
    hideLoading();
    return;
  }
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`API request failed with status ${res.status}`);
    const result = await res.json();

    const part = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!part) throw new Error("No valid content received from AI.");
    const parsed = JSON.parse(part);

    if (!parsed.uniName || !parsed.courseAppliedFor) {
      alertUser("AI couldn't identify university and course. Please add manually.", "error");
      hideLoading();
      return;
    }

    const existingApp = currentApplications.find(
      (a) =>
        a.uniName?.toLowerCase() === parsed.uniName.toLowerCase() &&
        a.courseAppliedFor?.toLowerCase() === parsed.courseAppliedFor.toLowerCase()
    );

    if (existingApp) showMergeConflictModal(existingApp, parsed);
    else {
      alertUser("Information extracted! Please review and save.", "success");
      openModal(parsed, true);
    }
  } catch (err) {
    console.error(err);
    alertUser("AI could not extract information. Please add manually.", "error");
  } finally {
    hideLoading();
  }
}
