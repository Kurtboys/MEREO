"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertCircle, Info, X, Rocket, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast types
type ToastType = "success" | "error" | "info" | "mission" | "checkpoint";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  // Convenience methods
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
  missionComplete: (missionTitle: string) => void;
  checkpointComplete: (checkpointTitle: string) => void;
  dayStarted: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Toast icons
const toastIcons: Record<ToastType, typeof Check> = {
  success: Check,
  error: AlertCircle,
  info: Info,
  mission: Rocket,
  checkpoint: Flag,
};

// Toast colors
const toastColors: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: "bg-status-complete/10",
    border: "border-status-complete/30",
    icon: "text-status-complete",
  },
  error: {
    bg: "bg-status-bottleneck/10",
    border: "border-status-bottleneck/30",
    icon: "text-status-bottleneck",
  },
  info: {
    bg: "bg-accent/10",
    border: "border-accent/30",
    icon: "text-accent",
  },
  mission: {
    bg: "bg-status-complete/10",
    border: "border-status-complete/30",
    icon: "text-status-complete",
  },
  checkpoint: {
    bg: "bg-status-active/10",
    border: "border-status-active/30",
    icon: "text-status-active",
  },
};

// Single Toast Component
function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const Icon = toastIcons[toast.type];
  const colors = toastColors[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "w-80 rounded-lg border shadow-xl backdrop-blur-sm overflow-hidden",
        colors.bg,
        colors.border
      )}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0 mt-0.5", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{toast.title}</p>
          {toast.description && (
            <p className="text-xs text-text-secondary mt-1">{toast.description}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// Toast Provider
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const duration = toast.duration ?? 3000;

      setToasts((prev) => [...prev, { ...toast, id }]);

      // Auto-dismiss
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Convenience methods
  const success = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "success", title, description });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "error", title, description, duration: 5000 });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) => {
      addToast({ type: "info", title, description });
    },
    [addToast]
  );

  const missionComplete = useCallback(
    (missionTitle: string) => {
      addToast({
        type: "mission",
        title: "Mission Complete!",
        description: missionTitle,
      });
    },
    [addToast]
  );

  const checkpointComplete = useCallback(
    (checkpointTitle: string) => {
      addToast({
        type: "checkpoint",
        title: "Checkpoint Complete",
        description: checkpointTitle,
      });
    },
    [addToast]
  );

  const dayStarted = useCallback(() => {
    addToast({
      type: "success",
      title: "Day Started",
      description: "Good luck with your missions!",
    });
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        success,
        error,
        info,
        missionComplete,
        checkpointComplete,
        dayStarted,
      }}
    >
      {children}

      {/* Toast Container - Fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
