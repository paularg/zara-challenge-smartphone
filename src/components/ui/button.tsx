import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'focus-outline inline-flex items-center justify-center rounded-none border border-transparent px-8 text-xs leading-4 font-light tracking-[0.08em] uppercase disabled:pointer-events-none disabled:text-disabled-foreground',
  {
    variants: {
      variant: {
        default:
          'bg-action text-primary-foreground hover:bg-action-hover active:bg-action-active disabled:bg-disabled',
        outline:
          'border-action border-[0.5px] bg-transparent text-foreground hover:border-action-hover hover:text-text-hover active:border-action-active disabled:border-disabled-border disabled:bg-transparent',
      },
      size: {
        default: 'h-10',
        medium: 'h-12',
        large: 'h-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

const Button = ({
  asChild = false,
  className,
  size = 'default',
  variant = 'default',
  ...props
}: ButtonProps) => {
  const Component = asChild ? Slot.Root : 'button'

  return (
    <Component
      className={cn(buttonVariants({ className, size, variant }))}
      data-slot="button"
      {...props}
    />
  )
}

export { Button }
