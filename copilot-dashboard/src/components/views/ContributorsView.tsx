import React, { useMemo } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useViewStyles } from './viewStyles';
import { ContributorTable } from '../tables';
import { ContributorBarChart, AIHumanPieChart } from '../charts';
import type { ProcessedData, Contributor } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface ContributorsViewProps {
  data: ProcessedData;
  onContributorSelect?: (contributor: Contributor) => void;
}

export const ContributorsView: React.FC<ContributorsViewProps> = ({
  data,
  onContributorSelect,
}) => {
  const styles = useViewStyles();
  const { users } = data;

  // Convert users object to array
  const contributors = useMemo(() => {
    return Object.values(users).sort((a, b) => b.aiPercentage - a.aiPercentage);
  }, [users]);

  // Prepare chart data with all required fields
  const chartContributors = contributors.slice(0, 10).map((c) => ({
    name: c.name,
    aiCommits: c.aiCommits,
    humanCommits: c.humanCommits,
    totalCommits: c.totalCommits,
    aiPercentage: c.aiPercentage,
  }));

  // Calculate stats
  const stats = useMemo(() => {
    const total = contributors.length;
    const totalCommits = contributors.reduce((sum, c) => sum + c.totalCommits, 0);
    const aiCommits = contributors.reduce((sum, c) => sum + c.aiCommits, 0);
    const avgAI = totalCommits > 0 ? (aiCommits / totalCommits) * 100 : 0;
    const topContributor = contributors[0]?.name || 'N/A';
    
    return { total, totalCommits, aiCommits, avgAI, topContributor };
  }, [contributors]);

  return (
    <div className={styles.container}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Contributors</span>
          <span className={styles.statValue}>{formatNumber(stats.total)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{formatNumber(stats.totalCommits)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>AI Commits</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatNumber(stats.aiCommits)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg AI %</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatPercentage(stats.avgAI)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Top AI User</span>
          <span className={styles.statValue}>{stats.topContributor}</span>
        </div>
      </div>

      {/* Charts */}
      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        <div className={styles.card}>
          <ContributorBarChart
            contributors={chartContributors}
            title="Top Contributors"
            subtitle="By AI-assisted commits"
          />
        </div>
        <div className={styles.card}>
          <AIHumanPieChart
            aiValue={stats.aiCommits}
            humanValue={stats.totalCommits - stats.aiCommits}
            title="Team Commit Distribution"
            subtitle="Overall AI vs Human commits"
          />
        </div>
      </div>

      {/* Table */}
      <ContributorTable
        contributors={contributors}
        onRowClick={onContributorSelect}
      />
    </div>
  );
};
