import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'raised' | 'ghost';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  variant = 'default',
  noPadding = false,
  ...props 
}) => {
  const variants = {
    default: 'bg-[var(--surface)] border-[var(--border-subtle)]',
    raised: 'bg-[var(--surface-raised)] border-[var(--border)]',
    ghost: 'bg-transparent border-dashed border-[var(--border)]',
  };

  return (
    <div 
      className={`card ${variants[variant]} ${noPadding ? '!p-0' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
