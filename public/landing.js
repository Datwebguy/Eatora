const root = document.documentElement;
const storedTheme = localStorage.getItem("eatora-theme-v2");
if (storedTheme) root.dataset.theme = storedTheme;
document.querySelector("#theme")?.addEventListener("click", () => {
  const theme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = theme;
  localStorage.setItem("eatora-theme-v2", theme);
});
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("is-visible")), { threshold: 0.18 });
document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
const menu = document.querySelector("#menu");
const mobileMenu = document.querySelector("#mobile-menu");
menu?.addEventListener("click", () => {
  const open = mobileMenu.hidden;
  mobileMenu.hidden = !open;
  mobileMenu.classList.toggle("open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  mobileMenu.hidden = true;
  mobileMenu.classList.remove("open");
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open menu");
}));
