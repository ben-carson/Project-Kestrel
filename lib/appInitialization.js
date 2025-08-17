// ===== APPLICATION INITIALIZATION WITH ENHANCED DISCOVERY =====

import { 
  registerDiscoveryRule, 
  initializeDefaultDiscoveryRules,
  getRegisteredRules 
} from './serviceDiscovery';

/**
 * Initialize service discovery with application-specific rules
 */
export function initializeServiceDiscovery() {
  console.log('[App] Initializing service discovery...');
  initializeDefaultDiscoveryRules();

  // ===== Database Services =====
  registerDiscoveryRule("audit-db", () => ({
    kind: "database", port: 5432, protocol: "tcp", engine: "postgres",
    category: "storage", schema: "audit", retention: "7 years", encryption: "at-rest",
    compliance: ["SOC2", "GDPR"]
  }));
  registerDiscoveryRule("compliance-db", () => ({
    kind: "database", port: 5432, protocol: "tcp", engine: "postgres",
    category: "storage", compliance: ["SOC2", "HIPAA", "GDPR"], encrypted: true, auditLog: true, backupSchedule: "hourly"
  }));
  registerDiscoveryRule("analytics-db", () => ({
    kind: "database", port: 5432, protocol: "tcp", engine: "postgres",
    category: "analytics", warehouse: true, partitioned: true, compressionEnabled: true
  }));
  registerDiscoveryRule("session-db", () => ({
    kind: "database", port: 5432, protocol: "tcp", engine: "postgres",
    category: "storage", ttl: 86400, cleanupSchedule: "hourly"
  }));

  // ===== Cache Services =====
  registerDiscoveryRule("admin-cache", () => ({
    kind: "cache", port: 6379, protocol: "tcp", engine: "redis",
    category: "performance", ttl: 300, maxMemory: "512mb", adminOnly: true, evictionPolicy: "allkeys-lru"
  }));
  registerDiscoveryRule("session-cache", () => ({
    kind: "cache", port: 6379, protocol: "tcp", engine: "redis",
    category: "performance", ttl: 3600, maxMemory: "2gb", persistence: "aof"
  }));
  registerDiscoveryRule("api-cache", () => ({
    kind: "cache", port: 6379, protocol: "tcp", engine: "redis",
    category: "performance", ttl: 60, maxMemory: "4gb", cluster: true
  }));

  // ===== Queue Services =====
  registerDiscoveryRule("event-queue", () => ({
    kind: "queue", port: 5672, protocol: "amqp", engine: "rabbitmq",
    category: "messaging", durable: true, autoAck: false, maxRetries: 3, dlq: true
  }));
  registerDiscoveryRule("task-queue", () => ({
    kind: "queue", port: 5672, protocol: "amqp", engine: "rabbitmq",
    category: "messaging", priority: true, maxConcurrency: 100, prefetch: 10
  }));
  registerDiscoveryRule("notification-queue", () => ({
    kind: "queue", port: 5672, protocol: "amqp", engine: "rabbitmq",
    category: "messaging", batching: true, batchSize: 100, batchTimeout: 5000
  }));

  // ===== API/Service Endpoints =====
  registerDiscoveryRule("fraud-detection", () => ({
    kind: "service", port: 8443, protocol: "https", engine: "ml-service",
    category: "security", mlModel: "fraud-v2", threshold: 0.85, timeout: 5000, retries: 2
  }));
  registerDiscoveryRule("recommendation-engine", () => ({
    kind: "service", port: 8080, protocol: "http", engine: "ml-service",
    category: "personalization", mlModel: "rec-v3", cacheResults: true, cacheTTL: 3600
  }));
  registerDiscoveryRule("payment-processor", () => ({
    kind: "service", port: 443, protocol: "https", engine: "external-api",
    category: "payment", provider: "stripe", timeout: 10000, retries: 3, idempotent: true
  }));

  // ===== Storage Services =====
  registerDiscoveryRule("media-storage", () => ({
    kind: "storage", port: 443, protocol: "https", engine: "s3",
    category: "storage", bucket: "media-assets", cdn: true, publicRead: true
  }));
  registerDiscoveryRule("backup-storage", () => ({
    kind: "storage", port: 443, protocol: "https", engine: "s3",
    category: "storage", bucket: "backups", encryption: "AES256", versioning: true, lifecycle: "90days"
  }));

  // ===== Worker Services =====
  registerDiscoveryRule("report-generator", () => ({
    kind: "worker", port: 8080, protocol: "http", engine: "worker",
    category: "processing", concurrency: 5, timeout: 300000, memoryLimit: "2gb"
  }));
  registerDiscoveryRule("image-processor", () => ({
    kind: "worker", port: 8080, protocol: "http", engine: "worker",
    category: "processing", concurrency: 10, timeout: 60000, supportedFormats: ["jpg","png","webp","avif"]
  }));

  // ===== Monitoring Services =====
  registerDiscoveryRule("health-monitor", () => ({
    kind: "service", port: 9090, protocol: "http", engine: "monitoring",
    category: "observability", checkInterval: 30000, alertThreshold: 3, metrics: ["cpu","memory","disk","network"]
  }));
  registerDiscoveryRule("log-aggregator", () => ({
    kind: "service", port: 514, protocol: "syslog", engine: "logging",
    category: "observability", retention: "30days", indexing: true, searchable: true
  }));
  registerDiscoveryRule("rate-limiter", () => ({
    kind: "service", port: 6379, protocol: "tcp", engine: "redis",
    category: "security", windowSize: 60000, maxRequests: 100, keyPrefix: "rl:"
  }));

  const registered = getRegisteredRules();
  console.log(`[App] Service discovery initialized with ${registered.length} rules`);
  console.log("[App] Registered services:", registered.slice(0, 10).join(", "),
    registered.length > 10 ? `... and ${registered.length - 10} more` : "");
  return registered;
}

/** Default apps */
export function getDefaultApplications() {
  return [
    { name: "user-service",         criticality: "high",     dependencies: ["user-db","session-cache","api-gateway","session-db"] },
    { name: "order-service",        criticality: "critical", dependencies: ["order-db","payment-processor","inventory-service","event-queue","api-cache"] },
    { name: "payment-service",      criticality: "critical", dependencies: ["payment-db","payment-processor","fraud-detection","event-queue","audit-db"] },
    { name: "inventory-service",    criticality: "medium",   dependencies: ["inventory-db","api-cache","event-queue"] },
    { name: "notification-service", criticality: "low",      dependencies: ["notification-queue","email-service","session-cache"] },
    { name: "analytics-service",    criticality: "low",      dependencies: ["analytics-db","task-queue","report-generator"] },
    { name: "admin-service",        criticality: "medium",   dependencies: ["admin-cache","audit-db","compliance-db","rate-limiter"] },
    { name: "media-service",        criticality: "medium",   dependencies: ["media-storage","image-processor","cdn","api-cache"] },
    { name: "search-service",       criticality: "medium",   dependencies: ["search-engine","api-cache","recommendation-engine"] },
    { name: "monitoring-service",   criticality: "high",     dependencies: ["health-monitor","log-aggregator","metrics-db","notification-queue"] }
  ];
}

/** Dynamic rule registration helper */
export function registerCustomService(serviceName, config) {
  console.log(`[App] Registering custom service: ${serviceName}`);
  registerDiscoveryRule(serviceName, () => ({
    kind: config.kind || "service",
    port: config.port || 8080,
    protocol: config.protocol || "http",
    engine: config.engine || "generic",
    category: config.category || "application",
    ...config.metadata
  }));
  if (typeof window !== "undefined" && window.topologyManager) {
    window.topologyManager.addServiceDiscoveryRule(
      serviceName,
      (server) => server.name.includes(serviceName) || server.tags?.includes(serviceName),
      (servers) => servers.filter(s => s.type === config.serverType).slice(0, config.instances || 1)
    );
  }
  return true;
}

/** Pull unmatched deps (if topologyManager present) */
export function getUnknownServices() {
  if (typeof window !== "undefined" && window.topologyManager?.getDiscoveryStats) {
    const stats = window.topologyManager.getDiscoveryStats();
    return stats.unmatchedDependencies;
  }
  return [];
}

export default { initializeServiceDiscovery, registerCustomService, getUnknownServices, getDefaultApplications };
