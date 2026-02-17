import React, { useMemo } from 'react';
import { Tooltip, mergeClasses } from '@fluentui/react-components';
import { DataTable, type Column } from './DataTable';
import { useTableStyles } from './tableStyles';
import type { Commit } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';

interface CommitTableProps {
  commits: Commit[];
  onRowClick?: (commit: Commit) => void;
}

export const CommitTable: React.FC<CommitTableProps> = ({
  commits,
  onRowClick,
}) => {
  const styles = useTableStyles();
  
  const columns: Column<Commit>[] = useMemo(() => [
    {
      key: 'hash',
      header: 'Hash',
      accessor: (commit) => (
        <Tooltip content={commit.hash} relationship="label">
          <span className={styles.monospace}>
            {commit.hash.substring(0, 7)}
          </span>
        </Tooltip>
      ),
      sortAccessor: (commit) => commit.hash,
      width: '80px',
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (commit) => formatDate(commit.date),
      sortAccessor: (commit) => new Date(commit.date).getTime(),
    },
    {
      key: 'author',
      header: 'Author',
      accessor: (commit) => (
        <Tooltip content={commit.author} relationship="label">
          <span className={styles.truncate}>{commit.author}</span>
        </Tooltip>
      ),
      sortAccessor: (commit) => commit.author,
      width: '150px',
    },
    {
      key: 'message',
      header: 'Message',
      accessor: (commit) => (
        <Tooltip content={commit.message} relationship="label">
          <span className={styles.truncate}>{commit.message}</span>
        </Tooltip>
      ),
      sortAccessor: (commit) => commit.message,
      width: '250px',
    },
    {
      key: 'type',
      header: 'Type',
      accessor: (commit) => (
        <span
          className={mergeClasses(
            styles.badge,
            commit.isAI ? styles.badgeAI : styles.badgeHuman
          )}
        >
          {commit.isAI ? 'AI' : 'Human'}
        </span>
      ),
      sortAccessor: (commit) => (commit.isAI ? 1 : 0),
      align: 'center',
      width: '80px',
    },
    {
      key: 'linesAdded',
      header: 'Lines +',
      accessor: (commit) => (
        <span style={{ color: '#22c55e' }}>
          +{formatNumber(commit.linesAdded)}
        </span>
      ),
      sortAccessor: (commit) => commit.linesAdded,
      align: 'right',
    },
    {
      key: 'linesDeleted',
      header: 'Lines -',
      accessor: (commit) => (
        <span style={{ color: '#ef4444' }}>
          -{formatNumber(commit.linesDeleted)}
        </span>
      ),
      sortAccessor: (commit) => commit.linesDeleted,
      align: 'right',
    },
    {
      key: 'totalLines',
      header: 'Net',
      accessor: (commit) => {
        const net = commit.linesAdded - commit.linesDeleted;
        const color = net >= 0 ? '#22c55e' : '#ef4444';
        return (
          <span style={{ color }}>
            {net >= 0 ? '+' : ''}{formatNumber(net)}
          </span>
        );
      },
      sortAccessor: (commit) => commit.linesAdded - commit.linesDeleted,
      align: 'right',
    },
  ], [styles.monospace, styles.truncate, styles.badge, styles.badgeAI, styles.badgeHuman]);

  const searchFilter = (commit: Commit, term: string) => {
    return (
      commit.hash.toLowerCase().includes(term) ||
      commit.author.toLowerCase().includes(term) ||
      commit.message.toLowerCase().includes(term)
    );
  };

  return (
    <DataTable
      title="Commits"
      data={commits}
      columns={columns}
      getRowKey={(commit) => commit.hash}
      searchFilter={searchFilter}
      searchPlaceholder="Search commits..."
      defaultSortKey="date"
      defaultSortDirection="desc"
      onRowClick={onRowClick}
      emptyMessage="No commits found"
      pageSize={25}
      pageSizeOptions={[25, 50, 100, 200]}
    />
  );
};
