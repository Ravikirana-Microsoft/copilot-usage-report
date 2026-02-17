import React, { useMemo } from 'react';
import { Avatar, Tooltip } from '@fluentui/react-components';
import { Person24Regular } from '@fluentui/react-icons';
import { DataTable, type Column } from './DataTable';
import { ProgressCell } from './ProgressCell';
import type { Contributor } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { COLORS } from '../../utils/colors';

interface ContributorTableProps {
  contributors: Contributor[];
  onRowClick?: (contributor: Contributor) => void;
}

export const ContributorTable: React.FC<ContributorTableProps> = ({
  contributors,
  onRowClick,
}) => {
  const columns: Column<Contributor>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Contributor',
      accessor: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar
            name={c.name}
            size={24}
            icon={<Person24Regular />}
            color="colorful"
          />
          <Tooltip content={c.name} relationship="label">
            <span style={{ fontWeight: 500 }}>{c.name}</span>
          </Tooltip>
        </div>
      ),
      sortAccessor: (c) => c.name,
      width: '200px',
    },
    {
      key: 'totalCommits',
      header: 'Total Commits',
      accessor: (c) => formatNumber(c.totalCommits),
      sortAccessor: (c) => c.totalCommits,
      align: 'right',
    },
    {
      key: 'aiCommits',
      header: 'AI Commits',
      accessor: (c) => (
        <span style={{ color: COLORS.AI_PRIMARY }}>
          {formatNumber(c.aiCommits)}
        </span>
      ),
      sortAccessor: (c) => c.aiCommits,
      align: 'right',
    },
    {
      key: 'humanCommits',
      header: 'Human Commits',
      accessor: (c) => (
        <span style={{ color: COLORS.HUMAN_PRIMARY }}>
          {formatNumber(c.humanCommits)}
        </span>
      ),
      sortAccessor: (c) => c.humanCommits,
      align: 'right',
    },
    {
      key: 'aiPercentage',
      header: 'AI %',
      accessor: (c) => <ProgressCell percentage={c.aiPercentage} />,
      sortAccessor: (c) => c.aiPercentage,
      width: '180px',
    },
    {
      key: 'totalLines',
      header: 'Total Lines',
      accessor: (c) => formatNumber(c.totalLines),
      sortAccessor: (c) => c.totalLines,
      align: 'right',
    },
    {
      key: 'aiLines',
      header: 'AI Lines',
      accessor: (c) => (
        <span style={{ color: COLORS.AI_PRIMARY }}>
          {formatNumber(c.aiLines)}
        </span>
      ),
      sortAccessor: (c) => c.aiLines,
      align: 'right',
    },
  ], []);

  const searchFilter = (c: Contributor, term: string) => {
    return c.name.toLowerCase().includes(term);
  };

  return (
    <DataTable
      title="Contributors"
      data={contributors}
      columns={columns}
      getRowKey={(c) => c.name}
      searchFilter={searchFilter}
      searchPlaceholder="Search contributors..."
      defaultSortKey="aiPercentage"
      defaultSortDirection="desc"
      onRowClick={onRowClick}
      emptyMessage="No contributors found"
    />
  );
};
