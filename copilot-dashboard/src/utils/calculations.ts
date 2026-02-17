import type { TierData } from '../types';

/**
 * Calculate AI percentage from AI and total values
 */
export const calculateAIPercentage = (aiValue: number, totalValue: number): number => {
  if (totalValue === 0) return 0;
  return (aiValue / totalValue) * 100;
};

/**
 * Calculate human value from total and AI values
 */
export const calculateHumanValue = (totalValue: number, aiValue: number): number => {
  return Math.max(0, totalValue - aiValue);
};

/**
 * Sum an array of numbers
 */
export const sum = (values: number[]): number => {
  return values.reduce((acc, val) => acc + val, 0);
};

/**
 * Calculate average of an array of numbers
 */
export const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
};

/**
 * Get top N items from array based on a value getter
 */
export const getTopN = <T>(
  items: T[],
  n: number,
  getValue: (item: T) => number,
  descending: boolean = true
): T[] => {
  const sorted = [...items].sort((a, b) => {
    const diff = getValue(b) - getValue(a);
    return descending ? diff : -diff;
  });
  return sorted.slice(0, n);
};

/**
 * Group items by a key
 */
export const groupBy = <T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return items.reduce((acc, item) => {
    const key = getKey(item);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
};

/**
 * Aggregate tier data from multiple sources
 */
export const aggregateTiers = (tierDataArray: TierData[]): TierData => {
  return tierDataArray.reduce(
    (acc, tiers) => ({
      tier1: acc.tier1 + tiers.tier1,
      tier2: acc.tier2 + tiers.tier2,
      tier3: acc.tier3 + tiers.tier3,
      tier4: acc.tier4 + tiers.tier4,
      tier5: acc.tier5 + tiers.tier5,
    }),
    { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 }
  );
};

/**
 * Get tier total
 */
export const getTierTotal = (tiers: TierData): number => {
  return tiers.tier1 + tiers.tier2 + tiers.tier3 + tiers.tier4 + tiers.tier5;
};

/**
 * Get tier percentage distribution
 */
export const getTierPercentages = (tiers: TierData): TierData => {
  const total = getTierTotal(tiers);
  if (total === 0) {
    return { tier1: 0, tier2: 0, tier3: 0, tier4: 0, tier5: 0 };
  }
  return {
    tier1: (tiers.tier1 / total) * 100,
    tier2: (tiers.tier2 / total) * 100,
    tier3: (tiers.tier3 / total) * 100,
    tier4: (tiers.tier4 / total) * 100,
    tier5: (tiers.tier5 / total) * 100,
  };
};

/**
 * Determine tier number from confidence score
 */
export const getTierFromConfidence = (confidence: number): number => {
  if (confidence >= 0.9) return 1;
  if (confidence >= 0.7) return 2;
  if (confidence >= 0.5) return 3;
  if (confidence >= 0.3) return 4;
  return 5;
};

/**
 * Get tier label
 */
export const getTierLabel = (tier: number): string => {
  const labels: Record<number, string> = {
    1: 'Tier 1 (90%+)',
    2: 'Tier 2 (70-90%)',
    3: 'Tier 3 (50-70%)',
    4: 'Tier 4 (30-50%)',
    5: 'Tier 5 (<30%)',
  };
  return labels[tier] || `Tier ${tier}`;
};

/**
 * Sort commits by date (newest first)
 */
export const sortByDateDesc = <T extends { date: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });
};

/**
 * Filter items by search term across multiple fields
 */
export const filterBySearch = <T>(
  items: T[],
  searchTerm: string,
  getSearchableFields: (item: T) => string[]
): T[] => {
  if (!searchTerm.trim()) return items;
  const term = searchTerm.toLowerCase();
  return items.filter((item) =>
    getSearchableFields(item).some((field) =>
      field.toLowerCase().includes(term)
    )
  );
};
