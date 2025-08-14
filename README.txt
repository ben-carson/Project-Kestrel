Project Kestrel — Web OS Shell Patch
------------------------------------

This zip contains drop-in files to add an OS-style shell to your existing React/Vite project.

Add/merge the `src/` directory contents into your repo:
- Types/os.types.ts
- components/os/** (DesktopShell, WindowManager, Window, Taskbar, AppLauncher, ContextMenu, AppErrorBoundary, apps/)
- hooks/useGlobalShortcuts.ts
- lib/{eventBus.ts,gateway.ts,appLifecycle.ts}
- store/useUIStore.ts (extend/replace with care; it assumes Zustand + persist)
- App.jsx (use as landing route)

Assumptions:
- You already have `src/components/widgets/WidgetRenderer.jsx` and your widget IDs like `systemHealth` and `securityEvents`.
- Tailwind (or equivalent) utility classes are available, or replace with your CSS.
- Vite will handle mixed TS/JSX files.

After merging:
1) Ensure `src/main.jsx` renders `<App />` (this App.jsx).
2) Run `npm i lucide-react zustand` (if not already installed).
3) `npm run dev` and open the launcher (Ctrl+K) or right-click desktop.

Have fun.
