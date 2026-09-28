// Applies the saved theme before first paint (no flash). A file, not inline, so the
// Content-Security-Policy can forbid inline scripts entirely.
(() => {
  let t = "system";
  try {
    t = localStorage.getItem("theme") ?? "system";
  } catch {}
  const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
})();
