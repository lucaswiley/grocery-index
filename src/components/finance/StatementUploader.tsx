'use client';

import { useState, useCallback } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import { ParsedStatement } from '@/types/statement';

import 'filepond/dist/filepond.min.css';

registerPlugin(FilePondPluginFileValidateType);

interface StatementUploaderProps {
  onUpload: (statement: ParsedStatement) => void;
}

export default function StatementUploader({ onUpload }: StatementUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleProcessFile = useCallback(async (fieldName: string, file: any, metadata: any, load: any, errorCallback: any) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadCount((c) => c + 1);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to parse statement');
      }

      const statement: ParsedStatement = await response.json();
      onUpload(statement);
      load(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Upload error:', err);
      setError(errorMessage);
      errorCallback(errorMessage);
    } finally {
      setUploadCount((c) => c - 1);
    }

    return {
      abort: () => {
        setUploadCount((c) => c - 1);
      }
    };
  }, [onUpload]);

  // Update isUploading based on count
  const actuallyUploading = uploadCount > 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <FilePond
        allowMultiple={true}
        maxFiles={10}
        server={{
          process: handleProcessFile,
          fetch: null,
          revert: null,
          restore: null,
          load: null
        }}
        name="file"
        labelIdle='Drag & Drop your statements or <span class="filepond--label-action">Browse</span>'
        acceptedFileTypes={['text/csv', 'application/pdf', '.csv', '.pdf']}
        disabled={isUploading}
        className={actuallyUploading ? 'opacity-50' : ''}
        onwarning={(warning) => console.warn('FilePond warning:', warning)}
        onerror={(err) => console.error('FilePond error:', err)}
      />
      {actuallyUploading && (
        <div className="text-center mt-2 text-sm text-gray-600">
          Processing {uploadCount} statement{uploadCount > 1 ? 's' : ''}...
        </div>
      )}
      {error && (
        <div className="text-center mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
      <p className="text-xs text-gray-500 text-center mt-2">
        Supports multiple Chase checking and credit card exports (CSV or PDF)
      </p>
    </div>
  );
}
