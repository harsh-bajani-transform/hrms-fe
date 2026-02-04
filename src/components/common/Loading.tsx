import { Loader2 } from "lucide-react";

export interface LoadingProps {
  /**
   * The main loading title/message
   */
  title?: string;
  /**
   * Optional secondary description
   */
  description?: string;
  /**
   * Size of the spinner
   * @default "default"
   */
  size?: "sm" | "default" | "lg";
  /**
   * Whether to show in full height container (min-h-[400px])
   * @default true
   */
  fullHeight?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
}

const sizeClasses = {
  sm: "w-6 h-6",
  default: "w-8 h-8",
  lg: "w-12 h-12",
};

const titleSizeClasses = {
  sm: "text-sm",
  default: "text-base",
  lg: "text-lg",
};

const descriptionSizeClasses = {
  sm: "text-xs",
  default: "text-sm",
  lg: "text-base",
};

/**
 * Reusable Loading component for consistent loading states across the application.
 * 
 * @example
 * ```tsx
 * <Loading 
 *   title="Loading users..." 
 *   description="Please wait while we fetch the data"
 * />
 * ```
 */
export const Loading = ({
  title = "Loading...",
  description,
  size = "default",
  fullHeight = true,
  className = "",
}: LoadingProps) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullHeight ? "min-h-100" : "py-8"
      } ${className}`}
    >
      <Loader2
        className={`animate-spin text-blue-600 ${sizeClasses[size]}`}
      />
      {title && (
        <p className={`font-medium text-gray-700 ${titleSizeClasses[size]}`}>
          {title}
        </p>
      )}
      {description && (
        <p
          className={`text-gray-500 text-center max-w-md ${descriptionSizeClasses[size]}`}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default Loading;
