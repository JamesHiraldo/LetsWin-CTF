(function(root) {
  "use strict";
  const modes = ["individual", "team"], statuses = ["New", "Working", "Blocked", "Solved"];
  const blank = mode => ({version: 1, mode, active: null, challenges: [], favorites: [], recipes: []});
  const str = (v, max = 100000) => typeof v === "string" ? v.slice(0, max) : "";
  function validate(value, mode) {
    if (!modes.includes(mode) || !value || value.version !== 1 || value.mode !== mode || !Array.isArray(value.challenges)) throw new Error("This is not a workspace backup for the selected game mode.");
    if (value.challenges.length > 100) throw new Error("A workspace supports up to 100 challenges.");
    const data = blank(mode), ids = new Set();
    data.challenges = value.challenges.map(c => {
      if (!c || !c.id || ids.has(c.id)) throw new Error("Invalid or duplicate challenge ID.");
      const id = str(c.id, 100); if (ids.has(id)) throw new Error("Duplicate challenge ID."); ids.add(id);
      return {id, title: str(c.title, 200), category: str(c.category, 40), status: statuses.includes(c.status) ? c.status : "New", description: str(c.description), notes: str(c.notes), flag: str(c.flag, 2000), updated: str(c.updated, 40), files: (Array.isArray(c.files) ? c.files : []).slice(0, 100).map(f => ({name: str(f.name, 300), size: Number.isSafeInteger(f.size) && f.size >= 0 ? f.size : 0, type: str(f.type, 100)})), results: (Array.isArray(c.results) ? c.results : []).slice(0, 50).map(r => ({tool: str(r.tool, 100), text: str(r.text), time: str(r.time, 40)}))};
    });
    data.active = ids.has(value.active) ? value.active : null;
    data.favorites = [...new Set((Array.isArray(value.favorites) ? value.favorites : []).filter(x => typeof x === "string" && /^https?:\/\//.test(x)))].slice(0, 200);
    data.recipes = (Array.isArray(value.recipes) ? value.recipes : []).slice(0, 50).map(r => ({name: str(r.name, 100), steps: (Array.isArray(r.steps) ? r.steps : []).slice(0, 12).map(s => ({format: str(s.format, 20), direction: s.direction === "encode" ? "encode" : "decode"}))}));
    return data;
  }
  function createStore(storage) {
    let mode = null, data = null, warning = "";
    const key = m => `letswin.workspace.v1.${m}`;
    return {
      open(next) {
        if (!modes.includes(next)) throw new Error("Choose a game mode first.");
        mode = next; warning = ""; data = blank(mode);
        try { if(!storage){warning="Browser storage is unavailable. Export a JSON backup before closing this tab.";return data;} const raw = storage.getItem(key(mode)); if (raw) data = validate(JSON.parse(raw), mode); }
        catch { warning = "Saved data could not be loaded. Export this session before closing; the original saved data has not been overwritten."; }
        return data;
      },
      close() { mode = null; data = null; warning = ""; },
      get data() { if (!data) throw new Error("Choose a game mode first."); return data; },
      get warning() { return warning; },
      save() {
        if (!data) throw new Error("Choose a game mode first.");
        try { if (!storage) throw new Error(); storage.setItem(key(mode), JSON.stringify(validate(data, mode))); warning = ""; return true; }
        catch { warning = "Browser storage is unavailable or full. Your work remains in this tab. Export a JSON backup before closing."; return false; }
      },
      import(text) { if (text.length > 6000000) throw new Error("Backup exceeds 6 MB."); data = validate(JSON.parse(text), mode); this.save(); return data; },
      export() { return JSON.stringify(validate(data, mode), null, 2); },
      active() { return this.data.challenges.find(c => c.id === this.data.active); },
      add() {
        if (this.data.challenges.length >= 100) throw new Error("Maximum 100 challenges. Export and remove older challenges first.");
        const c = {id: root.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, title: "Untitled challenge", category: "forensics", status: "New", description: "", notes: "", flag: "", files: [], results: [], updated: new Date().toISOString()};
        this.data.challenges.push(c); this.data.active = c.id; this.save(); return c;
      },
      result(tool, text) {
        const c = this.active(); if (!c) throw new Error("Create or select a challenge in Saved challenges first.");
        if (c.results.length >= 50) throw new Error("This challenge has 50 saved results. Remove an older result first.");
        c.results.push({tool: str(tool, 100), text: str(text), time: new Date().toISOString()}); c.updated = new Date().toISOString(); this.save();
      }
    };
  }
  const api = {createStore, validate, statuses}; root.CTFWorkspace = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
