import imageCompression from 'browser-image-compression';
import { Receipt } from '@/types/receipt';

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}...`);
      return await fn();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      lastError = err;
      
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
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error compressing image:', err);
    throw new Error('Failed to compress image: ' + err.message);
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

    try {
      // Extract JSON from the response
      const jsonMatch = responseData.rawResponse.match(/\{[\s\S]*\}/m);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      type ParsedReceipt = {
        storeName?: string;
        totalCost: string | number;
        items: Array<{
          item: string;
          price: string | number;
          unit: string;
          pricePerUnit: string | number;
        }>;
      };

      const parsedReceipt = JSON.parse(jsonMatch[0]) as ParsedReceipt;
      
      return {
        id: Date.now().toString(),
        storeName: parsedReceipt.storeName || 'Unknown Store',
        purchaseDate: new Date(), // Convert to Date object to match Receipt type
        createdAt: new Date(),
        updatedAt: new Date(),
        totalCost: Number(parsedReceipt.totalCost),
        items: parsedReceipt.items.map((item: {
          item: string;
          price: string | number;
          unit: string;
          pricePerUnit: string | number;
        }) => ({
          item: item.item,
          price: Number(item.price),
          unit: item.unit,
          pricePerUnit: Number(item.pricePerUnit)
        })),
        imageUrl: '' // We might want to store the image URL in the future
      } as Receipt;
    } catch (error: unknown) {
      const parseError = error instanceof Error ? error : new Error(String(error));
      console.error('Error parsing receipt data:', parseError);
      throw new Error('Failed to parse receipt data: ' + parseError.message);
    }
  } catch (error: unknown) {
    const uploadError = error instanceof Error ? error : new Error(String(error));
    console.error('Upload error:', {
      message: uploadError.message,
      cause: uploadError.cause,
      stack: uploadError.stack
    });
    throw uploadError;
  }
}
