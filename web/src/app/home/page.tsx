"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Timeframe } from "@/lib/types";
import { useChart } from "@/lib/hooks/useChart";
import { useTradingPosition } from "@/lib/hooks/useTradingPosition";
import { useScreenshot } from "@/lib/hooks/useScreenshot";
import { useTheme } from "@/contexts/ThemeContext";
import { DrawingProvider, useDrawing } from "@/contexts/DrawingContext";
import { useLayoutManager } from "@/lib/hooks/useLayoutManager";
import { useChartResize } from "@/lib/hooks/useChartResize";
import TopNavigation from "@/components/trading/TopNavigation";
import StockInfoBar from "@/components/trading/StockInfoBar";
import LeftSidebar from "@/components/trading/LeftSidebar";
import ChartSection from "@/components/trading/ChartSection";
import AccountManagerSection from "@/components/trading/AccountManagerSection";
import WatchlistSection from "@/components/trading/WatchlistSection";
import StockInfoSection from "@/components/trading/StockInfoSection";
import NewsSection from "@/components/trading/NewsSection";
import ResizableDivider from "@/components/trading/ResizableDivider";

interface TradingPageProps {
  symbol?: string;
}

/**
 * Complete TradingView-style Trading Platform
 * Implements comprehensive trading interface with all required components
 */
export default function TradingPlatformWrapper(props: TradingPageProps) {
  return (
    <DrawingProvider>
      <TradingPlatform {...props} />
    </DrawingProvider>
  );
}

function TradingPlatform({ symbol = "VIC.VN" }: TradingPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Core state
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [selectedSymbol, setSelectedSymbol] = useState(symbol);
  const [ohlcData, setOhlcData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
  } | null>(null);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick");
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);

  // Custom hooks
  const { theme, toggleTheme } = useTheme();
  const { tradingPosition, handleBuy, handleSell, updateLastPrice } = useTradingPosition();
  const { downloadScreenshot } = useScreenshot();
  const { activeTool, setActiveTool } = useDrawing();
  const { triggerChartResize } = useChartResize(containerRef);
  const layoutManager = useLayoutManager();

  const isDarkMode = theme === "dark";

  // Chart management
  useChart({
    containerRef,
    symbol: selectedSymbol,
    timeframe,
    onPriceUpdate: updateLastPrice,
    onOHLCUpdate: setOhlcData,
    onVolumeUpdate: setCurrentVolume,
    isDarkMode,
    showRSI,
    showMACD,
    chartType,
    isPrivateMode,
  });

  // Effect to handle split changes
  useEffect(() => {
    const isAnyDragging = 
      layoutManager.chartAccountLayout.isDragging ||
      layoutManager.horizontalLayout.isDragging ||
      layoutManager.watchlistLayout.isDragging ||
      layoutManager.stockInfoLayout.isDragging;

    if (isAnyDragging) {
      triggerChartResize();
    } else {
      const timeout = setTimeout(() => {
        triggerChartResize();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [
    layoutManager.chartAccountLayout.split,
    layoutManager.horizontalLayout.split,
    layoutManager.watchlistLayout.split,
    layoutManager.stockInfoLayout.split,
    layoutManager.chartAccountLayout.isDragging,
    layoutManager.horizontalLayout.isDragging,
    layoutManager.watchlistLayout.isDragging,
    layoutManager.stockInfoLayout.isDragging,
    triggerChartResize,
  ]);

  // Event handlers
  const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  }, []);

  const handleSymbolChange = useCallback((newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  }, []);

  const handleBuyClick = useCallback(() => {
    handleBuy();
  }, [handleBuy]);

  const handleSellClick = useCallback(() => {
    handleSell();
  }, [handleSell]);

  const handleScreenshot = useCallback(async () => {
    try {
      const chartElement = containerRef.current;
      if (chartElement) {
        await downloadScreenshot(
          chartElement,
          `${selectedSymbol}_${timeframe}_${new Date().toISOString().split("T")[0]}.png`,
          {
            onSuccess: () => console.log("Screenshot downloaded successfully!"),
            onError: (error) => console.error("Screenshot failed:", error),
          }
        );
      }
    } catch (error) {
      console.error("Screenshot error:", error);
    }
  }, [downloadScreenshot, selectedSymbol, timeframe]);

  const handleToolSelect = useCallback((toolId: string) => {
    console.log("Selected tool:", toolId);
    setActiveTool(toolId as any);
  }, [setActiveTool]);

  const handleGroupToggle = useCallback((groupId: string) => {
    console.log("Group toggled:", groupId);
  }, []);

  const handleMenuOpen = useCallback(() => {
    console.log("Menu opened");
  }, []);
  
  const handleSettingsOpen = useCallback(() => {
    console.log("Settings opened");
  }, []);

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-200 ${
        isDarkMode ? "bg-[#131722]" : "bg-white"
      }`}
    >
      {/* Top Navigation Bar */}
      <TopNavigation
        symbol={selectedSymbol}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleTheme}
        onSymbolChange={handleSymbolChange}
        chartType={chartType}
        onChartTypeChange={setChartType}
        showRSI={showRSI}
        showMACD={showMACD}
        onToggleRSI={() => setShowRSI(!showRSI)}
        onToggleMACD={() => setShowMACD(!showMACD)}
        onScreenshot={handleScreenshot}
        isPrivateMode={isPrivateMode}
        onTogglePrivateMode={() => setIsPrivateMode(!isPrivateMode)}
      />

      {/* Stock Info Bar */}
      <StockInfoBar
        symbol={selectedSymbol}
        ohlcData={ohlcData}
        isDarkMode={isDarkMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar 
          isDarkMode={isDarkMode}
          onToolSelect={handleToolSelect}
          onGroupToggle={handleGroupToggle}
          onMenuOpen={handleMenuOpen}
          onSettingsOpen={handleSettingsOpen}
        />

        {/* Main Grid Area */}
        <div ref={layoutManager.mainContainerRef} className="flex-1 flex gap-2 p-2">
          {/* Left Section - Chart and Account Manager */}
          <div
            ref={layoutManager.leftColumnRef}
            className="grid gap-2 transition-none"
            style={{
              width: `${layoutManager.horizontalLayout.split}%`,
              gridTemplateRows: `${layoutManager.chartAccountLayout.split}fr 12px ${
                100 - layoutManager.chartAccountLayout.split
              }fr`,
            }}
          >
            {/* Chart Panel */}
            <ChartSection
              containerRef={containerRef}
              ohlcData={ohlcData}
              selectedSymbol={selectedSymbol}
              isDarkMode={isDarkMode}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              onBuyClick={handleBuyClick}
              onSellClick={handleSellClick}
              currentPrice={ohlcData?.close || tradingPosition.lastPrice || 245.3}
              change={ohlcData?.change || 0}
              changePercent={ohlcData?.changePercent || 0}
              showRSI={showRSI}
              showMACD={showMACD}
              onToggleRSI={() => setShowRSI(!showRSI)}
              onToggleMACD={() => setShowMACD(!showMACD)}
              isDragging={layoutManager.chartAccountLayout.isDragging}
              currentVolume={currentVolume}
              dayRange={{
                low: ohlcData?.low || 240.21,
                high: ohlcData?.high || 246.3,
              }}
              fiftyTwoWeekRange={{
                low: selectedSymbol.includes(".VN") ? 180500 : 180.5,
                high: selectedSymbol.includes(".VN") ? 260800 : 260.8,
              }}
            />

            {/* Vertical Divider */}
            <ResizableDivider
              isVertical={true}
              isDragging={layoutManager.chartAccountLayout.isDragging}
              onMouseDown={(e) => layoutManager.chartAccountLayout.handleMouseDown(e, true)}
              title={
                layoutManager.isAccountCollapsed
                  ? "Account Manager is collapsed"
                  : "Drag up/down to resize chart and account manager heights"
              }
              splitPercentage={layoutManager.chartAccountLayout.split}
              isDisabled={layoutManager.isAccountCollapsed}
              isDarkMode={isDarkMode}
            />

            {/* Account Manager Section */}
            <AccountManagerSection
              tradingPosition={tradingPosition}
              isDarkMode={isDarkMode}
              isDragging={layoutManager.chartAccountLayout.isDragging}
              isAccountCollapsed={layoutManager.isAccountCollapsed}
              isAccountMaximized={layoutManager.isAccountMaximized}
              chartAccountSplit={layoutManager.chartAccountLayout.split}
              onCollapsePanel={layoutManager.handleCollapsePanel}
              onOpenPanel={layoutManager.handleOpenPanel}
              onMaximizePanel={layoutManager.handleMaximizePanel}
              onRestorePanel={layoutManager.handleRestorePanel}
            />
          </div>

          {/* Horizontal Divider */}
          <ResizableDivider
            isVertical={false}
            isDragging={layoutManager.horizontalLayout.isDragging}
            onMouseDown={(e) => layoutManager.horizontalLayout.handleMouseDown(e, false)}
            onDoubleClick={layoutManager.horizontalLayout.resetSplit}
            title="Drag left/right to resize sections | Double-click to reset"
            splitPercentage={layoutManager.horizontalLayout.split}
            isDarkMode={isDarkMode}
          />

          {/* Right Section */}
          <div
            ref={layoutManager.rightSectionRef}
            className="grid gap-2 transition-none"
            style={{
              width: `${100 - layoutManager.horizontalLayout.split}%`,
              gridTemplateRows: `${layoutManager.watchlistLayout.split}fr 12px ${layoutManager.stockInfoLayout.split}fr 12px ${
                100 - layoutManager.watchlistLayout.split - layoutManager.stockInfoLayout.split
              }fr`,
            }}
          >
            {/* Watchlist Section */}
            <WatchlistSection
              selectedSymbol={selectedSymbol}
              onSymbolSelect={handleSymbolChange}
              isDarkMode={isDarkMode}
            />

            {/* Watchlist to Stock Info Divider */}
            <ResizableDivider
              isVertical={true}
              isDragging={layoutManager.watchlistLayout.isDragging}
              onMouseDown={(e) => layoutManager.watchlistLayout.handleMouseDown(e, true)}
              title="Drag up/down to resize watchlist and stock info sections"
              splitPercentage={layoutManager.watchlistLayout.split}
              isDarkMode={isDarkMode}
            />

            {/* Stock Info Section */}
            <StockInfoSection
              selectedSymbol={selectedSymbol}
              isDarkMode={isDarkMode}
              currentVolume={currentVolume}
            />

            {/* Stock Info to News Divider */}
            <ResizableDivider
              isVertical={true}
              isDragging={layoutManager.stockInfoLayout.isDragging}
              onMouseDown={(e) => layoutManager.stockInfoLayout.handleMouseDown(e, true)}
              title="Drag up/down to resize stock info and news sections"
              splitPercentage={layoutManager.stockInfoLayout.split + layoutManager.watchlistLayout.split}
              isDarkMode={isDarkMode}
            />

            {/* News Section */}
            <NewsSection isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}

  const handleSymbolChange = (newSymbol: string) => {
    setSelectedSymbol(newSymbol);
  };

  const handleBuyClick = () => {
    handleBuy();
  };

  const handleSellClick = () => {
    handleSell();
  };

  // Screenshot handler
  const handleScreenshot = async () => {
    try {
      const chartElement = containerRef.current;
      if (chartElement) {
        await downloadScreenshot(
          chartElement,
          `${selectedSymbol}_${timeframe}_${
            new Date().toISOString().split("T")[0]
          }.png`,
          {
            onSuccess: () => {
              console.log("Screenshot downloaded successfully!");
            },
            onError: (error) => {
              console.error("Screenshot failed:", error);
            },
          }
        );
      }
    } catch (error) {
      console.error("Screenshot error:", error);
    }
  };

  // Account panel control functions
  const handleCollapsePanel = useCallback(() => {
    if (!isAccountCollapsed) {
      setPreviousSplit(chartAccountSplit);
      setChartAccountSplit(95); // Almost fully collapsed, leaving space for header
      setIsAccountCollapsed(true);
      setIsAccountMaximized(false);
    }
  }, [chartAccountSplit, isAccountCollapsed]);

  const handleOpenPanel = useCallback(() => {
    setChartAccountSplit(50); // 50/50 split
    setIsAccountCollapsed(false);
    setIsAccountMaximized(false);
    setPreviousSplit(50);
  }, []);

  const handleMaximizePanel = useCallback(() => {
    if (!isAccountMaximized) {
      setPreviousSplit(chartAccountSplit);
      setChartAccountSplit(5); // Almost fully maximized account panel
      setIsAccountMaximized(true);
      setIsAccountCollapsed(false);
    }
  }, [chartAccountSplit, isAccountMaximized]);

  const handleRestorePanel = useCallback(() => {
    setChartAccountSplit(previousSplit);
    setIsAccountMaximized(false);
    setIsAccountCollapsed(false);
  }, [previousSplit]);

  // Horizontal layout helper functions
  const handleResetHorizontalLayout = useCallback(() => {
    setHorizontalSplit(75); // Reset to default 75/25 split
    setPreviousHorizontalSplit(75);
  }, []);

  // Double-click handler for horizontal divider to reset layout
  const handleHorizontalDividerDoubleClick = useCallback(() => {
    handleResetHorizontalLayout();
  }, [handleResetHorizontalLayout]);

  // Enhanced resizable divider with immediate smooth updates
  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't allow dragging when collapsed
      if (isAccountCollapsed) return;

      e.preventDefault();
      setIsDragging(true);

      const leftColumn = leftColumnRef.current;
      if (!leftColumn) return;

      const startY = e.clientY;
      const containerRect = leftColumn.getBoundingClientRect();
      const containerHeight = containerRect.height - 12; // Subtract divider height
      const startSplit = chartAccountSplit;

      // Debounce state updates for smoother performance
      let lastUpdateTime = 0;
      const updateThreshold = 8; // Update every 8ms (~120fps)

      const handleMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - lastUpdateTime < updateThreshold) return;
        lastUpdateTime = now;

        // Use requestAnimationFrame for smooth updates during drag
        requestAnimationFrame(() => {
          const deltaY = e.clientY - startY;
          const deltaPercentage = (deltaY / containerHeight) * 100;
          let newSplit = startSplit + deltaPercentage;

          // Enhanced constraints with smooth easing near boundaries
          const minSplit = 5;
          const maxSplit = 95;

          if (newSplit < minSplit) {
            newSplit = minSplit + (newSplit - minSplit) * 0.1; // Ease into boundary
          } else if (newSplit > maxSplit) {
            newSplit = maxSplit + (newSplit - maxSplit) * 0.1; // Ease into boundary
          }

          newSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));

          // Update split immediately for real-time visual feedback
          setChartAccountSplit(newSplit);

          // Auto-collapse/maximize based on drag position with smooth thresholds
          if (newSplit >= 92) {
            setIsAccountCollapsed(true);
            setIsAccountMaximized(false);
          } else if (newSplit <= 8) {
            setIsAccountMaximized(true);
            setIsAccountCollapsed(false);
          } else {
            setIsAccountCollapsed(false);
            setIsAccountMaximized(false);
          }
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Store the final position as previous split if not collapsed/maximized
        if (!isAccountCollapsed && !isAccountMaximized) {
          setPreviousSplit(chartAccountSplit);
        }

        // Add smooth transition back after drag ends
        if (leftColumnRef.current) {
          leftColumnRef.current.style.transition =
            "grid-template-rows 0.2s ease-out";
          setTimeout(() => {
            if (leftColumnRef.current) {
              leftColumnRef.current.style.transition = "";
            }
          }, 200);
        }

        // Final resize to ensure everything is properly sized
        setTimeout(() => {
          triggerChartResize();
        }, 100);
      };

      // Prevent text selection and show resize cursor
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      chartAccountSplit,
      isAccountCollapsed,
      isAccountMaximized,
      triggerChartResize,
    ]
  );

  // Horizontal resizable divider handler
  const handleHorizontalDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsHorizontalDragging(true);

      const mainContainer = mainContainerRef.current;
      if (!mainContainer) return;

      const startX = e.clientX;
      const containerRect = mainContainer.getBoundingClientRect();
      const containerWidth = containerRect.width - 8; // Subtract divider width
      const startSplit = horizontalSplit;

      // Debounce state updates for smoother performance
      let lastUpdateTime = 0;
      const updateThreshold = 8; // Update every 8ms (~120fps)

      const handleMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - lastUpdateTime < updateThreshold) return;
        lastUpdateTime = now;

        requestAnimationFrame(() => {
          const deltaX = e.clientX - startX;
          const deltaPercentage = (deltaX / containerWidth) * 100;
          let newSplit = startSplit + deltaPercentage;

          // Smooth constraints with easing near boundaries
          const minSplit = 40;
          const maxSplit = 90;

          if (newSplit < minSplit) {
            newSplit = minSplit + (newSplit - minSplit) * 0.1; // Ease into boundary
          } else if (newSplit > maxSplit) {
            newSplit = maxSplit + (newSplit - maxSplit) * 0.1; // Ease into boundary
          }

          newSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));

          // Update split immediately for real-time visual feedback
          setHorizontalSplit(newSplit);

          // Trigger chart resize for smooth experience
          triggerChartResize();
        });
      };

      const handleMouseUp = () => {
        setIsHorizontalDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Store the final position as previous split
        setPreviousHorizontalSplit(horizontalSplit);

        // Add smooth transition back after drag ends
        if (mainContainerRef.current) {
          mainContainerRef.current.style.transition = "all 0.2s ease-out";
          setTimeout(() => {
            if (mainContainerRef.current) {
              mainContainerRef.current.style.transition = "";
            }
          }, 200);
        }

        // Final resize to ensure everything is properly sized
        setTimeout(() => {
          triggerChartResize();
        }, 100);
      };

      // Prevent text selection and show resize cursor
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
    },
    [horizontalSplit, triggerChartResize]
  );

  // Right section watchlist divider handler (between watchlist and stock info)
  const handleRightWatchlistDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsRightWatchlistDragging(true);

      const rightSection = rightSectionRef.current;
      if (!rightSection) return;

      const startY = e.clientY;
      const containerRect = rightSection.getBoundingClientRect();
      const containerHeight = containerRect.height - 24; // Subtract divider heights (2 * 12px)
      const startSplit = rightWatchlistSplit;

      // Debounce state updates for smoother performance
      let lastUpdateTime = 0;
      const updateThreshold = 8; // Update every 8ms (~120fps)

      const handleMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - lastUpdateTime < updateThreshold) return;
        lastUpdateTime = now;

        requestAnimationFrame(() => {
          const deltaY = e.clientY - startY;
          const deltaPercentage = (deltaY / containerHeight) * 100;
          let newSplit = startSplit + deltaPercentage;

          // Smooth constraints with easing near boundaries
          const minSplit = 20;
          const maxSplit = 70;

          if (newSplit < minSplit) {
            newSplit = minSplit + (newSplit - minSplit) * 0.1; // Ease into boundary
          } else if (newSplit > maxSplit) {
            newSplit = maxSplit + (newSplit - maxSplit) * 0.1; // Ease into boundary
          }

          newSplit = Math.max(minSplit, Math.min(maxSplit, newSplit));

          // Update split immediately for real-time visual feedback
          setRightWatchlistSplit(newSplit);
        });
      };

      const handleMouseUp = () => {
        setIsRightWatchlistDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Add smooth transition back after drag ends
        if (rightSectionRef.current) {
          rightSectionRef.current.style.transition =
            "grid-template-rows 0.2s ease-out";
          setTimeout(() => {
            if (rightSectionRef.current) {
              rightSectionRef.current.style.transition = "";
            }
          }, 200);
        }
      };

      // Prevent text selection and show resize cursor
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
    },
    [rightWatchlistSplit]
  );

  // Right section stock info divider handler (between stock info and news)
  const handleRightStockInfoDividerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsRightStockInfoDragging(true);

      const rightSection = rightSectionRef.current;
      if (!rightSection) return;

      const startY = e.clientY;
      const containerRect = rightSection.getBoundingClientRect();
      const containerHeight = containerRect.height - 24; // Subtract divider heights (2 * 12px)
      const startSplit = rightStockInfoSplit;

      // Debounce state updates for smoother performance
      let lastUpdateTime = 0;
      const updateThreshold = 8; // Update every 8ms (~120fps)

      const handleMouseMove = (e: MouseEvent) => {
        const now = performance.now();
        if (now - lastUpdateTime < updateThreshold) return;
        lastUpdateTime = now;

        requestAnimationFrame(() => {
          const deltaY = e.clientY - startY;
          const deltaPercentage = (deltaY / containerHeight) * 100;
          let newSplit = startSplit + deltaPercentage;

          // Smooth constraints with easing near boundaries
          const minStockInfo = 15;
          const maxStockInfo = Math.min(60, 100 - rightWatchlistSplit);

          if (newSplit < minStockInfo) {
            newSplit = minStockInfo + (newSplit - minStockInfo) * 0.1; // Ease into boundary
          } else if (newSplit > maxStockInfo) {
            newSplit = maxStockInfo + (newSplit - maxStockInfo) * 0.1; // Ease into boundary
          }

          newSplit = Math.max(minStockInfo, Math.min(maxStockInfo, newSplit));

          // Update split immediately for real-time visual feedback
          setRightStockInfoSplit(newSplit);
        });
      };

      const handleMouseUp = () => {
        setIsRightStockInfoDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";

        // Add smooth transition back after drag ends
        if (rightSectionRef.current) {
          rightSectionRef.current.style.transition =
            "grid-template-rows 0.2s ease-out";
          setTimeout(() => {
            if (rightSectionRef.current) {
              rightSectionRef.current.style.transition = "";
            }
          }, 200);
        }
      };

      // Prevent text selection and show resize cursor
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";

      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp);
    },
    [rightStockInfoSplit, rightWatchlistSplit]
  );

  return (
    <div
      className={`h-screen flex flex-col transition-colors duration-200 ${
        isDarkMode ? "bg-[#131722]" : "bg-white"
      }`}
    >
      {/* Top Navigation Bar */}
      <TopNavigation
        symbol={selectedSymbol}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleTheme}
        onSymbolChange={handleSymbolChange}
        chartType={chartType}
        onChartTypeChange={setChartType}
        showRSI={showRSI}
        showMACD={showMACD}
        onToggleRSI={() => setShowRSI(!showRSI)}
        onToggleMACD={() => setShowMACD(!showMACD)}
        onScreenshot={handleScreenshot}
        isPrivateMode={isPrivateMode}
        onTogglePrivateMode={() => setIsPrivateMode(!isPrivateMode)}
      />

      {/* Stock Info Bar */}
      <StockInfoBar
        symbol={selectedSymbol}
        ohlcData={ohlcData}
        isDarkMode={isDarkMode}
      />

      {/* Main Content Area - Fixed Layout with Left Sidebar + 2-Column Grid */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Sidebar - Always Visible */}
        <LeftSidebar 
          isDarkMode={isDarkMode}
          onToolSelect={handleToolSelect}
          onGroupToggle={handleGroupToggle}
          onMenuOpen={handleMenuOpen}
          onSettingsOpen={handleSettingsOpen}
        />

        {/* Main Grid Area - Horizontal Resizable Layout */}
        <div ref={mainContainerRef} className="flex-1 flex gap-2 p-2">
          {/* Left Section - Chart and Account Manager */}
          <div
            ref={leftColumnRef}
            className="grid gap-2 transition-none"
            style={{
              width: `${horizontalSplit}%`,
              gridTemplateRows: `${chartAccountSplit}fr 12px ${
                100 - chartAccountSplit
              }fr`,
            }}
          >
            {/* Chart Panel - Main UI with optimized rendering */}
            <ChartSection
              containerRef={containerRef}
              ohlcData={ohlcData}
              selectedSymbol={selectedSymbol}
              isDarkMode={isDarkMode}
              timeframe={timeframe}
              onTimeframeChange={handleTimeframeChange}
              onBuyClick={handleBuyClick}
              onSellClick={handleSellClick}
              currentPrice={
                ohlcData?.close || tradingPosition.lastPrice || 245.3
              }
              change={ohlcData?.change || 0}
              changePercent={ohlcData?.changePercent || 0}
              showRSI={showRSI}
              showMACD={showMACD}
              onToggleRSI={() => setShowRSI(!showRSI)}
              onToggleMACD={() => setShowMACD(!showMACD)}
              isDragging={isDragging}
              currentVolume={currentVolume}
              dayRange={{
                low: ohlcData?.low || 240.21,
                high: ohlcData?.high || 246.3,
              }}
              fiftyTwoWeekRange={{
                low: selectedSymbol.includes(".VN") ? 180500 : 180.5,
                high: selectedSymbol.includes(".VN") ? 260800 : 260.8,
              }}
            />

            {/* Replace the vertical divider and account manager section */}
            <ResizableDivider
              isVertical={true}
              isDragging={isDragging}
              onMouseDown={handleDividerMouseDown}
              title={
                isAccountCollapsed
                  ? "Account Manager is collapsed"
                  : "Drag up/down to resize chart and account manager heights"
              }
              splitPercentage={chartAccountSplit}
              isDisabled={isAccountCollapsed}
              isDarkMode={isDarkMode}
            />

            <AccountManagerSection
              tradingPosition={tradingPosition}
              isDarkMode={isDarkMode}
              isDragging={isDragging}
              isAccountCollapsed={isAccountCollapsed}
              isAccountMaximized={isAccountMaximized}
              chartAccountSplit={chartAccountSplit}
              onCollapsePanel={handleCollapsePanel}
              onOpenPanel={handleOpenPanel}
              onMaximizePanel={handleMaximizePanel}
              onRestorePanel={handleRestorePanel}
            />
          </div>

          {/* Replace horizontal divider */}
          <ResizableDivider
            isVertical={false}
            isDragging={isHorizontalDragging}
            onMouseDown={handleHorizontalDividerMouseDown}
            onDoubleClick={handleHorizontalDividerDoubleClick}
            title="Drag left/right to resize sections | Double-click to reset"
            splitPercentage={horizontalSplit}
            isDarkMode={isDarkMode}
          />

          {/* Replace right section with components */}
          <div
            ref={rightSectionRef}
            className="grid gap-2 transition-none"
            style={{
              width: `${100 - horizontalSplit}%`,
              gridTemplateRows: `${rightWatchlistSplit}fr 12px ${rightStockInfoSplit}fr 12px ${
                100 - rightWatchlistSplit - rightStockInfoSplit
              }fr`,
            }}
          >
            {/* Watchlist Section */}
            <WatchlistSection
              selectedSymbol={selectedSymbol}
              onSymbolSelect={handleSymbolChange}
              isDarkMode={isDarkMode}
            />

            {/* Watchlist to Stock Info Divider */}
            <ResizableDivider
              isVertical={true}
              isDragging={isRightWatchlistDragging}
              onMouseDown={handleRightWatchlistDividerMouseDown}
              title="Drag up/down to resize watchlist and stock info sections"
              splitPercentage={rightWatchlistSplit}
              isDarkMode={isDarkMode}
            />

            {/* Stock Info Section */}
            <StockInfoSection
              selectedSymbol={selectedSymbol}
              isDarkMode={isDarkMode}
              currentVolume={currentVolume}
            />

            {/* Stock Info to News Divider */}
            <ResizableDivider
              isVertical={true}
              isDragging={isRightStockInfoDragging}
              onMouseDown={handleRightStockInfoDividerMouseDown}
              title="Drag up/down to resize stock info and news sections"
              splitPercentage={rightStockInfoSplit + rightWatchlistSplit}
              isDarkMode={isDarkMode}
            />

            {/* News Section */}
            <NewsSection isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </div>
  );
}