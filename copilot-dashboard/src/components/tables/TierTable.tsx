import React, { useMemo } from 'react';
import { DataTable, type Column } from './DataTable';
import { ProgressCell } from './ProgressCell';
import { TierBadge } from './TierBadge';
import type { Tier } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';
import { TIER_COLORS } from '../../utils/colors';

interface TierTableProps {
  tiers: Tier[];
  onRowClick?: (tier: Tier) => void;
}

export const TierTable: React.FC<TierTableProps> = ({
  tiers,
  onRowClick,
}) => {
  const columns: Column<Tier>[] = useMemo(() => [
    {
      key: 'tier',
      header: 'Tier',
      accessor: (t) => <TierBadge tier={t.tier} />,
      sortAccessor: (t) => t.tier,
      width: '150px',
    },
    {
      key: 'count',
      header: 'Applications',
      accessor: (t) => formatNumber(t.count),
      sortAccessor: (t) => t.count,
      align: 'right',
    },
    {
      key: 'percentage',
      header: 'Distribution',
      accessor: (t) => {
        const tierColor = TIER_COLORS[`tier${t.tier}` as keyof typeof TIER_COLORS];
        return <ProgressCell percentage={t.percentage} color={tierColor} />;
      },
      sortAccessor: (t) => t.percentage,
      width: '180px',
    },
    {
      key: 'totalCommits',
      header: 'Total Commits',
      accessor: (t) => formatNumber(t.totalCommits),
      sortAccessor: (t) => t.totalCommits,
      align: 'right',
    },
    {
      key: 'aiCommits',
      header: 'AI Commits',
      accessor: (t) => {
        const tierColor = TIER_COLORS[`tier${t.tier}` as keyof typeof TIER_COLORS];
        return (
          <span style={{ color: tierColor }}>
            {formatNumber(t.aiCommits)}
          </span>
        );
      },
      sortAccessor: (t) => t.aiCommits,
      align: 'right',
    },
    {
      key: 'avgAIPercentage',
      header: 'Avg AI %',
      accessor: (t) => {
        const tierColor = TIER_COLORS[`tier${t.tier}` as keyof typeof TIER_COLORS];
        return (
          <span style={{ color: tierColor, fontWeight: 600 }}>
            {formatPercentage(t.avgAIPercentage)}
          </span>
        );
      },
      sortAccessor: (t) => t.avgAIPercentage,
      align: 'right',
    },
  ], []);

  return (
    <DataTable
      title="Tier Distribution"
      data={tiers}
      columns={columns}
      getRowKey={(t) => `tier-${t.tier}`}
      defaultSortKey="tier"
      defaultSortDirection="asc"
      onRowClick={onRowClick}
      emptyMessage="No tier data available"
      searchable={false}
      pageSizeOptions={[5, 10]}
      pageSize={5}
    />
  );
};
