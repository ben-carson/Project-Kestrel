//src/lib/storeAdapters.js
import { useDashboardStore } from '../store/useDashboardStore';
import { useUIStore } from '../store/useUIStore';
import { eventBus } from './eventBus';

/**
 * Store Bridge for Legacy Widget Compatibility
 * 
 * This ensures widgets can access their data through existing store hooks
 * while running in the Kestrel window environment.
 */

// Dashboard store should continue working as-is since it connects to your system.js
// No changes needed - it already has the sophisticated server evolution data

// UI Store bridge - map widget notifications to Kestrel toasts
const originalUIStore = useUIStore.getState();

export const bridgeWidgetNotifications = () => {
  // Bridge any widget-specific UI actions to Kestrel's notification system
  // Your widgets already handle their own error boundaries and feedback
  
  // Example: Listen for widget events and create Kestrel notifications
  eventBus.subscribe('kestrel-system', 'widget.notification', (data) => {
    originalUIStore.addToast({
      type: data.type || 'info',
      title: data.title || 'Widget Notification',
      message: data.message || '',
      duration: data.duration || 3000
    });
  });
};

// Initialize the bridge
bridgeWidgetNotifications();