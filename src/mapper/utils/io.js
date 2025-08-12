export const uid = () => Math.random().toString(36).slice(2, 9);
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export async function importJSON(file) {
  if (!file) return null;
  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    return obj && typeof obj === "object" ? obj : null;
  } catch (e) {
    console.warn("Import failed:", e);
    alert("Import failed: JSON is invalid.");
    return null;
  }
}

export function exportJSON(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "operational-approach.json";
  a.click();
  URL.revokeObjectURL(a.href);
}
