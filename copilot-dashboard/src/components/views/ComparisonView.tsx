import React, { useMemo } from 'react';
import { makeStyles, tokens, Text, Badge } from '@fluentui/react-components';
import { Trophy24Regular } from '@fluentui/react-icons';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartContainer } from '../charts/ChartContainer';
import type { ProcessedData } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  highlightCard: {
    border: '2px solid #ffd700',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), transparent)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
  },
  cardTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingVerticalM,
  },
  stat: {
    textAlign: 'center',
  },
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
  },
  statValueAI: {
    color: '#00bcf2',
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: tokens.colorNeutralBackground5,
    borderRadius: tokens.borderRadiusMedium,
    overflow: 'hidden',
    marginTop: tokens.spacingVerticalM,
  },
  progressFill: {
    height: '100%',
    borderRadius: tokens.borderRadiusMedium,
    transition: 'width 0.3s ease',
  },
  branches: {
    marginTop: tokens.spacingVerticalM,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  chartCard: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  trophy: {
    color: '#ffd700',
  },
  highestBadge: {
    fontSize: tokens.fontSizeBase100,
    color: '#ffd700',
  },
});

interface ComparisonViewProps {
  data: ProcessedData;
}

interface AggregatedApp {
  name: string;
  totalCommits: number;
  aiCommits: number;
  humanCommits: number;
  totalLines: number;
  aiLines: number;
  humanLines: number;
  aiPercentage: number;
  branches: string[];
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ data }) => {
  const styles = useStyles();

  // Aggregate applications data similar to original dashboard
  const aggregatedApps = useMemo<AggregatedApp[]>(() => {
    const appMap = new Map<string, AggregatedApp>();

    data.branches.forEach((branch) => {
      const existing = appMap.get(branch.application);
      if (existing) {
        existing.totalCommits += branch.totalCommits;
        existing.aiCommits += branch.aiCommits;
        existing.humanCommits += branch.humanCommits;
        existing.totalLines += branch.totalLines;
        existing.aiLines += branch.aiLines;
        existing.humanLines += branch.humanLines;
        if (!existing.branches.includes(branch.branch)) {
          existing.branches.push(branch.branch);
        }
      } else {
        appMap.set(branch.application, {
          name: branch.application,
          totalCommits: branch.totalCommits,
          aiCommits: branch.aiCommits,
          humanCommits: branch.humanCommits,
          totalLines: branch.totalLines,
          aiLines: branch.aiLines,
          humanLines: branch.humanLines,
          aiPercentage: 0,
          branches: [branch.branch],
        });
      }
    });

    // Calculate AI percentage
    return Array.from(appMap.values()).map((app) => ({
      ...app,
      aiPercentage: app.totalLines > 0 ? (app.aiLines / app.totalLines) * 100 : 0,
    }));
  }, [data.branches]);

  // Find highest AI percentage
  const maxAIPct = Math.max(...aggregatedApps.map((app) => app.aiPercentage), 0);
  const highestApp = aggregatedApps.find((app) => app.aiPercentage === maxAIPct);

  // Chart data
  const chartData = useMemo<ChartData<'bar'>>(() => ({
    labels: aggregatedApps.map((app) => app.name),
    datasets: [
      {
        label: 'AI Lines',
        data: aggregatedApps.map((app) => app.aiLines),
        backgroundColor: '#00bcf2',
        borderRadius: 4,
      },
      {
        label: 'Human Lines',
        data: aggregatedApps.map((app) => app.humanLines),
        backgroundColor: '#6b7280',
        borderRadius: 4,
      },
    ],
  }), [aggregatedApps]);

  const chartOptions = useMemo<ChartOptions<'bar'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x' as const,
    scales: {
      x: {
        stacked: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#9ca3af' },
      },
      y: {
        stacked: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: {
          color: '#9ca3af',
          callback: (value) => value !== null ? formatNumber(value as number) : '',
        },
      },
    },
    plugins: {
      legend: {
        labels: { color: '#cccccc', usePointStyle: true },
      },
      title: {
        display: true,
        text: 'Lines of Code by Repository',
        color: '#cccccc',
        font: { size: 14 },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatNumber(context.parsed.y ?? 0)}`,
        },
      },
    },
  }), []);

  if (aggregatedApps.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.chartCard}>
          <Text align="center" style={{ padding: '40px', color: '#888' }}>
            No repository data available for comparison
          </Text>
        </div>
      </div>
    );
  }

  const getProgressColor = (pct: number) => {
    if (pct >= 50) return '#22c55e';
    if (pct >= 25) return '#00bcf2';
    if (pct >= 10) return '#f59e0b';
    return '#6b7280';
  };

  return (
    <div className={styles.container}>
      {/* Comparison Cards Grid */}
      <div className={styles.grid}>
        {aggregatedApps.map((app) => {
          const isHighlight = app.name === highestApp?.name;
          return (
            <div
              key={app.name}
              className={`${styles.card} ${isHighlight ? styles.highlightCard : ''}`}
            >
              <div className={styles.cardHeader}>
                {isHighlight && <Trophy24Regular className={styles.trophy} />}
                <Text className={styles.cardTitle}>{app.name}</Text>
                {isHighlight && (
                  <Badge appearance="filled" color="warning" size="small">
                    Highest AI %
                  </Badge>
                )}
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={`${styles.statValue} ${styles.statValueAI}`}>
                    {formatPercentage(app.aiPercentage)}
                  </div>
                  <div className={styles.statLabel}>AI Usage</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{formatNumber(app.totalCommits)}</div>
                  <div className={styles.statLabel}>Total Commits</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{formatNumber(app.aiCommits)}</div>
                  <div className={styles.statLabel}>AI Commits</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statValue}>{formatNumber(app.aiLines)}</div>
                  <div className={styles.statLabel}>AI Lines</div>
                </div>
              </div>

              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{
                    width: `${Math.min(app.aiPercentage, 100)}%`,
                    backgroundColor: getProgressColor(app.aiPercentage),
                  }}
                />
              </div>

              <div className={styles.branches}>
                Branches: {app.branches.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison Bar Chart */}
      <div className={styles.chartCard}>
        <ChartContainer title="Repository Comparison" subtitle="AI vs Human lines by repository" height={350}>
          <Bar data={chartData} options={chartOptions} />
        </ChartContainer>
      </div>
    </div>
  );
};

export default ComparisonView;
