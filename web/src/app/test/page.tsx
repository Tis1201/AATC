"use client";

import { useState, useRef } from "react";
import LeftSidebar from "@/components/trading/LeftSidebar";
import { DrawingProvider } from "@/contexts/DrawingContext";

export default function TestPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
  const handleToolSelect = (toolId: string) => {
    console.log("Tool selected:", toolId);
  };
  
  const handleGroupToggle = (groupId: string) => {
    console.log("Group toggled:", groupId);
  };
  
  const handleMenuOpen = () => {
    console.log("Menu opened");
  };
  
  const handleSettingsOpen = () => {
    console.log("Settings opened");
  };

  return (
    <DrawingProvider>
      <div className="flex h-screen">
        <LeftSidebar 
          isDarkMode={isDarkMode}
          onToolSelect={handleToolSelect}
          onGroupToggle={handleGroupToggle}
          onMenuOpen={handleMenuOpen}
          onSettingsOpen={handleSettingsOpen}
        />
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Drawing Tools Test</h1>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Toggle {isDarkMode ? "Light" : "Dark"} Mode
            </button>
          </div>
          
          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden relative">
            <div 
              ref={chartContainerRef}
              className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
              style={{ 
                backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }}
            >
              <div className="text-center p-8 bg-white/80 rounded-lg shadow-lg">
                <h2 className="text-xl font-semibold mb-2">Chart Area</h2>
                <p className="text-gray-600 mb-4">Use the drawing tools on the left to draw on this chart</p>
                <div className="flex justify-center space-x-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Instructions:</h3>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              <li>Select a drawing tool from the left sidebar</li>
              <li>Click and drag on the chart area to draw</li>
              <li>Press ESC to return to selection mode</li>
              <li>Use Delete tool to clear all drawings</li>
              <li>Use Lock tool to prevent further editing</li>
              <li>Use Visibility tool to hide/show drawings</li>
            </ul>
          </div>
        </div>
      </div>
    </DrawingProvider>
  );
}