(() => {
  const config = window.SAAS_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey && window.supabase?.createClient);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey) : null;
  const isLocalDemo = location.hostname === "127.0.0.1" && new URLSearchParams(location.search).get("demo") === "1";
  const loading = document.querySelector("[data-admin-loading]");
  const shell = document.querySelector("[data-admin-shell]");
  let state = null;

  const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[character]));
  const formatDate = (value, withTime = false) => {
    if (!value) return "Non renseignée";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Non renseignée";
    return new Intl.DateTimeFormat("fr-FR", withTime ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
  };
  const formatBytes = (value) => {
    const bytes = Number(value || 0);
    if (!bytes) return "0 Go";
    const units = ["o", "Ko", "Mo", "Go", "To"];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(bytes / (1024 ** index))} ${units[index]}`;
  };
  const relativeDate = (value) => {
    if (!value) return "Jamais";
    const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 2) return "À l’instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (minutes < 1440) return `Il y a ${Math.round(minutes / 60)} h`;
    return formatDate(value, true);
  };
  const statusLabels = {
    active: "Opérationnel", attention: "À surveiller", suspended: "Suspendu", ended: "Terminé",
    open: "Ouverte", acknowledged: "Prise en compte", resolved: "Résolue", in_progress: "En cours",
    closed: "Clôturée", draft: "Brouillon", sent: "Envoyée", paid: "Payée", overdue: "En retard"
  };
  const organizationName = (id) => state.organizations.find((item) => item.id === id)?.name || "Organisation inconnue";

  const showError = (title, message) => {
    document.body.innerHTML = `<main class="admin-access-error"><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(message)}</p><a class="button" href="/connexion.html">Retour à la connexion</a></div></main>`;
  };

  const activityList = (items, type, limit = 5) => {
    if (!items.length) return '<div class="portal-empty">Aucune donnée disponible.</div>';
    return `<div class="admin-activity-list">${items.slice(0, limit).map((item) => {
      const alert = type === "alerts";
      const tone = alert ? item.severity : "info";
      const title = alert ? item.title : item.subject;
      const label = alert ? organizationName(item.organization_id) : `${organizationName(item.organization_id)} · ${statusLabels[item.status] || item.status}`;
      const date = alert ? item.occurred_at : item.updated_at;
      return `<article class="admin-activity"><span class="admin-activity-icon ${escapeHtml(tone)}">${alert ? "!" : "D"}</span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(label)}</small></div><time>${escapeHtml(relativeDate(date))}</time></article>`;
    }).join("")}</div>`;
  };

  const clientRows = (organizations) => {
    if (!organizations.length) return '<div class="portal-empty">Aucun client ne correspond à cette recherche.</div>';
    return `<table class="portal-table admin-table"><thead><tr><th>Client</th><th>Formule</th><th>Utilisation</th><th>Appareils</th><th>Dernière sauvegarde</th><th>Statut</th></tr></thead><tbody>${organizations.map((organization) => {
      const subscription = state.subscriptionByOrg.get(organization.id);
      const devices = state.devicesByOrg.get(organization.id) || [];
      const used = Number(subscription?.storage_used_bytes || 0);
      const limit = Number(subscription?.storage_limit_bytes || 0);
      const percent = limit ? Math.min(100, Math.round(used / limit * 100)) : 0;
      const tone = percent >= 95 ? "critical" : percent >= 80 ? "warning" : "";
      const status = subscription?.status || "attention";
      return `<tr tabindex="0" data-client-id="${organization.id}"><td><div class="admin-client-name"><span><svg><use href="#admin-building"/></svg></span><div><strong>${escapeHtml(organization.name)}</strong><small>${escapeHtml(organization.slug)}</small></div></div></td><td>${escapeHtml(subscription?.plan_name || "Non définie")}</td><td><div class="admin-usage"><strong>${escapeHtml(formatBytes(used))}${limit ? ` (${percent} %)` : ""}</strong><span class="admin-usage-track"><i class="${tone}" style="width:${percent}%"></i></span></div></td><td>${devices.length}</td><td>${escapeHtml(relativeDate(subscription?.last_backup_at))}</td><td><span class="admin-status ${escapeHtml(status)}">${escapeHtml(statusLabels[status] || status)}</span></td></tr>`;
    }).join("")}</tbody></table>`;
  };

  const renderRequests = () => {
    if (!state.requests.length) return '<div class="portal-empty">Aucune demande client.</div>';
    return `<table class="portal-table admin-table"><thead><tr><th>Référence</th><th>Client</th><th>Objet</th><th>Catégorie</th><th>Priorité</th><th>Statut</th><th>Mise à jour</th></tr></thead><tbody>${state.requests.map((item) => `<tr><td>#D-${String(item.id).padStart(5, "0")}</td><td>${escapeHtml(organizationName(item.organization_id))}</td><td>${escapeHtml(item.subject)}</td><td>${escapeHtml(item.category)}</td><td>${escapeHtml(item.priority)}</td><td><span class="admin-status ${escapeHtml(item.status)}">${escapeHtml(statusLabels[item.status] || item.status)}</span></td><td>${escapeHtml(formatDate(item.updated_at, true))}</td></tr>`).join("")}</tbody></table>`;
  };
  const renderInvoices = () => {
    if (!state.invoices.length) return '<div class="portal-empty">Aucune facture enregistrée.</div>';
    return `<table class="portal-table admin-table"><thead><tr><th>Facture</th><th>Client</th><th>Date</th><th>Montant HT</th><th>Statut</th></tr></thead><tbody>${state.invoices.map((item) => `<tr><td>${escapeHtml(item.invoice_number)}</td><td>${escapeHtml(organizationName(item.organization_id))}</td><td>${escapeHtml(formatDate(item.issued_at))}</td><td>${new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(item.amount_cents || 0) / 100)}</td><td><span class="admin-status ${escapeHtml(item.status)}">${escapeHtml(statusLabels[item.status] || item.status)}</span></td></tr>`).join("")}</tbody></table>`;
  };
  const renderAlerts = () => {
    if (!state.alerts.length) return '<div class="portal-empty">Aucune alerte active.</div>';
    return `<table class="portal-table admin-table"><thead><tr><th>Niveau</th><th>Client</th><th>Message</th><th>Source</th><th>Statut</th><th>Date</th></tr></thead><tbody>${state.alerts.map((item) => `<tr><td>${item.severity === "critical" ? "Critique" : item.severity === "warning" ? "Attention" : "Information"}</td><td>${escapeHtml(organizationName(item.organization_id))}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.source || "—")}</td><td><span class="admin-status ${escapeHtml(item.status)}">${escapeHtml(statusLabels[item.status] || item.status)}</span></td><td>${escapeHtml(formatDate(item.occurred_at, true))}</td></tr>`).join("")}</tbody></table>`;
  };

  const openClient = (organizationId) => {
    const organization = state.organizations.find((item) => item.id === Number(organizationId));
    if (!organization) return;
    const subscription = state.subscriptionByOrg.get(organization.id);
    const devices = state.devicesByOrg.get(organization.id) || [];
    document.querySelector("[data-client-title]").textContent = organization.name;
    document.querySelector("[data-client-subtitle]").textContent = `Compte créé le ${formatDate(organization.created_at)}`;
    document.querySelector("[data-client-detail]").innerHTML = `<div class="admin-detail-grid"><article><small>Formule</small><strong>${escapeHtml(subscription?.plan_name || "Non définie")}</strong></article><article><small>Volume utilisé</small><strong>${escapeHtml(formatBytes(subscription?.storage_used_bytes))}</strong></article><article><small>Rétention</small><strong>${escapeHtml(`${subscription?.retention_days || 365} jours`)}</strong></article></div><div class="admin-device-list"><h3>Équipements sauvegardés</h3>${devices.length ? `<table class="portal-table"><thead><tr><th>Nom</th><th>Type</th><th>Volume source</th><th>Dernière sauvegarde</th><th>État</th></tr></thead><tbody>${devices.map((device) => `<tr><td>${escapeHtml(device.name)}</td><td>${escapeHtml(device.device_type || "—")}</td><td>${escapeHtml(formatBytes(device.source_bytes))}</td><td>${escapeHtml(formatDate(device.last_backup_at, true))}</td><td><span class="admin-status ${device.backup_alert || device.missing_backup_alert ? "attention" : "active"}">${device.backup_alert || device.missing_backup_alert ? "À vérifier" : "Opérationnel"}</span></td></tr>`).join("")}</tbody></table>` : '<div class="portal-empty">Aucun équipement synchronisé.</div>'}</div>`;
    document.querySelector("[data-client-dialog]").showModal();
  };

  const bindClientRows = () => document.querySelectorAll("[data-client-id]").forEach((row) => {
    row.addEventListener("click", () => openClient(row.dataset.clientId));
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") openClient(row.dataset.clientId); });
  });

  const filterClients = (value) => {
    const search = value.trim().toLocaleLowerCase("fr");
    const filtered = state.organizations.filter((item) => `${item.name} ${item.slug}`.toLocaleLowerCase("fr").includes(search));
    document.querySelectorAll("[data-client-search]").forEach((input) => { if (input.value !== value) input.value = value; });
    document.querySelector("[data-clients-overview]").innerHTML = clientRows(filtered.slice(0, 8));
    document.querySelector("[data-clients-list]").innerHTML = clientRows(filtered);
    document.querySelector("[data-clients-summary]").textContent = `${filtered.length} client${filtered.length > 1 ? "s" : ""}`;
    bindClientRows();
  };

  const render = (user, data) => {
    state = data;
    state.subscriptionByOrg = new Map(state.subscriptions.map((item) => [item.organization_id, item]));
    state.devicesByOrg = new Map();
    state.devices.forEach((item) => state.devicesByOrg.set(item.organization_id, [...(state.devicesByOrg.get(item.organization_id) || []), item]));
    const displayName = user.user_metadata?.full_name || "Admin Alliancia";
    document.querySelector("[data-admin-name]").textContent = displayName;
    document.querySelector("[data-admin-email]").textContent = user.email;
    document.querySelector("[data-admin-initials]").textContent = displayName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    document.querySelector("[data-kpi-clients]").textContent = state.subscriptions.filter((item) => item.status === "active").length;
    document.querySelector("[data-kpi-storage]").textContent = formatBytes(state.subscriptions.reduce((sum, item) => sum + Number(item.storage_used_bytes || 0), 0));
    document.querySelector("[data-kpi-alerts]").textContent = state.alerts.filter((item) => item.status !== "resolved" && item.severity !== "info").length;
    document.querySelector("[data-kpi-requests]").textContent = state.requests.filter((item) => !["resolved", "closed"].includes(item.status)).length;
    document.querySelector("[data-alerts-preview]").innerHTML = activityList(state.alerts, "alerts");
    document.querySelector("[data-requests-preview]").innerHTML = activityList(state.requests, "requests");
    document.querySelector("[data-requests-list]").innerHTML = renderRequests();
    document.querySelector("[data-invoices-list]").innerHTML = renderInvoices();
    document.querySelector("[data-alerts-list]").innerHTML = renderAlerts();
    filterClients("");
    document.querySelectorAll("[data-client-search]").forEach((input) => input.addEventListener("input", (event) => filterClients(event.target.value)));
    loading.hidden = true;
    shell.hidden = false;
  };

  const load = async () => {
    if (isLocalDemo) {
      const now = Date.now();
      render(
        { email: "contact@alliancia-solutions.fr", user_metadata: { full_name: "Admin Alliancia" } },
        {
          organizations: [
            { id: 1, name: "Alliancia Solutions", slug: "alliancia-solutions", created_at: new Date(now - 120 * 86400000).toISOString() },
            { id: 2, name: "Cabinet d’ostéopathie Frank Hummel", slug: "cabinet-osteopathie-frank-hummel", created_at: new Date(now - 7 * 86400000).toISOString() }
          ],
          subscriptions: [
            { organization_id: 1, plan_name: "Interne", storage_limit_bytes: 0, storage_used_bytes: 0, retention_days: 365, status: "attention", last_backup_at: null },
            { organization_id: 2, plan_name: "10 Go", storage_limit_bytes: 10 * 1024 ** 3, storage_used_bytes: 830638054, retention_days: 365, status: "active", last_backup_at: new Date(now - 38 * 60000).toISOString() }
          ],
          devices: [
            { id: 1, organization_id: 2, name: "Sauvegarde Documents", device_type: "Poste", source_bytes: 510000000, last_backup_at: new Date(now - 38 * 60000).toISOString(), backup_alert: false, missing_backup_alert: false },
            { id: 2, organization_id: 2, name: "Sauvegarde Logicielle", device_type: "Poste", source_bytes: 320638054, last_backup_at: new Date(now - 42 * 60000).toISOString(), backup_alert: false, missing_backup_alert: false }
          ],
          alerts: [], requests: [], invoices: []
        }
      );
      return;
    }
    if (!client) { showError("Configuration incomplète", "La console ne peut pas joindre le service sécurisé."); return; }
    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) { location.replace("/connexion.html"); return; }
    const { data: administrator, error: accessError } = await client.from("app_admins").select("role").eq("user_id", user.id).eq("active", true).maybeSingle();
    if (accessError || !administrator) { showError("Accès réservé", "Cette console est réservée aux collaborateurs Alliancia autorisés."); return; }
    const queries = await Promise.all([
      client.from("organizations").select("id,name,slug,created_at").order("name").limit(500),
      client.from("subscriptions").select("*").limit(500),
      client.from("backup_devices").select("*").order("last_backup_at", { ascending: false }).limit(1000),
      client.from("alerts").select("*").order("occurred_at", { ascending: false }).limit(500),
      client.from("support_requests").select("*").order("updated_at", { ascending: false }).limit(500),
      client.from("invoices").select("*").order("issued_at", { ascending: false }).limit(500)
    ]);
    const failed = queries.find((query) => query.error);
    if (failed) { showError("Chargement impossible", "Les données de la console ne sont pas disponibles. Réessayez dans quelques instants."); return; }
    render(user, {
      organizations: queries[0].data || [], subscriptions: queries[1].data || [], devices: queries[2].data || [],
      alerts: queries[3].data || [], requests: queries[4].data || [], invoices: queries[5].data || []
    });
  };

  document.querySelectorAll("[data-admin-view]").forEach((control) => control.addEventListener("click", () => {
    const view = control.dataset.adminView;
    document.querySelectorAll(".portal-sidebar [data-admin-view]").forEach((button) => button.classList.toggle("active", button.dataset.adminView === view));
    document.querySelectorAll("[data-view-panel]").forEach((panel) => { panel.hidden = panel.dataset.viewPanel !== view; panel.classList.toggle("active", panel.dataset.viewPanel === view); });
    document.querySelector(".portal-sidebar")?.classList.remove("open");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  document.querySelector("[data-admin-menu]")?.addEventListener("click", () => document.querySelector(".portal-sidebar")?.classList.toggle("open"));
  document.querySelector("[data-admin-logout]")?.addEventListener("click", async () => { if (client) await client.auth.signOut(); location.replace("/connexion.html"); });
  load();
})();
