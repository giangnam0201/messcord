import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-discord-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-discord-accent text-white hover:bg-discord-accent/80',
        secondary: 'bg-zinc-700 text-zinc-100 hover:bg-zinc-600',
        danger: 'bg-discord-red text-white hover:bg-red-600',
        success: 'bg-discord-green text-white hover:bg-green-600',
        ghost: 'text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100',
        outline: 'border border-zinc-600 text-zinc-300 hover:bg-zinc-700/50 hover:text-zinc-100',
        link: 'text-discord-accent underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
