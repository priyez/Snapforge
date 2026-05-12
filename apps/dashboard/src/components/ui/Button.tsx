import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: any;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', icon, iconPosition = 'left', loading, children, ...props }, ref) => {
    const variants = {
      primary: 'btn-primary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20',
    };

    const sizes = {
      sm: 'h-8 px-4 text-xs',
      md: 'h-11 px-6 text-sm',
      lg: 'h-14 px-8 text-base',
    };

    const iconElement = loading ? (
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
    ) : icon ? (
      <HugeiconsIcon icon={icon} size={size === 'sm' ? 14 : 18} className="shrink-0" />
    ) : null;

    return (
      <button
        ref={ref}
        className={`btn ${variants[variant]} ${sizes[size]} ${className} ${loading ? 'opacity-70 pointer-events-none' : ''}`}
        {...props}
      >
        {iconPosition === 'left' && iconElement}
        {children}
        {iconPosition === 'right' && iconElement}
      </button>
    );
  }
);

Button.displayName = 'Button';
