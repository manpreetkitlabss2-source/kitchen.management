import React, { useEffect } from "react";
import ReactDOM from "react-dom";

/**
 * Tailwind CSS Modal Component
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - title: string
 * - children: node
 * - size: small | medium | large | xl
 * - footer: node
 * - closeOnBackdropClick: boolean
 * - showCloseButton: boolean
 */

const sizeClasses = {
  small: "max-w-sm",
  medium: "max-w-lg",
  large: "max-w-2xl",
  xl: "max-w-4xl",
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  footer,
  closeOnBackdropClick = true,
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-xl flex flex-col animate-in fade-in zoom-in-95`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {title}
          </h2>

          {showCloseButton && (
            <button
              onClick={onClose}
              aria-label="ClosModale modal"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    modalContent,
    document.getElementById("modal-root") || document.body
  );
};

export default Modal;
