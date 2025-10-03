"use client";
import { useState, useEffect } from "react";
import { useDrawing } from "@/contexts/DrawingContext";
import { drawingService } from "@/lib/drawing-service";
import { tools, ToolItem } from "@/lib/data/tools";
import CursorPopupMenu from "./CursorPopupMenu";

interface LeftSidebarProps {
  isDarkMode?: boolean;
  onToolSelect?: (toolId: string) => void;
  onGroupToggle?: (groupId: string) => void;
  onMenuOpen?: () => void;
  onSettingsOpen?: () => void;
}

export default function LeftSidebar({ 
  isDarkMode = true,
  onToolSelect,
  onGroupToggle,
  onMenuOpen,
  onSettingsOpen
}: LeftSidebarProps) {
  const { activeTool, setActiveTool } = useDrawing();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [cursorMenuOpen, setCursorMenuOpen] = useState(false);
  const [cursorMenuPosition, setCursorMenuPosition] = useState({ x: 0, y: 0 });



  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key to select the selection tool
      if (e.key === "Escape") {
        setActiveTool("selection");
        if (onToolSelect) onToolSelect("selection");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onToolSelect, setActiveTool]);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
    
    if (onGroupToggle) onGroupToggle(groupName);
  };

  const handleCursorSelect = (cursorType: 'diagonal' | 'dot' | 'arrow' | 'illustration') => {
    console.log('LeftSidebar: Setting cursor type:', cursorType);
    drawingService.setCursorType(cursorType);
    // Ensure selection tool remains active after cursor selection
    setActiveTool("selection");
    if (onToolSelect) onToolSelect("selection");
  };

  const handleCursorMenuClose = () => {
    setCursorMenuOpen(false);
    // Ensure selection tool remains active when menu closes
    setActiveTool("selection");
  };

  const handleToolSelect = (toolId: string) => {
    // Special handling for menu and settings
    if (toolId === "menu") {
      if (onMenuOpen) onMenuOpen();
      return;
    }
    
    if (toolId === "settings") {
      if (onSettingsOpen) onSettingsOpen();
      return;
    }
    
    // Handle selection tool - open popup menu
    if (toolId === "selection") {
      // Calculate position for popup menu (right side of sidebar)
      const sidebarWidth = 280; // Approximate sidebar width
      const popupX = sidebarWidth + 20; // 20px gap from sidebar
      const popupY = 100; // Fixed Y position
      
      setCursorMenuPosition({ x: popupX, y: popupY });
      setCursorMenuOpen(true);
      setActiveTool("selection");
      if (onToolSelect) onToolSelect("selection");
      return;
    }
    
    // Special handling for action tools
    switch (toolId) {
      case "delete":
        drawingService.clearAllDrawings();
        if (onToolSelect) onToolSelect(toolId);
        return;
      case "lock":
        drawingService.lockAllDrawings();
        if (onToolSelect) onToolSelect(toolId);
        return;
      case "visibility":
        drawingService.toggleVisibility();
        if (onToolSelect) onToolSelect(toolId);
        return;
      default:
        // Regular tool selection
        setActiveTool(toolId as any);
        if (onToolSelect) onToolSelect(toolId);
    }
  };


  return (
    <>
    <div
      className={`w-12 flex flex-col items-center py-2 space-y-1 h-full border-r transition-colors duration-200 ${
        isDarkMode
          ? "bg-[#131722] border-[#2a2e39]"
          : "bg-white border-gray-200"
      }`}
      style={{ zIndex: 50 }}
    >
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isOpen = openGroups[tool.id] || false;
        
        if (tool.type === "group") {
          return (
            <div key={tool.id} className="w-full flex flex-col items-center">
              <button
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors group relative ${
                  isDarkMode
                    ? "text-gray-400 hover:text-white hover:bg-gray-800"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
                title={tool.label}
                onClick={() => toggleGroup(tool.id)}
              >
                <Icon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                
                {/* Group Tooltip */}
                <div
                  className={`absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${
                    isDarkMode ? "bg-gray-900 text-white" : "bg-gray-800 text-white"
                  }`}
                  style={{ minWidth: "200px", textAlign: "left" }}
                >
                  <div className="font-medium">{tool.label}</div>
                  {tool.description && (
                    <div className="text-[10px] opacity-75 mt-1 whitespace-pre-line">{tool.description}</div>
                  )}
                </div>
              </button>
              
              {/* Submenu items */}
              {isOpen && tool.submenu && (
                <div className="flex flex-col items-center mt-1 space-y-1">
                  {tool.submenu.map((subItem) => {
                    const SubIcon = subItem.icon;
                    return (
                      <button
                        key={subItem.id}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                          activeTool === subItem.id
                            ? "bg-blue-600 text-white"
                            : isDarkMode
                            ? "text-gray-500 hover:text-white hover:bg-gray-800"
                            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        title={subItem.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (subItem.type === "tool") {
                            setActiveTool(subItem.id as any);
                            if (onToolSelect) onToolSelect(subItem.id);
                          }
                        }}
                      >
                        <SubIcon className="w-3 h-3" />
                        
                        {/* Submenu Tooltip */}
                        <div
                          className={`absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${
                            isDarkMode ? "bg-gray-900 text-white" : "bg-gray-800 text-white"
                          }`}
                          style={{ minWidth: "150px", textAlign: "left" }}
                        >
                          <div className="font-medium">{subItem.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        
        return (
          <button
            key={tool.id}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors group relative ${
              activeTool === tool.id
                ? "bg-blue-600 text-white"
                : isDarkMode
                ? "text-gray-400 hover:text-white hover:bg-gray-800"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            title={`${tool.label}${tool.hotkey ? ` (${tool.hotkey})` : ''}`}
            data-tool-id={tool.id}
            onClick={() => handleToolSelect(tool.id)}
          >
            <Icon className="w-4 h-4" />
            
            {/* Tooltip */}
            <div
              className={`absolute left-full ml-2 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none ${
                isDarkMode ? "bg-gray-900 text-white" : "bg-gray-800 text-white"
              }`}
              style={{ minWidth: "200px", textAlign: "left" }}
            >
              <div className="font-medium">{tool.label}</div>
              {tool.hotkey && (
                <div className="text-[10px] opacity-75 mt-1">Hotkey: {tool.hotkey}</div>
              )}
              {tool.description && (
                <div className="text-[10px] opacity-75 mt-1 whitespace-pre-line">{tool.description}</div>
              )}
            </div>
          </button>
        );
      })}
    </div>

    {/* Cursor Popup Menu */}
    <CursorPopupMenu
      isDarkMode={isDarkMode}
      isOpen={cursorMenuOpen}
      onClose={handleCursorMenuClose}
      onCursorSelect={handleCursorSelect}
      position={cursorMenuPosition}
    />
    </>
  );
}