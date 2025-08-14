import React from 'react';

export class AppErrorBoundary extends React.Component<{ appId: string, children: React.ReactNode }, { hasError: boolean }> {
  constructor(props:any){
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(){
    return { hasError: true };
  }
  componentDidCatch(error:any, info:any){
    console.error(`[AppError] ${this.props.appId}`, error, info);
  }
  render(){
    if (this.state.hasError) {
      return (
        <div className="h-full w-full grid place-items-center p-6 text-center">
          <div>
            <h2 className="text-lg font-semibold mb-2">App crashed</h2>
            <p className="text-sm opacity-70 mb-4">[{this.props.appId}]</p>
            <button className="px-3 py-1 rounded bg-neutral-700" onClick={() => this.setState({ hasError:false })}>Restart</button>
          </div>
        </div>
      );
    }
    return this.props.children as any;
  }
}
