import React, { useMemo } from 'react';
import { mergeClasses, Spinner, Text } from '@fluentui/react-components';
import {
  Code24Regular,
  People24Regular,
  History24Regular,
  Document24Regular,
} from '@fluentui/react-icons';
import { useViewStyles } from './viewStyles';
import { SummaryCard } from '../cards/SummaryCard';
import {
  AIHumanPieChart,
  TierBarChart,
  ApplicationBarChart,
  ContributorBarChart,
  ContributorDetailChart,
  FileTypeBarChart,
  HistoricalLineChart,
} from '../charts';
import { useAppSelector } from '../../store/hooks';
import type { ProcessedData } from '../../types';
import type { HistoricalReportData } from '../../store/slices/reportSlice';

interface OverviewViewProps {
  data: ProcessedData;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ data }) => {
  const styles = useViewStyles();
  const { summary, applications, users, commits, fileTypes } = data;
  
  // Get historical data from store (aggregated from all reports)
  const historicalData = useAppSelector((state) => state.report.historicalData);
  const historicalLoading = useAppSelector((state) => state.report.historicalLoading);

  // Convert historical data for chart (from all reports)
  const historicalChartData = useMemo(() => {
    if (historicalData && historicalData.length > 0) {
      // Use data from all historical reports (same as original HTML dashboard)
      // Reverse to show oldest first (chronological order)
      return [...historicalData].reverse().slice(-10).map((report: HistoricalReportData) => ({
        date: formatReportLabel(report.name, report.date),
        aiCommits: report.aiCommits,
        humanCommits: report.humanCommits,
        aiPercentage: report.aiPercentage,
        humanPercentage: report.humanPercentage ?? (100 - report.aiPercentage),
      }));
    }
    
    // Fallback: generate from current report commits (group by month)
    if (!commits || commits.length === 0) return [];

    // Group commits by month
    const monthlyData: Record<string, { ai: number; human: number }> = {};
    
    commits.forEach((commit) => {
      if (!commit.date) return;
      
      // Parse date and get month key (YYYY-MM)
      const date = new Date(commit.date);
      if (isNaN(date.getTime())) return;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { ai: 0, human: 0 };
      }
      
      if (commit.isAI) {
        monthlyData[monthKey].ai++;
      } else {
        monthlyData[monthKey].human++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => {
        const total = counts.ai + counts.human;
        const aiPct = total > 0 ? (counts.ai / total) * 100 : 0;
        return {
          date: formatMonthLabel(date),
          aiCommits: counts.ai,
          humanCommits: counts.human,
          aiPercentage: aiPct,
          humanPercentage: 100 - aiPct,
        };
      });
  }, [historicalData, commits]);

  // Prepare applications data with lines for stacked bar chart
  const applicationsWithLines = applications.map((app) => ({
    name: app.name,
    aiLines: app.aiLines,
    humanLines: app.humanLines,
    totalLines: app.totalLines,
  }));

  // Prepare top contributors by AI Lines (horizontal bar)
  const topContributorsByLines = Object.values(users)
    .sort((a, b) => b.aiLines - a.aiLines)
    .slice(0, 10)
    .map((user) => ({
      name: user.name,
      aiLines: user.aiLines,
    }));

  return (
    <div className={styles.container}>
      {/* Summary Cards */}
      <div className={mergeClasses(styles.grid, styles.gridFour)}>
        <SummaryCard
          title="Total Commits"
          value={summary.totalCommits}
          icon={<History24Regular />}
          showProgress
          progressValue={summary.aiPercentage}
          progressLabel={`${summary.aiCommits.toLocaleString()} AI / ${summary.humanCommits.toLocaleString()} Human`}
        />
        <SummaryCard
          title="Total Lines"
          value={summary.totalLines}
          icon={<Code24Regular />}
          showProgress
          progressValue={summary.linesAiPercentage}
          progressLabel={`${summary.aiLines.toLocaleString()} AI / ${summary.humanLines.toLocaleString()} Human`}
        />
        <SummaryCard
          title="Contributors"
          value={summary.contributorCount}
          icon={<People24Regular />}
        />
        <SummaryCard
          title="Applications"
          value={summary.applicationCount}
          icon={<Document24Regular />}
        />
      </div>

      {/* Row 1: 4 Charts - Pie, Tier Bar, App Bar, Top Contributors */}
      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        {/* Chart 1: AI vs Human Code Distribution (Doughnut) */}
        <div className={styles.card}>
          <AIHumanPieChart
            aiValue={summary.aiLines}
            humanValue={summary.humanLines}
            title="AI vs Human Code Distribution"
            subtitle="Distribution of code lines"
          />
        </div>
        
        {/* Chart 2: Confidence Tier Distribution (Bar) */}
        <div className={styles.card}>
          <TierBarChart
            tiers={summary.tiers}
            title="Confidence Tier Distribution"
            subtitle="Commits by AI confidence level"
          />
        </div>
      </div>

      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        {/* Chart 3: AI Usage by Application (Stacked Bar) */}
        <div className={styles.card}>
          <ApplicationBarChart
            applications={applicationsWithLines}
            title="AI Usage by Application"
            subtitle="AI vs Human lines per repository"
            showLines
          />
        </div>

        {/* Chart 4: Top Contributors by AI Usage (Horizontal Bar) */}
        <div className={styles.card}>
          <ContributorBarChart
            contributors={topContributorsByLines}
            title="Top Contributors by AI Usage"
            subtitle="Top 10 contributors by AI lines"
            showLines
          />
        </div>
      </div>

      {/* Row 2: Contributor Details and File Type */}
      <div className={mergeClasses(styles.grid, styles.gridTwo)}>
        {/* Chart 5: Contributor Application Details (with selector) */}
        <div className={styles.card}>
          <ContributorDetailChart
            users={users}
            title="Contributor Application Details"
            subtitle="Select a contributor to see their breakdown"
          />
        </div>

        {/* Chart 6: AI Usage by File Type (Stacked Bar) */}
        <div className={styles.card}>
          <FileTypeBarChart
            fileTypes={fileTypes.slice(0, 8)}
            title="AI Usage by File Type"
            subtitle="AI vs Human lines by extension"
            height={350}
          />
        </div>
      </div>

      {/* Row 3: Historical Trend Chart (Full Width) */}
      <div className={styles.card}>
        {historicalLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 250, gap: 12 }}>
            <Spinner size="medium" />
            <Text size={300}>Loading historical data from all reports...</Text>
          </div>
        ) : (
          <HistoricalLineChart
            data={historicalChartData}
            title="Historical Trend (AI Usage % Over Reports)"
            subtitle={historicalData.length > 1 
              ? `Showing ${historicalChartData.length} analysis reports`
              : "Monthly AI commit percentage"
            }
            height={250}
            showPercentage
            showBothLines
          />
        )}
      </div>
    </div>
  );
};

// Helper function to format month label
function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

// Helper function to format report label (use name or date)
function formatReportLabel(name: string, date: string): string {
  // If name looks like a custom name (not just a date), use it
  if (name && !name.match(/^\d{4}-\d{2}-\d{2}/)) {
    return name;
  }
  // Otherwise, format the date nicely
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }
    return date;
  }
  return name || 'Unknown';
}
