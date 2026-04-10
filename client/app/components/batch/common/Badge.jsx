import React from "react";

/**
 * Tailwind CSS Badge Component
 * Props:
 * - children: node
 * - variant: primary | success | warning | danger | secondary | info
 * - size: small | medium
 * - className: string
 */

const variantClasses = {
  primary: "bg-blue-100 text-blue-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  secondary: "bg-gray-100 text-gray-700",
  info: "bg-cyan-100 text-cyan-700",
};

const sizeClasses = {
  small: "px-2 py-0.5 text-xs",
  medium: "px-2.5 py-1 text-sm",
};

const Badge = ({
  children,
  variant = "primary",
  size = "small",
  className = "",
}) => {
  const classes = [
    "inline-flex items-center font-medium rounded-full",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
};

export default Badge;