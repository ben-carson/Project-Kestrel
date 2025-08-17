// src/core/PermissionManager.ts
import { PermissionError } from "../types/plugin";
import type {
  PermissionChecker,
  PermissionScope,
} from "../types/plugin";

export class PermissionManager {
  private pluginPermissions = new Map<string, Set<string>>();
  private permissionPolicies = new Map<string, boolean>(); // For policy overrides

  validatePermissions(pluginId: string, permissions: string[]): void {
    // Validate permission format
    for (const permission of permissions) {
      if (!this.isValidPermission(permission)) {
        throw new PermissionError(permission, `Invalid permission for ${pluginId}`);
      }
    }

    // Check policy overrides
    const denied = permissions.filter((p) => !this.isPolicyAllowed(pluginId, p));
    if (denied.length > 0) {
      throw new PermissionError(denied[0], `Denied by policy for ${pluginId}`);
    }

    this.pluginPermissions.set(pluginId, new Set(permissions));
  }

  /**
   * Returns a PermissionChecker function bound to a plugin’s granted permissions.
   * Usage: const can = pm.createChecker('plugin-x', perms); if (!can('data.read')) ...
   */
  createChecker(pluginId: string, permissions: string[]): PermissionChecker {
    const set = new Set(permissions);
    return (scope: string) => set.has(scope);
  }

  revokePermission(pluginId: string, permission: string): void {
    const set = this.pluginPermissions.get(pluginId);
    if (set) set.delete(permission);
  }

  grantPermission(pluginId: string, permission: string): void {
    if (!this.isValidPermission(permission)) {
      throw new PermissionError(permission, `Invalid permission`);
    }
    let set = this.pluginPermissions.get(pluginId);
    if (!set) {
      set = new Set();
      this.pluginPermissions.set(pluginId, set);
    }
    set.add(permission);
  }

  getPluginPermissions(pluginId: string): string[] {
    const set = this.pluginPermissions.get(pluginId);
    return set ? Array.from(set) : [];
  }

  private isValidPermission(permission: string): boolean {
    // e.g. "data:read" or "data:metrics.read"
    const re = /^[a-z]+:[a-z]+(\.[a-z]+)?$/;
    return re.test(permission);
  }

  private isPolicyAllowed(pluginId: string, permission: string): boolean {
    const key = `${pluginId}:${permission}`;
    const override = this.permissionPolicies.get(key);
    if (override !== undefined) return override;

    // Default denylist (tune as you need)
    const dangerous = new Set<string>([
      "actions:system.restart",
      "data:config.write",
      "events:system",
    ]);
    return !dangerous.has(permission);
  }

  setPermissionPolicy(pluginId: string, permission: string, allowed: boolean): void {
    const key = `${pluginId}:${permission}`;
    this.permissionPolicies.set(key, allowed);
  }

  /** Throws if not granted */
  assert(pluginId: string, scope: PermissionScope | string): void {
    const set = this.pluginPermissions.get(pluginId);
    if (!set || !set.has(scope)) {
      throw new PermissionError(String(scope), `Plugin ${pluginId} lacks permission`);
    }
  }
}
