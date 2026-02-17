import React, { useMemo } from 'react';
import { Tooltip } from '@fluentui/react-components';
import { DataTable, type Column } from './DataTable';
import { ProgressCell } from './ProgressCell';
import { TierBadge } from './TierBadge';
import type { Application } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { COLORS } from '../../utils/colors';

interface ApplicationTableProps {
  applications: Application[];
  onRowClick?: (app: Application) => void;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  applications,
  onRowClick,
}) => {
  const columns: Column<Application>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Application',
      accessor: (app) => (
        <Tooltip content={app.name} relationship="label">
          <span style={{ fontWeight: 500 }}>{app.name}</span>
        </Tooltip>
      ),
      sortAccessor: (app) => app.name,
      width: '200px',
    },
    {
      key: 'totalCommits',
      header: 'Total Commits',
      accessor: (app) => formatNumber(app.totalCommits),
      sortAccessor: (app) => app.totalCommits,
      align: 'right',
    },
    {
      key: 'aiCommits',
      header: 'AI Commits',
      accessor: (app) => (
        <span style={{ color: COLORS.AI_PRIMARY }}>
          {formatNumber(app.aiCommits)}
        </span>
      ),
      sortAccessor: (app) => app.aiCommits,
      align: 'right',
    },
    {
      key: 'humanCommits',
      header: 'Human Commits',
      accessor: (app) => (
        <span style={{ color: COLORS.HUMAN_PRIMARY }}>
          {formatNumber(app.humanCommits)}
        </span>
      ),
      sortAccessor: (app) => app.humanCommits,
      align: 'right',
    },
    {
      key: 'aiPercentage',
      header: 'AI %',
      accessor: (app) => <ProgressCell percentage={app.aiPercentage} />,
      sortAccessor: (app) => app.aiPercentage,
      width: '180px',
    },
    {
      key: 'totalLines',
      header: 'Total Lines',
      accessor: (app) => formatNumber(app.totalLines),
      sortAccessor: (app) => app.totalLines,
      align: 'right',
    },
    {
      key: 'tier',
      header: 'Tier',
      accessor: (app) => <TierBadge tier={app.tier} showLabel={false} />,
      sortAccessor: (app) => app.tier,
      align: 'center',
    },
  ], []);

  const searchFilter = (app: Application, term: string) => {
    return app.name.toLowerCase().includes(term);
  };

  return (
    <DataTable
      title="Applications"
      data={applications}
      columns={columns}
      getRowKey={(app) => app.name}
      searchFilter={searchFilter}
      searchPlaceholder="Search applications..."
      defaultSortKey="aiPercentage"
      defaultSortDirection="desc"
      onRowClick={onRowClick}
      emptyMessage="No applications found"
    />
  );
};
