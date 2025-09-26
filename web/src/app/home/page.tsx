"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { Timeframe } from "@/lib/types";
import { useChart } from "@/lib/hooks/useChart";
import { useTradingPosition } from "@/lib/hooks/useTradingPosition";
import { useScreenshot } from "@/lib/hooks/useScreenshot";
import { useTheme } from "@/contexts/ThemeContext";
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
export default function TradingPlatform({
  symbol = "VIC.VN",
}: TradingPageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  // Chart type state
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">(
    "candlestick"
  );

  // Indicator state management
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  // Vertical split state for chart vs account manager
  const [chartAccountSplit, setChartAccountSplit] = useState(70); // 70% chart, 30% account
  const [isDragging, setIsDragging] = useState(false);
  const [isAccountCollapsed, setIsAccountCollapsed] = useState(false);
  const [isAccountMaximized, setIsAccountMaximized] = useState(false);
  const [previousSplit, setPreviousSplit] = useState(70); // Store previous split for restore
  const leftColumnRef = useRef<HTMLDivElement>(null);

  // Horizontal split state for left section vs right section
  const [horizontalSplit, setHorizontalSplit] = useState(75); // 75% left, 25% right
  const [isHorizontalDragging, setIsHorizontalDragging] = useState(false);
  const [previousHorizontalSplit, setPreviousHorizontalSplit] = useState(75);
  const mainContainerRef = useRef<HTMLDivElement>(null);

  // Right section vertical split state (watchlist | stock info | news)
  const [rightWatchlistSplit, setRightWatchlistSplit] = useState(40); // 40% watchlist
  const [rightStockInfoSplit, setRightStockInfoSplit] = useState(30); // 30% stock info, 30% news
  const [isRightWatchlistDragging, setIsRightWatchlistDragging] =
    useState(false);
  const [isRightStockInfoDragging, setIsRightStockInfoDragging] =
    useState(false);
  const rightSectionRef = useRef<HTMLDivElement>(null);

  // Animation frame ref for smoother updates
  const animationFrameRef = useRef<number | null>(null);
  const lastResizeTimeRef = useRef<number>(0);

  // Theme context
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  // Trading position management
  const { tradingPosition, handleBuy, handleSell, updateLastPrice } =
    useTradingPosition();

  // Screenshot functionality
  const { downloadScreenshot } = useScreenshot();

  // Chart management with technical indicators and chart type
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
  });

  // Optimized chart resize function with throttling
  const triggerChartResize = useCallback(() => {
    const now = Date.now();

    // Cancel previous animation frame if pending
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Use requestAnimationFrame for smooth 60fps updates
    animationFrameRef.current = requestAnimationFrame(() => {
      // Only trigger resize if enough time has passed (throttle to ~60fps)
      if (now - lastResizeTimeRef.current >= 16) {
        const resizeEvent = new CustomEvent("chartResize");
        window.dispatchEvent(resizeEvent);
        lastResizeTimeRef.current = now;
      }
    });
  }, []);

  // Add resize observer to handle chart resizing when grid height changes
  useEffect(() => {
    const chartContainer = containerRef.current;
    if (!chartContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      triggerChartResize();
    });

    resizeObserver.observe(chartContainer);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [triggerChartResize]);

  // Effect to handle split changes - immediate resize during drag
  useEffect(() => {
    if (
      isDragging ||
      isHorizontalDragging ||
      isRightWatchlistDragging ||
      isRightStockInfoDragging
    ) {
      // During drag, resize immediately for real-time feedback
      triggerChartResize();
    } else {
      // After drag ends, do one final resize with small delay
      const timeout = setTimeout(() => {
        triggerChartResize();
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [
    chartAccountSplit,
    horizontalSplit,
    rightWatchlistSplit,
    rightStockInfoSplit,
    isDragging,
    isHorizontalDragging,
    isRightWatchlistDragging,
    isRightStockInfoDragging,
    triggerChartResize,
  ]);

  const handleTimeframeChange = (newTimeframe: Timeframe) => {
    setTimeframe(newTimeframe);
  };

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
          const maxStockInfo = Math.min(60, 90 - rightWatchlistSplit);

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
        <LeftSidebar isDarkMode={isDarkMode} />

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
