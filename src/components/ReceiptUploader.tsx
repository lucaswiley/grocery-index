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
  const [files, setFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleProcessFile = useCallback(async (fieldName: string, file: any, metadata: any, load: Function, error: Function, progress: Function, abort: Function) => {
    try {
      setIsUploading(true);
      await onUpload(file);
      load(file);
    } catch (err: any) {
      console.error('Upload error:', err);
      error(err.message);
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  return (
    <div className="w-full max-w-md mx-auto">
      <FilePond
        files={files}
        onupdatefiles={setFiles}
        allowMultiple={false}
        maxFiles={1}
        server={{
          process: handleProcessFile,
        }}
        name="file"
        labelIdle='Drag & Drop your receipt or <span class="filepond--label-action">Browse</span>'
        acceptedFileTypes={['image/*']}
        imagePreviewHeight={170}
        disabled={isUploading}
        className={isUploading ? 'opacity-50' : ''}
      />
      {isUploading && (
        <div className="text-center mt-2 text-sm text-gray-600">
          Processing receipt...
        </div>
      )}
    </div>
  );
}
