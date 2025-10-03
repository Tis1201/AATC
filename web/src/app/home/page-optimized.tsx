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
