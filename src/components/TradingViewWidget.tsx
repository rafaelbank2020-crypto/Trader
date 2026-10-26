import React, { useEffect, useRef, memo } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  theme?: 'dark' | 'light';
  interval?: string;
  height?: number | string;
}

function TradingViewWidgetComponent({
  symbol = 'FX:EURUSD',
  theme = 'dark',
  interval = '1',
  height = 660
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'America/Sao_Paulo',
      theme: theme,
      style: '1',
      locale: 'br',
      enable_publishing: false,
      backgroundColor: 'rgba(9, 9, 11, 1)',
      gridColor: 'rgba(39, 39, 42, 0.4)',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      hide_volume: true,
      support_host: 'https://www.tradingview.com'
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-zinc-950 shadow-2xl relative flex flex-col min-h-0">
      <div
        ref={containerRef}
        style={{ height: typeof height === 'number' ? `${height}px` : height, width: '100%' }}
        className="tradingview-widget-container flex-1 w-full h-full"
      />
    </div>
  );
}

export const TradingViewWidget = memo(TradingViewWidgetComponent);
