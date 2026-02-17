import React, { useRef } from 'react';
import {
  Button,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { DocumentAdd24Regular } from '@fluentui/react-icons';
import { useAppDispatch } from '../../store/hooks';
import { loadReportFromFile } from '../../store/slices/reportSlice';

const useStyles = makeStyles({
  input: {
    display: 'none',
  },
  button: {
    fontWeight: tokens.fontWeightSemibold,
  },
});

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await dispatch(loadReportFromFile(file));
      onUploadComplete?.();
      // Reset the input so the same file can be selected again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className={styles.input}
        onChange={handleFileChange}
      />
      <Button
        className={styles.button}
        appearance="secondary"
        icon={<DocumentAdd24Regular />}
        onClick={handleClick}
      >
        Load JSON
      </Button>
    </>
  );
};
