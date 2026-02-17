import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions, chartColorPalette } from './chartConfig';
import './chartConfig';

interface FileTypeBarChartProps {
  fileTypes: Array<{
    extension: string;
    aiLines: number;
    humanLines: number;
    totalLines: number;
  }>;
  title?: string;
  subtitle?: string;
  height?: string | number;
  maxItems?: number;
}

export const FileTypeBarChart: React.FC<FileTypeBarChartProps> = ({
  fileTypes,
  title = 'Lines by File Type',
  subtitle,
  height = '350px',
  maxItems = 10,
}) => {
  // Sort by total lines and take top N
  const sortedTypes = [...fileTypes]
    .sort((a, b) => b.totalLines - a.totalLines)
    .slice(0, maxItems);

  const labels = sortedTypes.map((ft) => ft.extension || 'unknown');

  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: 'AI Lines',
        data: sortedTypes.map((ft) => ft.aiLines),
        backgroundColor: chartColorPalette.ai.background,
        borderColor: chartColorPalette.ai.border,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Human Lines',
        data: sortedTypes.map((ft) => ft.humanLines),
        backgroundColor: chartColorPalette.human.background,
        borderColor: chartColorPalette.human.border,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    scales: {
      x: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: (value) => {
            const num = value as number;
            if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
            return num.toString();
          },
        },
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          afterTitle: (context) => {
            const index = context[0].dataIndex;
            const ft = sortedTypes[index];
            const aiPercent = ft.totalLines > 0 
              ? ((ft.aiLines / ft.totalLines) * 100).toFixed(1) 
              : '0';
            return `Total: ${ft.totalLines.toLocaleString()} | AI: ${aiPercent}%`;
          },
          label: (context) => {
            const value = context.raw as number;
            return `${context.dataset.label}: ${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      height={height}
      isEmpty={fileTypes.length === 0}
      emptyMessage="No file type data available"
    >
      <Bar data={data} options={options} />
    </ChartContainer>
  );
};

export default FileTypeBarChart;
