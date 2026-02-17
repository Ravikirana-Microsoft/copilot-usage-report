import React, { useMemo } from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Trophy24Regular,
  Warning24Regular,
  Checkmark24Regular,
  Star24Regular,
  Target24Regular,
  Dismiss24Regular,
} from '@fluentui/react-icons';
import type { ProcessedData } from '../../types';
import { formatNumber, formatPercentage } from '../../utils/formatters';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalL,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground5,
    },
  },
  goldItem: {
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05))',
    border: '2px solid #ffd700',
  },
  silverItem: {
    background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.15), rgba(192, 192, 192, 0.05))',
    border: '2px solid #c0c0c0',
  },
  bronzeItem: {
    background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.15), rgba(205, 127, 50, 0.05))',
    border: '2px solid #cd7f32',
  },
  rank: {
    width: '48px',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground5,
  },
  rankGold: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    color: '#ffd700',
  },
  rankSilver: {
    backgroundColor: 'rgba(192, 192, 192, 0.2)',
    color: '#c0c0c0',
  },
  rankBronze: {
    backgroundColor: 'rgba(205, 127, 50, 0.2)',
    color: '#cd7f32',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userDetails: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXS,
  },
  score: {
    textAlign: 'right',
  },
  scoreValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
    color: '#00bcf2',
  },
  scoreLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
  },
  alertItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  alertSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid #22c55e',
  },
  alertWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid #f59e0b',
  },
  alertDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
  },
  alertIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: tokens.spacingVerticalXXS,
  },
  alertMessage: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  noData: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground3,
  },
});

interface LeaderboardViewProps {
  data: ProcessedData;
}

interface Alert {
  type: 'success' | 'warning' | 'danger';
  icon: React.ReactNode;
  title: string;
  message: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ data }) => {
  const styles = useStyles();
  const { users, branches, summary } = data;

  // Top users sorted by AI lines (same as original dashboard)
  const topUsers = useMemo(() => {
    return Object.values(users)
      .filter((u) => u.aiLines > 0 && u.name && u.name !== 'Unknown' && u.name !== 'null' && u.name.trim() !== '')
      .map((u) => ({
        ...u,
        aiPercentage: u.totalLines > 0 ? (u.aiLines / u.totalLines) * 100 : 0,
      }))
      .sort((a, b) => b.aiLines - a.aiLines)
      .slice(0, 10);
  }, [users]);

  // Generate alerts (same logic as original dashboard)
  const alerts = useMemo<Alert[]>(() => {
    const alertList: Alert[] = [];
    const targetAIPct = 25; // Default target

    // Overall AI usage check
    const overallAIPct = summary.totalLines > 0
      ? (summary.aiLines / summary.totalLines) * 100
      : 0;

    if (overallAIPct >= targetAIPct) {
      alertList.push({
        type: 'success',
        icon: <Checkmark24Regular style={{ color: '#22c55e' }} />,
        title: 'Target Achieved!',
        message: `Overall AI usage is ${formatPercentage(overallAIPct)}, exceeding the ${targetAIPct}% target.`,
      });
    } else {
      alertList.push({
        type: 'warning',
        icon: <Warning24Regular style={{ color: '#f59e0b' }} />,
        title: 'Below Target',
        message: `Overall AI usage is ${formatPercentage(overallAIPct)}, below the ${targetAIPct}% target. Gap: ${formatPercentage(targetAIPct - overallAIPct)}`,
      });
    }

    // Check branches with very low AI usage
    const lowUsageBranches = branches.filter((b) => {
      const pct = b.aiPercentage || 0;
      return pct < 10 && b.totalCommits > 10;
    });

    if (lowUsageBranches.length > 0) {
      alertList.push({
        type: 'danger',
        icon: <Dismiss24Regular style={{ color: '#ef4444' }} />,
        title: 'Low AI Adoption',
        message: `${lowUsageBranches.length} branch(es) have less than 10% AI usage: ${lowUsageBranches.slice(0, 3).map((b) => `${b.application}/${b.branch}`).join(', ')}${lowUsageBranches.length > 3 ? '...' : ''}`,
      });
    }

    // Check branches with excellent AI usage
    const highUsageBranches = branches.filter((b) => {
      const pct = b.aiPercentage || 0;
      return pct >= 40;
    });

    if (highUsageBranches.length > 0) {
      alertList.push({
        type: 'success',
        icon: <Star24Regular style={{ color: '#22c55e' }} />,
        title: 'High AI Adoption',
        message: `${highUsageBranches.length} branch(es) have excellent AI usage (40%+): ${highUsageBranches.slice(0, 3).map((b) => `${b.application}/${b.branch}`).join(', ')}${highUsageBranches.length > 3 ? '...' : ''}`,
      });
    }

    // Tier 1 (Definitive AI) check
    const tier1Count = summary.tiers.tier1 || 0;
    if (tier1Count > 0) {
      alertList.push({
        type: 'success',
        icon: <Target24Regular style={{ color: '#22c55e' }} />,
        title: 'Definitive AI Commits',
        message: `${tier1Count} commit(s) detected as Tier 1 (99-100% confidence) AI-generated code.`,
      });
    }

    // No AI commits warning
    if (summary.aiCommits === 0) {
      alertList.push({
        type: 'danger',
        icon: <Dismiss24Regular style={{ color: '#ef4444' }} />,
        title: 'No AI Usage Detected',
        message: 'No AI-assisted commits were detected in the analyzed period. Consider enabling Copilot for your team.',
      });
    }

    return alertList;
  }, [summary, branches]);

  const medals = ['🥇', '🥈', '🥉'];

  const getRankClass = (index: number) => {
    if (index === 0) return styles.rankGold;
    if (index === 1) return styles.rankSilver;
    if (index === 2) return styles.rankBronze;
    return '';
  };

  const getItemClass = (index: number) => {
    if (index === 0) return styles.goldItem;
    if (index === 1) return styles.silverItem;
    if (index === 2) return styles.bronzeItem;
    return '';
  };

  const getAlertClass = (type: string) => {
    switch (type) {
      case 'success': return styles.alertSuccess;
      case 'warning': return styles.alertWarning;
      case 'danger': return styles.alertDanger;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      {/* Leaderboard */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <Trophy24Regular style={{ color: '#ffd700' }} />
          <span>🏆 Top AI Users Leaderboard</span>
        </div>

        {topUsers.length === 0 ? (
          <div className={styles.noData}>No AI usage data available</div>
        ) : (
          <div className={styles.leaderboardList}>
            {topUsers.map((user, index) => (
              <div
                key={user.name}
                className={`${styles.leaderboardItem} ${getItemClass(index)}`}
              >
                <div className={`${styles.rank} ${getRankClass(index)}`}>
                  {index < 3 ? medals[index] : `#${index + 1}`}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={styles.userDetails}>
                    {user.totalCommits} commits | {user.aiCommits} AI commits | {formatNumber(user.totalLines)} total lines
                  </div>
                </div>
                <div className={styles.score}>
                  <div className={styles.scoreValue}>{formatNumber(user.aiLines)}</div>
                  <div className={styles.scoreLabel}>AI Lines ({formatPercentage(user.aiPercentage)})</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alerts & Thresholds */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <Warning24Regular />
          <span>Alerts & Thresholds</span>
        </div>

        <div className={styles.alertsList}>
          {alerts.map((alert, index) => (
            <div key={index} className={`${styles.alertItem} ${getAlertClass(alert.type)}`}>
              <div className={styles.alertIcon}>{alert.icon}</div>
              <div className={styles.alertContent}>
                <div className={styles.alertTitle}>{alert.title}</div>
                <div className={styles.alertMessage}>{alert.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardView;
