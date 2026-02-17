import React, { useState, useMemo } from 'react';
import { Select, mergeClasses } from '@fluentui/react-components';
import { useViewStyles } from './viewStyles';
import { ApplicationTable } from '../tables';
import { ApplicationBarChart, TierBarChart } from '../charts';
import type { ProcessedData, Application } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface ApplicationsViewProps {
  data: ProcessedData;
  onApplicationSelect?: (app: Application) => void;
}

type SortOption = 'aiPercentage' | 'totalCommits' | 'aiCommits' | 'name';

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  data,
  onApplicationSelect,
}) => {
  const styles = useViewStyles();
  const { applications, summary } = data;
  const [sortBy, setSortBy] = useState<SortOption>('aiPercentage');

  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      switch (sortBy) {
        case 'aiPercentage':
          return b.aiPercentage - a.aiPercentage;
        case 'totalCommits':
          return b.totalCommits - a.totalCommits;
        case 'aiCommits':
          return b.aiCommits - a.aiCommits;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [applications, sortBy]);

  // Prepare data for charts
  const chartData = sortedApplications.slice(0, 15).map((app) => ({
    name: app.name,
    aiCommits: app.aiCommits,
    humanCommits: app.humanCommits,
  }));

  return (
    <div className={styles.container}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Applications</span>
          <span className={styles.statValue}>{formatNumber(applications.length)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg AI %</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatPercentage(summary.aiPercentage)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{formatNumber(summary.totalCommits)}</span>
        </div>
      </div>

      {/* Charts */}
      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        <div className={styles.card}>
          <ApplicationBarChart
            applications={chartData}
            title="Applications by Commits"
            subtitle="AI vs Human commit breakdown"
          />
        </div>
        <div className={styles.card}>
          <TierBarChart
            tiers={summary.tiers}
            title="Tier Distribution"
            subtitle="Applications grouped by AI adoption level"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <span>Sort by:</span>
        <Select
          value={sortBy}
          onChange={(_, data) => setSortBy(data.value as SortOption)}
        >
          <option value="aiPercentage">AI Percentage</option>
          <option value="totalCommits">Total Commits</option>
          <option value="aiCommits">AI Commits</option>
          <option value="name">Name</option>
        </Select>
      </div>

      {/* Table */}
      <ApplicationTable
        applications={sortedApplications}
        onRowClick={onApplicationSelect}
      />
    </div>
  );
};
