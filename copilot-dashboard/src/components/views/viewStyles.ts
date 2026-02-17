import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

export const useViewStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('24px'),
    width: '100%',
  },
  
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  
  sectionTitle: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px',
  },
  
  grid: {
    display: 'grid',
    ...shorthands.gap('20px'),
  },
  
  gridTwo: {
    gridTemplateColumns: 'repeat(2, 1fr)',
    '@media (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  
  gridThree: {
    gridTemplateColumns: 'repeat(3, 1fr)',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  
  gridFour: {
    gridTemplateColumns: 'repeat(4, 1fr)',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(2, 1fr)',
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    ...shorthands.gap('20px'),
  },
  
  card: {
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius('8px'),
    ...shorthands.padding('20px'),
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
  },
  
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    ...shorthands.gap('16px'),
    marginBottom: '16px',
  },
  
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
  },
  
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  
  statValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  
  statValueAI: {
    color: '#00bcf2',
  },
  
  statValueHuman: {
    color: '#6b7280',
  },
  
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
    marginBottom: '16px',
  },
  
  divider: {
    height: '1px',
    backgroundColor: tokens.colorNeutralStroke2,
    marginTop: '8px',
    marginBottom: '8px',
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('60px', '20px'),
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  
  emptyTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    marginBottom: '8px',
  },
  
  emptyDescription: {
    fontSize: tokens.fontSizeBase200,
  },
});
