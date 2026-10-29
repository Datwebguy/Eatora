const themeRoot = document.documentElement;
const savedTheme = localStorage.getItem("eatora-theme");
if (savedTheme) themeRoot.dataset.theme = savedTheme;
document.querySelector("#theme")?.addEventListener("click", () => {
  const next = themeRoot.dataset.theme === "dark" ? "light" : "dark";
  themeRoot.dataset.theme = next;
  localStorage.setItem("eatora-theme", next);
});
