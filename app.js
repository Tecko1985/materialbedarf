let appData = { meldungen: [] };
let currentUsername = null;
let currentIsAdmin = false;
let currentCanEdit = false;
let currentVorname = null;
let currentNachname = null;
let currentMannschaften = [];

function canEdit() { return currentIsAdmin || currentCanEdit; }
// Filter nur noch im Tab "Bearbeitet" — der Verwaltung-Tab zeigt ausschliesslich offene Meldungen.
let currentBearbeitetFilter = "alle";
let positionRowSeq = 0;

const MELDUNG_STATUS = [
  { id: "offen", label: "Offen" },
  { id: "angenommen", label: "Angenommen" },
  { id: "abgelehnt", label: "Abgelehnt" },
  { id: "gekauft", label: "Gekauft/Erledigt" }
];

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("de-DE") + ", " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) + " Uhr";
}

function localDateIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "fxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16));
}

function download(filename, type, content) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

// Fallback, falls der Gateway (noch) kein vorname/nachname liefert (älterer, noch nicht
// neu deployter admin-worker.js). Rät den Namen aus dem username (Format "vorname.nachname").
function deriveNameFromUsername(username) {
  const parts = String(username || "").split(".");
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  return { vorname: cap(parts[0] || ""), nachname: cap(parts.slice(1).join(" ") || "") };
}

function normalizeAppData(data) {
  const d = data && typeof data === "object" ? data : {};
  if (!Array.isArray(d.meldungen)) d.meldungen = [];
  return d;
}

// Wendet mutate() auf appData an und speichert. Bei Konflikt (409) wird der aktuelle
// Remote-Stand nachgeladen und dieselbe Mutation erneut angewendet, bevor erneut
// gespeichert wird.
async function saveWithConflictRetry(mutate) {
  mutate(appData);
  try {
    await gatewaySave(appData);
  } catch (e) {
    if (!(e instanceof ConflictError)) throw e;
    const data = await gatewayLoad();
    appData = normalizeAppData(data);
    mutate(appData);
    await gatewaySave(appData);
  }
}

function renderChangelog() {
  const list = document.getElementById("changelog-list");
  list.innerHTML = APP_CHANGELOG.map((entry) => `
    <div class="changelog-entry">
      <span class="cv">Version ${escapeHtml(entry.version)}</span>
      ${entry.groups.map((g) => `
        <div class="changelog-group">
          <div class="cg-title">${escapeHtml(g.title)}</div>
          <ul class="cg-items">${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>
      `).join("")}
    </div>
  `).join("");
}

function renderHeaderUser() {
  const el = document.getElementById("header-user");
  if (!el) return;
  if (!currentUsername) { el.textContent = ""; return; }
  const name = (currentVorname || currentNachname)
    ? `${currentVorname || ""} ${currentNachname || ""}`.trim()
    : currentUsername;
  const mannschaftHinweis = currentMannschaften.length ? ` (${currentMannschaften.join(", ")})` : "";
  el.textContent = "👤 " + name + mannschaftHinweis + (currentIsAdmin ? " (Admin)" : "");
}

function activateTab(name) {
  document.querySelectorAll("nav button[data-tab]").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.remove("active"));
  document.querySelector(`nav button[data-tab="${name}"]`).classList.add("active");
  document.getElementById("tab-" + name).classList.add("active");
}

function setupTabs() {
  document.querySelectorAll("nav button[data-tab]").forEach((b) => {
    b.addEventListener("click", () => activateTab(b.dataset.tab));
  });

  // Versionshistorie liegt im oeffentlichen Meldung-Tab (siehe index.html), nicht im
  // admin-only Verwaltung-Tab — fuer jeden eingeloggten Nutzer erreichbar.
  const versionBadgeHeader = document.getElementById("version-badge");
  const openVersionHistory = () => activateTab("info");
  versionBadgeHeader.addEventListener("click", openVersionHistory);
  versionBadgeHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openVersionHistory(); }
  });
}

// ---------- Mannschaft-Feld ----------

function renderMannschaftField() {
  const el = document.getElementById("mannschaft-field");
  if (!el) return;
  if (currentMannschaften.length > 1) {
    el.innerHTML = `
      <label>Mannschaft</label>
      <select id="f-mannschaft">
        ${currentMannschaften.map((m) => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`).join("")}
      </select>`;
  } else if (currentMannschaften.length === 1) {
    el.innerHTML = `<label>Mannschaft</label><p class="muted">${escapeHtml(currentMannschaften[0])}</p>`;
  } else {
    el.innerHTML = `<p class="muted">Keine Mannschaft im Trainerprofil hinterlegt.</p>`;
  }
}

function resolveMannschaft() {
  if (currentMannschaften.length > 1) {
    const sel = document.getElementById("f-mannschaft");
    return sel ? sel.value : null;
  }
  if (currentMannschaften.length === 1) return currentMannschaften[0];
  return null;
}

// ---------- Positionszeilen ----------

function positionRowHtml(rowId) {
  return `
    <div class="position-row" data-row-id="${rowId}">
      <input type="text" class="position-material" placeholder="z.B. Trainingsbälle" />
      <input type="number" class="position-menge" min="1" step="1" value="1" />
      <button type="button" class="btn-remove-position" title="Zeile entfernen">✕</button>
    </div>`;
}

function addPositionRow() {
  document.getElementById("meldung-positionen-rows").insertAdjacentHTML("beforeend", positionRowHtml(positionRowSeq++));
}

function collectPositionenFromForm() {
  return Array.from(document.querySelectorAll("#meldung-positionen-rows .position-row"))
    .map((row) => ({
      material: row.querySelector(".position-material").value.trim(),
      menge: Number(row.querySelector(".position-menge").value) || 0
    }))
    .filter((p) => p.material && p.menge > 0);
}

function resetMeldungForm() {
  document.getElementById("meldung-positionen-rows").innerHTML = "";
  addPositionRow();
  document.getElementById("f-grund").value = "";
  document.getElementById("f-dringlichkeit").value = "normal";
  renderMannschaftField();
}

function showFormError(msg) {
  const el = document.getElementById("form-error");
  el.style.display = msg ? "block" : "none";
  el.textContent = msg || "";
}

async function submitMeldung() {
  showFormError("");
  const positionen = collectPositionenFromForm();
  const grund = document.getElementById("f-grund").value.trim();
  const dringlichkeit = document.getElementById("f-dringlichkeit").value;
  const mannschaft = resolveMannschaft();

  if (!positionen.length) { showFormError("Mindestens ein Material mit Menge angeben."); return; }
  if (!grund) { showFormError("Bitte einen Grund/Verwendungszweck angeben."); return; }

  const btn = document.getElementById("btn-submit");
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = "Wird gespeichert…";
  try {
    const ticket = {
      id: uuid(),
      erstelltVon: currentUsername,
      vorname: currentVorname,
      nachname: currentNachname,
      mannschaft,
      positionen,
      grund,
      dringlichkeit,
      status: "offen",
      adminKommentar: "",
      erstelltAm: new Date().toISOString(),
      entschiedenAm: null,
      entschiedenVon: null,
      gekauftAm: null
    };
    await saveWithConflictRetry((data) => { data.meldungen.push(ticket); });
    resetMeldungForm();
    renderMeineMeldungen();
  } catch (e) {
    showFormError("Fehler beim Speichern: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalLabel;
  }
}

// ---------- Gemeinsame Anzeige-Helfer ----------

function positionenText(positionen) {
  return (positionen || []).map((p) => `${p.material} ×${p.menge}`).join(", ");
}

function statusLabel(status) {
  const s = MELDUNG_STATUS.find((x) => x.id === status);
  return s ? s.label : status;
}

function statusBadgeHtml(status) {
  return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(statusLabel(status))}</span>`;
}

function trainerName(m) {
  return (m.vorname || m.nachname) ? `${m.vorname || ""} ${m.nachname || ""}`.trim() : m.erstelltVon;
}

// ---------- Meine Meldungen ----------

function meineMeldungenSorted() {
  return appData.meldungen
    .filter((m) => m.erstelltVon === currentUsername)
    .sort((a, b) => (b.erstelltAm || "").localeCompare(a.erstelltAm || ""));
}

function renderMeineMeldungen() {
  const list = meineMeldungenSorted();
  const container = document.getElementById("meine-meldungen-rows");
  document.getElementById("meine-meldungen-empty").style.display = list.length ? "none" : "block";
  container.innerHTML = list.map((m) => `
    <div class="meldung-row">
      <div class="meldung-row-main">
        <div class="meldung-datum muted">${escapeHtml(fmtDate(m.erstelltAm))}${m.mannschaft ? " · " + escapeHtml(m.mannschaft) : ""}</div>
        <div class="meldung-positionen">${escapeHtml(positionenText(m.positionen))}</div>
        <div class="meldung-grund muted">${escapeHtml(m.grund)}</div>
        ${m.dringlichkeit === "dringend" ? `<span class="dringend-flag">⚠ Dringend</span>` : ""}
        ${m.adminKommentar ? `<div class="meldung-kommentar muted">Kommentar: ${escapeHtml(m.adminKommentar)}</div>` : ""}
      </div>
      <div class="meldung-row-actions">
        ${statusBadgeHtml(m.status)}
        ${m.status === "offen" ? `<button type="button" class="btn secondary small btn-withdraw" data-id="${escapeHtml(m.id)}">Zurückziehen</button>` : ""}
      </div>
    </div>
  `).join("");
}

async function withdrawMeldung(id) {
  if (!confirm("Diese Meldung wirklich zurückziehen?")) return;
  // Status-Guard auch in der Mutation (nicht nur im UI-Button): beim Konflikt-Retry
  // läuft mutate() erneut auf dem frischen Remote-Stand — hat ein Admin die Meldung
  // inzwischen entschieden, darf das Zurückziehen sie nicht mehr löschen.
  await saveWithConflictRetry((data) => {
    data.meldungen = data.meldungen.filter((m) => !(m.id === id && m.status === "offen"));
  });
  renderMeineMeldungen();
}

// ---------- Verwaltung (Admin) ----------

function sortedByErstelltDesc(list) {
  return list.slice().sort((a, b) => (b.erstelltAm || "").localeCompare(a.erstelltAm || ""));
}

// Die beiden Listen sind komplementaer: was hier fehlt, steht im jeweils anderen Tab.
// "offen" ist der einzige noch nicht entschiedene Status (siehe MELDUNG_STATUS).
function offeneMeldungen() {
  return sortedByErstelltDesc(appData.meldungen.filter((m) => m.status === "offen"));
}

function bearbeiteteMeldungen() {
  const list = appData.meldungen.filter((m) => m.status !== "offen");
  return sortedByErstelltDesc(currentBearbeitetFilter === "alle"
    ? list
    : list.filter((m) => m.status === currentBearbeitetFilter));
}

function bearbeitetFilterLabel() {
  return currentBearbeitetFilter === "alle" ? "Alle bearbeiteten" : statusLabel(currentBearbeitetFilter);
}

// Ein Markup fuer beide Tabs — welche Aktionen erscheinen, haengt allein am Status der
// Meldung, nicht am Tab. Damit bleibt "Als gekauft markieren" bei angenommenen Meldungen
// erreichbar, obwohl die im Tab "Bearbeitet" stehen.
function adminMeldungRowHtml(m) {
  return `
    <div class="meldung-row" data-id="${escapeHtml(m.id)}">
      <div class="meldung-row-main">
        <div class="meldung-datum muted">${escapeHtml(fmtDate(m.erstelltAm))} · ${escapeHtml(trainerName(m))}${m.mannschaft ? " · " + escapeHtml(m.mannschaft) : ""}</div>
        <div class="meldung-positionen">${escapeHtml(positionenText(m.positionen))}</div>
        <div class="meldung-grund muted">${escapeHtml(m.grund)}</div>
        ${m.dringlichkeit === "dringend" ? `<span class="dringend-flag">⚠ Dringend</span>` : ""}
        ${(m.status === "offen" || m.status === "angenommen") ? `
        <div class="form-field admin-kommentar-field">
          <label>Admin-Kommentar</label>
          <input type="text" class="admin-kommentar-input" value="${escapeHtml(m.adminKommentar || "")}" placeholder="z.B. wird nächste Woche bestellt" />
        </div>` : (m.adminKommentar ? `<div class="meldung-kommentar muted">Kommentar: ${escapeHtml(m.adminKommentar)}</div>` : "")}
      </div>
      <div class="meldung-row-actions">
        ${statusBadgeHtml(m.status)}
        ${m.status === "offen" ? `
          <button type="button" class="btn success small btn-annehmen">Annehmen</button>
          <button type="button" class="btn secondary small btn-ablehnen">Ablehnen</button>
        ` : ""}
        ${m.status === "angenommen" ? `<button type="button" class="btn small btn-gekauft">Als gekauft markieren</button>` : ""}
        <button type="button" class="btn secondary small btn-delete-meldung">Löschen</button>
      </div>
    </div>`;
}

function renderMeldungList(list, rowsId, emptyId) {
  document.getElementById(emptyId).style.display = list.length ? "none" : "block";
  document.getElementById(rowsId).innerHTML = list.map(adminMeldungRowHtml).join("");
}

// Immer beide Listen: jede Entscheidung laesst eine Meldung von der einen in die andere
// wandern, ein Neurendern nur des aktiven Tabs liesse die andere veraltet zurueck.
function renderAdminMeldungen() {
  renderMeldungList(offeneMeldungen(), "verwaltung-rows", "verwaltung-empty");
  renderMeldungList(bearbeiteteMeldungen(), "bearbeitet-rows", "bearbeitet-empty");
}

async function entscheideMeldung(id, entscheidung, adminKommentar) {
  if (!canEdit()) return;
  await saveWithConflictRetry((data) => {
    const m = data.meldungen.find((x) => x.id === id);
    if (!m || m.status !== "offen") return;
    m.status = entscheidung;
    m.entschiedenAm = new Date().toISOString();
    m.entschiedenVon = currentUsername;
    if (adminKommentar !== undefined) m.adminKommentar = adminKommentar;
  });
  renderAdminMeldungen();
}

async function alsGekauftMarkieren(id, adminKommentar) {
  if (!canEdit()) return;
  await saveWithConflictRetry((data) => {
    const m = data.meldungen.find((x) => x.id === id);
    if (!m || m.status !== "angenommen") return;
    m.status = "gekauft";
    m.gekauftAm = new Date().toISOString();
    if (adminKommentar !== undefined) m.adminKommentar = adminKommentar;
  });
  renderAdminMeldungen();
}

async function deleteMeldungAdmin(id) {
  if (!canEdit()) return;
  if (!confirm("Diese Meldung wirklich endgültig löschen?")) return;
  await saveWithConflictRetry((data) => {
    data.meldungen = data.meldungen.filter((m) => m.id !== id);
  });
  renderAdminMeldungen();
}

// ---------- Export ----------

// zeilen/titel kommen vom aufrufenden Tab — exportiert wird immer genau das, was dort
// gerade sichtbar ist.
function exportText(zeilen, titel, dateiSlug) {
  if (!zeilen.length) { alert("Keine Meldungen zum Exportieren vorhanden."); return; }
  const fields = [
    { label: "Datum", key: "datum" },
    { label: "Trainer", key: "trainer" },
    { label: "Mannschaft", key: "mannschaft" },
    { label: "Material", key: "material" },
    { label: "Grund", key: "grund" },
    { label: "Dringlichkeit", key: "dringlichkeit" },
    { label: "Status", key: "status" },
    { label: "Kommentar", key: "kommentar" }
  ];
  const rows = zeilen.map((m) => ({
    datum: fmtDate(m.erstelltAm),
    trainer: trainerName(m),
    mannschaft: m.mannschaft || "",
    material: positionenText(m.positionen),
    grund: m.grund || "",
    dringlichkeit: m.dringlichkeit === "dringend" ? "dringend" : "normal",
    status: statusLabel(m.status),
    kommentar: m.adminKommentar || ""
  }));
  const widths = fields.map((f) => Math.max(f.label.length, ...rows.map((r) => String(r[f.key]).length)));
  const line = (cells) => cells.map((c, i) => String(c).padEnd(widths[i])).join("  ");
  const sepLine = widths.map((w) => "-".repeat(w)).join("  ");
  let out = `Materialbedarf — Meldungen (${titel})\n`;
  out += `Erstellt am ${new Date().toLocaleString("de-DE")}\n\n`;
  out += line(fields.map((f) => f.label)) + "\n" + sepLine + "\n";
  out += rows.map((r) => line(fields.map((f) => r[f.key]))).join("\n") + "\n";
  download(`materialbedarf_${dateiSlug}_${localDateIso()}.txt`, "text/plain", "﻿" + out);
}

function exportPdf(zeilen, titel) {
  if (!zeilen.length) { alert("Keine Meldungen zum Exportieren vorhanden."); return; }
  const theadHtml = `<tr><th>Datum</th><th>Trainer</th><th>Mannschaft</th><th>Material</th><th>Grund</th><th>Dringlichkeit</th><th>Status</th><th>Kommentar</th></tr>`;
  const rowsHtml = zeilen.map((m) => `
    <tr>
      <td>${escapeHtml(fmtDate(m.erstelltAm))}</td>
      <td>${escapeHtml(trainerName(m))}</td>
      <td>${escapeHtml(m.mannschaft || "")}</td>
      <td>${escapeHtml(positionenText(m.positionen))}</td>
      <td>${escapeHtml(m.grund || "")}</td>
      <td>${escapeHtml(m.dringlichkeit === "dringend" ? "dringend" : "normal")}</td>
      <td>${escapeHtml(statusLabel(m.status))}</td>
      <td>${escapeHtml(m.adminKommentar || "")}</td>
    </tr>`).join("");
  document.getElementById("print-content").innerHTML = `
    <h1>🛒 Materialbedarf</h1>
    <p class="print-meta">Meldungen (${escapeHtml(titel)}) — erstellt am ${new Date().toLocaleString("de-DE")}</p>
    <table class="print-table">
      <thead>${theadHtml}</thead>
      <tbody>${rowsHtml}</tbody>
    </table>`;
  document.body.classList.add("printing-report");
  const cleanup = () => { document.body.classList.remove("printing-report"); window.removeEventListener("afterprint", cleanup); };
  window.addEventListener("afterprint", cleanup);
  setTimeout(() => window.print(), 150);
}

// ---------- Start ----------

function startApp() {
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "block";
}

function showConnectScreen(errorMsg) {
  document.getElementById("connect-screen").style.display = "block";
  document.getElementById("app-shell").style.display = "none";
  const err = document.getElementById("cloud-error");
  err.style.display = errorMsg ? "block" : "none";
  err.textContent = errorMsg || "";
}

async function init() {
  document.getElementById("version-badge").textContent = "v" + APP_VERSION;
  document.getElementById("version-badge-2").textContent = "v" + APP_VERSION;
  renderChangelog();
  setupTabs();

  addPositionRow();
  document.getElementById("btn-add-position").addEventListener("click", addPositionRow);
  document.getElementById("meldung-positionen-rows").addEventListener("click", (e) => {
    if (!e.target.closest(".btn-remove-position")) return;
    const rows = document.querySelectorAll("#meldung-positionen-rows .position-row");
    if (rows.length <= 1) return;
    e.target.closest(".position-row").remove();
  });
  document.getElementById("btn-submit").addEventListener("click", submitMeldung);
  document.getElementById("meine-meldungen-rows").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-withdraw");
    if (btn) withdrawMeldung(btn.dataset.id);
  });

  document.getElementById("bearbeitet-status-filter").addEventListener("change", (e) => {
    currentBearbeitetFilter = e.target.value;
    renderAdminMeldungen();
  });
  const onMeldungAction = (e) => {
    const row = e.target.closest(".meldung-row");
    if (!row) return;
    const id = row.dataset.id;
    const kommentarInput = row.querySelector(".admin-kommentar-input");
    const kommentar = kommentarInput ? kommentarInput.value.trim() : undefined;
    if (e.target.closest(".btn-annehmen")) entscheideMeldung(id, "angenommen", kommentar);
    else if (e.target.closest(".btn-ablehnen")) entscheideMeldung(id, "abgelehnt", kommentar);
    else if (e.target.closest(".btn-gekauft")) alsGekauftMarkieren(id, kommentar);
    else if (e.target.closest(".btn-delete-meldung")) deleteMeldungAdmin(id);
  };
  document.getElementById("verwaltung-rows").addEventListener("click", onMeldungAction);
  document.getElementById("bearbeitet-rows").addEventListener("click", onMeldungAction);
  document.getElementById("btn-export-text")
    .addEventListener("click", () => exportText(offeneMeldungen(), "Offen", "offen"));
  document.getElementById("btn-export-pdf")
    .addEventListener("click", () => exportPdf(offeneMeldungen(), "Offen"));
  document.getElementById("btn-export-bearbeitet-text")
    .addEventListener("click", () => exportText(bearbeiteteMeldungen(), bearbeitetFilterLabel(), "bearbeitet"));
  document.getElementById("btn-export-bearbeitet-pdf")
    .addEventListener("click", () => exportPdf(bearbeiteteMeldungen(), bearbeitetFilterLabel()));

  if (!getSessionToken()) {
    showConnectScreen();
    return;
  }

  try {
    // Nacheinander statt Promise.all — und das ist hier schneller, nicht
    // langsamer: dav-load liefert das "me" mittlerweile gratis mit (der Worker
    // hat nutzer.json und die Rechte-Datei für diesen Request ohnehin gelesen),
    // der zweite Aufruf kostet also gar keinen Request mehr. Parallel wären es
    // zwei echte Requests mit zwei Session-Prüfungen.
    const data = await gatewayLoad();
    const me = await fetchMe();
    currentUsername = me.username;
    currentIsAdmin = !!me.isAdmin;
    currentCanEdit = !!me.canEdit;
    currentVorname = me.vorname || null;
    currentNachname = me.nachname || null;
    currentMannschaften = Array.isArray(me.mannschaften) ? me.mannschaften : [];
    appData = normalizeAppData(data);
    document.getElementById("nav-verwaltung").style.display = canEdit() ? "" : "none";
    document.getElementById("nav-bearbeitet").style.display = canEdit() ? "" : "none";
    // Nur-Seher: Bedarf melden ist jetzt Bearbeitern vorbehalten (Sehen = absolut nichts
    // editierbar, 2026-07-24 2. Runde) -- Melden-Formular komplett ausblenden. Serverseitig
    // ist der Schreibweg ohnehin gesperrt (materialbedarf in WRITE_REQUIRES_EDIT_PERMISSION).
    const meldenBtn = document.getElementById("btn-submit");
    const meldenCard = meldenBtn ? meldenBtn.closest(".card") : null;
    if (meldenCard) meldenCard.style.display = canEdit() ? "" : "none";
    startApp();
    renderHeaderUser();
    renderMannschaftField();
    renderMeineMeldungen();
    if (canEdit()) {
      renderAdminMeldungen();
    }
  } catch (e) {
    if (e instanceof NotLoggedInError) {
      showConnectScreen();
    } else {
      showConnectScreen("Fehler beim Laden: " + e.message);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => { init(); });
