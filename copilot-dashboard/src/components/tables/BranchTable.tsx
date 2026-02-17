import React, { useMemo } from 'react';
import { Tooltip } from '@fluentui/react-components';
import { DataTable, type Column } from './DataTable';
import { ProgressCell } from './ProgressCell';
import { TierBadge } from './TierBadge';
import type { Branch } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { useTableStyles } from './tableStyles';
import { COLORS } from '../../utils/colors';

interface BranchTableProps {
  branches: Branch[];
  onRowClick?: (branch: Branch) => void;
}

export const BranchTable: React.FC<BranchTableProps> = ({
  branches,
  onRowClick,
}) => {
  const styles = useTableStyles();
  
  const columns: Column<Branch>[] = useMemo(() => [
    {
      key: 'application',
      header: 'Application',
      accessor: (branch) => branch.application,
      sortAccessor: (branch) => branch.application,
    },
    {
      key: 'branch',
      header: 'Branch',
      accessor: (branch) => (
        <Tooltip content={branch.branch} relationship="label">
          <span className={styles.monospace}>{branch.branch}</span>
        </Tooltip>
      ),
      sortAccessor: (branch) => branch.branch,
      width: '200px',
    },
    {
      key: 'totalCommits',
      header: 'Total Commits',
      accessor: (branch) => formatNumber(branch.totalCommits),
      sortAccessor: (branch) => branch.totalCommits,
      align: 'right',
    },
    {
      key: 'aiCommits',
      header: 'AI Commits',
      accessor: (branch) => (
        <span style={{ color: COLORS.AI_PRIMARY }}>
          {formatNumber(branch.aiCommits)}
        </span>
      ),
      sortAccessor: (branch) => branch.aiCommits,
      align: 'right',
    },
    {
      key: 'humanCommits',
      header: 'Human Commits',
      accessor: (branch) => (
        <span style={{ color: COLORS.HUMAN_PRIMARY }}>
          {formatNumber(branch.humanCommits)}
        </span>
      ),
      sortAccessor: (branch) => branch.humanCommits,
      align: 'right',
    },
    {
      key: 'aiPercentage',
      header: 'AI %',
      accessor: (branch) => <ProgressCell percentage={branch.aiPercentage} />,
      sortAccessor: (branch) => branch.aiPercentage,
      width: '180px',
    },
    {
      key: 'tier',
      header: 'Tier',
      accessor: (branch) => <TierBadge tier={branch.tier} showLabel={false} />,
      sortAccessor: (branch) => branch.tier,
      align: 'center',
    },
  ], [styles.monospace]);

  const searchFilter = (branch: Branch, term: string) => {
    return (
      branch.application.toLowerCase().includes(term) ||
      branch.branch.toLowerCase().includes(term)
    );
  };

  return (
    <DataTable
      title="Branches"
      data={branches}
      columns={columns}
      getRowKey={(branch) => `${branch.application}-${branch.branch}`}
      searchFilter={searchFilter}
      searchPlaceholder="Search branches..."
      defaultSortKey="aiPercentage"
      defaultSortDirection="desc"
      onRowClick={onRowClick}
      emptyMessage="No branches found"
    />
  );
};
