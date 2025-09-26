"use client";
import {
  MousePointer,
  Minus,
  Square,
  Circle,
  Triangle,
  Type,
  BarChart3,
  TrendingUp,
  Settings,
  History,
  FileText,
  HelpCircle,
} from "lucide-react";

interface LeftSidebarProps {
  isDarkMode?: boolean;
}

export default function LeftSidebar({ isDarkMode = true }: LeftSidebarProps) {
  const tools = [
    { icon: MousePointer, label: "Selection", active: true },
    { icon: Minus, label: "Line" },
    { icon: Square, label: "Rectangle" },
    { icon: Circle, label: "Circle" },
    { icon: Triangle, label: "Triangle" },
    { icon: Type, label: "Text" },
    { icon: BarChart3, label: "Chart Settings" },
    { icon: TrendingUp, label: "Indicators" },
    { icon: History, label: "History" },
    { icon: FileText, label: "Templates" },
    { icon: Settings, label: "Settings" },
    { icon: HelpCircle, label: "Help" },
  ];

  return (
    <div
      className={`w-12 flex flex-col items-center py-2 space-y-1 h-full border-r transition-colors duration-200 ${
        isDarkMode
          ? "bg-[#131722] border-[#2a2e39]"
          : "bg-white border-gray-200"
      }`}
    >
      {tools.map((tool, index) => {
        const Icon = tool.icon;
        return (
          <button
            key={tool.label}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors group relative ${
              tool.active
                ? "bg-blue-600 text-white"
                : isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={tool.label}
          >
            <Icon className="w-4 h-4" />

            {/* Tooltip */}
            <div
              className={`absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${
                isDarkMode ? "bg-gray-900 text-white" : "bg-gray-800 text-white"
              }`}
            >
              {tool.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
