import React, { useState, useMemo } from 'react';
import { Select, Input, mergeClasses } from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { useViewStyles } from './viewStyles';
import { CommitTable } from '../tables';
import type { ProcessedData, Commit } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface CommitsViewProps {
  data: ProcessedData;
  onCommitSelect?: (commit: Commit) => void;
}

type CommitFilter = 'all' | 'ai' | 'human';

export const CommitsView: React.FC<CommitsViewProps> = ({
  data,
  onCommitSelect,
}) => {
  const styles = useViewStyles();
  const { commits } = data;
  const [filter, setFilter] = useState<CommitFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('all');

  // Convert CommitData to Commit format for table
  const tableCommits: Commit[] = useMemo(() => {
    return commits.map((c) => ({
      hash: c.hash,
      author: c.author,
      date: c.date,
      message: c.message,
      linesAdded: c.linesAdded,
      linesDeleted: 0, // Not in source data
      isAI: c.isAI,
      confidenceScore: c.confidenceScore,
      tierNumber: c.tierNumber,
      application: c.application,
    }));
  }, [commits]);

  const filteredCommits = useMemo(() => {
    let filtered = tableCommits;
    
    if (filter === 'ai') {
      filtered = filtered.filter((c) => c.isAI);
    } else if (filter === 'human') {
      filtered = filtered.filter((c) => !c.isAI);
    }
    
    if (selectedApp !== 'all') {
      filtered = filtered.filter((c) => c.application === selectedApp);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.hash.toLowerCase().includes(term) ||
          c.author.toLowerCase().includes(term) ||
          c.message.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [tableCommits, filter, selectedApp, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredCommits.length;
    const aiCount = filteredCommits.filter((c) => c.isAI).length;
    const humanCount = total - aiCount;
    const aiPercentage = total > 0 ? (aiCount / total) * 100 : 0;
    const totalLines = filteredCommits.reduce((sum, c) => sum + c.linesAdded, 0);
    
    return { total, aiCount, humanCount, aiPercentage, totalLines };
  }, [filteredCommits]);

  const appOptions = useMemo(() => {
    const uniqueApps = [...new Set(tableCommits.map((c) => c.application).filter(Boolean))];
    return uniqueApps.sort();
  }, [tableCommits]);

  return (
    <div className={styles.container}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{formatNumber(stats.total)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>AI Commits</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatNumber(stats.aiCount)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Human Commits</span>
          <span className={mergeClasses(styles.statValue, styles.statValueHuman)}>
            {formatNumber(stats.humanCount)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>AI %</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatPercentage(stats.aiPercentage)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Lines</span>
          <span className={styles.statValue}>{formatNumber(stats.totalLines)}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <Select
          value={filter}
          onChange={(_, data) => setFilter(data.value as CommitFilter)}
        >
          <option value="all">All Commits</option>
          <option value="ai">AI Only</option>
          <option value="human">Human Only</option>
        </Select>
        
        <Select
          value={selectedApp}
          onChange={(_, data) => setSelectedApp(data.value)}
          style={{ minWidth: '200px' }}
        >
          <option value="all">All Applications</option>
          {appOptions.map((app) => (
            <option key={app} value={app}>
              {app}
            </option>
          ))}
        </Select>
        
        <Input
          contentBefore={<Search24Regular />}
          placeholder="Search commits..."
          value={searchTerm}
          onChange={(_, data) => setSearchTerm(data.value)}
          style={{ minWidth: '250px' }}
        />
      </div>

      {/* Table */}
      <CommitTable
        commits={filteredCommits}
        onRowClick={onCommitSelect}
      />
    </div>
  );
};
