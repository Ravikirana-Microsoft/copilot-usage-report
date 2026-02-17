import {
  makeStyles,
  tokens,
  Card,
  Text,
  ProgressBar,
  Tooltip,
} from '@fluentui/react-components';
import {
  ArrowUp24Regular,
  ArrowDown24Regular,
  Info16Regular,
} from '@fluentui/react-icons';
import { formatNumber, formatPercentage, formatCompactNumber } from '../../utils/formatters';

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalL,
    minWidth: '220px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  cardAI: {
    borderLeft: `4px solid #00bcf2`,
  },
  cardHuman: {
    borderLeft: `4px solid #6b7280`,
  },
  cardSuccess: {
    borderLeft: `4px solid ${tokens.colorPaletteGreenBackground3}`,
  },
  cardWarning: {
    borderLeft: `4px solid ${tokens.colorPaletteYellowBackground3}`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalS,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoIcon: {
    cursor: 'pointer',
    color: tokens.colorNeutralForeground4,
  },
  value: {
    fontSize: '2rem',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    lineHeight: 1.2,
    marginBottom: tokens.spacingVerticalXS,
  },
  valueAI: {
    color: '#00bcf2',
  },
  valueHuman: {
    color: '#6b7280',
  },
  subValue: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalM,
  },
  progressContainer: {
    marginTop: tokens.spacingVerticalS,
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  trend: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXXS,
    fontSize: tokens.fontSizeBase200,
    marginTop: tokens.spacingVerticalS,
  },
  trendUp: {
    color: tokens.colorPaletteGreenForeground1,
  },
  trendDown: {
    color: tokens.colorPaletteRedForeground1,
  },
  icon: {
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusMedium,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
  },
  iconAI: {
    backgroundColor: 'rgba(0, 188, 242, 0.15)',
    color: '#00bcf2',
  },
  iconHuman: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    color: '#6b7280',
  },
});

export type SummaryCardVariant = 'ai' | 'human' | 'success' | 'warning' | 'default';

interface SummaryCardProps {
  title: string;
  value: number;
  subValue?: string;
  tooltip?: string;
  icon?: React.ReactNode;
  variant?: SummaryCardVariant;
  showProgress?: boolean;
  progressValue?: number;
  progressMax?: number;
  progressLabel?: string;
  trend?: number;
  trendLabel?: string;
  format?: 'number' | 'percentage' | 'compact';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subValue,
  tooltip,
  icon,
  variant = 'default',
  showProgress = false,
  progressValue = 0,
  progressMax = 100,
  progressLabel,
  trend,
  trendLabel,
  format = 'number',
}) => {
  const styles = useStyles();

  const getCardClass = () => {
    const classes = [styles.card];
    switch (variant) {
      case 'ai':
        classes.push(styles.cardAI);
        break;
      case 'human':
        classes.push(styles.cardHuman);
        break;
      case 'success':
        classes.push(styles.cardSuccess);
        break;
      case 'warning':
        classes.push(styles.cardWarning);
        break;
    }
    return classes.join(' ');
  };

  const getValueClass = () => {
    const classes = [styles.value];
    if (variant === 'ai') classes.push(styles.valueAI);
    if (variant === 'human') classes.push(styles.valueHuman);
    return classes.join(' ');
  };

  const formatValue = (val: number): string => {
    switch (format) {
      case 'percentage':
        return formatPercentage(val);
      case 'compact':
        return formatCompactNumber(val);
      default:
        return formatNumber(val);
    }
  };

  const progressPercentage = progressMax > 0 ? (progressValue / progressMax) * 100 : 0;

  return (
    <Card className={getCardClass()}>
      <div className={styles.header}>
        <div className={styles.title}>
          {title}
          {tooltip && (
            <Tooltip content={tooltip} relationship="description">
              <Info16Regular className={styles.infoIcon} />
            </Tooltip>
          )}
        </div>
        {icon && (
          <div className={`${styles.icon} ${variant === 'ai' ? styles.iconAI : styles.iconHuman}`}>
            {icon}
          </div>
        )}
      </div>

      <Text className={getValueClass()}>{formatValue(value)}</Text>

      {subValue && <Text className={styles.subValue}>{subValue}</Text>}

      {showProgress && (
        <div className={styles.progressContainer}>
          <div className={styles.progressLabel}>
            <span style={{ color: '#00bcf2' }}>AI: {formatPercentage(progressPercentage)}</span>
            <span style={{ color: '#6b7280' }}>Human: {formatPercentage(100 - progressPercentage)}</span>
          </div>
          <ProgressBar
            value={progressPercentage / 100}
            color="brand"
          />
          {progressLabel && (
            <div style={{ fontSize: '0.75rem', color: tokens.colorNeutralForeground3, marginTop: '4px' }}>
              {progressLabel}
            </div>
          )}
        </div>
      )}

      {trend !== undefined && (
        <div className={`${styles.trend} ${trend >= 0 ? styles.trendUp : styles.trendDown}`}>
          {trend >= 0 ? <ArrowUp24Regular /> : <ArrowDown24Regular />}
          <span>
            {trend >= 0 ? '+' : ''}
            {formatPercentage(trend)}
          </span>
          {trendLabel && <span style={{ color: tokens.colorNeutralForeground3 }}>{trendLabel}</span>}
        </div>
      )}
    </Card>
  );
};

export default SummaryCard;
