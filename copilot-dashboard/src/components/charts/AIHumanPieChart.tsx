import { Pie } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions, chartColorPalette } from './chartConfig';
import './chartConfig'; // Ensure Chart.js is registered

interface AIHumanPieChartProps {
  aiValue: number;
  humanValue: number;
  title?: string;
  subtitle?: string;
  height?: string | number;
  showPercentage?: boolean;
}

export const AIHumanPieChart: React.FC<AIHumanPieChartProps> = ({
  aiValue,
  humanValue,
  title = 'AI vs Human Distribution',
  subtitle,
  height = '300px',
  showPercentage = true,
}) => {
  const total = aiValue + humanValue;
  const aiPercentage = total > 0 ? ((aiValue / total) * 100).toFixed(1) : '0';
  const humanPercentage = total > 0 ? ((humanValue / total) * 100).toFixed(1) : '0';

  const data: ChartData<'pie'> = {
    labels: [
      `AI-Assisted (${showPercentage ? aiPercentage + '%' : aiValue.toLocaleString()})`,
      `Human (${showPercentage ? humanPercentage + '%' : humanValue.toLocaleString()})`,
    ],
    datasets: [
      {
        data: [aiValue, humanValue],
        backgroundColor: [
          chartColorPalette.ai.background,
          chartColorPalette.human.background,
        ],
        borderColor: [
          chartColorPalette.ai.border,
          chartColorPalette.human.border,
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    ...defaultChartOptions,
    plugins: {
      ...defaultChartOptions.plugins,
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
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
      emptyMessage="No commit data available"
    >
      <Pie data={data} options={options} />
    </ChartContainer>
  );
};

export default AIHumanPieChart;
