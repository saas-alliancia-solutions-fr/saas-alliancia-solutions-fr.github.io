(() => {
  const config = window.SAAS_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey) : null;
  const isLocalDemo = location.hostname === "127.0.0.1" && new URLSearchParams(location.search).get("demo") === "1";
  const authLinkType = new URLSearchParams(location.hash.slice(1)).get("type");
  const needsPasswordSetup = ["invite", "recovery"].includes(authLinkType) || new URLSearchParams(location.search).get("reset") === "1";

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));
  const formatDate = (value, withTime = false) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("fr-FR", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
  };
  const formatBytes = (value) => {
    const bytes = Number(value || 0);
    if (!bytes) return "0 Go";
    const units = ["o", "Ko", "Mo", "Go", "To"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(bytes / (1024 ** index))} ${units[index]}`;
  };
  const relativeBackup = (value) => {
    if (!value) return "Non renseignée";
    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (minutes < 1440) return `Il y a ${Math.round(minutes / 60)} h`;
    return formatDate(value, true);
  };

  const loginForm = document.querySelector("[data-login-form]");
  if (loginForm) {
    const setupNotice = document.querySelector("[data-auth-setup]");
    const submit = loginForm.querySelector("[type='submit']");
    const feedback = document.querySelector("[data-auth-feedback]");
    const resetForm = document.querySelector("[data-reset-form]");
    const resetFeedback = document.querySelector("[data-reset-feedback]");
    const updatePasswordForm = document.querySelector("[data-update-password-form]");
    const updatePasswordFeedback = document.querySelector("[data-update-password-feedback]");

    const showPasswordSetup = () => {
      loginForm.hidden = true;
      resetForm.hidden = true;
      updatePasswordForm.hidden = false;
      updatePasswordForm.elements.password.focus();
    };

    if (!configured) {
      setupNotice.hidden = false;
      submit.disabled = true;
    } else {
      client.auth.getSession().then(({ data }) => {
        if (data.session && needsPasswordSetup) showPasswordSetup();
        else if (data.session) location.replace("/portail.html");
      });
      client.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && needsPasswordSetup)) showPasswordSetup();
      });
    }

    document.querySelector("[data-password-toggle]")?.addEventListener("click", (event) => {
      const input = loginForm.elements.password;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      event.currentTarget.textContent = show ? "Masquer" : "Afficher";
      event.currentTarget.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
    });
    document.querySelector("[data-forgot-password]")?.addEventListener("click", () => {
      loginForm.hidden = true;
      resetForm.hidden = false;
      resetForm.elements.email.value = loginForm.elements.email.value;
      resetForm.elements.email.focus();
    });
    document.querySelector("[data-back-login]")?.addEventListener("click", () => {
      resetForm.hidden = true;
      loginForm.hidden = false;
      loginForm.elements.email.focus();
    });
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client) return;
      submit.disabled = true;
      feedback.classList.remove("success");
      feedback.textContent = "Vérification de vos accès…";
      const { error } = await client.auth.signInWithPassword({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value
      });
      if (error) {
        feedback.textContent = "Adresse e-mail ou mot de passe incorrect.";
        submit.disabled = false;
        return;
      }
      feedback.classList.add("success");
      feedback.textContent = "Connexion réussie. Ouverture de votre espace…";
      location.replace("/portail.html");
    });
    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!client) return;
      const resetSubmit = resetForm.querySelector("[type='submit']");
      resetSubmit.disabled = true;
      const { error } = await client.auth.resetPasswordForEmail(resetForm.elements.email.value.trim(), {
        redirectTo: `${location.origin}/connexion.html?reset=1`
      });
      resetFeedback.textContent = error ? "Le lien n’a pas pu être envoyé. Réessayez dans quelques instants." : "Si cette adresse correspond à un compte, un lien sécurisé vient d’être envoyé.";
      resetFeedback.classList.toggle("success", !error);
      resetSubmit.disabled = false;
    });
    updatePasswordForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = updatePasswordForm.elements.password.value;
      const confirmation = updatePasswordForm.elements.confirmation.value;
      if (password !== confirmation) {
        updatePasswordFeedback.textContent = "Les deux mots de passe ne correspondent pas.";
        return;
      }
      const updateSubmit = updatePasswordForm.querySelector("[type='submit']");
      updateSubmit.disabled = true;
      updatePasswordFeedback.textContent = "Sécurisation de votre accès…";
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        updatePasswordFeedback.textContent = "Le mot de passe n’a pas pu être enregistré. Demandez un nouveau lien.";
        updateSubmit.disabled = false;
        return;
      }
      updatePasswordFeedback.classList.add("success");
      updatePasswordFeedback.textContent = "Mot de passe enregistré. Ouverture de votre espace…";
      location.replace("/portail.html");
    });
  }

  const portalPage = document.querySelector("[data-portal-page]");
  if (!portalPage) return;

  const demoData = {
    user: { id: "demo", email: "client@entreprise.fr", user_metadata: { full_name: "Claire Martin" } },
    organization: { id: 1, name: "Entreprise Démo" },
    subscription: { plan_name: "500 Go", storage_limit_bytes: 500 * 1024 ** 3, storage_used_bytes: 248 * 1024 ** 3, retention_days: 365, status: "active", last_backup_at: new Date(Date.now() - 18 * 60000).toISOString() },
    usage: Array.from({ length: 30 }, (_, index) => ({ measured_on: new Date(Date.now() - (29 - index) * 86400000).toISOString(), storage_bytes: (208 + index * 1.35 + Math.sin(index / 3) * 5) * 1024 ** 3, protected_devices: 12 })),
    alerts: [
      { severity: "info", title: "Sauvegarde effectuée avec succès", occurred_at: new Date(Date.now() - 18 * 60000).toISOString(), status: "open" },
      { severity: "warning", title: "Espace de stockage utilisé à 80 %", occurred_at: new Date(Date.now() - 86400000).toISOString(), status: "open" },
      { severity: "critical", title: "Échec de sauvegarde sur Serveur-01", occurred_at: new Date(Date.now() - 2 * 86400000).toISOString(), status: "open" }
    ],
    invoices: [
      { invoice_number: "F-2026-0045", issued_at: "2026-08-15", amount_cents: 66000, status: "paid", file_path: null },
      { invoice_number: "F-2026-0032", issued_at: "2026-07-15", amount_cents: 66000, status: "paid", file_path: null }
    ],
    requests: [
      { id: 56, subject: "Accès à une sauvegarde", category: "Restauration", status: "in_progress", priority: "normal", updated_at: new Date().toISOString() },
      { id: 51, subject: "Ajout d’un utilisateur", category: "Contrat", status: "in_progress", priority: "normal", updated_at: new Date(Date.now() - 86400000).toISOString() }
    ]
  };

  let portalState = null;
  const loading = document.querySelector("[data-portal-loading]");
  const shell = document.querySelector("[data-portal-shell]");
  const setText = (selector, value) => { const node = document.querySelector(selector); if (node) node.textContent = value; };
  const statusLabel = { open: "Ouverte", acknowledged: "Prise en compte", resolved: "Résolue", draft: "Brouillon", sent: "Envoyée", paid: "Payée", overdue: "En retard", in_progress: "En cours", closed: "Clôturée" };

  const renderTable = (type, rows, limit) => {
    const items = limit ? rows.slice(0, limit) : rows;
    if (!items.length) return '<div class="portal-empty">Aucune donnée disponible pour le moment.</div>';
    if (type === "alerts") return `<table class="portal-table"><thead><tr><th>Niveau</th><th>Message</th><th>Date</th></tr></thead><tbody>${items.map((item) => `<tr><td><span class="portal-severity ${escapeHtml(item.severity)}"></span>${item.severity === "critical" ? "Critique" : item.severity === "warning" ? "Attention" : "Information"}</td><td>${escapeHtml(item.title)}</td><td>${formatDate(item.occurred_at, true)}</td></tr>`).join("")}</tbody></table>`;
    if (type === "invoices") return `<table class="portal-table"><thead><tr><th>N° de facture</th><th>Date</th><th>Montant</th><th>Statut</th><th></th></tr></thead><tbody>${items.map((item) => `<tr><td>${escapeHtml(item.invoice_number)}</td><td>${formatDate(item.issued_at)}</td><td>${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format((item.amount_cents || 0) / 100)} HT</td><td><span class="portal-status ${escapeHtml(item.status)}">${statusLabel[item.status] || escapeHtml(item.status)}</span></td><td>${item.file_path ? `<button class="portal-download" type="button" data-invoice-path="${escapeHtml(item.file_path)}">Télécharger</button>` : "—"}</td></tr>`).join("")}</tbody></table>`;
    return `<table class="portal-table"><thead><tr><th>Référence</th><th>Objet</th><th>Statut</th><th>Mise à jour</th></tr></thead><tbody>${items.map((item) => `<tr><td>#D-${String(item.id).padStart(5, "0")}</td><td>${escapeHtml(item.subject)}</td><td><span class="portal-status ${escapeHtml(item.status)}">${statusLabel[item.status] || escapeHtml(item.status)}</span></td><td>${formatDate(item.updated_at, true)}</td></tr>`).join("")}</tbody></table>`;
  };

  const renderChart = (selector, usage) => {
    const host = document.querySelector(selector);
    if (!host || !usage.length) return;
    const width = 900, height = 230, pad = 28;
    const values = usage.map((item) => Number(item.storage_bytes || 0));
    const max = Math.max(...values, 1) * 1.12;
    const points = values.map((value, index) => `${pad + index * ((width - pad * 2) / Math.max(values.length - 1, 1))},${height - pad - (value / max) * (height - pad * 2)}`).join(" ");
    const area = `${pad},${height - pad} ${points} ${width - pad},${height - pad}`;
    host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Évolution du volume sauvegardé"><defs><linearGradient id="usage-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#356bff" stop-opacity=".2"/><stop offset="1" stop-color="#356bff" stop-opacity=".02"/></linearGradient></defs><line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#dbe3ef"/><line x1="${pad}" y1="${height / 2}" x2="${width - pad}" y2="${height / 2}" stroke="#edf1f7"/><polygon points="${area}" fill="url(#usage-fill)"/><polyline points="${points}" fill="none" stroke="#356bff" stroke-width="3" vector-effect="non-scaling-stroke"/></svg>`;
  };

  const bindInvoiceDownloads = () => document.querySelectorAll("[data-invoice-path]").forEach((button) => button.addEventListener("click", async () => {
    if (!client) return;
    button.disabled = true;
    button.textContent = "Préparation…";
    const { data, error } = await client.storage.from("invoices").createSignedUrl(button.dataset.invoicePath, 60);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    button.textContent = error ? "Indisponible" : "Télécharger";
    button.disabled = false;
  }));

  const renderPortal = (state) => {
    portalState = state;
    const name = state.user.user_metadata?.full_name || state.user.email.split("@")[0];
    setText("[data-organization-name]", state.organization.name);
    setText("[data-user-name]", name);
    setText("[data-user-email]", state.user.email);
    setText("[data-user-initials]", name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase());
    setText("[data-backup-status]", state.subscription?.status === "active" ? "Sauvegardes opérationnelles" : "Situation à vérifier");
    setText("[data-storage-used]", formatBytes(state.subscription?.storage_used_bytes));
    setText("[data-last-backup]", relativeBackup(state.subscription?.last_backup_at));
    setText("[data-retention]", `${state.subscription?.retention_days || 365} jours`);
    setText("[data-storage-summary]", formatBytes(state.subscription?.storage_used_bytes));
    setText("[data-storage-limit]", state.subscription?.storage_limit_bytes ? `sur ${formatBytes(state.subscription.storage_limit_bytes)}` : "Capacité non renseignée");
    document.querySelector("[data-alerts-preview]").innerHTML = renderTable("alerts", state.alerts, 4);
    document.querySelector("[data-invoices-preview]").innerHTML = renderTable("invoices", state.invoices, 4);
    document.querySelector("[data-requests-preview]").innerHTML = renderTable("requests", state.requests, 4);
    document.querySelector("[data-alerts-list]").innerHTML = renderTable("alerts", state.alerts);
    document.querySelector("[data-invoices-list]").innerHTML = renderTable("invoices", state.invoices);
    document.querySelector("[data-requests-list]").innerHTML = renderTable("requests", state.requests);
    renderChart("[data-usage-chart]", state.usage);
    renderChart("[data-usage-chart-full]", state.usage);
    bindInvoiceDownloads();
    loading.hidden = true;
    shell.hidden = false;
  };

  const loadPortal = async () => {
    if (isLocalDemo) { renderPortal(demoData); return; }
    if (!client) { location.replace("/connexion.html"); return; }
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { location.replace("/connexion.html"); return; }
    const { data: membership, error: membershipError } = await client.from("organization_members").select("organization_id, role, organizations(id,name)").eq("user_id", user.id).limit(1).maybeSingle();
    if (membershipError || !membership?.organizations) {
      loading.innerHTML = "<strong>Votre compte n’est associé à aucune entreprise.</strong><p>Contactez Alliancia Solutions pour finaliser votre accès.</p>";
      return;
    }
    const organizationId = membership.organization_id;
    const [subscription, usage, alerts, invoices, requests] = await Promise.all([
      client.from("subscriptions").select("*").eq("organization_id", organizationId).maybeSingle(),
      client.from("usage_daily").select("*").eq("organization_id", organizationId).order("measured_on", { ascending: true }).limit(30),
      client.from("alerts").select("*").eq("organization_id", organizationId).order("occurred_at", { ascending: false }).limit(100),
      client.from("invoices").select("*").eq("organization_id", organizationId).order("issued_at", { ascending: false }).limit(100),
      client.from("support_requests").select("*").eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(100)
    ]);
    const firstError = [subscription, usage, alerts, invoices, requests].find((result) => result.error)?.error;
    if (firstError) {
      loading.innerHTML = "<strong>Impossible de charger votre espace.</strong><p>Réessayez dans quelques instants ou contactez l’assistance.</p>";
      return;
    }
    renderPortal({ user, organization: membership.organizations, subscription: subscription.data, usage: usage.data || [], alerts: alerts.data || [], invoices: invoices.data || [], requests: requests.data || [] });
  };

  document.querySelectorAll("[data-portal-view]").forEach((control) => control.addEventListener("click", () => {
    const view = control.dataset.portalView;
    document.querySelectorAll(".portal-sidebar [data-portal-view]").forEach((button) => button.classList.toggle("active", button.dataset.portalView === view));
    document.querySelectorAll("[data-view-panel]").forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== view; panel.classList.toggle("active", panel.dataset.viewPanel === view); });
    document.querySelector(".portal-sidebar")?.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  document.querySelector("[data-portal-menu]")?.addEventListener("click", () => document.querySelector(".portal-sidebar")?.classList.toggle("open"));
  document.querySelector("[data-logout]")?.addEventListener("click", async () => { if (client) await client.auth.signOut(); location.replace("/connexion.html"); });

  const requestDialog = document.querySelector("[data-request-dialog]");
  document.querySelectorAll("[data-new-request]").forEach((button) => button.addEventListener("click", () => requestDialog?.showModal()));
  document.querySelector("[data-request-close]")?.addEventListener("click", () => requestDialog?.close());
  document.querySelector("[data-request-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const feedback = document.querySelector("[data-request-feedback]");
    const submit = form.querySelector("[type='submit']");
    submit.disabled = true;
    if (isLocalDemo) {
      feedback.textContent = "Mode démonstration : la demande serait transmise ici.";
      window.setTimeout(() => requestDialog.close(), 900);
      submit.disabled = false;
      return;
    }
    const payload = Object.fromEntries(new FormData(form));
    const { error } = await client.from("support_requests").insert({ organization_id: portalState.organization.id, created_by: portalState.user.id, subject: payload.subject, category: payload.category, priority: payload.priority, message: payload.message });
    feedback.textContent = error ? "La demande n’a pas pu être envoyée." : "Votre demande a bien été transmise.";
    if (!error) window.setTimeout(() => location.reload(), 900);
    submit.disabled = false;
  });

  loadPortal();
})();
