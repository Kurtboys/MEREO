"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Link2, Plus } from "lucide-react";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string) => void;
}

export function AddLinkModal({ isOpen, onClose, onAdd }: AddLinkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Focus URL input when modal opens
  useEffect(() => {
    if (isOpen && urlInputRef.current) {
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUrl("");
      setTitle("");
      setError("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Validate URL
  const isValidUrl = (urlString: string): boolean => {
    try {
      // Add protocol if missing
      const urlToTest = urlString.startsWith("http") ? urlString : `https://${urlString}`;
      new URL(urlToTest);
      return true;
    } catch {
      return false;
    }
  };

  // Handle submit
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError("");

      if (!url.trim()) {
        setError("URL is required");
        return;
      }

      if (!isValidUrl(url)) {
        setError("Please enter a valid URL");
        return;
      }

      // Normalize URL
      const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

      // Use URL as title if title is empty
      const finalTitle = title.trim() || new URL(normalizedUrl).hostname.replace("www.", "");

      onAdd(normalizedUrl, finalTitle);
      onClose();
    },
    [url, title, onAdd, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-surface border border-border-subtle rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Link2 className="w-4 h-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">Add Link</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-hover text-text-secondary hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* URL Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    URL <span className="text-status-bottleneck">*</span>
                  </label>
                  <input
                    ref={urlInputRef}
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                    }}
                    placeholder="https://example.com"
                    className="w-full px-4 py-3 bg-void border border-border-subtle rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  />
                  {error && (
                    <p className="mt-2 text-sm text-status-bottleneck">{error}</p>
                  )}
                </div>

                {/* Title Input */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Title <span className="text-text-disabled">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Link title (uses URL if empty)"
                    className="w-full px-4 py-3 bg-void border border-border-subtle rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent hover:bg-accent-hover text-void font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Canvas
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
