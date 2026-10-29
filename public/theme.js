const themeRoot = document.documentElement;
const savedTheme = localStorage.getItem("eatora-theme-v2");
if (savedTheme) themeRoot.dataset.theme = savedTheme;
document.querySelector("#theme")?.addEventListener("click", () => {
  const next = themeRoot.dataset.theme === "dark" ? "light" : "dark";
  themeRoot.dataset.theme = next;
  localStorage.setItem("eatora-theme-v2", next);
});
