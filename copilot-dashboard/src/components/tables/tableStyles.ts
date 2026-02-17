import { makeStyles, tokens, shorthands } from '@fluentui/react-components';

export const useTableStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
    width: '100%',
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
  },
  
  title: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  
  controls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('12px'),
    flexWrap: 'wrap',
  },
  
  searchInput: {
    minWidth: '200px',
    maxWidth: '300px',
  },
  
  tableWrapper: {
    overflowX: 'auto',
    ...shorthands.borderRadius('8px'),
    backgroundColor: tokens.colorNeutralBackground2,
  },
  
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: tokens.fontSizeBase200,
  },
  
  tableHeader: {
    backgroundColor: tokens.colorNeutralBackground3,
  },
  
  th: {
    ...shorthands.padding('12px', '16px'),
    textAlign: 'left',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke1),
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  
  thSortable: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('4px'),
  },
  
  thRight: {
    textAlign: 'right',
    justifyContent: 'flex-end',
  },
  
  td: {
    ...shorthands.padding('10px', '16px'),
    color: tokens.colorNeutralForeground2,
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    verticalAlign: 'middle',
  },
  
  tdRight: {
    textAlign: 'right',
  },
  
  tdCenter: {
    textAlign: 'center',
  },
  
  tr: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  
  trClickable: {
    cursor: 'pointer',
  },
  
  pagination: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    ...shorthands.gap('12px'),
    paddingTop: '8px',
  },
  
  paginationInfo: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  
  paginationControls: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
  },
  
  emptyState: {
    ...shorthands.padding('40px'),
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
  },
  
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('2px', '8px'),
    ...shorthands.borderRadius('4px'),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
  
  badgeAI: {
    backgroundColor: 'rgba(0, 188, 242, 0.15)',
    color: '#00bcf2',
  },
  
  badgeHuman: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    color: '#9ca3af',
  },
  
  progressCell: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    minWidth: '150px',
  },
  
  progressBar: {
    flexGrow: 1,
    height: '6px',
    backgroundColor: tokens.colorNeutralBackground4,
    ...shorthands.borderRadius('3px'),
    ...shorthands.overflow('hidden'),
  },
  
  progressFill: {
    height: '100%',
    ...shorthands.borderRadius('3px'),
    transitionProperty: 'width',
    transitionDuration: '300ms',
  },
  
  progressText: {
    minWidth: '45px',
    textAlign: 'right',
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
  },
  
  tierBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('2px', '10px'),
    ...shorthands.borderRadius('12px'),
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightSemibold,
  },
  
  tier1: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#ef4444',
  },
  
  tier2: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    color: '#f97316',
  },
  
  tier3: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    color: '#eab308',
  },
  
  tier4: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
  },
  
  tier5: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
  },
  
  monospace: {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: tokens.fontSizeBase100,
  },
  
  truncate: {
    maxWidth: '200px',
    whiteSpace: 'nowrap',
    ...shorthands.overflow('hidden'),
    textOverflow: 'ellipsis',
  },
  
  sortIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
  },
  
  sortIconActive: {
    color: tokens.colorBrandForeground1,
  },
});
