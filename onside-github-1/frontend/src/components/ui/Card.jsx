import { forwardRef } from 'react'
import { classNames } from '../../domain/formatters'

export const Card = forwardRef(function Card({ variant = 'secondary', className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={classNames(
        variant === 'primary' ? 'glass-primary' : 'glass-secondary',
        'rounded-2xl p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
