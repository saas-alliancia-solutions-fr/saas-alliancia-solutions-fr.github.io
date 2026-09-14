(() => {
  const main = document.querySelector("main");
  const button = document.createElement("button");
  let ticking = false;

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const currentPath = window.location.pathname.replace(/\/index\.html$/, "/");
  document.querySelectorAll("a[href]").forEach((link) => {
    const url = new URL(link.href, window.location.href);
    const linkPath = url.pathname.replace(/\/index\.html$/, "/");
    if (url.origin === window.location.origin && !url.hash && linkPath === currentPath) {
      link.setAttribute("aria-current", "page");
    }
  });

  const header = document.querySelector("[data-header]");
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Revenir en haut de la page");
  button.setAttribute("aria-hidden", "true");
  button.tabIndex = -1;
  button.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 14 6-6 6 6"/></svg>';
  document.body.append(button);

  const update = () => {
    const threshold = Math.min(700, Math.max(420, window.innerHeight * 0.7));
    const visible = window.scrollY > threshold && document.documentElement.scrollHeight > window.innerHeight * 1.35;
    button.classList.toggle("is-visible", visible);
    button.setAttribute("aria-hidden", String(!visible));
    button.tabIndex = visible ? 0 : -1;
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  button.addEventListener("click", () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    window.setTimeout(() => {
      if (main) {
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
      update();
    }, reducedMotion ? 0 : 500);
  });

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  update();
})();
