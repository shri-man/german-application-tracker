// /src/navigation.js
import { el } from "./dom.js";

export function navigateToTab(tabName) {
  if (window.location.hash !== `#${tabName}`) window.location.hash = tabName;
  el.navLinks.forEach((link) =>
    link.classList.toggle("nav-active", link.dataset.tab === tabName)
  );
  el.tabContents.forEach((content) =>
    content.classList.toggle("active", content.id === tabName)
  );
}

export function handleInitialTab() {
  const tabName = window.location.hash.substring(1) || "home";
  navigateToTab(tabName);
}

export function initNav() {
  window.addEventListener("scroll", () => {
    el.mainHeader.classList.toggle("scrolled", window.scrollY > 10);
  });

  el.navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateToTab(e.target.dataset.tab);
    });
  });

  handleInitialTab();
}
