// ======================================================
// File: src/components/ErrorBoundary.tsx
// ======================================================

/*
  [ErrorBoundary 역할]
  
  - React 컴포넌트 트리에서 발생한 에러를 캐치
  - 에러 발생 시 Fallback UI 표시
  - 사용자에게 친화적인 에러 메시지 제공
*/

"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error | null; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 에러 로깅 (나중에 Sentry 등으로 전송 가능)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// 기본 에러 Fallback UI
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error | null;
  resetError: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle size={48} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>
        {error && process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-red-50 rounded-md text-left">
            <p className="text-sm font-mono text-red-800 break-all">{error.message}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetError}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
          <button
            onClick={() => router.push("/home")}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            <Home size={18} />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

