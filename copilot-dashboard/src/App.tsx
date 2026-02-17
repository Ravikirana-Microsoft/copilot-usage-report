import { useEffect, useState, useRef } from 'react';
import {
  makeStyles,
  tokens,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { fetchReportsIndex } from './store/slices';
import {
  Header,
  TabNavigation,
  LoadingSpinner,
  Footer,
  ExportButton,
  ReportSelector,
  OverviewView,
  ApplicationsView,
  BranchesView,
  ContributorsView,
  CommitsView,
  FileTypesView,
  TiersView,
  ComparisonView,
  LeaderboardView,
  ExportModal,
} from './components';
import './App.css';

const useStyles = makeStyles({
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `0 ${tokens.spacingHorizontalXXL}`,
    marginTop: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
    justifyContent: 'space-between',
  },
  main: {
    flex: 1,
    maxWidth: '1600px',
    width: '100%',
    margin: '0 auto',
    padding: tokens.spacingHorizontalXXL,
  },
  contentArea: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    padding: tokens.spacingHorizontalXXL,
    minHeight: '400px',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3,
    gap: tokens.spacingVerticalM,
  },
  placeholderIcon: {
    fontSize: '3rem',
    marginBottom: tokens.spacingVerticalM,
  },
  errorContainer: {
    padding: tokens.spacingHorizontalXXL,
    maxWidth: '800px',
    margin: '0 auto',
    marginTop: tokens.spacingVerticalXXL,
  },
});

function App() {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { loading, error, processedData } = useAppSelector((state) => state.report);
  const { activeView } = useAppSelector((state) => state.ui);
  const [showExportModal, setShowExportModal] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Load reports index only once on mount
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      dispatch(fetchReportsIndex());
    }
  }, [dispatch]);

  if (loading) {
    return (
      <div className={styles.app}>
        <Header />
        <LoadingSpinner label="Loading report data..." fullPage />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.app}>
        <Header />
        <div className={styles.errorContainer}>
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        </div>
        <Footer />
      </div>
    );
  }

  const renderView = () => {
    if (!processedData) return null;

    switch (activeView) {
      case 'overview':
        return <OverviewView data={processedData} />;
      case 'applications':
        return <ApplicationsView data={processedData} />;
      case 'branches':
        return <BranchesView data={processedData} />;
      case 'contributors':
        return <ContributorsView data={processedData} />;
      case 'commits':
        return <CommitsView data={processedData} />;
      case 'fileTypes':
        return <FileTypesView data={processedData} />;
      case 'tiers':
        return <TiersView data={processedData} />;
      case 'comparison':
        return <ComparisonView data={processedData} />;
      case 'leaderboard':
        return <LeaderboardView data={processedData} />;
      default:
        return <OverviewView data={processedData} />;
    }
  };

  const summary = processedData?.summary;

  return (
    <div className={styles.app}>
      <Header />
      
      {processedData && (
        <>
          <TabNavigation
            applicationCount={processedData.applications.length}
            branchCount={processedData.branches.length}
            contributorCount={summary?.contributorCount}
            commitCount={processedData.commits.length}
          />
          
          <div className={styles.headerActions}>
            <ReportSelector />
            <ExportButton 
              data={processedData} 
              onOpenModal={() => setShowExportModal(true)} 
            />
          </div>
        </>
      )}

      {!processedData && (
        <div className={styles.headerActions}>
          <ReportSelector />
        </div>
      )}

      <main className={styles.main}>
        {processedData && summary ? (
          renderView()
        ) : (
          <div className={styles.contentArea}>
            <div className={styles.placeholder}>
              <span className={styles.placeholderIcon}>📊</span>
              <h3>No Report Data</h3>
              <p>Select a report period from the dropdown above to load data.</p>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Export Modal */}
      {processedData && (
        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          data={processedData}
        />
      )}
    </div>
  );
}

export default App;
