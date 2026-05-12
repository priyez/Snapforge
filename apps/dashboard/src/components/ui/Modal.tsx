import React, { useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = 'md' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden`}>
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-subtle)]">
          <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-md hover:bg-[var(--surface-hover)]"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
