import imageCompression from 'browser-image-compression';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}...`);
      return await fn();
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 4000);
      console.log(`Waiting ${delay}ms before retry...`);
      await wait(delay);
    }
  }

  throw lastError;
}

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');

  if (file.size <= MAX_SIZE_BYTES) {
    console.log('File already under size limit');
    return file;
  }

  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: 4096,
    useWebWorker: true,
    fileType: file.type,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
    return compressedFile;
  } catch (error: any) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image: ' + (error.message || 'Unknown error'));
  }
}

export async function uploadReceipt(file: File) {
  console.log('Starting upload for file:', file.name);
  
  // Only compress if it's an image file
  const compressedFile = file.type.startsWith('image/') 
    ? await compressImage(file)
    : file;

  const formData = new FormData();
  formData.append('file', compressedFile);

  try {
    console.log('Sending request to /api/upload');
    const response = await retryRequest(() => 
      fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
    );

    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    if (!response.ok) {
      throw new Error(
        `Upload failed: ${responseData.error}\n` +
        `Details: ${responseData.details}\n` +
        `Status: ${responseData.status}\n` +
        `Type: ${responseData.type}`
      );
    }

    // For now, return a dummy receipt while we debug the API response
    return {
      id: Date.now().toString(),
      storeName: 'Test Store',
      purchaseDate: new Date().toISOString(),
      totalCost: 0,
      items: []
    };
  } catch (error: any) {
    console.error('Upload error:', {
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    throw error;
  }
}
