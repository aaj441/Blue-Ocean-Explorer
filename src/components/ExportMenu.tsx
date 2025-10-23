import { Menu } from "@headlessui/react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

type ExportMenuProps = {
  onExport: (format: 'csv' | 'json') => void;
  label?: string;
  disabled?: boolean;
};

export function ExportMenu({ onExport, label = "Export", disabled = false }: ExportMenuProps) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button
        disabled={disabled}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Download className="w-4 h-4" />
        {label}
      </Menu.Button>
      
      <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-lg shadow-lg focus:outline-none z-10">
        <div className="p-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => onExport('csv')}
                className={`${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export as CSV
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => onExport('json')}
                className={`${
                  active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                } group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors`}
              >
                <FileJson className="w-4 h-4" />
                Export as JSON
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
}
