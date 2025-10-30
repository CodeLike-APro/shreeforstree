// src/store/useStore.js
import { create } from "zustand";

export const useStore = create((set, get) => ({
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  filterProducts: (products, debug = false) => {
    const query = get().searchQuery.trim().toLowerCase();
    if (!query) return products;

    // 1) normalize helper: lowercase, remove punctuation, collapse spaces
    const normalizeText = (s = "") =>
      String(s)
        .toLowerCase()
        .replace(/[\u2018\u2019\u201C\u201D]/g, "'") // smart quotes -> simple
        .replace(/[^a-z0-9\s]/g, " ") // remove non-alphanumeric -> spaces
        .replace(/\s+/g, " ")
        .trim();

    // 2) stronger singularization (simple rules)
    const singularize = (word = "") => {
      if (!word) return word;
      const rules = [
        [/ies$/, "y"], // ivories → ivory
        [/ves$/, "f"], // knives → knif
        [/men$/, "man"], // women → woman
        [/children$/, "child"],
        [/oes$/, "o"],
        [/sses$/, "ss"],
        [/xes$/, "x"],
        [/ches$/, "ch"],
        [/shes$/, "sh"],
        [/s$/, ""], // dresses → dress
      ];
      for (const [regex, replace] of rules) {
        if (regex.test(word)) return word.replace(regex, replace);
      }
      return word;
    };

    // 3) tokens normalized + singularized + unique
    const rawTokens = normalizeText(query).split(/\s+/).filter(Boolean);
    const tokens = Array.from(
      new Set(
        rawTokens.flatMap((t) => [
          t,
          singularize(t),
          t.replace(/[^a-z0-9]/g, ""),
        ])
      )
    ).filter(Boolean);

    if (debug) console.log("search tokens:", tokens);

    // 4) prepare product searchable text in same normalized form
    const productFieldsNormalized = (p) => {
      const textFields = [
        p.title,
        p.description,
        p.color,
        ...(p.tags || []),
        ...(p.keywords || []),
        p.category || "",
      ]
        .filter(Boolean)
        .map((f) => normalizeText(String(f)));

      // Combine all into a single searchable string
      return textFields.join(" ");
    };

    // 5) helper to check token presence (whole-word exact or substring)
    const tokenMatchesField = (token, field) => {
      if (!field) return false;
      // exact word match first (word boundaries)
      const wordRegex = new RegExp(
        `\\b${token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "i"
      );
      if (wordRegex.test(field)) return true;
      // fallback: substring
      return field.includes(token);
    };

    // 6) scoring: count how many unique tokens match this product
    // 6) scoring: count how many unique tokens match this product
    const scored = products.map((p) => {
      const searchable = productFieldsNormalized(p);
      const matchedTokens = new Set();

      tokens.forEach((token) => {
        // match singular + plural variations
        if (searchable.includes(token)) matchedTokens.add(token);
      });

      return {
        p,
        score: matchedTokens.size,
        matchedTokens: Array.from(matchedTokens),
      };
    });

    if (debug) {
      console.log(
        "scored:",
        scored.map((s) => ({
          id: s.p.id,
          score: s.score,
          matched: s.matchedTokens,
        }))
      );
    }

    // ✅ NEW LOGIC — OR-based flexible match
    const matched = scored
      .filter((s) => s.score > 0) // any token matches
      .sort((a, b) => b.score - a.score) // more matched words first
      .map((s) => s.p);

    // ✅ Fallback: if nothing matched, return all products
    return matched.length > 0 ? matched : products;
  },
}));
