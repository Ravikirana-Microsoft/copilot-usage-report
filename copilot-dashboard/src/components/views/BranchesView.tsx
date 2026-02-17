import React, { useState, useMemo } from 'react';
import { Select, Input, mergeClasses } from '@fluentui/react-components';
import { Search24Regular } from '@fluentui/react-icons';
import { useViewStyles } from './viewStyles';
import { BranchTable } from '../tables';
import type { ProcessedData, Branch } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

interface BranchesViewProps {
  data: ProcessedData;
  onBranchSelect?: (branch: Branch) => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({
  data,
  onBranchSelect,
}) => {
  const styles = useViewStyles();
  const { branches } = data;
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBranches = useMemo(() => {
    let filtered = branches;
    
    if (selectedApp !== 'all') {
      filtered = filtered.filter((b) => b.application === selectedApp);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.branch.toLowerCase().includes(term) ||
          b.application.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [branches, selectedApp, searchTerm]);

  // Calculate stats for filtered branches
  const stats = useMemo(() => {
    const total = filteredBranches.length;
    const totalCommits = filteredBranches.reduce((sum, b) => sum + b.totalCommits, 0);
    const aiCommits = filteredBranches.reduce((sum, b) => sum + b.aiCommits, 0);
    const avgAI = totalCommits > 0 ? (aiCommits / totalCommits) * 100 : 0;
    
    return { total, totalCommits, aiCommits, avgAI };
  }, [filteredBranches]);

  const appOptions = useMemo(() => {
    const uniqueApps = [...new Set(branches.map((b) => b.application))];
    return uniqueApps.sort();
  }, [branches]);

  return (
    <div className={styles.container}>
      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Branches</span>
          <span className={styles.statValue}>{formatNumber(stats.total)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Commits</span>
          <span className={styles.statValue}>{formatNumber(stats.totalCommits)}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>AI Commits</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatNumber(stats.aiCommits)}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Avg AI %</span>
          <span className={mergeClasses(styles.statValue, styles.statValueAI)}>
            {formatPercentage(stats.avgAI)}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
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
          placeholder="Search branches..."
          value={searchTerm}
          onChange={(_, data) => setSearchTerm(data.value)}
          style={{ minWidth: '250px' }}
        />
      </div>

      {/* Table */}
      <BranchTable
        branches={filteredBranches}
        onRowClick={onBranchSelect}
      />
    </div>
  );
};
