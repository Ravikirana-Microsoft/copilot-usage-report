import React from 'react';
import { useTableStyles } from './tableStyles';
import { COLORS } from '../../utils/colors';

interface ProgressCellProps {
  percentage: number;
  color?: string;
  showText?: boolean;
}

export const ProgressCell: React.FC<ProgressCellProps> = ({
  percentage,
  color = COLORS.AI_PRIMARY,
  showText = true,
}) => {
  const styles = useTableStyles();
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={styles.progressCell}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showText && (
        <span className={styles.progressText}>
          {clampedPercentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
};
