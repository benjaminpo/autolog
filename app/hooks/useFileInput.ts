// React 19 custom hook for file input handling
import { useCallback } from 'react';

/**
 * Hook to handle file input changes in React 19
 * This is a separate hook because file inputs require special handling
 */
export function useFileInput(
  onFileChange: (file: File, reader: FileReader) => void
) {
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files[0]) {
        const reader = new FileReader();
        onFileChange(files[0], reader);
      }
    },
    [onFileChange]
  );

  return {
    handleFileChange
  };
}
