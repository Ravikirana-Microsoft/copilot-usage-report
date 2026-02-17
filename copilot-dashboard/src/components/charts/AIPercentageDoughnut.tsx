import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions, chartColorPalette } from './chartConfig';
import './chartConfig';

interface AIPercentageDoughnutProps {
  aiPercentage: number;
  title?: string;
  subtitle?: string;
  height?: string | number;
  label?: string;
}

export const AIPercentageDoughnut: React.FC<AIPercentageDoughnutProps> = ({
  aiPercentage,
  title = 'AI Contribution',
  subtitle,
  height = '250px',
  label = 'AI-Assisted',
}) => {
  const humanPercentage = 100 - aiPercentage;

  const data: ChartData<'doughnut'> = {
    labels: [label, 'Human'],
    datasets: [
      {
        data: [aiPercentage, humanPercentage],
        backgroundColor: [
          chartColorPalette.ai.background,
          chartColorPalette.human.background,
        ],
        borderColor: [
          chartColorPalette.ai.border,
          chartColorPalette.human.border,
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    ...defaultChartOptions,
    cutout: '70%',
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: false,
      },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const value = context.raw as number;
            return `${context.label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
  };

  // Custom center text plugin
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw: (chart: { ctx: CanvasRenderingContext2D; chartArea: { width: number; height: number; left: number; top: number } }) => {
      const ctx = chart.ctx;
      const { width, height, left, top } = chart.chartArea;
      
      ctx.save();
      ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#00bcf2';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${aiPercentage.toFixed(1)}%`, left + width / 2, top + height / 2 - 10);
      
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText('AI', left + width / 2, top + height / 2 + 15);
      ctx.restore();
    },
  };

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      height={height}
    >
      <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
    </ChartContainer>
  );
};

export default AIPercentageDoughnut;
