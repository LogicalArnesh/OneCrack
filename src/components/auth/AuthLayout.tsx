import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-3xl border border-border shadow-2xl">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-headline font-bold text-primary">
            OneCrack
          </Link>
          <h2 className="text-3xl font-headline font-bold text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground font-body">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
