import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Button,
  Radio,
  RadioGroup,
  makeStyles,
  tokens,
  shorthands,
  Spinner,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  DocumentPdf24Regular,
  DocumentTable24Regular,
  Document24Regular,
  ArrowDownload24Regular,
} from '@fluentui/react-icons';
import type { ProcessedData } from '../../types';
import {
  exportSummaryCSV,
  exportApplicationsCSV,
  exportContributorsCSV,
  exportBranchesCSV,
  exportCommitsCSV,
  exportFileTypesCSV,
  exportJSON,
  type ExportFormat,
  type ExportScope,
} from '../../services/exportService';
import { exportToExcel } from '../../services/excelExport';
import { exportToPDF, exportSummaryPDF } from '../../services/pdfExport';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('16px'),
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground1,
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('8px'),
  },
  formatCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    ...shorthands.gap('12px'),
  },
  formatCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    ...shorthands.padding('16px'),
    ...shorthands.borderRadius('8px'),
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    cursor: 'pointer',
    transitionProperty: 'all',
    transitionDuration: '150ms',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  formatCardSelected: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  formatIcon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground2,
  },
  formatIconSelected: {
    color: tokens.colorBrandForeground1,
  },
  formatLabel: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  formatDescription: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
  exportButton: {
    minWidth: '120px',
  },
});

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  data: ProcessedData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  data,
}) => {
  const styles = useStyles();
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [scope, setScope] = useState<ExportScope>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Small delay to show spinner
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      switch (format) {
        case 'pdf':
          if (scope === 'summary') {
            exportSummaryPDF(data);
          } else {
            exportToPDF(data);
          }
          break;
          
        case 'excel':
          exportToExcel(data);
          break;
          
        case 'csv':
          switch (scope) {
            case 'summary':
              exportSummaryCSV(data);
              break;
            case 'applications':
              exportApplicationsCSV(data.applications);
              break;
            case 'branches':
              exportBranchesCSV(data);
              break;
            case 'contributors':
              exportContributorsCSV(data.users);
              break;
            case 'commits':
              exportCommitsCSV(data);
              break;
            case 'fileTypes':
              exportFileTypesCSV(data);
              break;
            case 'all':
              // Export all as separate CSV files
              exportSummaryCSV(data);
              exportApplicationsCSV(data.applications);
              exportContributorsCSV(data.users);
              break;
          }
          break;
          
        case 'json':
          exportJSON(data);
          break;
      }
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions: { value: ExportFormat; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'pdf',
      label: 'PDF',
      description: 'Formatted report',
      icon: <DocumentPdf24Regular />,
    },
    {
      value: 'excel',
      label: 'Excel',
      description: 'Multi-sheet workbook',
      icon: <DocumentTable24Regular />,
    },
    {
      value: 'csv',
      label: 'CSV',
      description: 'Raw data export',
      icon: <Document24Regular />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }
        >
          Export Report
        </DialogTitle>
        
        <DialogBody>
          <DialogContent className={styles.content}>
            {/* Format Selection */}
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Export Format</span>
              <div className={styles.formatCards}>
                {formatOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`${styles.formatCard} ${
                      format === option.value ? styles.formatCardSelected : ''
                    }`}
                    onClick={() => setFormat(option.value)}
                  >
                    <span
                      className={`${styles.formatIcon} ${
                        format === option.value ? styles.formatIconSelected : ''
                      }`}
                    >
                      {option.icon}
                    </span>
                    <span className={styles.formatLabel}>{option.label}</span>
                    <span className={styles.formatDescription}>
                      {option.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope Selection (for CSV) */}
            {format === 'csv' && (
              <div className={styles.section}>
                <span className={styles.sectionTitle}>Data to Export</span>
                <RadioGroup
                  className={styles.radioGroup}
                  value={scope}
                  onChange={(_, data) => setScope(data.value as ExportScope)}
                >
                  <Radio value="all" label="All Data (multiple files)" />
                  <Radio value="summary" label="Summary Only" />
                  <Radio value="applications" label="Applications" />
                  <Radio value="branches" label="Branches" />
                  <Radio value="contributors" label="Contributors" />
                  <Radio value="commits" label="Commits" />
                  <Radio value="fileTypes" label="File Types" />
                </RadioGroup>
              </div>
            )}

            {/* PDF Scope */}
            {format === 'pdf' && (
              <div className={styles.section}>
                <span className={styles.sectionTitle}>Report Type</span>
                <RadioGroup
                  className={styles.radioGroup}
                  value={scope}
                  onChange={(_, data) => setScope(data.value as ExportScope)}
                >
                  <Radio value="all" label="Full Report" />
                  <Radio value="summary" label="Summary Only" />
                </RadioGroup>
              </div>
            )}
          </DialogContent>
        </DialogBody>
        
        <DialogActions>
          <Button appearance="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            className={styles.exportButton}
            icon={isExporting ? <Spinner size="tiny" /> : <ArrowDownload24Regular />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};
