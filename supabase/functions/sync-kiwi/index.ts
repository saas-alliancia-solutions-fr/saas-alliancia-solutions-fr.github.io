import { createClient } from "npm:@supabase/supabase-js@2";

type JsonRecord = Record<string, unknown>;

const json = (body: JsonRecord, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const numberValue = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
};

const booleanValue = (value: unknown) =>
  value === true || value === 1 || value === "1" || value === "true";

const textValue = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const dateValue = (value: unknown) => {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const kiwiCapacityToBytes = (value: unknown) =>
  Math.round((numberValue(value) / 1024) * 1_000_000_000);

const planName = (bytes: number) => {
  const gigabytes = bytes / 1_000_000_000;
  if (gigabytes >= 1000) return `${Number((gigabytes / 1000).toFixed(1))} To`;
  return `${Number(gigabytes.toFixed(1))} Go`;
};

const getAdminKey = () => {
  const keys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (keys) {
    const parsed = JSON.parse(keys) as Record<string, string>;
    if (parsed.default) return parsed.default;
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
};

const fetchKiwi = async (baseUrl: string, token: string, path: string) => {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "X-AUTH-TOKEN": token, accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Kiwi ${path}: HTTP ${response.status}`);
  const payload = await response.json() as { response?: { status?: string; results?: JsonRecord[] } };
  if (payload.response?.status !== "OK" || !Array.isArray(payload.response.results)) {
    throw new Error(`Kiwi ${path}: réponse inattendue`);
  }
  return payload.response.results;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const syncSecret = Deno.env.get("KIWI_SYNC_SECRET") ?? "";
  if (!syncSecret || request.headers.get("x-sync-secret") !== syncSecret) {
    return json({ error: "Accès refusé" }, 401);
  }

  const baseUrl = (Deno.env.get("KIWI_API_BASE_URL") ?? "https://admin5.sante.kiwi-backup.com").replace(/\/$/, "");
  const token = Deno.env.get("KIWI_API_TOKEN") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const adminKey = getAdminKey();
  if (!token || !supabaseUrl || !adminKey) return json({ error: "Configuration serveur incomplète" }, 500);

  const supabase = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date();
  const measuredOn = now.toISOString().slice(0, 10);

  try {
    const [contracts, machines, alertMachines] = await Promise.all([
      fetchKiwi(baseUrl, token, "/api/contrats.json"),
      fetchKiwi(baseUrl, token, "/api/machines.json"),
      fetchKiwi(baseUrl, token, "/api/machines_alerte.json"),
    ]);

    const { data: links, error: linksError } = await supabase
      .from("kiwi_contract_links")
      .select("organization_id, kiwi_contract_id")
      .eq("enabled", true);
    if (linksError) throw linksError;

    const summary: JsonRecord[] = [];
    for (const link of links ?? []) {
      const contract = contracts.find((item) => String(item.id) === link.kiwi_contract_id);
      if (!contract) {
        await supabase.from("kiwi_contract_links").update({
          last_error: "Contrat introuvable dans Kiwi",
          last_synced_at: now.toISOString(),
        }).eq("organization_id", link.organization_id);
        summary.push({ organizationId: link.organization_id, status: "missing" });
        continue;
      }

      const contractMachines = machines.filter((item) => String(item.cid) === link.kiwi_contract_id);
      const contractAlerts = alertMachines.filter((item) => String(item.cid) === link.kiwi_contract_id);
      const alertIds = new Set(contractAlerts.map((item) => String(item.id)));
      const latestBackup = contractMachines
        .map((item) => dateValue(item.last_backup))
        .filter((value): value is string => Boolean(value))
        .sort()
        .at(-1) ?? null;
      const storageLimit = kiwiCapacityToBytes(contract.volume_disponible);
      const storageUsed = numberValue(contract.volume_total);
      const isActive = booleanValue(contract.actif);

      const { error: subscriptionError } = await supabase.from("subscriptions").upsert({
        organization_id: link.organization_id,
        plan_name: planName(storageLimit),
        storage_limit_bytes: storageLimit,
        storage_used_bytes: storageUsed,
        retention_days: Math.max(1, numberValue(contract.historique) || 365),
        status: !isActive ? "ended" : contractAlerts.length ? "attention" : "active",
        last_backup_at: latestBackup,
        updated_at: now.toISOString(),
      }, { onConflict: "organization_id" });
      if (subscriptionError) throw subscriptionError;

      if (contractMachines.length) {
        const deviceRows = contractMachines.map((machine) => ({
          organization_id: link.organization_id,
          kiwi_machine_id: textValue(machine.id),
          name: textValue(machine.nom_machine, "Machine sans nom"),
          device_type: textValue(machine.type) || null,
          client_version: textValue(machine.version) || null,
          source_bytes: numberValue(machine.source_size),
          stored_bytes: numberValue(machine.stored_size),
          source_count: numberValue(machine.source_count),
          last_backup_at: dateValue(machine.last_backup),
          backup_alert: booleanValue(machine.alerte_backup),
          missing_backup_alert: booleanValue(machine.alerte_non_backup),
          backup_running: booleanValue(machine.running_backup),
          active: true,
          synced_at: now.toISOString(),
          updated_at: now.toISOString(),
        }));
        const { error: devicesError } = await supabase.from("backup_devices")
          .upsert(deviceRows, { onConflict: "kiwi_machine_id" });
        if (devicesError) throw devicesError;
      }

      const { error: usageError } = await supabase.from("usage_daily").upsert({
        organization_id: link.organization_id,
        measured_on: measuredOn,
        storage_bytes: storageUsed,
        protected_devices: contractMachines.length,
        successful_backups: contractMachines.filter((item) => !alertIds.has(String(item.id))).length,
        failed_backups: contractAlerts.length,
      }, { onConflict: "organization_id,measured_on" });
      if (usageError) throw usageError;

      if (contractAlerts.length) {
        const alertRows = contractAlerts.map((machine) => ({
          organization_id: link.organization_id,
          severity: "critical",
          title: `Sauvegarde à vérifier — ${textValue(machine.nom_machine, "machine")}`,
          message: machine.last_backup ? `Dernière sauvegarde connue : ${textValue(machine.last_backup_string, textValue(machine.last_backup))}` : "Aucune sauvegarde récente connue.",
          source: "kiwi",
          external_id: textValue(machine.id),
          status: "open",
          occurred_at: dateValue(machine.last_backup) ?? now.toISOString(),
          resolved_at: null,
          metadata: { contract_id: link.kiwi_contract_id, machine_type: machine.type ?? null },
        }));
        const { error: alertsError } = await supabase.from("alerts")
          .upsert(alertRows, { onConflict: "source,external_id" });
        if (alertsError) throw alertsError;
      }

      const { data: priorAlerts, error: priorAlertsError } = await supabase.from("alerts")
        .select("id, external_id")
        .eq("organization_id", link.organization_id)
        .eq("source", "kiwi")
        .neq("status", "resolved");
      if (priorAlertsError) throw priorAlertsError;
      const resolvedIds = (priorAlerts ?? []).filter((item) => !alertIds.has(String(item.external_id))).map((item) => item.id);
      if (resolvedIds.length) {
        const { error: resolveError } = await supabase.from("alerts")
          .update({ status: "resolved", resolved_at: now.toISOString() })
          .in("id", resolvedIds);
        if (resolveError) throw resolveError;
      }

      const { error: linkError } = await supabase.from("kiwi_contract_links").update({
        last_synced_at: now.toISOString(),
        last_error: null,
      }).eq("organization_id", link.organization_id);
      if (linkError) throw linkError;

      summary.push({ organizationId: link.organization_id, status: "synced", machines: contractMachines.length, alerts: contractAlerts.length });
    }

    return json({ ok: true, synchronizedAt: now.toISOString(), organizations: summary });
  } catch (error) {
    console.error("Kiwi synchronization failed", error instanceof Error ? error.message : error);
    return json({ error: "La synchronisation Kiwi a échoué" }, 502);
  }
});

