import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ZapIcon } from '@hugeicons/core-free-icons';
import { CodeWindow } from './CodeWindow';

export function FeatureRow({ title, description, code, language, imageElement, reversed }: { title: string, description: string, code?: string, language?: string, imageElement?: React.ReactNode, reversed?: boolean }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
      <div className={`space-y-6 ${reversed ? 'lg:order-2' : ''}`}>
        <div className="flex items-center gap-3 text-white">
          <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
            <HugeiconsIcon icon={ZapIcon} size={18} />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        </div>
        <p className="text-zinc-400 text-lg leading-relaxed">{description}</p>
      </div>
      <div className={reversed ? 'lg:order-1' : ''}>
        {imageElement ? (
          imageElement
        ) : (
          <CodeWindow code={code || ''} language={language} />
        )}
      </div>
    </div>
  );
}
