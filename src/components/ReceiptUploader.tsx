import { useState, useCallback } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register plugins
registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType);

interface ReceiptUploaderProps {
  onUpload: (file: File) => Promise<void>;
}

export default function ReceiptUploader({ onUpload }: ReceiptUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  // FilePond's type system is complex, using any here for simplicity
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const handleProcessFile = useCallback(async (fieldName: string, file: any, metadata: any, load: any, error: any) => {
    try {
      setIsUploading(true);
      await onUpload(file);
      load(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Upload error:', err);
      error(errorMessage);
    } finally {
      setIsUploading(false);
    }

    return {
      abort: () => {
        setIsUploading(false);
      }
    };
  }, [onUpload]);

  return (
    <div className="w-full max-w-md mx-auto">
      <FilePond
        allowMultiple={false}
        maxFiles={1}
        server={{
          process: handleProcessFile,
          fetch: null,
          revert: null,
          restore: null,
          load: null
        }}
        name="file"
        labelIdle='Drag & Drop your receipt or <span class="filepond--label-action">Browse</span>'
        acceptedFileTypes={['image/*']}
        imagePreviewHeight={170}
        disabled={isUploading}
        className={isUploading ? 'opacity-50' : ''}
        onwarning={(error) => console.warn('FilePond warning:', error)}
        onerror={(error) => console.error('FilePond error:', error)}
      />
      {isUploading && (
        <div className="text-center mt-2 text-sm text-gray-600">
          Processing receipt...
        </div>
      )}
    </div>
  );
}
