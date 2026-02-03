import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = ({
  icon: Icon,
  title,
  description,
  actions,
}: PageHeaderProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
};
