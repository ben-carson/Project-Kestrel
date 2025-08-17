// ===== NEXT-LEVEL ENTERPRISE SERVER EVOLUTION FEATURES =====
import { getServiceMeta, createServiceMatcher, initializeDefaultDiscoveryRules } from "./serviceDiscovery.js";

// ===== SERVER PERSONALITY PROFILES =====
export const getServerPersonality = (type) => SERVER_PERSONALITIES[type] || SERVER_PERSONALITIES["stable"];

// ===== 1) Application Topology Manager (enhanced discovery + virtual nodes) =====
export class ApplicationTopologyManager {
  constructor(applications = [], servers = []) {
    this.applications = new Map();
    this.dependencyGraph = new Map();
    this.applicationHealth = new Map();
    this.serviceDiscoveryRules = {}; // legacy+generated
    this.isInitialized = false;

    if (typeof initializeDefaultDiscoveryRules === "function") initializeDefaultDiscoveryRules();
    this.initializeApplications(applications, servers);
  }

  initializeApplications(applications = [], servers = []) {
    const apps = Array.isArray(applications) ? applications : this.getDefaultApplications();
    apps.forEach(app => {
      this.applications.set(app.name, {
        ...app,
        nodes: [],
        healthThresholds: this.getHealthThresholds(app.criticality),
        lastHealthCheck: Date.now(),
        healthHistory: []
      });
      this.dependencyGraph.set(app.name, {
        dependencies: app.dependencies || [],
        dependents: apps.filter(a => (a.dependencies || []).includes(app.name)).map(a => a.name)
      });
    });
  }

  getDefaultApplications() {
    return [
      { name: "user-service", criticality: "high", dependencies: ["user-db","cache","api-gateway"] },
      { name: "order-service", criticality: "critical", dependencies: ["order-db","payment-service","inventory-service","queue"] },
      { name: "payment-service", criticality: "critical", dependencies: ["payment-db","external-gateway","queue"] },
      { name: "inventory-service", criticality: "medium", dependencies: ["inventory-db","cache"] },
      { name: "notification-service", criticality: "low", dependencies: ["email-service","queue"] }
    ];
  }

  initialize() {
    if (this.applications.size === 0) {
      this.initializeApplications(this.getDefaultApplications(), []);
    }
    this.isInitialized = true;
  }

  // --- Enhanced node resolution (quiet, layered, creates virtuals) ---
  resolveApplicationNodes(app, currentServers) {
    const resolvedNodes = [];
    const servers = Array.isArray(currentServers) ? currentServers : [];

    (app.dependencies || []).forEach(serviceName => {
      // reuse cached rule if present
      let rule = this.serviceDiscoveryRules[serviceName];

      // otherwise build from discovery
      if (!rule) {
        const meta = getServiceMeta(serviceName);
        const { matcher, fallback, metadata } = createServiceMatcher(serviceName, meta);
        rule = { matcher, fallback, metadata };
        this.serviceDiscoveryRules[serviceName] = rule;
      }

      // Try matcher
      let matches = servers.filter(rule.matcher);

      // Fallback if needed
      if (matches.length === 0 && typeof rule.fallback === "function") {
        matches = rule.fallback(servers) || [];
        if (matches.length > 0) {
          console.debug(`[topology] Fallback used for ${serviceName}: ${matches.map(n => n.name).join(", ")}`);
        }
      }

      // Still nothing? Make a virtual node
      if (matches.length === 0 && rule.metadata) {
        console.debug(`[topology] Creating virtual node for ${serviceName}`);
        matches = [this.createVirtualNode(serviceName, rule.metadata)];
      }

      resolvedNodes.push(...matches);
    });

    const appData = this.applications.get(app.name);
    if (appData) {
      appData.nodes = resolvedNodes;
      appData.lastNodeResolution = Date.now();
    }
    return resolvedNodes;
  }

  createVirtualNode(serviceName, metadata) {
    return {
      id: `virtual-${serviceName}-${Date.now()}`,
      name: serviceName,
      type: this.metadataToServerType(metadata),
      status: "unknown",
      virtual: true,
      metrics: { cpuUsage: 0, memoryUsage: 0, networkLatency: 0 },
      metadata,
      createdAt: Date.now()
    };
  }

  metadataToServerType(metadata) {
    const map = { database:"db", cache:"cache", queue:"queue", gateway:"lb", worker:"worker",
                  notification:"worker", analytics:"db", search:"api", storage:"storage", service:"api" };
    return map[metadata.kind] || "api";
  }

  updateServiceDiscoveryRule(serviceName, matcher, fallback) {
    this.serviceDiscoveryRules[serviceName] = { matcher, fallback: fallback || this.serviceDiscoveryRules[serviceName]?.fallback };
  }
  addServiceDiscoveryRule(serviceName, matcher, fallback) {
    this.serviceDiscoveryRules[serviceName] = { matcher, fallback };
  }

  // Stats for UI/debug
  getDiscoveryStats() {
    const stats = { totalRules: Object.keys(this.serviceDiscoveryRules).length, resolvedApplications: this.applications.size,
                    virtualNodes: 0, physicalNodes: 0, unmatchedDependencies: [] };
    this.applications.forEach((app, name) => {
      (app.nodes || []).forEach(node => node.virtual ? stats.virtualNodes++ : stats.physicalNodes++);
      (app.dependencies || []).forEach(dep => {
        if (!this.serviceDiscoveryRules[dep]) stats.unmatchedDependencies.push(`${name} -> ${dep}`);
      });
    });
    return stats;
  }

  // Health modeling (unchanged shape, simplified here)
  getHealthThresholds(criticality) {
    const t = {
      critical: { warning: 90, critical: 70, failure: 50 },
      high:     { warning: 80, critical: 60, failure: 40 },
      medium:   { warning: 70, critical: 50, failure: 30 },
      low:      { warning: 60, critical: 40, failure: 20 }
    };
    return t[criticality] || t.medium;
  }

  calculateApplicationHealth(appName, currentServers) {
    const app = this.applications.get(appName);
    if (!app) return null;
    const nodes = this.resolveApplicationNodes(app, currentServers);
    if (!nodes.length) {
      return { health: 0, status: "unknown", reason: "No nodes found", nodeDetails: { total: 0, healthy: 0, warning: 0, critical: 0, offline: 0 },
               dependencies: app.dependencies || [], lastNodeResolution: app.lastNodeResolution };
    }
    const scores = nodes.map(n => {
      let s = 100;
      if (n.status === "offline") s = 0;
      else if (n.status === "critical") s = 20;
      else if (n.status === "warning") s = 60;
      else if (n.status === "maintenance") s = 80;
      if (n.metrics) {
        s -= Math.max(0, (n.metrics.cpuUsage || 0) - 80) * 0.5;
        s -= Math.max(0, (n.metrics.memoryUsage || 0) - 80) * 0.5;
        s -= Math.max(0, (n.metrics.networkLatency || 0) - 200) * 0.1;
      }
      return Math.max(0, Math.min(100, s));
    });
    const avg = scores.reduce((a,b) => a+b, 0) / scores.length;
    const thresholds = app.healthThresholds;
    let status = "healthy", reason = "All systems operational";
    if (avg < thresholds.failure) { status = "failure"; reason = "Critical system failure"; }
    else if (avg < thresholds.critical) { status = "critical"; reason = "Multiple system issues detected"; }
    else if (avg < thresholds.warning) { status = "warning"; reason = "Performance degradation detected"; }
    return { health: avg, status, reason, nodeDetails: {
      total: nodes.length,
      healthy: nodes.filter(n => ["online","maintenance","unknown"].includes(n.status)).length,
      warning: nodes.filter(n => n.status === "warning").length,
      critical: nodes.filter(n => n.status === "critical").length,
      offline: nodes.filter(n => n.status === "offline").length
    }, dependencies: app.dependencies || [], resolvedNodes: nodes.map(n => ({ id: n.id, name: n.name, status: n.status })), lastNodeResolution: app.lastNodeResolution };
  }

  getAllApplicationHealth(currentServers) {
    const map = new Map();
    this.applications.forEach((_, name) => map.set(name, this.calculateApplicationHealth(name, currentServers)));
    return map;
  }
}

// ===== 2) PERSONALITIES (kept concise) =====
const SERVER_PERSONALITIES = {
  stable: { name: "Stable Server", description: "Reliable, predictable performance", traits: { volatility: 0.1, degradationRate: 1.0, recoveryRate: 1.0, incidentProneness: 0.5, loadSensitivity: 1.0 } }
};

// Utility
export function assignServerPersonalities(servers = []) { return servers.map(s => ({ ...s, personality: { type: "stable", ...SERVER_PERSONALITIES["stable"], assignedAt: Date.now() } })); }
export function getServerPersonalityName(key) { return (SERVER_PERSONALITIES[key] || SERVER_PERSONALITIES["stable"]).name; }
