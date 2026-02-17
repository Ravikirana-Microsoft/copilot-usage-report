import React, { useMemo } from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useViewStyles } from './viewStyles';
import { FileTypeTable } from '../tables';
import { FileTypeBarChart, AIHumanPieChart } from '../charts';
import type { ProcessedData, FileType } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface FileTypesViewProps {
  data: ProcessedData;
  onFileTypeSelect?: (fileType: FileType) => void;
}

export const FileTypesView: React.FC<FileTypesViewProps> = ({
  data,
  onFileTypeSelect,
}) => {
  const styles = useViewStyles();
  const { fileTypes } = data;

  // Sort by total lines
  const sortedFileTypes = useMemo(() => {
    return [...fileTypes].sort((a, b) => b.totalLines - a.totalLines);
  }, [fileTypes]);

  // Prepare chart data
  const chartData = sortedFileTypes.slice(0, 10).map((ft) => ({
    extension: ft.extension,
    aiLines: ft.aiLines,
    humanLines: ft.humanLines,
    totalLines: ft.totalLines,
  }));

  // Calculate stats
  const stats = useMemo(() => {
    const total = fileTypes.length;
    const totalLines = fileTypes.reduce((sum, ft) => sum + ft.totalLines, 0);
    const aiLines = fileTypes.reduce((sum, ft) => sum + ft.aiLines, 0);
    const humanLines = totalLines - aiLines;
    const avgAI = totalLines > 0 ? (aiLines / totalLines) * 100 : 0;
    const topExtension = sortedFileTypes[0]?.extension || 'N/A';
    
    return { total, totalLines, aiLines, humanLines, avgAI, topExtension };
  }, [fileTypes, sortedFileTypes]);

  return (
    <div className={styles.container}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>File Types</span>
          <span className={styles.statValue}>{formatNumber(stats.total)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Lines</span>
          <span className={styles.statValue}>{formatNumber(stats.totalLines)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>AI Lines</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatNumber(stats.aiLines)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>AI %</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatPercentage(stats.avgAI)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Top Type</span>
          <span className={styles.statValue}>{stats.topExtension}</span>
        </div>
      </div>

      {/* Charts */}
      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        <div className={styles.card}>
          <FileTypeBarChart
            fileTypes={chartData}
            title="Lines by File Type"
            subtitle="AI vs Human lines"
          />
        </div>
        <div className={styles.card}>
          <AIHumanPieChart
            aiValue={stats.aiLines}
            humanValue={stats.humanLines}
            title="Line Distribution"
            subtitle="Overall AI vs Human lines"
          />
        </div>
      </div>

      {/* Table */}
      <FileTypeTable
        fileTypes={sortedFileTypes}
        onRowClick={onFileTypeSelect}
      />
    </div>
  );
};
