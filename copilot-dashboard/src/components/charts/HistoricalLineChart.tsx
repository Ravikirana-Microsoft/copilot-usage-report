import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import type { ChartOptions, ChartData } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { chartColorPalette, defaultChartOptions } from './chartConfig';

interface HistoricalDataPoint {
  date: string;
  aiCommits: number;
  humanCommits: number;
  aiPercentage: number;
  humanPercentage?: number;
}

interface HistoricalLineChartProps {
  data: HistoricalDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  showPercentage?: boolean;
  showBothLines?: boolean;
}

export const HistoricalLineChart: React.FC<HistoricalLineChartProps> = ({
  data,
  title = 'Historical AI Usage Trends',
  subtitle,
  height = 300,
  showPercentage = true,
  showBothLines = true,
}) => {
  const chartData = useMemo<ChartData<'line'>>(() => {
    const labels = data.map((d) => d.date);
    
    // Show both AI% and Human% lines (like original HTML dashboard)
    if (showPercentage && showBothLines) {
      return {
        labels,
        datasets: [
          {
            label: 'AI-Assisted %',
            data: data.map((d) => d.aiPercentage),
            borderColor: '#00bcf2',
            backgroundColor: 'rgba(0, 188, 242, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#00bcf2',
            borderWidth: 3,
          },
          {
            label: 'Human-Written %',
            data: data.map((d) => d.humanPercentage ?? (100 - d.aiPercentage)),
            borderColor: '#6b7280',
            backgroundColor: 'rgba(107, 114, 128, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 6,
            pointHoverRadius: 8,
            pointBackgroundColor: '#6b7280',
            borderWidth: 3,
          },
        ],
      };
    }
    
    // Show only AI percentage
    if (showPercentage) {
      return {
        labels,
        datasets: [
          {
            label: 'AI Percentage',
            data: data.map((d) => d.aiPercentage),
            borderColor: chartColorPalette.ai.border,
            backgroundColor: chartColorPalette.ai.background,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      };
    }
    
    // Show commit counts
    return {
      labels,
      datasets: [
        {
          label: 'AI Commits',
          data: data.map((d) => d.aiCommits),
          borderColor: chartColorPalette.ai.border,
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Human Commits',
          data: data.map((d) => d.humanCommits),
          borderColor: chartColorPalette.human.border,
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y',
        },
      ],
    };
  }, [data, showPercentage, showBothLines]);

  const options = useMemo<ChartOptions<'line'>>(() => {
    const baseOptions = {
      ...defaultChartOptions,
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: "'Segoe UI', system-ui, sans-serif",
              size: 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
          },
          ticks: {
            color: '#9ca3af',
            font: {
              family: "'Segoe UI', system-ui, sans-serif",
              size: 11,
            },
            callback: showPercentage 
              ? (value: string | number) => `${value}%`
              : undefined,
          },
          max: showPercentage ? 100 : undefined,
        },
      },
      plugins: {
        ...defaultChartOptions.plugins,
        tooltip: {
          ...defaultChartOptions.plugins.tooltip,
          callbacks: {
            label: (context: { dataset: { label?: string }; parsed: { y: number } }) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return showPercentage 
                ? `${label}: ${value.toFixed(1)}%`
                : `${label}: ${value}`;
            },
          },
        },
      },
    };
    return baseOptions as ChartOptions<'line'>;
  }, [showPercentage]);

  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title} subtitle={subtitle} height={height}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: '100%',
          color: '#9ca3af'
        }}>
          No historical data available
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title={title} subtitle={subtitle} height={height}>
      <Line data={chartData} options={options} />
    </ChartContainer>
  );
};

export default HistoricalLineChart;
