import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions, chartColorPalette } from './chartConfig';
import type { TierData } from '../../types';
import './chartConfig';

interface TierDoughnutChartProps {
  tiers: TierData;
  title?: string;
  subtitle?: string;
  height?: string | number;
}

const tierLabels = [
  'Tier 1 (90-100%)',
  'Tier 2 (70-89%)',
  'Tier 3 (40-69%)',
  'Tier 4 (10-39%)',
  'Tier 5 (0-9%)',
];

const tierDescriptions = [
  'High AI confidence',
  'Medium-high AI',
  'Medium AI',
  'Low AI',
  'Human-authored',
];

export const TierDoughnutChart: React.FC<TierDoughnutChartProps> = ({
  tiers,
  title = 'Tier Distribution',
  subtitle,
  height = '300px',
}) => {
  const tierValues = [tiers.tier1, tiers.tier2, tiers.tier3, tiers.tier4, tiers.tier5];
  const total = tierValues.reduce((sum, val) => sum + val, 0);

  const data: ChartData<'doughnut'> = {
    labels: tierLabels,
    datasets: [
      {
        data: tierValues,
        backgroundColor: [
          chartColorPalette.tiers.tier1.background,
          chartColorPalette.tiers.tier2.background,
          chartColorPalette.tiers.tier3.background,
          chartColorPalette.tiers.tier4.background,
          chartColorPalette.tiers.tier5.background,
        ],
        borderColor: [
          chartColorPalette.tiers.tier1.border,
          chartColorPalette.tiers.tier2.border,
          chartColorPalette.tiers.tier3.border,
          chartColorPalette.tiers.tier4.border,
          chartColorPalette.tiers.tier5.border,
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    ...defaultChartOptions,
    cutout: '60%',
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            const description = tierDescriptions[context.dataIndex] || '';
            return [
              `${context.label}: ${value.toLocaleString()} (${percentage}%)`,
              description,
            ];
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
      <Doughnut data={data} options={options} />
    </ChartContainer>
  );
};

export default TierDoughnutChart;
