import {
  makeStyles,
  tokens,
  Spinner,
  Text,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXXL,
  },
  fullPage: {
    minHeight: '100vh',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  text: {
    color: tokens.colorNeutralForeground3,
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    boxShadow: tokens.shadow64,
  },
});

interface LoadingSpinnerProps {
  label?: string;
  size?: 'tiny' | 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | 'huge';
  fullPage?: boolean;
  overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'large',
  fullPage = false,
  overlay = false,
}) => {
  const styles = useStyles();

  if (overlay) {
    return (
      <div className={styles.overlay}>
        <div className={styles.overlayContent}>
          <Spinner size={size} />
          {label && <Text className={styles.text}>{label}</Text>}
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${fullPage ? styles.fullPage : ''}`}>
      <Spinner size={size} label={label} />
    </div>
  );
};

export default LoadingSpinner;
