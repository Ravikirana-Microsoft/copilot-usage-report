import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { makeStyles, Input, Text, Button } from '@fluentui/react-components';
import { Search24Regular, Dismiss16Regular } from '@fluentui/react-icons';
import { ChartContainer } from './ChartContainer';
import { defaultChartOptions, chartColorPalette } from './chartConfig';
import type { UserData } from '../../types';
import './chartConfig';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  selectorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative',
  },
  searchContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '250px',
    overflowY: 'auto',
    backgroundColor: '#2d2d2d',
    borderRadius: '4px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    border: '1px solid #3c3c3c',
  },
  dropdownOption: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #3c3c3c',
    ':hover': {
      backgroundColor: '#3c3c3c',
    },
  },
  optionName: {
    fontWeight: 500,
    color: '#ffffff',
  },
  optionStats: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  selectedInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 188, 242, 0.1)',
    borderRadius: '4px',
    border: '1px solid rgba(0, 188, 242, 0.3)',
  },
  selectedName: {
    fontWeight: 600,
    color: '#00bcf2',
  },
  selectedDetails: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '250px',
    color: '#9ca3af',
  },
});

interface ContributorDetailChartProps {
  users: Record<string, UserData>;
  title?: string;
  subtitle?: string;
  height?: string | number;
}

export const ContributorDetailChart: React.FC<ContributorDetailChartProps> = ({
  users,
  title = 'Contributor Application Details',
  subtitle,
  height = '350px',
}) => {
  const styles = useStyles();
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort users by total lines (to include both AI and manual contributors)
  // AI contributors will still appear first due to higher overall activity
  const sortedUsers = useMemo(() => {
    return Object.values(users)
      .filter(u => u.name && u.name !== 'null' && u.name !== 'Unknown' && u.name.trim() !== '')
      .sort((a, b) => {
        // Sort by AI lines first (AI contributors come first)
        const aiDiff = (b.aiLines || 0) - (a.aiLines || 0);
        if (aiDiff !== 0) return aiDiff;
        // Then by total lines
        return (b.totalLines || 0) - (a.totalLines || 0);
      });
  }, [users]);

  // Auto-select top contributor on mount or when users change
  useEffect(() => {
    if (sortedUsers.length > 0 && !selectedUser) {
      // Auto-select the top contributor (highest AI lines)
      setSelectedUser(sortedUsers[0]);
    }
  }, [sortedUsers, selectedUser]);

  // Filter users based on search - show all matching users
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return sortedUsers;
    const query = searchQuery.toLowerCase().trim();
    return sortedUsers.filter(u => u.name.toLowerCase().includes(query));
  }, [sortedUsers, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectUser = (user: UserData) => {
    setSelectedUser(user);
    setSearchQuery('');
    setDropdownVisible(false);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
  };

  // Prepare chart data from selected user's applications
  const chartData = useMemo(() => {
    if (!selectedUser || !selectedUser.applications) {
      return null;
    }

    const apps = Object.entries(selectedUser.applications)
      .filter(([, data]) => data.totalLines > 0)
      .sort((a, b) => b[1].aiLines - a[1].aiLines)
      .slice(0, 10);

    if (apps.length === 0) return null;

    const data: ChartData<'bar'> = {
      labels: apps.map(([name]) => name.length > 25 ? name.substring(0, 25) + '...' : name),
      datasets: [
        {
          label: 'AI Lines',
          data: apps.map(([, data]) => data.aiLines),
          backgroundColor: chartColorPalette.ai.background,
          borderColor: chartColorPalette.ai.border,
          borderWidth: 1,
        },
        {
          label: 'Human Lines',
          data: apps.map(([, data]) => data.totalLines - data.aiLines),
          backgroundColor: chartColorPalette.human.background,
          borderColor: chartColorPalette.human.border,
          borderWidth: 1,
        },
      ],
    };

    return { data, apps };
  }, [selectedUser]);

  const chartOptions: ChartOptions<'bar'> = {
    ...defaultChartOptions,
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: (value) => {
            if (typeof value === 'number') {
              return value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value;
            }
            return value;
          },
        },
        title: {
          display: true,
          text: 'Lines of Code',
          color: '#9ca3af',
        },
      },
      y: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#cccccc',
        },
      },
    },
    plugins: {
      ...defaultChartOptions.plugins,
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#cccccc',
          boxWidth: 12,
          padding: 10,
        },
      },
      tooltip: {
        ...defaultChartOptions.plugins.tooltip,
        callbacks: {
          afterBody: (context) => {
            if (!chartData) return [];
            const idx = context[0].dataIndex;
            const [, appData] = chartData.apps[idx];
            const pct = appData.totalLines > 0 
              ? ((appData.aiLines / appData.totalLines) * 100).toFixed(1) 
              : '0';
            return [`AI %: ${pct}%`, `Total Lines: ${appData.totalLines.toLocaleString()}`];
          },
        },
      },
    },
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <ChartContainer title={title} subtitle={subtitle} height={height}>
      <div className={styles.container}>
        {/* Contributor Selector */}
        <div className={styles.selectorContainer} ref={containerRef}>
          <div className={styles.searchContainer}>
            <Input
              contentBefore={<Search24Regular />}
              placeholder="Search and select a contributor..."
              value={searchQuery}
              onChange={(_, data) => setSearchQuery(data.value)}
              onFocus={() => setDropdownVisible(true)}
              style={{ width: '100%' }}
            />
            <div 
              className={styles.dropdown}
              style={{ display: dropdownVisible ? 'block' : 'none' }}
            >
              {filteredUsers.map((user) => {
                const aiPct = user.totalLines > 0 
                  ? ((user.aiLines / user.totalLines) * 100).toFixed(1) 
                  : '0';
                const hasAI = (user.aiLines || 0) > 0;
                return (
                  <div
                    key={user.name}
                    className={styles.dropdownOption}
                    onClick={() => handleSelectUser(user)}
                  >
                    <span className={styles.optionName}>{user.name}</span>
                    <span className={styles.optionStats}>
                      {hasAI 
                        ? `${formatNumber(user.aiLines || 0)} AI lines (${aiPct}%)`
                        : `${formatNumber(user.totalLines || 0)} total lines (0% AI)`
                      }
                    </span>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af' }}>
                  No contributors found
                </div>
              )}
            </div>
          </div>

          {/* Selected User Info */}
          {selectedUser && (
            <div className={styles.selectedInfo}>
              <div>
                <div className={styles.selectedName}>🤖 {selectedUser.name}</div>
                <div className={styles.selectedDetails}>
                  {selectedUser.totalCommits} commits • {formatNumber(selectedUser.aiLines)} AI lines (
                  {selectedUser.totalLines > 0 
                    ? ((selectedUser.aiLines / selectedUser.totalLines) * 100).toFixed(1) 
                    : '0'}%)
                </div>
              </div>
              <Button
                appearance="subtle"
                icon={<Dismiss16Regular />}
                onClick={handleClearSelection}
                title="Clear selection"
              />
            </div>
          )}
        </div>

        {/* Chart or Placeholder */}
        {selectedUser && chartData ? (
          <div style={{ height: '250px' }}>
            <Bar data={chartData.data} options={chartOptions} />
          </div>
        ) : (
          <div className={styles.placeholder}>
            <Text>Select a contributor above to see their application breakdown</Text>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};

export default ContributorDetailChart;
