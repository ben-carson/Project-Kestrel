// Enhanced Kestrel useUIStore.ts
// Combines sophisticated dashboard UI management with OS window management
// Supports both legacy widgets and new Kestrel OS apps

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';
import { AppRegistry } from '../components/os/apps/AppRegistry';

// Default user profile
const DEFAULT_USER_PROFILE = {
  id: 'kestrel-user-1',
  name: 'Admin User',
  email: 'admin@kestrel.com',
  role: 'Administrator',
  isPremium: true,
  permissions: ['read', 'write', 'admin'],
  avatar: '/default-avatar.png',
  lastLogin: new Date().toISOString(),
  preferences: {
    theme: 'dark',
    notifications: true,
    autoRefresh: true,
    enableAdvancedFeatures: true
  }
};

// Toast auto-removal timeout
const TOAST_AUTO_REMOVE_DELAY = 5000;

// === TYPE DEFINITIONS ===

// Kestrel permission types
type KestrelPermission =
  | 'ui:window'
  | 'events:publish'
  | 'events:subscribe'
  | 'data:metrics.read'
  | 'data:recommendations.read'
  | 'data:alerts.read'
  | 'data:topology.read'
  | 'data:incidents.read'
  | 'aida:agent.access'
  | 'maia:memory.read'
  | 'maia:memory.write';

// Toast configuration types
type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastConfig {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: ToastAction;
}

// Confirmation modal configuration types
type ConfirmationVariant = 'default' | 'danger' | 'warning';

interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
}

// Valid Kestrel permissions
const VALID_PERMISSIONS: KestrelPermission[] = [
  'ui:window',
  'events:publish',
  'events:subscribe', 
  'data:metrics.read',
  'data:recommendations.read',
  'data:alerts.read',
  'data:topology.read',
  'data:incidents.read',
  'aida:agent.access',
  'maia:memory.read',
  'maia:memory.write'
];

// Permission validation helper
const isValidPermission = (perm: string): perm is KestrelPermission => {
  return VALID_PERMISSIONS.includes(perm as KestrelPermission);
};

// OS Window type
interface OSWindow {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  workspace: number;
  minimized: boolean;
  Component?: React.FC;
}

// Kestrel permission types
type KestrelPermission =
  | 'ui:window'
  | 'events:publish'
  | 'events:subscribe'
  | 'data:metrics.read'
  | 'data:recommendations.read'
  | 'data:alerts.read'
  | 'data:topology.read'
  | 'data:incidents.read'
  | 'aida:agent.access'
  | 'maia:memory.read'
  | 'maia:memory.write';

// Persistence configuration
const uiPersistConfig = {
  name: 'kestrel-ui-state',
  storage: createJSONStorage(() => localStorage),
  version: 1,
  
  partialize: (state: any) => ({
    // Theme and UI preferences
    theme: state.theme,
    isDarkMode: state.isDarkMode,
    
    // OS Window state
    osWindows: state.osWindows.map((win: OSWindow) => ({
      // Only persist serializable window data
      id: win.id,
      appId: win.appId,
      title: win.title,
      x: win.x,
      y: win.y,
      w: win.w,
      h: win.h,
      z: win.z,
      workspace: win.workspace,
      minimized: win.minimized
      // Component is restored during hydration
    })),
    osFocusedId: state.osFocusedId,
    activeWorkspace: state.activeWorkspace,
    
    // User profile (without sensitive data)
    userProfile: {
      ...state.userProfile,
      lastLogin: undefined,
      avatar: undefined
    },
    
    // Dev panel state
    isDevPanelOpen: state.isDevPanelOpen,
    
    // Metadata
    lastSaved: Date.now()
  }),
  
  onRehydrateStorage: () => (state: any, error: any) => {
    if (error) {
      console.error('Kestrel UI state rehydration failed:', error);
      return;
    }
    
    if (state && typeof window !== 'undefined') {
      // Apply theme immediately
      document.documentElement.classList.toggle('dark', state.isDarkMode);
      
      // Restore window components
      state.hydrateRuntime?.();
      
      console.log('Kestrel UI state rehydrated successfully');
    }
  }
};

/**
 * Enhanced Kestrel UI Store
 * Combines sophisticated dashboard UI management with OS window management
 */
export const useUIStore = create(
  persist(
    (set, get) => {
      let zCounter = 10; // Z-index counter for windows

      return {
        // === THEME MANAGEMENT ===
        theme: 'dark',
        isDarkMode: true,

        // === TOAST SYSTEM (Enhanced from dashboard) ===
        toasts: [],
        toastIdCounter: 0,

        // === CONFIRMATION MODALS (Promise-based, no functions in state) ===
        confirmationModal: {
          isOpen: false,
          title: '',
          message: '',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'default' as ConfirmationVariant
        },

        // === KESTREL OS WINDOW MANAGEMENT ===
        osWindows: [] as OSWindow[],
        osFocusedId: null as string | null,
        launcherOpen: false,
        workspaces: 4,
        activeWorkspace: 1,

        // === USER PROFILE ===
        userProfile: DEFAULT_USER_PROFILE,

        // === DEVELOPER PANEL ===
        isDevPanelOpen: false,

        // === UI LOADING STATES ===
        isLoading: false,
        loadingMessage: '',

        // === THEME ACTIONS ===
        toggleTheme: () => {
          set(produce((draft) => {
            draft.theme = draft.theme === 'dark' ? 'light' : 'dark';
            draft.isDarkMode = draft.theme === 'dark';
            
            if (typeof window !== 'undefined') {
              document.documentElement.classList.toggle('dark', draft.isDarkMode);
            }
          }));
        },

        setTheme: (newTheme: string) => {
          if (newTheme !== 'dark' && newTheme !== 'light') {
            console.warn(`Invalid theme: ${newTheme}`);
            return;
          }
          
          set(produce((draft) => {
            draft.theme = newTheme;
            draft.isDarkMode = newTheme === 'dark';
            
            if (typeof window !== 'undefined') {
              document.documentElement.classList.toggle('dark', draft.isDarkMode);
            }
          }));
        },

        // === ENHANCED TOAST SYSTEM (Type-safe) ===
        addToast: (toast: ToastConfig) => {
          const state = get();
          const toastId = state.toastIdCounter + 1;
          const duration = toast.duration || TOAST_AUTO_REMOVE_DELAY;
          
          set(produce((draft) => {
            draft.toastIdCounter = toastId;
            draft.toasts.push({
              id: toastId,
              type: toast.type,
              title: toast.title,
              message: toast.message,
              action: toast.action,
              createdAt: Date.now(),
              persistent: toast.persistent || false
            });
          }));
          
          if (!toast.persistent) {
            setTimeout(() => {
              get().removeToast(toastId);
            }, duration);
          }
          
          return toastId;
        },

        removeToast: (toastId: number) => {
          set(produce((draft) => {
            draft.toasts = draft.toasts.filter((t: any) => t.id !== toastId);
          }));
        },

        clearAllToasts: () => {
          set({ toasts: [] });
        },

        removeOldToasts: (maxAge = 30000) => {
          const cutoffTime = Date.now() - maxAge;
          
          set(produce((draft) => {
            draft.toasts = draft.toasts.filter((toast: any) => 
              (toast.createdAt || 0) > cutoffTime || toast.persistent
            );
          }));
        },

        // === PROMISE-BASED CONFIRMATION MODAL SYSTEM ===
        showConfirmation: (config: ConfirmationConfig): Promise<boolean> => {
          set({
            confirmationModal: {
              isOpen: true,
              title: config.title,
              message: config.message,
              confirmText: config.confirmText || 'Confirm',
              cancelText: config.cancelText || 'Cancel',
              variant: config.variant || 'default'
            }
          });

          // Return a Promise that resolves when user makes a choice
          return new Promise<boolean>((resolve) => {
            // Store the resolver in a way that our action handlers can access it
            (get() as any)._confirmationResolver = resolve;
          });
        },

        hideConfirmation: () => {
          set(produce((draft) => {
            draft.confirmationModal.isOpen = false;
          }));
        },

        executeConfirmation: () => {
          const state = get() as any;
          if (state._confirmationResolver) {
            state._confirmationResolver(true);
            delete state._confirmationResolver;
          }
          get().hideConfirmation();
        },

        cancelConfirmation: () => {
          const state = get() as any;
          if (state._confirmationResolver) {
            state._confirmationResolver(false);
            delete state._confirmationResolver;
          }
          get().hideConfirmation();
        },

        // === KESTREL OS WINDOW MANAGEMENT ===
        openLauncher: () => {
          set({ launcherOpen: true });
        },

        closeLauncher: () => {
          set({ launcherOpen: false });
        },

        launchApp: async (appId: string) => {
          const appManifest = AppRegistry[appId];
          if (!appManifest) {
            throw new Error(`Unknown app: ${appId}`);
          }

          // Validate permissions
          const invalidPerms = appManifest.permissions.filter(p => !isValidPermission(p));
          if (invalidPerms.length > 0) {
            throw new Error(`Invalid permissions: ${invalidPerms.join(', ')}`);
          }

          // Load the app component
          const { default: Component } = await appManifest.mount();
          
          // Find the highest z-index and increment
          const state = get();
          const maxZ = state.osWindows.reduce((max, win) => Math.max(max, win.z || 0), 0);
          zCounter = Math.max(maxZ + 1, zCounter + 1);

          const windowId = `win_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const newWindow: OSWindow = {
            id: windowId,
            appId: appId,
            title: appManifest.title,
            x: 80 + (state.osWindows.length * 20) % 180,
            y: 80 + (state.osWindows.length * 20) % 120,
            w: 980,
            h: 620,
            z: zCounter,
            workspace: state.activeWorkspace,
            minimized: false,
            Component
          };

          set(produce((draft) => {
            draft.osWindows.push(newWindow);
            draft.launcherOpen = false;
            draft.osFocusedId = windowId;
          }));

          return windowId;
        },

        focusWindow: (windowId: string) => {
          set(produce((draft) => {
            const window = draft.osWindows.find((w: OSWindow) => w.id === windowId);
            if (window) {
              window.z = ++zCounter;
              window.minimized = false;
              draft.osFocusedId = windowId;
            }
          }));
        },

        minimizeWindow: (windowId: string) => {
          set(produce((draft) => {
            const window = draft.osWindows.find((w: OSWindow) => w.id === windowId);
            if (window) {
              window.minimized = true;
              if (draft.osFocusedId === windowId) {
                draft.osFocusedId = null;
              }
            }
          }));
        },

        closeWindow: (windowId: string) => {
          set(produce((draft) => {
            draft.osWindows = draft.osWindows.filter((w: OSWindow) => w.id !== windowId);
            if (draft.osFocusedId === windowId) {
              draft.osFocusedId = null;
            }
          }));
        },

        commitMove: (windowId: string, x: number, y: number) => {
          set(produce((draft) => {
            const window = draft.osWindows.find((w: OSWindow) => w.id === windowId);
            if (window) {
              window.x = x;
              window.y = y;
            }
          }));
        },

        commitResize: (windowId: string, w: number, h: number) => {
          set(produce((draft) => {
            const window = draft.osWindows.find((win: OSWindow) => win.id === windowId);
            if (window) {
              window.w = Math.max(380, w);
              window.h = Math.max(240, h);
            }
          }));
        },

        switchWorkspace: (workspace: number) => {
          set({ activeWorkspace: workspace });
        },

        // === WINDOW HYDRATION (For persistence) ===
        hydrateRuntime: async () => {
          const state = get();
          const restored = state.osWindows;
          const next: OSWindow[] = [];

          for (const win of restored) {
            const manifest = AppRegistry[win.appId];
            if (!manifest) continue;

            try {
              const { default: Component } = await manifest.mount();
              next.push({ ...win, Component });
            } catch (error) {
              console.warn(`Failed to restore app ${win.appId}:`, error);
            }
          }

          // Update z-counter based on restored windows
          const maxZ = next.reduce((max, win) => Math.max(max, win.z || 0), 10);
          zCounter = Math.max(maxZ + 1, 10);

          set({ osWindows: next });
        },

        // === DEVELOPER PANEL ===
        toggleDevPanel: () => {
          set(produce((draft) => {
            draft.isDevPanelOpen = !draft.isDevPanelOpen;
          }));
          
          const { isDevPanelOpen } = get();
          get().addToast({
            type: 'info',
            title: `Developer Panel ${isDevPanelOpen ? 'Opened' : 'Closed'}`,
            message: isDevPanelOpen 
              ? 'Debug tools and system diagnostics are now available'
              : 'Developer tools have been hidden',
            duration: 2000
          });
        },

        // === USER PROFILE MANAGEMENT ===
        updateUserProfile: (updates: any) => {
          set(produce((draft) => {
            Object.assign(draft.userProfile, updates);
            draft.userProfile.lastModified = new Date().toISOString();
          }));
          
          get().addToast({
            type: 'success',
            title: 'Profile Updated',
            message: 'Your profile settings have been saved',
            duration: 3000
          });
        },

        updateUserPreferences: (preferences: any) => {
          set(produce((draft) => {
            Object.assign(draft.userProfile.preferences, preferences);
            draft.userProfile.lastModified = new Date().toISOString();
            
            // Apply theme changes immediately
            if (preferences.theme && preferences.theme !== draft.theme) {
              draft.theme = preferences.theme;
              draft.isDarkMode = preferences.theme === 'dark';
              
              if (typeof window !== 'undefined') {
                document.documentElement.classList.toggle('dark', draft.isDarkMode);
              }
            }
          }));
        },

        // === LOADING STATES ===
        setLoading: (loading: boolean, message = '') => {
          set({
            isLoading: loading,
            loadingMessage: message
          });
        },

        // === UTILITY METHODS ===
        getUIStateSummary: () => {
          const state = get();
          return {
            theme: state.theme,
            isDarkMode: state.isDarkMode,
            toastCount: state.toasts.length,
            windowCount: state.osWindows.length,
            activeWorkspace: state.activeWorkspace,
            focusedWindow: state.osFocusedId,
            modalsOpen: {
              confirmation: state.confirmationModal.isOpen,
              launcher: state.launcherOpen,
              devPanel: state.isDevPanelOpen
            },
            userProfile: {
              id: state.userProfile.id,
              name: state.userProfile.name,
              role: state.userProfile.role
            },
            timestamp: new Date().toISOString()
          };
        },

        resetUIState: () => {
          set({
            theme: 'dark',
            isDarkMode: true,
            toasts: [],
            toastIdCounter: 0,
            confirmationModal: {
              isOpen: false,
              title: '',
              message: '',
              confirmText: 'Confirm',
              cancelText: 'Cancel',
              variant: 'default' as ConfirmationVariant
            },
            osWindows: [],
            osFocusedId: null,
            launcherOpen: false,
            activeWorkspace: 1,
            userProfile: DEFAULT_USER_PROFILE,
            isDevPanelOpen: false,
            isLoading: false,
            loadingMessage: ''
          });
          
          if (typeof window !== 'undefined') {
            document.documentElement.classList.add('dark');
          }
          
          get().addToast({
            type: 'info',
            title: 'Kestrel Reset',
            message: 'OS interface has been reset to defaults'
          });
        }
      };
    },
    uiPersistConfig
  )
);

// === UTILITY CONSTANTS ===
export const TOAST_TYPES = {
  SUCCESS: 'success',
  INFO: 'info', 
  WARNING: 'warning',
  ERROR: 'error'
};

export const CONFIRMATION_VARIANTS = {
  DEFAULT: 'default',
  DANGER: 'danger',
  WARNING: 'warning'
};

export const createToast = (
  type: ToastType, 
  title: string, 
  message: string, 
  options: Partial<ToastConfig> = {}
): ToastConfig => ({
  type, 
  title, 
  message, 
  ...options
});

export const createConfirmation = (
  title: string, 
  message: string, 
  options: Partial<ConfirmationConfig> = {}
): ConfirmationConfig => ({
  title, 
  message, 
  ...options
});

export default useUIStore;