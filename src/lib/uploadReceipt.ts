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
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error;
      
      if (attempt === maxRetries) break;
      
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 4000);
      console.log(`Waiting ${delay}ms before retry...`);
      await wait(delay);
    }
  }

  throw lastError;
}

export async function uploadReceipt(file: File) {
  console.log('Starting upload for file:', file.name);
  const formData = new FormData();
  formData.append('file', file);

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

    console.log('Upload successful:', responseData);
    return responseData;
  } catch (error: any) {
    console.error('Upload error:', {
      message: error.message,
      cause: error.cause,
      stack: error.stack
    });
    throw error;
  }
}
