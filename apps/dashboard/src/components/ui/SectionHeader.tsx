import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode; // Actions (buttons, etc)
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, children }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-sans tracking-tight text-[var(--text)]">
          {title}
        </h1>
        {description && (
          <p className="text-[var(--text-muted)] font-sans text-sm">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );
};
