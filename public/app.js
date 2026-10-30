import { safeWebLink, phoneLink, questionFor } from './place-details.js';
const state = { resolved: [], input: null };
const API_PREFIX = "/api";
const $ = (selector) => document.querySelector(selector);
const results = $("#results");
const status = $("#status");

function showStatus(message) { status.textContent = message; status.classList.remove("hidden"); }
function hideStatus() { status.classList.add("hidden"); }
async function api(path, payload) {
  const response = await fetch(`${API_PREFIX}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json(); if (!response.ok) throw new Error("We couldn’t complete your search. Please try again."); return data;
}
function cards(places) {
  const list = (items, label) => items.map(item => `<li><strong>${label}</strong> ${escapeHtml(item)}</li>`).join('');
  $("#cards").innerHTML = places.length ? places.map((place, i) => {
    const checks = place.checks || { passed: [], unknown: [], failed: [] };
    const evidence = (place.evidence || []).map(chip => `<span class="chip">${escapeHtml(chip.label)}</span>`).join('');
    const address = place.properties?.address;
    const menu = safeWebLink(place.properties?.menu_url);
    const website = safeWebLink(place.properties?.website);
    const phone = phoneLink(place.properties?.phone);
    const links = [menu && `<a href="${escapeHtml(menu)}" target="_blank" rel="noopener noreferrer">View menu ↗</a>`, website && `<a href="${escapeHtml(website)}" target="_blank" rel="noopener noreferrer">Restaurant website ↗</a>`, phone && `<a href="${escapeHtml(phone)}">Call ${escapeHtml(place.properties.phone)}</a>`].filter(Boolean).join('');
    const questions = [...new Set([...checks.unknown, ...checks.failed])];
    return `<article class="place-card"><span class="place-index">${place.needsCheck ? 'Needs your check' : 'Details available'}</span><h3>${escapeHtml(place.name || 'Unnamed place')}</h3>${address ? `<p class="place-meta">${escapeHtml(address)}</p>` : ''}<p class="place-meta">Why this fits</p><div class="chips">${evidence || 'Taste match only — no detailed reason returned.'}</div><ul class="needs-list">${list(checks.passed, 'Supported:')}${list(checks.unknown, 'Unknown — confirm on the menu:')}${list(checks.failed, 'Does not match:')}</ul>${questions.length ? `<p class="check-heading">What to ask</p><ul class="needs-list">${questions.map(need => `<li>${escapeHtml(questionFor(need))}</li>`).join('')}</ul>` : ''}<div class="contact-links">${links || '<span>Menu and contact details aren’t available here. Please look them up before deciding.</span>'}</div><p class="place-meta">Please check the menu and contact the restaurant about any needs you cannot confirm.</p><div class="place-actions"><button type="button" data-action="confirm">I checked the menu — this is fine</button><button type="button" data-action="skip">Skip</button></div><p class="choice-status" aria-live="polite"></p></article>`;
  }).join('') : `<div class="notice">We couldn’t find places for this search. Try another location or favorites.</div>`;
}
$("#cards").addEventListener('click', event => {
  const action = event.target.closest('[data-action]');
  if (!action) return;
  const card = action.closest('.place-card');
  if (action.dataset.action === 'skip') { card.remove(); if (!$('#cards').children.length) $('#cards').innerHTML = '<div class="notice">You skipped these places. Try another search when you’re ready.</div>'; }
  else { card.querySelector('.choice-status').textContent = 'You marked this place as checked.'; action.disabled = true; }
});
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[char])); }
async function recommendFromResolved() {
  const entityIds = state.resolved.map((item) => item.choices[0]?.entity_id || item.choices[0]?.id).filter(Boolean);
  if (entityIds.length !== state.resolved.length) return;
  showStatus("Checking places against your needs…");
  const recommendation = await api("/recommend", { ...state.input, entityIds, take: Number($("#count").value) });
  results.classList.remove("hidden"); $("#ambiguity").classList.add("hidden"); cards(recommendation.places);
  $(".comparison").classList.remove("hidden");
  $("#qloo-summary").textContent = recommendation.places.length === 0 ? "No places were found for this search." : recommendation.needsCheck ? "These places match the person's tastes. Check each need before choosing." : "Please confirm the details directly with the restaurant.";
  results.scrollIntoView({ behavior: "smooth" });
  showStatus("Preparing a comparison…");
  try { const comparison = await api("/compare", state.input); $("#llm-summary").textContent = comparison.pureLlmPlan?.plan || "A general suggestion is unavailable right now."; }
  catch { $("#llm-summary").textContent = "A general suggestion is unavailable right now."; }
  hideStatus();
}
$("#finder").addEventListener("submit", async (event) => {
  event.preventDefault(); hideStatus(); results.classList.add("hidden"); $(".comparison").classList.add("hidden"); showStatus("Looking for your favorites…");
  const favorites = $("#favorites").value.split("\n").map((value) => value.trim()).filter(Boolean);
  const constraints = [...document.querySelectorAll(".check input:checked")].map((input) => input.value);
  if (favorites.length < 3 || favorites.length > 5) { showStatus("Add between 3 and 5 favorites."); return; }
  if (new Set(favorites.map(value => value.toLowerCase())).size !== favorites.length) { showStatus("Please enter different favorites."); return; }
  if (constraints.length < 2 || constraints.length > 3) { showStatus("Choose 2 or 3 practical needs."); return; }
  state.input = { favorites, location: $("#location").value.trim(), constraints, medicationNotes: $("#medication-notes").value.trim() };
  try {
    const resolved = await api("/resolve", { favorites }); state.resolved = resolved.resolved;
    const missing = state.resolved.filter((item) => item.choices.length === 0);
    if (missing.length) { showStatus(`No match found for ${missing.map(item => item.query).join(", ")}. Try another name.`); return; }
    const ambiguous = state.resolved.filter((item) => item.choices.length !== 1);
    if (ambiguous.length) { results.classList.remove("hidden"); $("#ambiguity").classList.remove("hidden"); $("#ambiguity").innerHTML = `<strong>Choose the right match.</strong><p>Choose the match you mean before we look for places.</p>${ambiguous.map((item) => `<div class="choice-row"><span>${escapeHtml(item.query)}</span><select data-query="${escapeHtml(item.query)}"><option value="">Choose a match…</option>${item.choices.slice(0, 8).map((choice, index) => `<option value="${index}">${escapeHtml([choice.name || "Unnamed result", choice.properties?.address, (choice.type || choice.types?.[0] || "").split(":").pop().replaceAll("_", " ")].filter(Boolean).join(" — "))}</option>`).join("")}</select></div>`).join("")}<button id="confirm-choices" class="choice-button" disabled>Continue with these choices ↗</button>`; $("#cards").innerHTML = ""; $("#ambiguity").querySelectorAll("select").forEach((select) => select.addEventListener("change", () => { $("#confirm-choices").disabled = [...$("#ambiguity").querySelectorAll("select")].some((field) => !field.value); })); $("#confirm-choices").addEventListener("click", async () => { for (const field of $("#ambiguity").querySelectorAll("select")) { const item = state.resolved.find((entry) => entry.query === field.dataset.query); item.choices = [item.choices[Number(field.value)]]; } try { await recommendFromResolved(); } catch (error) { showStatus(error.message); } }); hideStatus(); results.scrollIntoView({ behavior: "smooth" }); return; }
    await recommendFromResolved();
  } catch (error) { showStatus(error.message); }
});
$("#new-search").addEventListener("click", () => { results.classList.add("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); });
