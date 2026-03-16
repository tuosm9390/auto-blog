import React from 'react';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export function PageContainer({ className = '', maxWidth = 'md', children, ...props }: PageContainerProps) {
  const maxW = {
    sm: 'max-w-3xl',
    md: 'max-w-4xl',
    lg: 'max-w-5xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className={`${maxW[maxWidth]} mx-auto px-4 py-12 md:py-16 animate-fade-in-up ${className}`} {...props}>
      {children}
    </div>
  );
}
