"use client";
import { useState } from "react";
import { DrawingProvider, useDrawing } from "@/contexts/DrawingContext";
import LeftSidebar from "@/components/trading/LeftSidebar";
import TrendlineDemo from "@/components/trading/TrendlineDemo";

function TestTrendlineContent() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { activeTool } = useDrawing();

  return (
    <div className={`h-screen flex ${isDarkMode ? "bg-[#131722]" : "bg-white"}`}>
      {/* Left Sidebar */}
      <LeftSidebar 
        isDarkMode={isDarkMode}
        onToolSelect={(toolId) => console.log("Tool selected:", toolId)}
        onGroupToggle={(groupId) => console.log("Group toggled:", groupId)}
        onMenuOpen={() => console.log("Menu opened")}
        onSettingsOpen={() => console.log("Settings opened")}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
              Trendline Drawing Test
            </h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`px-4 py-2 rounded ${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"}`}
            >
              Toggle Theme
            </button>
          </div>
        </div>

        {/* Demo Component */}
        <div className="flex-1">
          <TrendlineDemo isDarkMode={isDarkMode} />
        </div>

        {/* Features Info */}
        <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className={`p-3 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <h4 className="font-semibold mb-2">Lines & Shapes</h4>
              <ul className="text-xs space-y-1">
                <li>• Trendline</li>
                <li>• Horizontal/Vertical</li>
                <li>• Rectangle</li>
                <li>• Ellipse</li>
              </ul>
            </div>
            <div className={`p-3 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <h4 className="font-semibold mb-2">Advanced Shapes</h4>
              <ul className="text-xs space-y-1">
                <li>• Triangle</li>
                <li>• Polygon (Multi-point)</li>
                <li>• Arrow</li>
                <li>• Custom shapes</li>
              </ul>
            </div>
            <div className={`p-3 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <h4 className="font-semibold mb-2">Features</h4>
              <ul className="text-xs space-y-1">
                <li>• Snap to grid</li>
                <li>• Visual feedback</li>
                <li>• Selection & editing</li>
                <li>• Cursor options</li>
                <li>• Delete (Del key)</li>
              </ul>
            </div>
            <div className={`p-3 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <h4 className="font-semibold mb-2">Styling</h4>
              <ul className="text-xs space-y-1">
                <li>• Color picker</li>
                <li>• Stroke width</li>
                <li>• Opacity control</li>
                <li>• Quick presets</li>
              </ul>
            </div>
            <div className={`p-3 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <h4 className="font-semibold mb-2">Cursor Options</h4>
              <ul className="text-xs space-y-1">
                <li>• Click Cursor/Selection Tool</li>
                <li>• Choose cursor type</li>
                <li>• Mũi tên, Đường chéo</li>
                <li>• Dấu chấm, Minh họa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestTrendlinePage() {
  return (
    <DrawingProvider>
      <TestTrendlineContent />
    </DrawingProvider>
  );
}
