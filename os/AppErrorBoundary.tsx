import React from "react";

type Props = { appId: string; children: React.ReactNode };
type State = { hasError: boolean };

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_err: unknown): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    console.error(`[AppError] ${this.props.appId}`, error, info);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full grid place-items-center p-6 text-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">App crashed</h2>
            <p className="text-sm opacity-70 mb-4">[{this.props.appId}]</p>
            <button
              className="px-3 py-1 rounded bg-neutral-700"
              onClick={() => this.setState({ hasError: false })}
            >
              Restart
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
