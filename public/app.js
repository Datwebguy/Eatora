const state = { sessionId: localStorage.getItem("eatora-session") || "", resolved: [], input: null };
const API_PREFIX = "/api";
const $ = (selector) => document.querySelector(selector);
const results = $("#results");
const status = $("#status");

function showStatus(message) { status.textContent = message; status.classList.remove("hidden"); }
function hideStatus() { status.classList.add("hidden"); }
function remember(response) { const id = response.headers.get("x-session-id"); if (id) { state.sessionId = id; localStorage.setItem("eatora-session", id); } }
async function api(path, payload) {
  const response = await fetch(`${API_PREFIX}${path}`, { method: "POST", headers: { "content-type": "application/json", ...(state.sessionId ? { "x-session-id": state.sessionId } : {}) }, body: JSON.stringify(payload) });
  remember(response); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Something went wrong"); return data;
}
function cards(places) { $("#cards").innerHTML = places.length ? places.map((place, i) => `<article class="place-card"><span class="place-index">0${i + 1}</span><h3>${escapeHtml(place.name || "Unnamed place")}</h3><p class="place-meta">Verified place from this session</p><div class="chips">${(place.evidence || []).map((chip) => `<span class="chip">${escapeHtml(typeof chip === "object" ? chip.label : chip)}</span>`).join("")}</div></article>`).join("") : `<div class="notice">Qloo did not return places that met every selected constraint. There are no substitute recommendations.</div>`; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char])); }
async function recommendFromResolved() {
  const entityIds = state.resolved.map((item) => item.choices[0]?.entity_id || item.choices[0]?.id).filter(Boolean);
  if (entityIds.length !== state.resolved.length) return;
  showStatus("Applying practical filters to real places…");
  const recommendation = await api("/recommend", { ...state.input, entityIds, take: Number($("#count").value) });
  results.classList.remove("hidden"); $("#ambiguity").classList.add("hidden"); cards(recommendation.places); $("#qloo-summary").textContent = recommendation.places.length ? `${recommendation.places.length} place${recommendation.places.length === 1 ? "" : "s"} survived the selected constraints. Every card above is sourced from the Qloo response.` : "No verified places survived the selected constraints."; $("#call-log").textContent = JSON.stringify(recommendation.calls || [], null, 2); results.scrollIntoView({ behavior: "smooth" });
  showStatus("Building the comparison view…"); const comparison = await api("/compare", state.input); $("#llm-summary").textContent = comparison.pureLlmPlan?.plan || "The LLM comparison is not configured on this server yet."; hideStatus();
}
$("#finder").addEventListener("submit", async (event) => {
  event.preventDefault(); hideStatus(); showStatus("Resolving their taste signals…");
  const favorites = $("#favorites").value.split("\n").map((value) => value.trim()).filter(Boolean);
  const constraints = [...document.querySelectorAll(".check input:checked")].map((input) => input.value);
  if (favorites.length < 3 || favorites.length > 5) { showStatus("Add between 3 and 5 favorites."); return; }
  if (constraints.length < 2 || constraints.length > 3) { showStatus("Choose 2 or 3 practical needs."); return; }
  state.input = { favorites, location: $("#location").value.trim(), constraints };
  try {
    const resolved = await api("/resolve", { favorites }); state.resolved = resolved.resolved;
    const ambiguous = state.resolved.filter((item) => item.choices.length !== 1);
    if (ambiguous.length) { results.classList.remove("hidden"); $("#ambiguity").classList.remove("hidden"); $("#ambiguity").innerHTML = `<strong>Choose a clearer signal.</strong><p>Qloo found more than one match for the item below. Pick the one you mean before we search for places.</p>${ambiguous.map((item) => `<div class="choice-row"><span>${escapeHtml(item.query)}</span><select data-query="${escapeHtml(item.query)}"><option value="">Choose a match…</option>${item.choices.slice(0, 8).map((choice, index) => `<option value="${index}">${escapeHtml(choice.name || choice.entity_id || choice.id || "Unnamed result")}</option>`).join("")}</select></div>`).join("")}<button id="confirm-choices" class="choice-button" disabled>Continue with these choices ↗</button>`; cards([]); $("#ambiguity").querySelectorAll("select").forEach((select) => select.addEventListener("change", () => { $("#confirm-choices").disabled = [...$("#ambiguity").querySelectorAll("select")].some((field) => !field.value); })); $("#confirm-choices").addEventListener("click", async () => { for (const field of $("#ambiguity").querySelectorAll("select")) { const item = state.resolved.find((entry) => entry.query === field.dataset.query); item.choices = [item.choices[Number(field.value)]]; } try { await recommendFromResolved(); } catch (error) { showStatus(error.message); } }); hideStatus(); results.scrollIntoView({ behavior: "smooth" }); return; }
    await recommendFromResolved();
  } catch (error) { showStatus(error.message); }
});
$("#new-search").addEventListener("click", () => { results.classList.add("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); });
