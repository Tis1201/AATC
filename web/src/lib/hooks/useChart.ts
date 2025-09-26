import { useRef, useEffect, MutableRefObject } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
} from "lightweight-charts";
import { CandlestickWithVolume, Timeframe } from "../types";
import { fetchYahooSeries } from "../api";
import { generateNextBarRealistic } from "../trading-utils";
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
} from "../indicators";

interface UseChartProps {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  symbol: string;
  timeframe: Timeframe;
  onPriceUpdate: (price: number) => void;
  onOHLCUpdate?: (ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
    change: number;
    changePercent: number;
  }) => void;
  onVolumeUpdate?: (volume: number) => void;
  isDarkMode?: boolean;
  showRSI?: boolean;
  showMACD?: boolean;
  chartType?: "candlestick" | "line" | "area";
}

/**
 * Custom hook for managing trading charts with technical indicators
 */
export function useChart({
  containerRef,
  symbol,
  timeframe,
  onPriceUpdate,
  onOHLCUpdate,
  onVolumeUpdate,
  isDarkMode = true,
  showRSI = false,
  showMACD = false,
  chartType = "candlestick",
}: UseChartProps) {
  // Refs to prevent unnecessary re-initialization
  const isInitializedRef = useRef<string>(""); // Store symbol+timeframe combo
  const cleanupRef = useRef<(() => void) | null>(null);
  const isDisposedRef = useRef<boolean>(false); // Track if charts are disposed
  const resizeTimeoutRef = useRef<number | null>(null);
  const chartsRef = useRef<{
    mainChart: IChartApi | null;
    rsiChart: IChartApi | null;
    macdChart: IChartApi | null;
  }>({ mainChart: null, rsiChart: null, macdChart: null });

  const seriesRef = useRef<{
    priceSeries: any;
    volumeSeries: ISeriesApi<"Histogram"> | null;
    smaSeries: ISeriesApi<"Line"> | null;
    emaSeries: ISeriesApi<"Line"> | null;
    bbUpperSeries: ISeriesApi<"Line"> | null;
    bbLowerSeries: ISeriesApi<"Line"> | null;
    bbMiddleSeries: ISeriesApi<"Line"> | null;
    rsiSeries: ISeriesApi<"Line"> | null;
    macdLineSeries: ISeriesApi<"Line"> | null;
  }>({
    priceSeries: null,
    volumeSeries: null,
    smaSeries: null,
    emaSeries: null,
    bbUpperSeries: null,
    bbLowerSeries: null,
    bbMiddleSeries: null,
    rsiSeries: null,
    macdLineSeries: null,
  });

  const dataRef = useRef<{
    bars: CandlestickWithVolume[];
    closes: number[];
    lastBar: CandlestickWithVolume | null;
    timer: number | null;
  }>({
    bars: [],
    closes: [],
    lastBar: null,
    timer: null,
  });

  useEffect(() => {
    const currentKey = `${symbol}-${timeframe}-${isDarkMode}-${showRSI}-${showMACD}-${chartType}`;

    console.log("useChart effect triggered:", {
      currentKey,
      previousKey: isInitializedRef.current,
      isDisposed: isDisposedRef.current,
      showRSI,
      showMACD,
    });

    // If already initialized with same parameters, don't reinitialize
    if (isInitializedRef.current === currentKey && !isDisposedRef.current) {
      console.log("Skipping initialization - same key");
      return;
    }

    // Cleanup previous initialization
    if (cleanupRef.current && !isDisposedRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Reset disposal flag and mark as initialized
    isDisposedRef.current = false;
    isInitializedRef.current = currentKey;

    const container = containerRef.current;
    if (!container) return;

    // Clear container
    container.innerHTML = "";

    // Chart theme configuration - Match TradingView colors
    const chartTheme = isDarkMode
      ? {
          layout: {
            background: { color: "#131722" },
            textColor: "#d9d9d9",
          },
          grid: {
            vertLines: { color: "#2a2e39" },
            horzLines: { color: "#2a2e39" },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          timeScale: {
            borderColor: "#2a2e39",
          },
          rightPriceScale: {
            borderColor: "#2a2e39",
          },
        }
      : {
          layout: {
            background: { color: "#ffffff" },
            textColor: "#374151",
          },
          grid: {
            vertLines: { color: "#e5e7eb" },
            horzLines: { color: "#e5e7eb" },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
          },
          timeScale: {
            borderColor: "#d1d5db",
          },
          rightPriceScale: {
            borderColor: "#d1d5db",
          },
        };

    // Create main chart with dynamic height based on container size and indicators
    const getContainerHeight = () => {
      const containerRect = container.getBoundingClientRect();
      return Math.max(containerRect.height || 300, 300);
    };

    const createChartsWithDynamicSizing = () => {
      const containerHeight = getContainerHeight();

      // Calculate heights for sub-charts
      let mainChartHeight = containerHeight;
      let rsiHeight = 0;
      let macdHeight = 0;

      if (showRSI && showMACD) {
        mainChartHeight = Math.floor(containerHeight * 0.6);
        rsiHeight = Math.floor(containerHeight * 0.2);
        macdHeight = Math.floor(containerHeight * 0.2);
      } else if (showRSI || showMACD) {
        mainChartHeight = Math.floor(containerHeight * 0.75);
        if (showRSI) rsiHeight = Math.floor(containerHeight * 0.25);
        if (showMACD) macdHeight = Math.floor(containerHeight * 0.25);
      }

      return { mainChartHeight, rsiHeight, macdHeight, containerHeight };
    };

    const { mainChartHeight, rsiHeight, macdHeight } =
      createChartsWithDynamicSizing();

    const mainChart = createChart(container, {
      width: container.clientWidth,
      height: mainChartHeight,
      ...chartTheme,
    });

    mainChart.applyOptions({
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        pinch: true,
      },
    });

    // Ensure the chart resizes properly
    const resizeCharts = () => {
      if (isDisposedRef.current) return;

      const {
        mainChartHeight: newMainHeight,
        rsiHeight: newRsiHeight,
        macdHeight: newMacdHeight,
      } = createChartsWithDynamicSizing();

      try {
        if (mainChart) {
          mainChart.resize(container.clientWidth, newMainHeight);
        }
        if (rsiChart) {
          rsiChart.resize(container.clientWidth, newRsiHeight);
        }
        if (macdChart) {
          macdChart.resize(container.clientWidth, newMacdHeight);
        }
      } catch (error) {
        console.warn("Chart resize error:", error);
      }
    };

    mainChart.resize(container.clientWidth, mainChartHeight);

    // Add series to main chart based on chart type
    let priceSeries: any = null;

    if (chartType === "candlestick") {
      priceSeries = mainChart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
    } else if (chartType === "line") {
      priceSeries = mainChart.addSeries(LineSeries, {
        color: isDarkMode ? "#2196F3" : "#1976D2",
        lineWidth: 2,
      });
    } else if (chartType === "area") {
      priceSeries = mainChart.addSeries(AreaSeries, {
        topColor: isDarkMode
          ? "rgba(33, 150, 243, 0.56)"
          : "rgba(25, 118, 210, 0.56)",
        bottomColor: isDarkMode
          ? "rgba(33, 150, 243, 0.04)"
          : "rgba(25, 118, 210, 0.04)",
        lineColor: isDarkMode ? "#2196F3" : "#1976D2",
        lineWidth: 2,
      });
    }

    const volumeSeries = mainChart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      base: 0,
      color: isDarkMode ? "#64748b" : "#9ca3af",
    });
    volumeSeries
      .priceScale()
      .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const smaSeries = mainChart.addSeries(LineSeries, {
      color: isDarkMode ? "#3b82f6" : "blue",
      lineWidth: 2,
    });
    const emaSeries = mainChart.addSeries(LineSeries, {
      color: isDarkMode ? "#f97316" : "orange",
      lineWidth: 2,
    });

    const bbUpperSeries = mainChart.addSeries(LineSeries, {
      color: isDarkMode ? "#6b7280" : "gray",
      lineWidth: 1,
    });

    const bbLowerSeries = mainChart.addSeries(LineSeries, {
      color: isDarkMode ? "#6b7280" : "gray",
      lineWidth: 1,
    });

    const bbMiddleSeries = mainChart.addSeries(LineSeries, {
      color: isDarkMode ? "#374151" : "black",
      lineWidth: 1,
    });

    // Conditionally create RSI chart
    let rsiChart: IChartApi | null = null;
    let rsiSeries: ISeriesApi<"Line"> | null = null;
    if (showRSI && rsiHeight > 0) {
      // Create a div for RSI chart
      const rsiContainer = document.createElement("div");
      rsiContainer.style.marginTop = "4px";
      rsiContainer.style.height = `${rsiHeight}px`;
      rsiContainer.style.overflow = "hidden";
      container.appendChild(rsiContainer);

      rsiChart = createChart(rsiContainer, {
        width: container.clientWidth,
        height: rsiHeight,
        ...chartTheme,
      });
      rsiSeries = rsiChart.addSeries(LineSeries, {
        color: isDarkMode ? "#a855f7" : "purple",
        lineWidth: 2,
      });

      // Add RSI reference lines
      rsiChart.applyOptions({
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
      });
    }

    // Conditionally create MACD chart
    let macdChart: IChartApi | null = null;
    let macdLineSeries: ISeriesApi<"Line"> | null = null;
    if (showMACD && macdHeight > 0) {
      // Create a div for MACD chart
      const macdContainer = document.createElement("div");
      macdContainer.style.marginTop = "4px";
      macdContainer.style.height = `${macdHeight}px`;
      macdContainer.style.overflow = "hidden";
      container.appendChild(macdContainer);

      macdChart = createChart(macdContainer, {
        width: container.clientWidth,
        height: macdHeight,
        ...chartTheme,
      });
      macdLineSeries = macdChart.addSeries(LineSeries, {
        color: isDarkMode ? "#10b981" : "green",
        lineWidth: 2,
      });
    }

    // Store references
    chartsRef.current = { mainChart, rsiChart, macdChart };
    seriesRef.current = {
      priceSeries,
      volumeSeries,
      smaSeries,
      emaSeries,
      bbUpperSeries,
      bbLowerSeries,
      bbMiddleSeries,
      rsiSeries,
      macdLineSeries,
    };

    // Setup crosshair move handler for volume updates
    const setupCrosshairHandler = () => {
      if (!onVolumeUpdate) {
        console.log("No onVolumeUpdate callback provided");
        return;
      }

      console.log(
        "Setting up crosshair handler with",
        dataRef.current.bars.length,
        "bars"
      );

      mainChart.subscribeCrosshairMove((param) => {
        // If no time or data is not loaded yet, return
        if (!param.time || dataRef.current.bars.length === 0) return;

        // Method 1: Use logical index (most reliable)
        if (param.logical !== undefined && param.logical >= 0) {
          const barIndex = Math.floor(param.logical);

          // Ensure we're within bounds
          if (barIndex >= 0 && barIndex < dataRef.current.bars.length) {
            const barData = dataRef.current.bars[barIndex];
            if (barData && barData.volume !== undefined) {
              console.log("Volume update:", barData.volume);
              onVolumeUpdate(barData.volume);
              return;
            }
          }
        }

        // Method 2: Fallback - try to find by time
        if (param.time) {
          const foundBar = dataRef.current.bars.find(
            (bar) => bar.time === param.time
          );
          if (foundBar && foundBar.volume !== undefined) {
            console.log("Volume update (by time):", foundBar.volume);
            onVolumeUpdate(foundBar.volume);
            return;
          }
        }
      });
    };

    const initFromData = (data: CandlestickWithVolume[]) => {
      const { bars, closes } = dataRef.current;
      const {
        priceSeries,
        volumeSeries,
        smaSeries,
        emaSeries,
        bbUpperSeries,
        bbLowerSeries,
        bbMiddleSeries,
        rsiSeries,
        macdLineSeries,
      } = seriesRef.current;

      if (!priceSeries || !volumeSeries || !smaSeries || !emaSeries) return;

      dataRef.current.bars = data.slice();
      dataRef.current.closes = data.map((b) => b.close);
      dataRef.current.lastBar = data[data.length - 1] ?? null;

      priceSeries.setData(
        chartType === "candlestick"
          ? data
          : data.map((d) => ({ time: d.time, value: d.close }))
      );
      volumeSeries.setData(
        data.map((b) => ({
          time: b.time,
          value: b.volume,
          color: b.close >= b.open ? "#26a69a" : "#ef5350",
        }))
      );

      if (dataRef.current.lastBar) {
        onPriceUpdate(dataRef.current.lastBar.close);

        // Set initial volume for the last bar
        if (onVolumeUpdate) {
          onVolumeUpdate(dataRef.current.lastBar.volume);
        }

        // Calculate and send OHLC data
        if (onOHLCUpdate && data.length > 1) {
          const currentBar = dataRef.current.lastBar;
          const previousBar = data[data.length - 2];
          const change = currentBar.close - previousBar.close;
          const changePercent = (change / previousBar.close) * 100;

          onOHLCUpdate({
            open: currentBar.open,
            high: currentBar.high,
            low: currentBar.low,
            close: currentBar.close,
            change,
            changePercent,
          });
        }
      }

      const sma = calculateSMA(dataRef.current.closes, 14);
      const ema = calculateEMA(dataRef.current.closes, 14);
      const rsi = calculateRSI(dataRef.current.closes, 14);
      const macdObj = calculateMACD(dataRef.current.closes);
      const bb = calculateBollingerBands(dataRef.current.closes, 20);

      bbUpperSeries?.setData(
        data
          .map((b, i) => ({ time: b.time, value: bb.upper[i] }))
          .filter((p) => !isNaN(p.value))
      );
      bbLowerSeries?.setData(
        data
          .map((b, i) => ({ time: b.time, value: bb.lower[i] }))
          .filter((p) => !isNaN(p.value))
      );
      bbMiddleSeries?.setData(
        data
          .map((b, i) => ({ time: b.time, value: bb.middle[i] }))
          .filter((p) => !isNaN(p.value))
      );

      smaSeries.setData(
        data
          .map((b, i) => ({ time: b.time, value: sma[i] }))
          .filter((pt) => !isNaN(pt.value))
      );
      emaSeries.setData(
        data
          .map((b, i) => ({ time: b.time, value: ema[i] }))
          .filter((pt) => !isNaN(pt.value))
      );

      // Only set RSI data if RSI chart is enabled
      if (rsiSeries) {
        rsiSeries.setData(
          data
            .map((b, i) => ({ time: b.time, value: rsi[i] }))
            .filter((pt) => !isNaN(pt.value))
        );
      }

      // Only set MACD data if MACD chart is enabled
      if (macdLineSeries) {
        macdLineSeries.setData(
          data
            .map((b, i) => ({ time: b.time, value: macdObj.macdLine[i] }))
            .filter((pt) => !isNaN(pt.value))
        );
      }

      // Setup crosshair handler AFTER data is loaded
      setupCrosshairHandler();

      console.log(
        "Data loaded and crosshair handler setup complete. Bars count:",
        data.length
      );
    };

    const loadData = async () => {
      try {
        console.log(`Loading data for ${symbol} with timeframe ${timeframe}`);
        const data = await fetchYahooSeries(symbol, timeframe);
        initFromData(data);

        // Start real-time simulation after data loads
        setTimeout(() => {
          startReplay();
        }, 1000);
      } catch (err) {
        console.error("Fetch Yahoo failed:", err);
      }
    };

    const startReplay = () => {
      if (dataRef.current.timer) return;

      dataRef.current.timer = window.setInterval(() => {
        // Check if charts are disposed before proceeding
        if (isDisposedRef.current) {
          if (dataRef.current.timer) {
            window.clearInterval(dataRef.current.timer);
            dataRef.current.timer = null;
          }
          return;
        }

        const { lastBar, bars, closes } = dataRef.current;
        const {
          priceSeries,
          volumeSeries,
          smaSeries,
          emaSeries,
          bbUpperSeries,
          bbLowerSeries,
          bbMiddleSeries,
          rsiSeries,
          macdLineSeries,
        } = seriesRef.current;

        if (!lastBar || !priceSeries || !volumeSeries) return;

        const next = generateNextBarRealistic(lastBar, closes);
        bars.push(next);
        closes.push(next.close);
        dataRef.current.lastBar = next;

        try {
          // Update main chart series
          if (priceSeries) {
            if (chartType === "candlestick") {
              priceSeries.update(next);
            } else {
              priceSeries.update({
                time: next.time,
                value: next.close,
              });
            }
          }
          volumeSeries.update({
            time: next.time,
            value: next.volume,
            color: next.close >= next.open ? "#26a69a" : "#ef5350",
          });

          const sma = calculateSMA(closes, 14);
          const ema = calculateEMA(closes, 14);
          const rsi = calculateRSI(closes, 14);
          const macdObj = calculateMACD(closes);
          const bb = calculateBollingerBands(closes, 20);
          const i = closes.length - 1;

          // Update technical indicators
          if (!isNaN(bb.upper[i]) && bbUpperSeries)
            bbUpperSeries.update({ time: next.time, value: bb.upper[i] });
          if (!isNaN(bb.lower[i]) && bbLowerSeries)
            bbLowerSeries.update({ time: next.time, value: bb.lower[i] });
          if (!isNaN(bb.middle[i]) && bbMiddleSeries)
            bbMiddleSeries.update({ time: next.time, value: bb.middle[i] });

          if (!isNaN(sma[i]) && smaSeries)
            smaSeries.update({ time: next.time, value: sma[i] });
          if (!isNaN(ema[i]) && emaSeries)
            emaSeries.update({ time: next.time, value: ema[i] });
          if (!isNaN(rsi[i]) && rsiSeries)
            rsiSeries.update({ time: next.time, value: rsi[i] });
          if (!isNaN(macdObj.macdLine[i]) && macdLineSeries)
            macdLineSeries.update({
              time: next.time,
              value: macdObj.macdLine[i],
            });

          // Update price callback
          onPriceUpdate(next.close);

          // Update OHLC data
          if (onOHLCUpdate && bars.length > 1) {
            const previousBar = bars[bars.length - 2];
            const change = next.close - previousBar.close;
            const changePercent = (change / previousBar.close) * 100;

            onOHLCUpdate({
              open: next.open,
              high: next.high,
              low: next.low,
              close: next.close,
              change,
              changePercent,
            });
          }
        } catch (error) {
          console.warn("Chart update error (chart may be disposed):", error);
          return;
        }
      }, 2000);
    };

    // Handle chart resizing when container size changes
    const handleChartResize = () => {
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
      }

      // Immediate resize for smoother experience during dragging
      resizeCharts();

      // Additional resize with slight delay to ensure everything is settled
      resizeTimeoutRef.current = window.setTimeout(() => {
        resizeCharts();
      }, 16); // ~60fps for smooth updates
    };

    // Listen for custom resize events and set up ResizeObserver
    window.addEventListener("chartResize", handleChartResize);
    window.addEventListener("resize", handleChartResize);

    // Set up ResizeObserver for the container
    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame for smooth resizing during rapid changes
      requestAnimationFrame(() => {
        handleChartResize();
      });
    });
    resizeObserver.observe(container);

    loadData();

    // Cleanup function
    const cleanup = () => {
      // Prevent multiple cleanup calls
      if (isDisposedRef.current) {
        return;
      }

      // Mark as disposed
      isDisposedRef.current = true;

      // Remove event listeners
      window.removeEventListener("chartResize", handleChartResize);
      window.removeEventListener("resize", handleChartResize);

      // Disconnect ResizeObserver
      if (resizeObserver) {
        resizeObserver.disconnect();
      }

      // Clear resize timeout
      if (resizeTimeoutRef.current) {
        window.clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }

      // Clear the timer first
      if (dataRef.current.timer) {
        window.clearInterval(dataRef.current.timer);
        dataRef.current.timer = null;
      }

      // Safely dispose of charts with proper error handling
      try {
        const { mainChart, rsiChart, macdChart } = chartsRef.current;

        // Clear series references first to prevent access after disposal
        seriesRef.current = {
          priceSeries: null,
          volumeSeries: null,
          smaSeries: null,
          emaSeries: null,
          bbUpperSeries: null,
          bbLowerSeries: null,
          bbMiddleSeries: null,
          rsiSeries: null,
          macdLineSeries: null,
        };

        // Dispose charts if they exist and haven't been disposed already
        if (mainChart && typeof mainChart.remove === "function") {
          mainChart.remove();
        }
        if (rsiChart && typeof rsiChart.remove === "function") {
          rsiChart.remove();
        }
        if (macdChart && typeof macdChart.remove === "function") {
          macdChart.remove();
        }

        // Clear chart references
        chartsRef.current = {
          mainChart: null,
          rsiChart: null,
          macdChart: null,
        };
      } catch (error) {
        // Silently handle disposal errors as they're expected in some cases
        console.warn(
          "Chart cleanup warning (this is usually harmless):",
          error
        );
      }
    };

    // Store cleanup function
    cleanupRef.current = cleanup;

    // Return cleanup for useEffect
    return cleanup;
  }, [symbol, timeframe, isDarkMode, showRSI, showMACD, chartType]); // Include chartType in dependencies

  return {
    charts: chartsRef.current,
    series: seriesRef.current,
  };
}
