import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
  errorStack: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: '',
    errorStack: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message, errorStack: error.stack || '' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an uncaught exception:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMsg: '', errorStack: '' });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-red-500/30 p-6 rounded-2xl text-center space-y-4 font-sans text-slate-100 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20 font-bold text-lg">
              ⚠
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-base text-white">SECTION ERROR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We couldn't load this section of MobiFin. Please try again or return to the main dashboard.
              </p>
              <div className="text-[10px] text-red-400/80 bg-red-950/40 p-2.5 rounded border border-red-900/30 font-mono mt-2 break-all text-left space-y-1">
                <div><strong>Route:</strong> {window.location.pathname}</div>
                <div><strong>Error:</strong> {this.state.errorMsg}</div>
                {this.state.errorStack && (
                  <div className="mt-2 overflow-x-auto whitespace-pre-wrap max-h-48 bg-black/40 p-2 rounded text-[9.5px]">
                    <strong>Stack:</strong> {this.state.errorStack}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="bg-emerald-600 hover:bg-emerald-500 border-none text-white rounded-lg py-2.5 font-bold text-xs cursor-pointer shadow-md transition-colors w-full"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
