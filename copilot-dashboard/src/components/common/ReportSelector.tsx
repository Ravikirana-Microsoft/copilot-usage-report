import React from 'react';
import {
  makeStyles,
  tokens,
  Dropdown,
  Option,
  Label,
  Spinner,
} from '@fluentui/react-components';
import { Calendar24Regular } from '@fluentui/react-icons';
import type { SelectionEvents, OptionOnSelectData } from '@fluentui/react-components';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchReport } from '../../store/slices/reportSlice';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  dropdown: {
    minWidth: '250px',
  },
  icon: {
    color: tokens.colorBrandForeground1,
    marginRight: tokens.spacingHorizontalXS,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
});

interface ReportInfo {
  filename: string;
  name: string;
  date: string;
  dateRange: string;
}

export const ReportSelector: React.FC = () => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const { availableReports, currentReportPath, loading } = useAppSelector((state) => state.report);

  // Note: fetchReportsIndex is called from App.tsx on mount, no need to call here

  const handleReportChange = (
    _event: SelectionEvents,
    data: OptionOnSelectData
  ) => {
    const selectedFilename = data.optionValue as string;
    if (selectedFilename && selectedFilename !== currentReportPath) {
      const basePath = import.meta.env.BASE_URL || '/';
      dispatch(fetchReport(`${basePath}reports/${selectedFilename}`));
    }
  };

  // Get current selected report name for display
  const getCurrentReportDisplay = (): string => {
    if (!currentReportPath) return '';
    const report = availableReports.find((r) => 
      currentReportPath.includes(r.filename)
    );
    return report ? `${report.name} (${report.dateRange})` : currentReportPath;
  };

  if (loading && availableReports.length === 0) {
    return (
      <div className={styles.container}>
        <Spinner size="tiny" label="Loading reports..." />
      </div>
    );
  }

  if (availableReports.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Label className={styles.label}>
        <Calendar24Regular className={styles.icon} />
        Report Period:
      </Label>
      <Dropdown
        className={styles.dropdown}
        placeholder="Select a report period"
        value={getCurrentReportDisplay()}
        onOptionSelect={handleReportChange}
        disabled={loading}
      >
        {availableReports.map((report: ReportInfo) => (
          <Option 
            key={report.filename} 
            value={report.filename}
            text={`${report.name} (${report.dateRange})`}
          >
            {report.name} ({report.dateRange})
          </Option>
        ))}
      </Dropdown>
    </div>
  );
};

export default ReportSelector;
