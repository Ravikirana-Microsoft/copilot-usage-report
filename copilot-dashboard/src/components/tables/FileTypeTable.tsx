import React, { useMemo } from 'react';
import { DataTable, type Column } from './DataTable';
import { ProgressCell } from './ProgressCell';
import type { FileType } from '../../types';
import { formatNumber } from '../../utils/formatters';
import { useTableStyles } from './tableStyles';
import { COLORS } from '../../utils/colors';

interface FileTypeTableProps {
  fileTypes: FileType[];
  onRowClick?: (fileType: FileType) => void;
}

export const FileTypeTable: React.FC<FileTypeTableProps> = ({
  fileTypes,
  onRowClick,
}) => {
  const styles = useTableStyles();
  
  const columns: Column<FileType>[] = useMemo(() => [
    {
      key: 'extension',
      header: 'File Type',
      accessor: (ft) => (
        <span className={styles.monospace} style={{ fontWeight: 500 }}>
          {ft.extension}
        </span>
      ),
      sortAccessor: (ft) => ft.extension,
      width: '120px',
    },
    {
      key: 'fileCount',
      header: 'Files',
      accessor: (ft) => formatNumber(ft.fileCount),
      sortAccessor: (ft) => ft.fileCount,
      align: 'right',
    },
    {
      key: 'totalLines',
      header: 'Total Lines',
      accessor: (ft) => formatNumber(ft.totalLines),
      sortAccessor: (ft) => ft.totalLines,
      align: 'right',
    },
    {
      key: 'aiLines',
      header: 'AI Lines',
      accessor: (ft) => (
        <span style={{ color: COLORS.AI_PRIMARY }}>
          {formatNumber(ft.aiLines)}
        </span>
      ),
      sortAccessor: (ft) => ft.aiLines,
      align: 'right',
    },
    {
      key: 'humanLines',
      header: 'Human Lines',
      accessor: (ft) => (
        <span style={{ color: COLORS.HUMAN_PRIMARY }}>
          {formatNumber(ft.humanLines)}
        </span>
      ),
      sortAccessor: (ft) => ft.humanLines,
      align: 'right',
    },
    {
      key: 'aiPercentage',
      header: 'AI %',
      accessor: (ft) => <ProgressCell percentage={ft.aiPercentage} />,
      sortAccessor: (ft) => ft.aiPercentage,
      width: '180px',
    },
    {
      key: 'totalLines',
      header: 'Total Lines',
      accessor: (ft) => formatNumber(ft.totalLines),
      sortAccessor: (ft) => ft.totalLines,
      align: 'right',
    },
    {
      key: 'aiLines',
      header: 'AI Lines',
      accessor: (ft) => (
        <span style={{ color: COLORS.AI_PRIMARY }}>
          {formatNumber(ft.aiLines)}
        </span>
      ),
      sortAccessor: (ft) => ft.aiLines,
      align: 'right',
    },
  ], [styles.monospace]);

  const searchFilter = (ft: FileType, term: string) => {
    return ft.extension.toLowerCase().includes(term);
  };

  return (
    <DataTable
      title="File Types"
      data={fileTypes}
      columns={columns}
      getRowKey={(ft) => ft.extension}
      searchFilter={searchFilter}
      searchPlaceholder="Search file types..."
      defaultSortKey="aiPercentage"
      defaultSortDirection="desc"
      onRowClick={onRowClick}
      emptyMessage="No file types found"
    />
  );
};
