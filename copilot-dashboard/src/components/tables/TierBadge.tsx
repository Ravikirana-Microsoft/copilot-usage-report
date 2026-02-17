import React from 'react';
import { mergeClasses } from '@fluentui/react-components';
import { useTableStyles } from './tableStyles';

interface TierBadgeProps {
  tier: number;
  showLabel?: boolean;
}

const TIER_LABELS: Record<number, string> = {
  1: '0-20%',
  2: '21-40%',
  3: '41-60%',
  4: '61-80%',
  5: '81-100%',
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  showLabel = true,
}) => {
  const styles = useTableStyles();
  
  const tierStyles: Record<number, string> = {
    1: styles.tier1,
    2: styles.tier2,
    3: styles.tier3,
    4: styles.tier4,
    5: styles.tier5,
  };

  return (
    <span className={mergeClasses(styles.tierBadge, tierStyles[tier])}>
      Tier {tier}
      {showLabel && ` (${TIER_LABELS[tier]})`}
    </span>
  );
};
