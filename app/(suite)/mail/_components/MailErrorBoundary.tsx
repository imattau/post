"use client";

import { Component } from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class MailErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error("[MailErrorBoundary]", error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[MailErrorBoundary] component stack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-dock">
          <div className="text-center p-8">
            <h2 className="text-[18px] font-semibold text-danger mb-2">Something went wrong</h2>
            <p className="text-text-secondary text-[13px] mb-4">
              An error occurred in the mail view. Try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-[10px] bg-brand text-white text-[13px] font-medium cursor-pointer hover:brightness-110 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
