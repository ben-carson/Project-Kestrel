// src/core/registrar.ts
import type {
  Registrar,
  TabRegistration,
  WidgetRegistration,
  ServiceRegistration,
  PluginContext,
  SystemItemRegistration,
} from "../types/plugin"; // NOTE: adjust casing to "../Types/plugin" if your tree uses 'Types'

export class HostRegistrar implements Registrar {
  public readonly tabs: TabRegistration[] = [];
  public readonly widgets: WidgetRegistration[] = [];
  public readonly services: ServiceRegistration[] = [];
  public readonly systemItems: SystemItemRegistration[] = [];

  constructor(
    private ctx: PluginContext,
    private hasPermission: (id: string) => boolean = () => true,
    private isEnabled: (flag?: string) => boolean = () => true
  ) {}

  requirePermission(permId: string): void {
    if (!this.hasPermission(permId)) {
      throw new Error(`Permission denied: ${permId}`);
    }
  }

  addTab(reg: TabRegistration): void {
    if (reg.featureFlag && !this.isEnabled(reg.featureFlag)) return;
    if (reg.requiredPermissions?.some((p) => !this.hasPermission(p))) return;
    this.tabs.push(reg);
  }

  addWidget(reg: WidgetRegistration): void {
    if (reg.featureFlag && !this.isEnabled(reg.featureFlag)) return;
    if (reg.requiredPermissions?.some((p) => !this.hasPermission(p))) return;
    this.widgets.push(reg);
  }

  addService(reg: ServiceRegistration): void {
    if (reg.featureFlag && !this.isEnabled(reg.featureFlag)) return;
    if (reg.requiredPermissions?.some((p) => !this.hasPermission(p))) return;
    this.services.push(reg);
  }

  addSystemItem(reg: SystemItemRegistration): void {
    if (reg.featureFlag && !this.isEnabled(reg.featureFlag)) return;
    if (reg.requiredPermissions?.some((p) => !this.hasPermission(p))) return;
    this.systemItems.push(reg);
  }
}
