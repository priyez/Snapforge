import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  description?: string;
  icon?: any;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, description, icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && <label className="form-label">{label}</label>}
        <div className="relative">
          {icon && (
            <HugeiconsIcon 
              icon={icon} 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" 
            />
          )}
          <input
            ref={ref}
            className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-red-500/50 focus:border-red-500' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{error}</p>}
        {description && <p className="text-[10px] text-[var(--text-muted)] font-mono">{description}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
