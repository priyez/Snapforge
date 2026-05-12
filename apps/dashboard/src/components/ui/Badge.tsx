import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: '',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <div
      className={`badge py-1 text-[8px] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
