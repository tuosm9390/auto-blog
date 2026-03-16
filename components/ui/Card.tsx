import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };
    
    return (
      <div 
        ref={ref} 
        className={`border border-border-subtle rounded-xl bg-surface/30 ${paddings[padding]} ${className}`} 
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
