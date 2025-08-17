// ===== ENHANCED SERVICE DISCOVERY SYSTEM =====
// Layered discovery: exact > category > heuristic. Debug-only logging for unknowns.

const discoveryRules = new Map();
const seenUnknown = new Set();

/** Register a rule by exact service name or category key */
export function registerDiscoveryRule(key, fn) {
  discoveryRules.set(String(key).toLowerCase(), fn);
}

/** Heuristic defaults for unknown names */
function defaultDiscovery(name = "") {
  const n = String(name).toLowerCase();
  if (/\b(db|database|postgres|mysql|mariadb|mongo|cassandra|dynamo|rds)\b/.test(n)) {
    return { kind: "database", port: 5432, protocol: "tcp", engine: n.includes("mysql") ? "mysql" : n.includes("mongo") ? "mongodb" : "postgres", category: "storage" };
  }
  if (/\b(cache|redis|memcached|elasticache|varnish)\b/.test(n)) {
    return { kind: "cache", port: 6379, protocol: "tcp", engine: n.includes("memcached") ? "memcached" : "redis", category: "performance" };
  }
  if (/\b(queue|mq|kafka|rabbit|sqs|sns|pubsub|message|event)\b/.test(n)) {
    return { kind: "queue", port: 5672, protocol: "tcp", engine: n.includes("kafka") ? "kafka" : n.includes("sqs") ? "sqs" : "rabbitmq", category: "messaging" };
  }
  if (/\b(gateway|proxy|waf|nginx|apache|haproxy|cloudflare|cdn|lb|load-?balancer)\b/.test(n)) {
    return { kind: "gateway", port: 443, protocol: "https", engine: n.includes("nginx") ? "nginx" : n.includes("haproxy") ? "haproxy" : "generic", category: "network" };
  }
  if (/\b(storage|s3|blob|file|bucket|nas|san)\b/.test(n)) {
    return { kind: "storage", port: 443, protocol: "https", engine: n.includes("s3") ? "s3" : "generic", category: "storage" };
  }
  if (/\b(worker|job|task|batch|cron|scheduler)\b/.test(n)) {
    return { kind: "worker", port: 8080, protocol: "http", engine: "generic", category: "processing" };
  }
  if (/\b(email|mail|smtp|notification|alert|sns)\b/.test(n)) {
    return { kind: "notification", port: 587, protocol: "smtp", engine: n.includes("sns") ? "sns" : "smtp", category: "communication" };
  }
  if (/\b(analytics|warehouse|etl|bigquery|redshift|snowflake|reporting)\b/.test(n)) {
    return { kind: "analytics", port: 5432, protocol: "tcp", engine: n.includes("bigquery") ? "bigquery" : n.includes("redshift") ? "redshift" : "generic", category: "analytics" };
  }
  if (/\b(search|elastic|solr|algolia)\b/.test(n)) {
    return { kind: "search", port: 9200, protocol: "http", engine: n.includes("elastic") ? "elasticsearch" : n.includes("solr") ? "solr" : "generic", category: "search" };
  }
  return { kind: "service", port: 80, protocol: "http", engine: "generic", category: "application" };
}

/** Resolve to rule function; try exact, then category, then heuristic */
function resolveDiscovery(name) {
  const normalized = String(name).toLowerCase();
  if (discoveryRules.has(normalized)) return discoveryRules.get(normalized);

  const categories = [
    { pattern: /db|database/i, key: "database" },
    { pattern: /cache|redis/i, key: "cache" },
    { pattern: /queue|mq|message/i, key: "queue" },
    { pattern: /gateway|proxy|waf|lb/i, key: "gateway" },
    { pattern: /worker|job|task/i, key: "worker" },
    { pattern: /email|mail|notification/i, key: "notification" },
    { pattern: /analytics|warehouse/i, key: "analytics" },
    { pattern: /search|elastic/i, key: "search" },
    { pattern: /storage|s3|blob/i, key: "storage" }
  ];
  for (const { pattern, key } of categories) {
    if (pattern.test(normalized) && discoveryRules.has(key)) return discoveryRules.get(key);
  }
  return (svcName) => defaultDiscovery(svcName);
}

/** Public: get normalized service metadata + one-time debug on unknowns */
export function getServiceMeta(svcName) {
  const rule = resolveDiscovery(svcName);
  const key = String(svcName).toLowerCase();
  if (!discoveryRules.has(key) && !seenUnknown.has(key)) {
    seenUnknown.add(key);
    console.debug(`[discovery] Using fallback discovery for "${svcName}"`);
  }
  return rule(svcName);
}

/** Build a matcher/fallback pair from metadata (for topology resolution) */
export function createServiceMatcher(svcName, meta) {
  const serviceKind = meta.kind;
  const typeKindMap = {
    database: "db",
    cache: "cache",
    queue: "queue",
    gateway: "lb",
    worker: "worker",
    notification: "worker",
    analytics: "db",
    search: "api",
    storage: "storage",
    service: "api"
  };

  return {
    matcher: (server) => {
      if (server?.tags?.includes(svcName)) return true;
      const sn = (server?.name || "").toLowerCase();
      const sv = svcName.toLowerCase();
      if (sn.includes(sv)) return true;
      if (server?.type === typeKindMap[serviceKind]) {
        const prefix = svcName.split("-")[0];
        if (prefix && sn.includes(prefix.toLowerCase())) return true;
        if (!svcName.includes("-")) return true;
      }
      return false;
    },
    fallback: (servers) => {
      const t = typeKindMap[serviceKind] || "api";
      const candidates = servers.filter(s => s.type === t);
      if (serviceKind === "cache" || serviceKind === "queue") return candidates.slice(0, 2);
      if (serviceKind === "database") return candidates.slice(0, 1);
      return candidates.slice(0, 3);
    },
    metadata: meta
  };
}

/** Category defaults */
export function initializeDefaultDiscoveryRules() {
  registerDiscoveryRule("database", () => ({ kind: "database", port: 5432, protocol: "tcp", engine: "postgres", category: "storage", replication: true, backup: true }));
  registerDiscoveryRule("cache",    () => ({ kind: "cache",    port: 6379, protocol: "tcp", engine: "redis",    category: "performance", ttl: 3600, evictionPolicy: "lru" }));
  registerDiscoveryRule("queue",    () => ({ kind: "queue",    port: 5672, protocol: "amqp", engine: "rabbitmq", category: "messaging", durable: true, autoAck: false }));
  registerDiscoveryRule("gateway",  () => ({ kind: "gateway",  port: 443,  protocol: "https", engine: "nginx",   category: "network", loadBalancing: "round-robin", healthCheck: "/health" }));
  console.log("[discovery] Default discovery rules initialized");
}

export function getRegisteredRules() { return Array.from(discoveryRules.keys()); }
export function clearUnknownTracking() { seenUnknown.clear(); }

export default {
  registerDiscoveryRule,
  getServiceMeta,
  createServiceMatcher,
  initializeDefaultDiscoveryRules,
  getRegisteredRules,
  clearUnknownTracking
};
