import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions, chartColorPalette } from './chartConfig';
import type { TierData } from '../../types';
import './chartConfig';

interface TierBarChartProps {
  tiers: TierData;
  title?: string;
  subtitle?: string;
  height?: string | number;
}

const tierConfig = [
  { key: 'tier1', label: 'Tier 1', description: '90-100% AI', color: chartColorPalette.tiers.tier1 },
  { key: 'tier2', label: 'Tier 2', description: '70-89% AI', color: chartColorPalette.tiers.tier2 },
  { key: 'tier3', label: 'Tier 3', description: '40-69% AI', color: chartColorPalette.tiers.tier3 },
  { key: 'tier4', label: 'Tier 4', description: '10-39% AI', color: chartColorPalette.tiers.tier4 },
  { key: 'tier5', label: 'Tier 5', description: '0-9% AI', color: chartColorPalette.tiers.tier5 },
];

export const TierBarChart: React.FC<TierBarChartProps> = ({
  tiers,
  title = 'Commits by Confidence Tier',
  subtitle,
  height = '300px',
}) => {
  const tierValues = [tiers.tier1, tiers.tier2, tiers.tier3, tiers.tier4, tiers.tier5];
  const total = tierValues.reduce((sum, val) => sum + val, 0);

  const data: ChartData<'bar'> = {
    labels: tierConfig.map((t) => t.label),
    datasets: [
      {
        label: 'Commits',
        data: tierValues,
        backgroundColor: tierConfig.map((t) => t.color.background),
        borderColor: tierConfig.map((t) => t.color.border),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const config = tierConfig[index];
            return `${config.label} (${config.description})`;
          },
          label: (context) => {
            const value = context.raw as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `Commits: ${value.toLocaleString()} (${percentage}%)`;
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
      isEmpty={total === 0}
      emptyMessage="No tier data available"
    >
      <Bar data={data} options={options} />
    </ChartContainer>
  );
};

export default TierBarChart;
