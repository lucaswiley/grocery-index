import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseChaseCSV, detectAccountType } from '@/lib/parseStatement';
import { ParsedStatement, Transaction, ExpenseCategory } from '@/types/statement';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function categorizeTransaction(description: string, amount: number): ExpenseCategory {
  const desc = description.toLowerCase();

  if (amount > 0 && (desc.includes('deposit') || desc.includes('payroll') || desc.includes('direct dep'))) {
    return 'income';
  }
  if (desc.includes('transfer') || desc.includes('zelle') || desc.includes('venmo') || desc.includes('paypal')) {
    return 'transfer';
  }
  if (desc.includes('fee') || desc.includes('charge') || desc.includes('interest')) {
    return 'fees';
  }
  if (desc.includes('home depot') || desc.includes('lowes') || desc.includes('lowe\'s') ||
      desc.includes('menards') || desc.includes('ace hardware') || desc.includes('hardware') ||
      desc.includes('lumber')) {
    return 'home_improvement';
  }
  if (desc.includes('grocery') || desc.includes('whole foods') || desc.includes('trader joe') ||
      desc.includes('safeway') || desc.includes('kroger') || desc.includes('costco') ||
      desc.includes('walmart') || desc.includes('target') || desc.includes('aldi')) {
    return 'groceries';
  }
  if (desc.includes('restaurant') || desc.includes('doordash') || desc.includes('uber eats') ||
      desc.includes('grubhub') || desc.includes('mcdonald') || desc.includes('starbucks') ||
      desc.includes('chipotle') || desc.includes('cafe') || desc.includes('coffee')) {
    return 'dining';
  }
  if (desc.includes('uber') || desc.includes('lyft') || desc.includes('gas') ||
      desc.includes('shell') || desc.includes('chevron') || desc.includes('parking')) {
    return 'transportation';
  }
  if (desc.includes('electric') || desc.includes('water') || desc.includes('internet') ||
      desc.includes('comcast') || desc.includes('verizon') || desc.includes('at&t')) {
    return 'utilities';
  }
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('hulu') ||
      desc.includes('disney') || desc.includes('movie')) {
    return 'entertainment';
  }
  if (desc.includes('pharmacy') || desc.includes('cvs') || desc.includes('walgreens') ||
      desc.includes('doctor') || desc.includes('medical')) {
    return 'health';
  }
  if (desc.includes('amazon') || desc.includes('best buy') || desc.includes('shop')) {
    return 'shopping';
  }

  return 'other';
}

function calculateSummary(transactions: Transaction[]) {
  const income = transactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const categoryTotals = new Map<ExpenseCategory, { total: number; count: number }>();

  transactions
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      const existing = categoryTotals.get(t.category) || { total: 0, count: 0 };
      categoryTotals.set(t.category, {
        total: existing.total + Math.abs(t.amount),
        count: existing.count + 1,
      });
    });

  const byCategory = Array.from(categoryTotals.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: expenses > 0 ? (data.total / expenses) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalIncome: income,
    totalExpenses: expenses,
    netChange: income - expenses,
    transactionCount: transactions.length,
    byCategory,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const accountType = formData.get('accountType') as 'checking' | 'credit' | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();

    // Handle CSV files
    if (fileName.endsWith('.csv')) {
      const csvContent = await file.text();
      const detectedType = accountType || detectAccountType(csvContent);
      const parsed = parseChaseCSV(csvContent, detectedType);
      parsed.fileName = file.name;
      return NextResponse.json(parsed);
    }

    // Handle PDF files using OpenAI Vision
    if (fileName.endsWith('.pdf')) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract all transactions from this bank/credit card statement PDF.

Return a JSON object with this exact structure:
{
  "accountType": "checking" or "credit",
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "merchant or description",
      "amount": number (negative for expenses, positive for income/credits)
    }
  ]
}

Important:
- Parse ALL transactions visible in the statement
- Use negative numbers for purchases/debits and positive for deposits/credits
- Format dates as YYYY-MM-DD
- Include the full description/merchant name
- Return ONLY the JSON, no other text`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return NextResponse.json({ error: 'Failed to parse PDF' }, { status: 500 });
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Transform to our format
      const transactions: Transaction[] = parsed.transactions.map((t: { date: string; description: string; amount: number }) => ({
        id: generateId(),
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.amount >= 0 ? 'credit' : 'debit',
        category: categorizeTransaction(t.description, t.amount),
      }));

      // Sort by date descending
      transactions.sort((a, b) => b.date.localeCompare(a.date));

      const dates = transactions.map((t) => t.date).sort();

      const result: ParsedStatement = {
        id: generateId(),
        fileName: file.name,
        accountType: parsed.accountType || accountType || 'checking',
        statementPeriod: {
          start: dates[0] || '',
          end: dates[dates.length - 1] || '',
        },
        transactions,
        summary: calculateSummary(transactions),
        uploadedAt: new Date().toISOString(),
      };

      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Please upload a CSV or PDF file.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error parsing statement:', error);
    return NextResponse.json(
      { error: 'Failed to parse statement', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
