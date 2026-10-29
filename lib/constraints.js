const TERMS = {
  soft: ["soup", "soft", "stew", "easy", "porridge", "congee", "puree"],
  sodium: ["high sodium", "salty", "cured", "processed"],
  heat: ["spicy", "very hot", "high heat", "chili", "chilli", "pepper"],
  grapefruit: ["grapefruit"],
  potassium: ["high potassium", "potassium-rich"]
};

function textOf(place) {
  return JSON.stringify(place).toLowerCase();
}

export function applyConstraints(places, constraints = []) {
  const requested = constraints.map((value) => String(value).toLowerCase());
  return places.map((place) => {
    const text = textOf(place);
    const excluded = [];
    const passed = [];
    if (requested.some((c) => c.includes("soft") || c.includes("chew"))) {
      const ok = TERMS.soft.some((term) => text.includes(term));
      (ok ? passed : excluded).push("soft texture / easy-to-chew");
    }
    if (requested.some((c) => c.includes("sodium"))) {
      const ok = !TERMS.sodium.some((term) => text.includes(term));
      (ok ? passed : excluded).push("low-sodium");
    }
    if (requested.some((c) => c.includes("heat") || c.includes("spicy"))) {
      const ok = !TERMS.heat.some((term) => text.includes(term));
      (ok ? passed : excluded).push("low-heat delivery");
    }
    if (requested.some((c) => c.includes("grapefruit"))) {
      const ok = !TERMS.grapefruit.some((term) => text.includes(term));
      (ok ? passed : excluded).push("avoid grapefruit");
    }
    if (requested.some((c) => c.includes("potassium"))) {
      const ok = !TERMS.potassium.some((term) => text.includes(term));
      (ok ? passed : excluded).push("limit high-potassium");
    }
    return { place, passed, excluded, eligible: excluded.length === 0 };
  });
}
