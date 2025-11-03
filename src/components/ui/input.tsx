import * as React from "react"
import { cn } from "../../lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border-input focus:border-healthcare-blue focus:ring-2 focus:ring-healthcare-blue/20 hover:border-healthcare-blue/50",
        glass: "glass-card border-border/30 focus:border-healthcare-blue focus:ring-2 focus:ring-healthcare-blue/20 backdrop-blur-md",
        premium: "border-2 border-healthcare-blue/30 focus:border-healthcare-blue focus:ring-2 focus:ring-healthcare-blue/30 focus:shadow-lg focus:shadow-healthcare-blue/10 hover:border-healthcare-blue/50",
        floating: "border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-healthcare-blue/30 focus:shadow-lg hover:bg-muted/70",
      },
      inputSize: {
        default: "h-10 px-3 py-2",
        sm: "h-8 px-2 py-1 text-xs",
        lg: "h-12 px-4 py-3 text-base",
        xl: "h-14 px-5 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, icon, rightIcon, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    
    return (
      <div className="relative">
        {icon && (
          <div className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors duration-200",
            isFocused && "text-healthcare-blue"
          )}>
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            inputVariants({ variant, inputSize }),
            icon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          {...props}
        />
        {rightIcon && (
          <div className={cn(
            "absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors duration-200",
            isFocused && "text-healthcare-blue"
          )}>
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }

