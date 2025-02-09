import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize Anthropic client
const apiKey = process.env.ANTHROPIC_API_KEY || '';
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  ANTHROPIC_API_KEY_LENGTH: apiKey.length,
  HAS_API_KEY: Boolean(apiKey)
});

if (!apiKey) {
  console.error('No API key found!');
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

// Verify API key format (should start with 'sk-ant')
if (!apiKey.startsWith('sk-ant')) {
  console.error('Invalid API key format');
  throw new Error('Invalid ANTHROPIC_API_KEY format');
}

const anthropic = new Anthropic({
  apiKey,
  baseURL: 'https://api.anthropic.com/v1',
});

// Add retry logic for API calls
async function retryAnthropicCall<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}...`);
      return await fn();
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should not reach here');
}

console.log('Anthropic client initialized');

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

    console.log('Sending request to Claude Vision API...');
    let message;
    try {
      message = await retryAnthropicCall(() => anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this receipt image and extract the following information in JSON format:\n' +
                    '- Store name\n' +
                    '- Date of purchase\n' +
                    '- Total amount\n' +
                    '- List of items with their prices\n' +
                    'Format the response as valid JSON with these fields: storeName, purchaseDate, totalCost, items (array of {name, price, quantity, unit})'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Image
              }
            }
          ]
        }]
      }));
    } catch (error: any) {
      console.error('Anthropic API error:', {
        message: error.message,
        status: error.status,
        type: error.type,
        details: error.details,
        stack: error.stack
      });
      return NextResponse.json(
        { 
          error: 'Failed to process receipt with Claude Vision',
          details: error.message || 'Unknown error',
          status: error.status,
          type: error.type
        },
        { status: 500 }
      );
    }

    console.log('Received response from Claude');
    const responseContent = message.content[0];
    console.log('Response type:', responseContent.type);
    
    if (responseContent.type !== 'text') {
      console.error('Unexpected response type:', responseContent.type);
      throw new Error('Unexpected response type from Claude');
    }
    
    let parsedData;
    try {
      // Extract JSON from the response
      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (error) {
      console.error('Error parsing Claude response:', error);
      return NextResponse.json(
        { error: 'Failed to parse receipt data' },
        { status: 500 }
      );
    }

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error processing receipt:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}
