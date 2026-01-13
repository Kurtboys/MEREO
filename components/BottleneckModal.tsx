"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface BottleneckModalProps {
  isOpen: boolean;
  missionTitle?: string;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

/**
 * Modal for marking a mission as bottlenecked
 * Allows optional reason input
 */
export function BottleneckModal({
  isOpen,
  missionTitle,
  onClose,
  onConfirm,
}: BottleneckModalProps) {
  const [reason, setReason] = useState("");

  // Reset reason when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(reason.trim() || undefined);
    setReason("");
  }, [reason, onConfirm]);

  // Handle enter key in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      handleConfirm();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-void/85 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl shadow-2xl pointer-events-auto">
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-status-bottleneck/20 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-6 h-6 text-status-bottleneck" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black">
                        What&apos;s blocking this mission?
                      </h2>
                      <p className="text-sm text-text-secondary mt-0.5">
                        Optional - helps you remember later
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 text-text-disabled hover:text-text-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mission being bottlenecked */}
                {missionTitle && (
                  <div className="mt-4 px-3 py-2 bg-void/50 rounded-lg border border-border-subtle">
                    <p className="text-sm text-text-secondary">Bottlenecking:</p>
                    <p className="font-medium text-text-primary truncate">
                      {missionTitle}
                    </p>
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="px-6 pb-6">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Waiting on client feedback, need more research, blocked by another task..."
                  className="w-full h-28 px-4 py-3 bg-void border border-border-subtle rounded-xl text-text-primary placeholder:text-text-disabled resize-none focus:outline-none focus:border-accent transition-colors"
                  autoFocus
                />
                <p className="text-xs text-text-disabled mt-2">
                  Press ⌘+Enter to confirm
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex items-center justify-between">
                <button
                  onClick={onClose}
                  className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="px-6 py-3 bg-status-bottleneck hover:bg-status-bottleneck/90 text-void font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Skip to Next Mission
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
