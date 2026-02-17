import { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Title1,
  Button,
  Tooltip,
  Badge,
} from '@fluentui/react-components';
import {
  WeatherMoon24Regular,
  WeatherSunny24Regular,
  ArrowDownload24Regular,
  Info24Regular,
  ChartMultiple24Regular,
} from '@fluentui/react-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { toggleDarkMode } from '../../store/slices';

const useStyles = makeStyles({
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  logo: {
    fontSize: '1.75rem',
    display: 'flex',
    alignItems: 'center',
  },
  titleWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS,
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  badge: {
    marginLeft: tokens.spacingHorizontalS,
  },
  iconButton: {
    minWidth: '36px',
  },
});

interface HeaderProps {
  onExport?: () => void;
  onShowInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onExport, onShowInfo }) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { isDarkMode } = useAppSelector((state) => state.ui);
  const { processedData, lastUpdated } = useAppSelector(
    (state) => state.report
  );

  const handleThemeToggle = useCallback(() => {
    dispatch(toggleDarkMode());
  }, [dispatch]);

  const formatLastUpdated = (timestamp: string | null): string => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <span className={styles.logo}>
          <ChartMultiple24Regular />
        </span>
        <div className={styles.titleWrapper}>
          <Title1>Copilot Usage Dashboard</Title1>
          {lastUpdated && (
            <span className={styles.subtitle}>
              Last updated: {formatLastUpdated(lastUpdated)}
            </span>
          )}
        </div>
        {processedData && (
          <Badge
            className={styles.badge}
            appearance="filled"
            color="brand"
          >
            {processedData.summary.applicationCount} Apps
          </Badge>
        )}
      </div>

      <div className={styles.controls}>
        {/* ReportSelector is now used separately - remove duplicate dropdown */}

        <Tooltip content="Export Report" relationship="label">
          <Button
            className={styles.iconButton}
            appearance="subtle"
            icon={<ArrowDownload24Regular />}
            onClick={onExport}
            disabled={!processedData}
          />
        </Tooltip>

        <Tooltip content="Report Info" relationship="label">
          <Button
            className={styles.iconButton}
            appearance="subtle"
            icon={<Info24Regular />}
            onClick={onShowInfo}
            disabled={!processedData}
          />
        </Tooltip>

        <Tooltip content={isDarkMode ? 'Light Mode' : 'Dark Mode'} relationship="label">
          <Button
            className={styles.iconButton}
            appearance="subtle"
            icon={isDarkMode ? <WeatherSunny24Regular /> : <WeatherMoon24Regular />}
            onClick={handleThemeToggle}
          />
        </Tooltip>
      </div>
    </header>
  );
};

export default Header;
