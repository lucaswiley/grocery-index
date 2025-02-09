import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openaiKey = process.env.OPENAI_API_KEY;

if (!openaiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

const openai = new OpenAI({
  apiKey: openaiKey,
});

console.log('OpenAI client initialized');

// Add retry logic for API calls
async function retryApiCall<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  const timeout = 30000; // 30 second timeout

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), timeout);
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}...`);
      
      // Race between the API call and timeout
      const result = await Promise.race([
        fn(),
        timeoutPromise
      ]);

      return result as T;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, {
        message: err.message,
        status: err instanceof Error ? ('status' in err ? (err as { status?: unknown }).status : undefined) : undefined,
        type: err instanceof Error ? ('type' in err ? (err as { type?: unknown }).type : undefined) : undefined,
        stack: err.stack
      });

      if (attempt === maxRetries) {
        throw err;
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should not reach here');
}

export async function POST(request: Request) {
  console.log('Received upload request');
  try {
    console.log('Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    console.log('File received:', file ? file.name : 'No file');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('Converting image to base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    console.log('Image converted to base64');

    console.log('Sending request to OpenAI API...');
    try {
      const response = await retryApiCall(() => 
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { 
                  type: 'text', 
                  text: 'This is a grocery receipt. Extract the information and format as JSON.\n\nRequired Structure:\n{\n  "storeName": "Store Name Here",\n  "totalCost": 123.45,\n  "items": [\n    {\n      "item": "Item Name",\n      "price": 12.34,\n      "unit": "ea",\n      "pricePerUnit": 12.34\n    }\n  ]\n}\n\nRules:\n1. storeName must be a string\n2. totalCost must be a number (no currency symbols)\n3. items must be an array of objects\n4. Each item must have:\n   - item (string): name of the item\n   - price (number): total price paid\n   - unit (string): unit of measurement (e.g., "ea" for each, "lb" for pound, "oz" for ounce)\n   - pricePerUnit (number): price per unit (e.g., price per item or price per pound)\n5. Return only the JSON object, no markdown or other text\n\nExample interpretations:\n- "Apples $4.99/lb" → {"item": "Apples", "price": 9.98, "unit": "lb", "pricePerUnit": 4.99} (if 2 lbs purchased)\n- "Milk $3.99" → {"item": "Milk", "price": 3.99, "unit": "ea", "pricePerUnit": 3.99}'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
        })
      );

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return new Response(
          JSON.stringify({
            error: 'Invalid API response',
            details: 'No content in response',
            type: 'API_ERROR'
          }),
          { status: 500 }
        );
      }
      
      // Log the raw response for debugging
      console.log('Raw API Response:', content);
      
      return new Response(JSON.stringify({
        success: true,
        rawResponse: content
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('OpenAI API error:', err);
      return new Response(
        JSON.stringify({
          error: 'Failed to process receipt',
          details: err.message,
          type: 'API_ERROR'
        }),
        { status: 500 }
      );
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error processing receipt:', err);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
