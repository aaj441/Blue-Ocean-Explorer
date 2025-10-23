import React from "react";
import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ size = "md", className = "", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  );
}

interface LoadingCardProps {
  title?: string;
  description?: string;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function LoadingCard({ 
  title = "Loading...", 
  description, 
  showProgress = false,
  progress = 0,
  className = "" 
}: LoadingCardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 rounded-full p-2">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
      
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export function Skeleton({ className = "", lines = 1, height = "h-4" }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${height} ${className}`} />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 rounded ${height} ${
            i === lines - 1 ? "w-3/4" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}

interface StatusIndicatorProps {
  status: "loading" | "success" | "error" | "pending";
  message?: string;
  className?: string;
}

export function StatusIndicator({ status, message, className = "" }: StatusIndicatorProps) {
  const statusConfig = {
    loading: {
      icon: Loader2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      text: "Loading...",
      animate: "animate-spin"
    },
    success: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      text: "Success",
      animate: ""
    },
    error: {
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      text: "Error",
      animate: ""
    },
    pending: {
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      text: "Pending",
      animate: ""
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${config.bgColor} rounded-full p-1`}>
        <Icon className={`w-4 h-4 ${config.color} ${config.animate}`} />
      </div>
      <span className={`text-sm font-medium ${config.color}`}>
        {message || config.text}
      </span>
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  onCancel?: () => void;
}

export function LoadingOverlay({ isVisible, message, progress, onCancel }: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4">
        <div className="text-center">
          <div className="bg-blue-100 rounded-full p-4 w-fit mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {message || "Processing..."}
          </h3>
          
          {progress !== undefined && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface RetryButtonProps {
  onRetry: () => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function RetryButton({ onRetry, isLoading = false, error, className = "" }: RetryButtonProps) {
  return (
    <div className={`text-center ${className}`}>
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}
      <button
        onClick={onRetry}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Retrying...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Try Again
          </>
        )}
      </button>
    </div>
  );
}

// Skeleton components for common layouts
export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton lines={3} />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4, className = "" }: { 
  rows?: number; 
  columns?: number; 
  className?: string; 
}) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading chart...</p>
        </div>
      </div>
    </div>
  );
}