import React, { useMemo } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useViewStyles } from './viewStyles';
import { TierTable, ApplicationTable } from '../tables';
import { TierDoughnutChart, TierBarChart } from '../charts';
import type { ProcessedData, Tier, Application } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface TiersViewProps {
  data: ProcessedData;
  onApplicationSelect?: (app: Application) => void;
}

export const TiersView: React.FC<TiersViewProps> = ({
  data,
  onApplicationSelect,
}) => {
  const styles = useViewStyles();
  const { applications, summary } = data;

  // Calculate tier data
  const tierData: Tier[] = useMemo(() => {
    const tierGroups = [
      { tier: 1, min: 0, max: 20, label: '0-20%' },
      { tier: 2, min: 21, max: 40, label: '21-40%' },
      { tier: 3, min: 41, max: 60, label: '41-60%' },
      { tier: 4, min: 61, max: 80, label: '61-80%' },
      { tier: 5, min: 81, max: 100, label: '81-100%' },
    ];

    return tierGroups.map((group) => {
      const tierApps = applications.filter(
        (app) => app.aiPercentage >= group.min && app.aiPercentage <= group.max
      );
      const count = tierApps.length;
      const totalCommits = tierApps.reduce((sum, app) => sum + app.totalCommits, 0);
      const aiCommits = tierApps.reduce((sum, app) => sum + app.aiCommits, 0);
      const avgAI = tierApps.length > 0
        ? tierApps.reduce((sum, app) => sum + app.aiPercentage, 0) / tierApps.length
        : 0;

      return {
        tier: group.tier,
        count,
        percentage: applications.length > 0 ? (count / applications.length) * 100 : 0,
        totalCommits,
        aiCommits,
        avgAIPercentage: avgAI,
      };
    });
  }, [applications]);

  // Stats
  const stats = useMemo(() => {
    const highTier = tierData.filter((t) => t.tier >= 4).reduce((sum, t) => sum + t.count, 0);
    const lowTier = tierData.filter((t) => t.tier <= 2).reduce((sum, t) => sum + t.count, 0);
    const highTierPct = applications.length > 0 ? (highTier / applications.length) * 100 : 0;
    
    return {
      totalApps: applications.length,
      highTier,
      lowTier,
      highTierPct,
      avgAI: summary.aiPercentage,
    };
  }, [tierData, applications, summary]);

  return (
    <div className={styles.container}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Applications</span>
          <span className={styles.statValue}>{formatNumber(stats.totalApps)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>High AI Adoption (Tier 4-5)</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatNumber(stats.highTier)} ({formatPercentage(stats.highTierPct)})
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Low AI Adoption (Tier 1-2)</span>
          <span className={mergeClasses(styles.statValue, styles.statValueHuman)}>
            {formatNumber(stats.lowTier)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Overall AI %</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatPercentage(stats.avgAI)}
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        <div className={styles.card}>
          <TierDoughnutChart
            tiers={summary.tiers}
            title="Tier Distribution"
            subtitle="Applications by AI adoption level"
          />
        </div>
        <div className={styles.card}>
          <TierBarChart
            tiers={summary.tiers}
            title="Commits by Tier"
            subtitle="Total commits per tier"
          />
        </div>
      </div>

      {/* Tier Summary Table */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Tier Summary</h3>
        <TierTable tiers={tierData} />
      </div>

      {/* Applications by Tier */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>All Applications</h3>
        <ApplicationTable
          applications={applications}
          onRowClick={onApplicationSelect}
        />
      </div>
    </div>
  );
};
