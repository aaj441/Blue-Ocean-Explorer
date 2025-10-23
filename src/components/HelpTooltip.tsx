import { HelpCircle } from "lucide-react";
import { useState } from "react";

interface HelpTooltipProps {
  content: string;
  title?: string;
  className?: string;
}

export function HelpTooltip({ content, title, className = "" }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          {title && (
            <p className="font-semibold mb-1">{title}</p>
          )}
          <p className="text-gray-200 leading-relaxed">{content}</p>
        </div>
      )}
    </div>
  );
}
