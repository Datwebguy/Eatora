const root = document.documentElement;
const storedTheme = localStorage.getItem("eatora-theme");
if (storedTheme) root.dataset.theme = storedTheme;
document.querySelector("#theme")?.addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  localStorage.setItem("eatora-theme", theme);
});
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.18 });
document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
