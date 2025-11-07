"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import TopNavigation from "@/components/trading/TopNavigation";
import MultiTabChartLayout from "@/components/trading/MultiTabChartLayout";
import ChartSection from "@/components/trading/ChartSection";
import { ChartLayout } from "@/components/trading/ChartLayoutSelector";
import { useChart, useScreenshot } from "@/lib/hooks";

import { Timeframe } from "@/lib/types";

export default function TradingPage() {
  const { theme } = useTheme(); // Removed toggleTheme since we only use dark mode
  const isDarkMode = true; // Always use dark mode

  // Chart state
  const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
  const [timeframe, setTimeframe] = useState<Timeframe>("1D");
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">(
    "candlestick"
  );
  const [chartLayout, setChartLayout] = useState<ChartLayout>("single");
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);
  const [enableLightningMode, setEnableLightningMode] = useState(false);

  // Chart container ref
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Initialize chart hook - use compatible timeframe for useChart
  const chartHook = useChart({
    containerRef: chartContainerRef,
    symbol: selectedSymbol,
    timeframe:
      timeframe === "1m"
        ? "1D"
        : timeframe === "5m"
        ? "1D"
        : timeframe === "15m"
        ? "1D"
        : timeframe === "30m"
        ? "1D"
        : timeframe, // Convert incompatible timeframes
    showRSI,
    showMACD,
    chartType,
    isDarkMode,
    onPriceUpdate: (price) => {
      console.log("Price updated:", price);
    },
  });

  // Screenshot functionality
  const { downloadScreenshot } = useScreenshot();

  // Handle screenshot
  const handleScreenshot = async () => {
    if (chartContainerRef.current) {
      try {
        await downloadScreenshot(
          chartContainerRef.current,
          `${selectedSymbol}_${timeframe}_${Date.now()}`,
          {
            quality: 1.0,
            backgroundColor: isDarkMode ? "#131722" : "#ffffff",
          }
        );
      } catch (error) {
        console.error("Screenshot failed:", error);
      }
    }
  };

  // Demo OHLC data for testing
  const demoOHLCData = {
    open: 150.25,
    high: 155.8,
    low: 148.9,
    close: 153.45,
    change: 3.2,
    changePercent: 2.13,
  };

  const demoCurrentPrice = 153.45;
  const demoChange = 3.2;
  const demoChangePercent = 2.13;
  const demoVolume = 25647382;
  const demoDayRange = { low: 148.9, high: 155.8 };
  const demo52WeekRange = { low: 124.17, high: 182.94 };

  // Handle buy/sell actions
  const handleBuy = () => {
    console.log(`Buy ${selectedSymbol} at ${demoCurrentPrice}`);
    // TODO: Implement buy logic
  };

  const handleSell = () => {
    console.log(`Sell ${selectedSymbol} at ${demoCurrentPrice}`);
    // TODO: Implement sell logic
  };

  // Handle chart save
  const handleSaveChart = () => {
    console.log("Chart saved!");
    // This is handled by the TopNavigation component
  };

  // Handle chart load
  const handleLoadChart = (chartId: string) => {
    console.log("Loading chart:", chartId);
    // TODO: Implement chart loading logic
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 bg-[#131722] text-white`}
    >
      {/* Top Navigation with all new features */}
      <TopNavigation
        symbol={selectedSymbol}
        timeframe={timeframe}
        onTimeframeChange={(tf) => setTimeframe(tf)}
        isDarkMode={isDarkMode}
        onSymbolChange={setSelectedSymbol}
        chartType={chartType}
        onChartTypeChange={setChartType}
        showRSI={showRSI}
        showMACD={showMACD}
        onToggleRSI={() => setShowRSI(!showRSI)}
        onToggleMACD={() => setShowMACD(!showMACD)}
        onScreenshot={handleScreenshot}
        onSaveChart={handleSaveChart}
      />

      {/* Main Content Area */}
      <div className="flex-1 p-4">
        {/* Multi-tab Chart Layout with enhanced features */}
        <MultiTabChartLayout
          isDarkMode={isDarkMode}
          onTabChange={(tabId) => console.log("Tab changed:", tabId)}
          onSymbolChange={setSelectedSymbol}
          onTimeframeChange={setTimeframe}
        >
          {/* Chart Section with all features */}
          <ChartSection
            containerRef={chartContainerRef}
            ohlcData={demoOHLCData}
            selectedSymbol={selectedSymbol}
            isDarkMode={isDarkMode}
            timeframe={timeframe}
            onTimeframeChange={(tf) => setTimeframe(tf)}
            onBuyClick={handleBuy}
            onSellClick={handleSell}
            currentPrice={demoCurrentPrice}
            change={demoChange}
            changePercent={demoChangePercent}
            showRSI={showRSI}
            showMACD={showMACD}
            onToggleRSI={() => setShowRSI(!showRSI)}
            onToggleMACD={() => setShowMACD(!showMACD)}
            isDragging={false}
            currentVolume={demoVolume}
            dayRange={demoDayRange}
            fiftyTwoWeekRange={demo52WeekRange}
          />
        </MultiTabChartLayout>
      </div>

      {/* Status Bar */}
      <div
        className={`border-t px-4 py-2 text-sm transition-colors duration-300 border-[#2a2e39] bg-[#1e222d]`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-gray-500">Symbol: {selectedSymbol}</span>
            <span className="text-gray-500">Timeframe: {timeframe}</span>
            <span className="text-gray-500">Layout: {chartLayout}</span>
            <span className="text-gray-500">RSI: {showRSI ? "ON" : "OFF"}</span>
            <span className="text-gray-500">
              MACD: {showMACD ? "ON" : "OFF"}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-500">
              Lightning Mode: {enableLightningMode ? "ON" : "OFF"}
            </span>
            <span className="text-gray-500">Theme: {theme}</span>
            {/* Loading state removed as we're using demo data */}
          </div>
        </div>
      </div>

      {/* Feature Showcase Panel (for demonstration) */}
      <div
        className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg border transition-colors duration-300 bg-[#1e222d] border-[#2a2e39]`}
      >
        <h3 className="text-sm font-semibold mb-2">
          🎉 New Features Available!
        </h3>
        <ul className="text-xs space-y-1">
          <li>✅ Multiple Chart Layouts (2x1, 2x2, 3x1, etc.)</li>
          <li>✅ Undo/Redo for Drawing Tools & Indicators</li>
          <li>✅ Save/Load Charts (Local Storage)</li>
          <li>✅ Cloud Save (GitHub Gist, Custom API)</li>
          <li>✅ Lightning Mode (Real-time WebSocket)</li>
          <li>✅ Enhanced Dark Mode with Smooth Transitions</li>
          <li>✅ Comprehensive Help/Documentation System</li>
        </ul>
        <div className="mt-2 text-xs text-gray-500">
          Press F1 for help, Ctrl+Z/Y for undo/redo
        </div>
      </div>
    </div>
  );
}
