"use strict";

const form = document.querySelector("#incident-form");
const successMessage = document.querySelector("#success-message");
const moderatorResults = document.querySelector("#moderator-results");
const description = document.querySelector("#description");
const characterCount = document.querySelector("#character-count");
const photoInput = document.querySelector("#photo");
const photoFilename = document.querySelector("#photo-filename");
const requiredProgress = document.querySelector("#required-progress");
const progressText = document.querySelector("#progress-text");
const storageKey = "campusIncidentUsabilityResults";

const errorTargets = {
  incidentType: document.querySelector("#type-error"),
  incidentDate: document.querySelector("#date-error"),
  incidentTime: document.querySelector("#time-error"),
  location: document.querySelector("#location-error"),
  description: document.querySelector("#description-error"),
  contactEmail: document.querySelector("#email-error"),
  contactPhone: document.querySelector("#phone-error"),
  photo: document.querySelector("#photo-error")
};

let startTimeMs = null;
let navigationErrorCount = 0;
let allResults = [];

function recordFirstInteraction() {
  if (startTimeMs === null) startTimeMs = Date.now();
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateProgress() {
  const checks = [
    Boolean(form.querySelector('input[name="incidentType"]:checked')),
    Boolean(form.elements.incidentDate.value) && form.elements.incidentDate.value <= localDateString(),
    Boolean(form.elements.incidentTime.value),
    Boolean(form.elements.location.value),
    description.value.trim().length >= 10
  ];
  const completed = checks.filter(Boolean).length;
  requiredProgress.value = completed;
  progressText.textContent = `${completed} of ${checks.length} required items complete`;
}

updateProgress();

// Any first pointer, focus, keyboard, or form-field interaction starts the timer.
["pointerdown", "focusin", "keydown", "input", "change"].forEach((eventName) => {
  form.addEventListener(eventName, recordFirstInteraction);
});

// A backwards tab movement is counted once per key press (not for key-repeat events).
form.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && event.shiftKey && !event.repeat) {
    recordFirstInteraction();
    navigationErrorCount += 1;
  }
});

function setError(control, message, errorElement) {
  const text = errorElement.querySelector(".error-text");
  if (text) text.textContent = message;
  else errorElement.textContent = message;
  errorElement.hidden = !message;
  if (message) {
    control.setAttribute("aria-invalid", "true");
  } else {
    control.removeAttribute("aria-invalid");
  }
}

function setRadioGroupError(message) {
  const radios = [...form.querySelectorAll('input[name="incidentType"]')];
  const groupErrorText = errorTargets.incidentType.querySelector(".error-text");
  if (groupErrorText) groupErrorText.textContent = message;
  else errorTargets.incidentType.textContent = message;
  errorTargets.incidentType.hidden = !message;
  radios.forEach((radio) => {
    if (message) radio.setAttribute("aria-invalid", "true");
    else radio.removeAttribute("aria-invalid");
  });
}

function clearErrorIfValid(target) {
  if (target.name === "incidentType" && form.querySelector('input[name="incidentType"]:checked')) {
    setRadioGroupError("");
  }
  if (target === form.elements.incidentDate && target.value && target.value <= localDateString()) {
    setError(target, "", errorTargets.incidentDate);
  }
  if (target === form.elements.incidentTime && target.value) {
    setError(target, "", errorTargets.incidentTime);
  }
  if (target === form.elements.location && target.value) {
    setError(target, "", errorTargets.location);
  }
  if (target === description && description.value.trim().length >= 10) {
    setError(target, "", errorTargets.description);
  }
  if (target === form.elements.contactEmail && (!target.value.trim() || target.validity.valid)) {
    setError(target, "", errorTargets.contactEmail);
  }
  if (target === form.elements.contactPhone && (!target.value.trim() || /^[+\d][\d\s().-]{5,24}$/.test(target.value.trim()))) {
    setError(target, "", errorTargets.contactPhone);
  }
}

function clearAllErrors() {
  setRadioGroupError("");
  setError(form.elements.incidentDate, "", errorTargets.incidentDate);
  setError(form.elements.incidentTime, "", errorTargets.incidentTime);
  setError(form.elements.location, "", errorTargets.location);
  setError(description, "", errorTargets.description);
  setError(form.elements.contactEmail, "", errorTargets.contactEmail);
  setError(form.elements.contactPhone, "", errorTargets.contactPhone);
  setError(photoInput, "", errorTargets.photo);
}

function validateForm() {
  clearAllErrors();
  let firstInvalid = null;
  let errorCount = 0;

  const typeSelected = form.querySelector('input[name="incidentType"]:checked');
  if (!typeSelected) {
    setRadioGroupError("Choose an incident type.");
    firstInvalid = form.querySelector('input[name="incidentType"]');
    errorCount += 1;
  }

  const date = form.elements.incidentDate;
  if (!date.value) {
    setError(date, "Enter the date the incident happened.", errorTargets.incidentDate);
    firstInvalid ||= date;
    errorCount += 1;
  } else if (date.value > localDateString()) {
    setError(date, "The incident date cannot be in the future.", errorTargets.incidentDate);
    firstInvalid ||= date;
    errorCount += 1;
  }

  const time = form.elements.incidentTime;
  if (!time.value) {
    setError(time, "Enter an approximate time.", errorTargets.incidentTime);
    firstInvalid ||= time;
    errorCount += 1;
  }

  const location = form.elements.location;
  if (!location.value) {
    setError(location, "Choose a campus location.", errorTargets.location);
    firstInvalid ||= location;
    errorCount += 1;
  }

  const trimmedDescription = description.value.trim();
  if (!trimmedDescription) {
    setError(description, "Describe what happened.", errorTargets.description);
    firstInvalid ||= description;
    errorCount += 1;
  } else if (trimmedDescription.length < 10) {
    setError(description, "Please provide at least 10 characters so we have enough detail.", errorTargets.description);
    firstInvalid ||= description;
    errorCount += 1;
  }

  const email = form.elements.contactEmail;
  if (email.value.trim() && !email.validity.valid) {
    setError(email, "Enter a valid email address, or leave this field blank.", errorTargets.contactEmail);
    firstInvalid ||= email;
    errorCount += 1;
  }

  const phone = form.elements.contactPhone;
  if (phone.value.trim() && !/^[+\d][\d\s().-]{5,24}$/.test(phone.value.trim())) {
    setError(phone, "Enter a valid phone number, or leave this field blank.", errorTargets.contactPhone);
    firstInvalid ||= phone;
    errorCount += 1;
  }

  const file = photoInput.files[0];
  if (file && !file.type.startsWith("image/")) {
    setError(photoInput, "Choose an image file.", errorTargets.photo);
    firstInvalid ||= photoInput;
    errorCount += 1;
  } else if (file && file.size > 10 * 1024 * 1024) {
    setError(photoInput, "The photo must be 10 MB or smaller.", errorTargets.photo);
    firstInvalid ||= photoInput;
    errorCount += 1;
  }

  return { valid: !firstInvalid, firstInvalid, errorCount };
}

function getLayoutVersion() {
  const stylesheet = document.querySelector('link[rel="stylesheet"][href*="desktop-first.css"], link[rel="stylesheet"][href*="mobile-first.css"]');
  const href = stylesheet ? stylesheet.getAttribute("href") || "" : "";
  if (href.includes("desktop-first.css")) return "desktop-first";
  if (href.includes("mobile-first.css")) return "mobile-first";
  return "unknown";
}

function readStoredResults() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function displayTime(isoTime) {
  const date = new Date(isoTime);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function showResults(record, saved) {
  document.querySelector("#result-start-time").textContent = displayTime(record.startTime);
  document.querySelector("#result-submit-time").textContent = displayTime(record.submitTime);
  document.querySelector("#result-completion-time").textContent = record.completionSeconds.toFixed(2);
  document.querySelector("#result-navigation-errors").textContent = String(record.navigationErrorCount);
  document.querySelector("#result-version").textContent = record.version;
  document.querySelector("#results-summary").textContent = `${allResults.length} session${allResults.length === 1 ? "" : "s"} available for download.`;
  document.querySelector("#storage-note").textContent = saved
    ? "Results are saved in this browser’s localStorage. Incident report details are not included."
    : "This session’s results are available to download, but localStorage could not save them in this browser.";
  moderatorResults.hidden = false;
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv() {
  const headers = ["start_time", "submit_time", "completion_seconds", "navigation_error_count", "version"];
  const rows = allResults.map((record) => [
    record.startTime,
    record.submitTime,
    Number(record.completionSeconds).toFixed(2),
    record.navigationErrorCount,
    record.version
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `campus-usability-results-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelector("#download-results").addEventListener("click", downloadCsv);

description.addEventListener("input", () => {
  characterCount.textContent = `${description.value.length} / 2000`;
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  photoFilename.textContent = file ? file.name : "No file chosen";
  let message = "";
  if (file && !file.type.startsWith("image/")) message = "Choose an image file.";
  else if (file && file.size > 10 * 1024 * 1024) message = "The photo must be 10 MB or smaller.";
  setError(photoInput, message, errorTargets.photo);
});

form.addEventListener("input", (event) => {
  clearErrorIfValid(event.target);
  updateProgress();
});

form.addEventListener("change", (event) => {
  clearErrorIfValid(event.target);
  updateProgress();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  recordFirstInteraction();

  const result = validateForm();
  if (!result.valid) {
    // Count each validation error shown on this submission (including missing required fields).
    navigationErrorCount += result.errorCount;
    result.firstInvalid.focus();
    return;
  }

  const submitTimeMs = Date.now();
  const record = {
    startTime: new Date(startTimeMs).toISOString(),
    submitTime: new Date(submitTimeMs).toISOString(),
    completionSeconds: Number(((submitTimeMs - startTimeMs) / 1000).toFixed(2)),
    navigationErrorCount,
    version: getLayoutVersion()
  };

  allResults = readStoredResults();
  allResults.push(record);
  let saved = false;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(allResults));
    saved = true;
  } catch (error) {
    // Keep this session in memory so the moderator can still download it.
  }

  form.hidden = true;
  successMessage.hidden = false;
  showResults(record, saved);
  successMessage.focus();
});
