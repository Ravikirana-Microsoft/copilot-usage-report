import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions } from './chartConfig';
import './chartConfig';

interface ApplicationData {
  name: string;
  aiCommits?: number;
  humanCommits?: number;
  aiLines?: number;
  humanLines?: number;
  totalLines?: number;
}

interface ApplicationBarChartProps {
  applications: ApplicationData[];
  title?: string;
  subtitle?: string;
  height?: string | number;
  maxItems?: number;
  horizontal?: boolean;
  showLines?: boolean; // If true, show lines instead of commits
}

export const ApplicationBarChart: React.FC<ApplicationBarChartProps> = ({
  applications,
  title = 'Commits by Application',
  subtitle,
  height = '350px',
  maxItems = 10,
  horizontal = false,
  showLines = false,
}) => {
  // Sort by total (lines or commits) and take top N
  const sortedApps = [...applications]
    .sort((a, b) => {
      if (showLines) {
        return (b.totalLines || (b.aiLines || 0) + (b.humanLines || 0)) - 
               (a.totalLines || (a.aiLines || 0) + (a.humanLines || 0));
      }
      return ((b.aiCommits || 0) + (b.humanCommits || 0)) - ((a.aiCommits || 0) + (a.humanCommits || 0));
    })
    .slice(0, maxItems);

  const labels = sortedApps.map((app) => 
    app.name.length > 20 ? app.name.substring(0, 20) + '...' : app.name
  );

  const aiData = sortedApps.map((app) => showLines ? (app.aiLines || 0) : (app.aiCommits || 0));
  const humanData = sortedApps.map((app) => {
    if (showLines) {
      return app.humanLines !== undefined 
        ? app.humanLines 
        : (app.totalLines || 0) - (app.aiLines || 0);
    }
    return app.humanCommits || 0;
  });

  const data: ChartData<'bar'> = {
    labels,
    datasets: [
      {
        label: showLines ? 'AI Lines' : 'AI-Assisted',
        data: aiData,
        backgroundColor: '#00bcf2',
        borderColor: '#00bcf2',
        borderWidth: 0,
      },
      {
        label: showLines ? 'Human Lines' : 'Human',
        data: humanData,
        backgroundColor: '#6b7280',
        borderColor: '#6b7280',
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    indexAxis: horizontal ? 'y' : 'x',
    scales: {
      x: {
        stacked: true,
        grid: {
          color: '#3c3c3c',
        },
        ticks: {
          color: '#cccccc',
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: true,
        grid: {
          color: '#3c3c3c',
        },
        ticks: {
          color: '#cccccc',
          font: {
            size: 11,
          },
        },
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        position: 'bottom',
        labels: {
          color: '#cccccc',
        },
      },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          afterTitle: (context) => {
            const index = context[0].dataIndex;
            const app = sortedApps[index];
            if (showLines) {
              const total = app.totalLines || (app.aiLines || 0) + (app.humanLines || 0);
              const aiPercent = total > 0 ? (((app.aiLines || 0) / total) * 100).toFixed(1) : '0';
              return `Total: ${total.toLocaleString()} | AI: ${aiPercent}%`;
            }
            const total = (app.aiCommits || 0) + (app.humanCommits || 0);
            const aiPercent = total > 0 ? (((app.aiCommits || 0) / total) * 100).toFixed(1) : '0';
            return `Total: ${total.toLocaleString()} | AI: ${aiPercent}%`;
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
      isEmpty={applications.length === 0}
      emptyMessage="No application data available"
    >
      <Bar data={data} options={options} />
    </ChartContainer>
  );
};

export default ApplicationBarChart;
