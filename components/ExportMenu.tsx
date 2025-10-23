import { Menu, Transition } from "@headlessui/react";
import { Download, FileJson, FileSpreadsheet, FileText, FileImage, Check } from "lucide-react";
import { Fragment, useState } from "react";
import toast from "react-hot-toast";

type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel' | 'png';

type ExportMenuProps = {
  onExport: (format: ExportFormat) => void;
  label?: string;
  disabled?: boolean;
  showProgress?: boolean;
  availableFormats?: ExportFormat[];
};

export function ExportMenu({ 
  onExport, 
  label = "Export", 
  disabled = false, 
  showProgress = false,
  availableFormats = ['csv', 'json', 'pdf', 'excel', 'png']
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  const formatOptions = [
    { 
      id: 'csv' as const, 
      label: 'CSV', 
      description: 'Excel-compatible spreadsheet',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    },
    { 
      id: 'json' as const, 
      label: 'JSON', 
      description: 'Structured data format',
      icon: FileJson,
      color: 'text-blue-600'
    },
    { 
      id: 'excel' as const, 
      label: 'Excel', 
      description: 'Advanced spreadsheet (.xls)',
      icon: FileSpreadsheet,
      color: 'text-green-700'
    },
    { 
      id: 'pdf' as const, 
      label: 'PDF', 
      description: 'Print-ready document',
      icon: FileText,
      color: 'text-red-600'
    },
    { 
      id: 'png' as const, 
      label: 'PNG', 
      description: 'Chart image format',
      icon: FileImage,
      color: 'text-purple-600'
    },
  ].filter(option => availableFormats.includes(option.id));

  const handleExport = async (format: ExportFormat) => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportingFormat(format);
    
    try {
      await onExport(format);
      toast.success(`${format.toUpperCase()} export completed!`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        disabled={disabled || isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isExporting ? (
          <>
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            {label}
          </>
        )}
      </Menu.Button>
      
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white border border-gray-200 rounded-lg shadow-xl focus:outline-none z-50">
          <div className="p-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              Export Format
            </div>
            {formatOptions.map((option) => {
              const Icon = option.icon;
              const isCurrentlyExporting = isExporting && exportingFormat === option.id;
              
              return (
                <Menu.Item key={option.id}>
                  {({ active }) => (
                    <button
                      onClick={() => handleExport(option.id)}
                      disabled={isExporting}
                      className={`${
                        active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      } group flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className={`${option.color} ${isCurrentlyExporting ? 'animate-pulse' : ''}`}>
                        {isCurrentlyExporting ? (
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                      {isCurrentlyExporting && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
