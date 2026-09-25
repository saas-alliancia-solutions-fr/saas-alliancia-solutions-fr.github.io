(() => {
  const GOOGLE_ADS_ID = "AW-18420987244";
  const GOOGLE_ADS_CONTACT_LABEL = "RNryCKLO2YQdEOzq589E";
  const CONSENT_STORAGE_KEY = "saas_google_ads_consent";
  const isPrivateSurface = document.body.matches(".portal-page, .auth-page");

  if (!isPrivateSurface) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  const storedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  window.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  window.gtag("js", new Date());
  window.gtag("config", GOOGLE_ADS_ID);

  if (storedConsent === "granted") {
    window.gtag("consent", "update", {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
  }

  const googleTag = document.createElement("script");
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
  document.head.append(googleTag);

  const sendContactConversion = () => {
    if (!document.querySelector('[data-conversion-page="lead"]')) return;
    const conversionKey = "saas_google_ads_contact_conversion";
    if (window.sessionStorage.getItem(conversionKey)) return;
    window.gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_CONTACT_LABEL}`,
    });
    window.sessionStorage.setItem(conversionKey, "sent");
  };

  if (!document.querySelector('[data-conversion-page="lead"]')) {
    window.sessionStorage.removeItem("saas_google_ads_contact_conversion");
  }

  if (storedConsent) {
    sendContactConversion();
  } else {
    const consentBanner = document.createElement("section");
    consentBanner.className = "consent-banner";
    consentBanner.setAttribute("aria-label", "Choix de confidentialité");
    consentBanner.innerHTML = `
      <div>
        <strong>Mesure d’audience et publicité</strong>
        <p>Avec votre accord, Google Ads nous aide à mesurer les demandes reçues et l’efficacité de nos annonces. Vous pouvez refuser sans limiter l’accès au site. <a href="/confidentialite.html">En savoir plus</a>.</p>
      </div>
      <div class="consent-actions">
        <button type="button" class="button button-secondary" data-consent="denied">Refuser</button>
        <button type="button" class="button" data-consent="granted">Accepter</button>
      </div>`;
    document.body.append(consentBanner);

    consentBanner.addEventListener("click", (event) => {
      const consentButton = event.target.closest("[data-consent]");
      if (!consentButton) return;
      const consent = consentButton.dataset.consent;
      window.localStorage.setItem(CONSENT_STORAGE_KEY, consent);
      if (consent === "granted") {
        window.gtag("consent", "update", {
          ad_storage: "granted",
          analytics_storage: "granted",
          ad_user_data: "granted",
          ad_personalization: "granted",
        });
      }
      sendContactConversion();
      consentBanner.remove();
    });
  }
  }

  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, { once: true });
  }

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
