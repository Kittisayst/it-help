"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold mb-2">ເກີດຂໍ້ຜິດພາດ</h2>
          <p className="text-muted text-sm mb-4 text-center max-w-md">
            {this.state.error?.message || "Something went wrong"}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            ລອງໃໝ່
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
