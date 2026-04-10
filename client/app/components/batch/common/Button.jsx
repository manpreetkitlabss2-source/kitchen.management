import React from "react";

/**
 * Tailwind CSS Button Component
 */

const variantClasses = {
  primary: "bg-blue-600 hover:bg-blue-700 text-white",
  secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  success: "bg-emerald-600 hover:bg-emerald-700 text-white",
  outline:
    "border border-gray-300 text-gray-700 hover:bg-gray-100",
};

const sizeClasses = {
  small: "px-3 py-1.5 text-sm",
  medium: "px-4 py-2 text-sm",
  large: "px-6 py-3 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "medium",
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    loading && "cursor-wait",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      )}

      {!loading && icon && iconPosition === "left" && (
        <i className={`mr-1 icon-${icon}`}></i>
      )}

      <span>{children}</span>

      {!loading && icon && iconPosition === "right" && (
        <i className={`ml-1 icon-${icon}`}></i>
      )}
    </button>
  );
};

export default Button;