import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

// Catches render-time crashes in whatever page is mounted below it so one broken
// page shows a contained fallback instead of blanking the entire app. Give this a
// `key` that changes with the route (see App.tsx) so navigating away recovers it.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('GridLock crashed while rendering:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white gap-4 px-6 text-center">
          <div className="text-4xl">🏁</div>
          <h1 className="text-xl font-black uppercase tracking-tight">Something went off track</h1>
          <p className="text-sm text-gray-500 max-w-sm font-mono">
            {this.state.error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
              className="px-5 py-2.5 rounded-xl bg-[#e10600] text-sm font-bold hover:bg-[#ff1a12] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
