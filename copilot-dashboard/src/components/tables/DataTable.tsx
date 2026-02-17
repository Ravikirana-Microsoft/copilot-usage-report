import React, { useState, useMemo, useCallback } from 'react';
import {
  Input,
  Button,
  Select,
  Tooltip,
  mergeClasses,
} from '@fluentui/react-components';
import {
  Search24Regular,
  ArrowUp24Regular,
  ArrowDown24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ArrowSort24Regular,
} from '@fluentui/react-icons';
import { useTableStyles } from './tableStyles';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortAccessor?: (item: T) => string | number;
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFilter?: (item: T, searchTerm: string) => boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  defaultSortKey?: string;
  defaultSortDirection?: 'asc' | 'desc';
  getRowKey: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  title,
  searchable = true,
  searchPlaceholder = 'Search...',
  searchFilter,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onRowClick,
  emptyMessage = 'No data available',
  defaultSortKey,
  defaultSortDirection = 'desc',
  getRowKey,
}: DataTableProps<T>): React.ReactElement {
  const styles = useTableStyles();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchTerm.toLowerCase()));
  }, [data, searchTerm, searchFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    
    const column = columns.find((col) => col.key === sortKey);
    if (!column) return filteredData;
    
    const accessor = column.sortAccessor ?? column.accessor;
    
    return [...filteredData].sort((a, b) => {
      const aVal = accessor(a);
      const bVal = accessor(b);
      
      // Handle React nodes - convert to string for comparison
      const aStr = typeof aVal === 'object' ? String(aVal) : aVal;
      const bStr = typeof bVal === 'object' ? String(bVal) : bVal;
      
      if (typeof aStr === 'number' && typeof bStr === 'number') {
        return sortDirection === 'asc' ? aStr - bStr : bStr - aStr;
      }
      
      const aString = String(aStr).toLowerCase();
      const bString = String(bStr).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aString.localeCompare(bString);
      }
      return bString.localeCompare(aString);
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  }, [sortKey]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  }, []);

  const renderSortIcon = (key: string, sortable?: boolean) => {
    if (sortable === false) return null;
    
    if (sortKey !== key) {
      return <ArrowSort24Regular className={styles.sortIcon} />;
    }
    
    return sortDirection === 'asc' ? (
      <ArrowUp24Regular className={mergeClasses(styles.sortIcon, styles.sortIconActive)} />
    ) : (
      <ArrowDown24Regular className={mergeClasses(styles.sortIcon, styles.sortIconActive)} />
    );
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {title && <h3 className={styles.title}>{title}</h3>}
        
        <div className={styles.controls}>
          {searchable && searchFilter && (
            <Input
              className={styles.searchInput}
              contentBefore={<Search24Regular />}
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(_, data) => handleSearch(data.value)}
            />
          )}
          
          <Select
            value={String(pageSize)}
            onChange={(_, data) => handlePageSizeChange(data.value)}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={mergeClasses(
                    styles.th,
                    column.align === 'right' && styles.thRight
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div
                    className={mergeClasses(
                      styles.thSortable,
                      column.align === 'right' && styles.thRight
                    )}
                  >
                    <span>{column.header}</span>
                    {renderSortIcon(column.key, column.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.emptyState}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={getRowKey(item)}
                  className={mergeClasses(
                    styles.tr,
                    onRowClick && styles.trClickable
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={mergeClasses(
                        styles.td,
                        column.align === 'right' && styles.tdRight,
                        column.align === 'center' && styles.tdCenter
                      )}
                    >
                      {column.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedData.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {((currentPage - 1) * pageSize) + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length} entries
            {searchTerm && ` (filtered from ${data.length} total)`}
          </span>
          
          <div className={styles.paginationControls}>
            <Tooltip content="Previous page" relationship="label">
              <Button
                icon={<ChevronLeft24Regular />}
                appearance="subtle"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              />
            </Tooltip>
            
            <span className={styles.paginationInfo}>
              Page {currentPage} of {totalPages || 1}
            </span>
            
            <Tooltip content="Next page" relationship="label">
              <Button
                icon={<ChevronRight24Regular />}
                appearance="subtle"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              />
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
