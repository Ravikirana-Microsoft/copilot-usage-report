import { useCallback } from 'react';
import {
  makeStyles,
  tokens,
  Tab,
  TabList,
  Badge,
} from '@fluentui/react-components';
import type { SelectTabData, SelectTabEvent } from '@fluentui/react-components';
import {
  Home24Regular,
  Apps24Regular,
  BranchFork24Regular,
  People24Regular,
  DocumentText24Regular,
  History24Regular,
  GridDots24Regular,
  Trophy24Regular,
} from '@fluentui/react-icons';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setActiveView } from '../../store/slices';
import type { ViewType } from '../../utils/constants';
import { VIEWS } from '../../utils/constants';

const useStyles = makeStyles({
  container: {
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground2,
    paddingLeft: tokens.spacingHorizontalXXL,
    paddingRight: tokens.spacingHorizontalXXL,
  },
  tabList: {
    maxWidth: '100%',
    overflowX: 'auto',
  },
  tab: {
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
  },
  tabContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  badge: {
    marginLeft: tokens.spacingHorizontalXS,
  },
});

interface TabConfig {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface TabNavigationProps {
  applicationCount?: number;
  branchCount?: number;
  contributorCount?: number;
  commitCount?: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  applicationCount,
  branchCount,
  contributorCount,
  commitCount,
}) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { activeView } = useAppSelector((state) => state.ui);

  const tabs: TabConfig[] = [
    {
      id: VIEWS.OVERVIEW,
      label: 'Overview',
      icon: <Home24Regular />,
    },
    {
      id: VIEWS.APPLICATIONS,
      label: 'Applications',
      icon: <Apps24Regular />,
      badge: applicationCount,
    },
    {
      id: VIEWS.BRANCHES,
      label: 'Branches',
      icon: <BranchFork24Regular />,
      badge: branchCount,
    },
    {
      id: VIEWS.CONTRIBUTORS,
      label: 'Users',
      icon: <People24Regular />,
      badge: contributorCount,
    },
    {
      id: VIEWS.COMMITS,
      label: 'Commits',
      icon: <History24Regular />,
      badge: commitCount,
    },
    {
      id: VIEWS.FILE_TYPES,
      label: 'File Types',
      icon: <DocumentText24Regular />,
    },
    {
      id: VIEWS.COMPARISON,
      label: 'Compare Repos',
      icon: <GridDots24Regular />,
    },
    {
      id: VIEWS.LEADERBOARD,
      label: 'Leaderboard',
      icon: <Trophy24Regular />,
    },
  ];

  const handleTabSelect = useCallback(
    (_event: SelectTabEvent, data: SelectTabData) => {
      dispatch(setActiveView(data.value as ViewType));
    },
    [dispatch]
  );

  return (
    <div className={styles.container}>
      <TabList
        className={styles.tabList}
        selectedValue={activeView}
        onTabSelect={handleTabSelect}
        size="large"
      >
        {tabs.map((tab) => (
          <Tab key={tab.id} value={tab.id} className={styles.tab}>
            <div className={styles.tabContent}>
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge
                  className={styles.badge}
                  appearance="filled"
                  size="small"
                  color="informative"
                >
                  {tab.badge}
                </Badge>
              )}
            </div>
          </Tab>
        ))}
      </TabList>
    </div>
  );
};

export default TabNavigation;
