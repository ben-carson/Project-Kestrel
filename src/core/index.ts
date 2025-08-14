// src/core/index.ts
export { PluginLoader } from './PluginLoader';
export { PermissionManager } from './PermissionManager';
export { StorageImpl } from './Storage';
export { ThemeManager, DEFAULT_THEME_TOKENS } from './ThemeManager';

// If your EventBus lives in core:
export { EventBusImpl } from './EventBus';
// If it actually lives in lib (uncomment the next line and delete the one above):
// export { EventBusImpl } from '../lib/EventBus';

// Re-export PluginManager once it’s present at ./PluginManager
export { PluginManager } from './PluginManager';
