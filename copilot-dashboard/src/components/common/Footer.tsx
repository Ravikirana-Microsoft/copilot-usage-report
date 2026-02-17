import {
  makeStyles,
  tokens,
  Link,
  Text,
  Divider,
} from '@fluentui/react-components';
import { useAppSelector } from '../../store/hooks';

const useStyles = makeStyles({
  footer: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    marginTop: 'auto',
  },
  content: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacingHorizontalL,
    maxWidth: '1600px',
    margin: '0 auto',
  },
  metadata: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  metaLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  links: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
  divider: {
    height: '16px',
  },
  copyright: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4,
  },
});

interface FooterProps {
  version?: string;
}

export const Footer: React.FC<FooterProps> = ({ version = '2.0.0' }) => {
  const styles = useStyles();
  const { processedData } = useAppSelector((state) => state.report);
  const metadata = processedData?.metadata;

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.metadata}>
          {metadata && (
            <>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Analysis:</span>
                <span>{metadata.analysisName || 'Unknown'}</span>
              </div>
              <Divider vertical className={styles.divider} />
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Generated:</span>
                <span>{formatDate(metadata.timestamp)}</span>
              </div>
              {metadata.dateRange && (
                <>
                  <Divider vertical className={styles.divider} />
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Date Range:</span>
                    <span>{metadata.dateRange}</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className={styles.links}>
          <Link
            href="https://github.com/Ravikirana-Microsoft/copilot-usage-report"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
          <Divider vertical className={styles.divider} />
          <Link
            href="https://github.com/Ravikirana-Microsoft/copilot-usage-report/blob/main/docs/COMPLETE_DOCUMENTATION.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </Link>
          <Divider vertical className={styles.divider} />
          <Text className={styles.copyright}>
            v{version} • Copilot Usage Dashboard
          </Text>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
