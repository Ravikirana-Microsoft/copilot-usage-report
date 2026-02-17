import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions } from './chartConfig';
import './chartConfig';

interface ContributorData {
  name: string;
  aiCommits?: number;
  humanCommits?: number;
  totalCommits?: number;
  aiPercentage?: number;
  aiLines?: number;
}

interface ContributorBarChartProps {
  contributors: ContributorData[];
  title?: string;
  subtitle?: string;
  height?: string | number;
  maxItems?: number;
  sortBy?: 'total' | 'ai' | 'human' | 'aiPercentage' | 'aiLines';
  showLines?: boolean; // If true, show AI lines as single horizontal bar
}

export const ContributorBarChart: React.FC<ContributorBarChartProps> = ({
  contributors,
  title = 'Top Contributors',
  subtitle,
  height = '350px',
  maxItems = 10,
  sortBy = 'total',
  showLines = false,
}) => {
  // Sort contributors based on sortBy parameter
  const sortedContributors = [...contributors]
    .sort((a, b) => {
      if (showLines) {
        return (b.aiLines || 0) - (a.aiLines || 0);
      }
      switch (sortBy) {
        case 'ai':
          return (b.aiCommits || 0) - (a.aiCommits || 0);
        case 'human':
          return (b.humanCommits || 0) - (a.humanCommits || 0);
        case 'aiPercentage':
          return (b.aiPercentage || 0) - (a.aiPercentage || 0);
        case 'aiLines':
          return (b.aiLines || 0) - (a.aiLines || 0);
        default:
          return (b.totalCommits || 0) - (a.totalCommits || 0);
      }
    })
    .slice(0, maxItems);

  const labels = sortedContributors.map((c) => {
    // Format author name - show first name + last initial or truncate
    const parts = c.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name;
  });

  // For showLines mode, show single bar with AI lines
  // Otherwise show stacked commits
  const data: ChartData<'bar'> = showLines ? {
    labels,
    datasets: [
      {
        label: 'AI Lines',
        data: sortedContributors.map((c) => c.aiLines || 0),
        backgroundColor: '#00bcf2',
        borderColor: '#00bcf2',
        borderWidth: 0,
      },
    ],
  } : {
    labels,
    datasets: [
      {
        label: 'AI-Assisted',
        data: sortedContributors.map((c) => c.aiCommits || 0),
        backgroundColor: '#00bcf2',
        borderColor: '#00bcf2',
        borderWidth: 0,
      },
      {
        label: 'Human',
        data: sortedContributors.map((c) => c.humanCommits || 0),
        backgroundColor: '#6b7280',
        borderColor: '#6b7280',
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: !showLines,
        grid: {
          color: '#3c3c3c',
        },
        ticks: {
          color: '#cccccc',
        },
      },
      y: {
        stacked: !showLines,
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
        display: !showLines,
        labels: {
          color: '#cccccc',
        },
      },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            return sortedContributors[index].name;
          },
          afterTitle: (context) => {
            const index = context[0].dataIndex;
            const contributor = sortedContributors[index];
            if (showLines) {
              return `AI Lines: ${(contributor.aiLines || 0).toLocaleString()}`;
            }
            return `AI: ${(contributor.aiPercentage || 0).toFixed(1)}% | Total: ${contributor.totalCommits || 0}`;
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
      isEmpty={contributors.length === 0}
      emptyMessage="No contributor data available"
    >
      <Bar data={data} options={options} />
    </ChartContainer>
  );
};

export default ContributorBarChart;
