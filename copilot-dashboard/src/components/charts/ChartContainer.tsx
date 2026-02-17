import { makeStyles, tokens, Card, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacingVerticalM,
  },
  title: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginTop: tokens.spacingVerticalXXS,
  },
  chartWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: '250px',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '200px',
    color: tokens.colorNeutralForeground3,
    gap: tokens.spacingVerticalS,
  },
  emptyIcon: {
    fontSize: '2rem',
    opacity: 0.5,
  },
});

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
  height?: string | number;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  children,
  actions,
  isEmpty = false,
  emptyMessage = 'No data available',
  height,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <div>
          <Text className={styles.title}>{title}</Text>
          {subtitle && <Text className={styles.subtitle}>{subtitle}</Text>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      <div className={styles.chartWrapper} style={{ height: height || '300px' }}>
        {isEmpty ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <Text>{emptyMessage}</Text>
          </div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
};

export default ChartContainer;
