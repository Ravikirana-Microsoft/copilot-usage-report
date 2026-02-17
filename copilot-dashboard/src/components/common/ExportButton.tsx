import React from 'react';
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  ArrowDownload24Regular,
  DocumentPdf24Regular,
  DocumentTable24Regular,
  Document24Regular,
  Code24Regular,
  ChevronDown16Regular,
} from '@fluentui/react-icons';
import type { ProcessedData } from '../../types';
import {
  exportSummaryCSV,
  exportApplicationsCSV,
  exportJSON,
} from '../../services/exportService';
import { exportToExcel } from '../../services/excelExport';
import { exportToPDF } from '../../services/pdfExport';

const useStyles = makeStyles({
  button: {
    fontWeight: tokens.fontWeightSemibold,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
});

interface ExportButtonProps {
  data: ProcessedData;
  onOpenModal?: () => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ data, onOpenModal }) => {
  const styles = useStyles();

  const handleQuickExport = (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    switch (format) {
      case 'pdf':
        exportToPDF(data);
        break;
      case 'excel':
        exportToExcel(data);
        break;
      case 'csv':
        exportSummaryCSV(data);
        exportApplicationsCSV(data.applications);
        break;
      case 'json':
        exportJSON(data);
        break;
    }
  };

  return (
    <Menu>
      <MenuTrigger>
        <Button
          className={styles.button}
          appearance="primary"
          icon={<ArrowDownload24Regular />}
        >
          Export
          <ChevronDown16Regular />
        </Button>
      </MenuTrigger>

      <MenuPopover>
        <MenuList>
          <MenuItem
            icon={<DocumentPdf24Regular />}
            onClick={() => handleQuickExport('pdf')}
          >
            Export as PDF
          </MenuItem>
          <MenuItem
            icon={<DocumentTable24Regular />}
            onClick={() => handleQuickExport('excel')}
          >
            Export as Excel
          </MenuItem>
          <MenuItem
            icon={<Document24Regular />}
            onClick={() => handleQuickExport('csv')}
          >
            Export as CSV
          </MenuItem>
          <MenuItem
            icon={<Code24Regular />}
            onClick={() => handleQuickExport('json')}
          >
            Export as JSON
          </MenuItem>
          {onOpenModal && (
            <MenuItem
              icon={<ArrowDownload24Regular />}
              onClick={onOpenModal}
            >
              More Export Options...
            </MenuItem>
          )}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};
