import {
  Transaction,
  ParsedStatement,
  ExpenseCategory,
  StatementSummary,
  CategorySummary,
} from '@/types/statement';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function categorizeTransaction(description: string, amount: number): ExpenseCategory {
  const desc = description.toLowerCase();

  // Income patterns
  if (amount > 0 && (desc.includes('deposit') || desc.includes('payroll') || desc.includes('direct dep'))) {
    return 'income';
  }

  // Transfer patterns
  if (desc.includes('transfer') || desc.includes('zelle') || desc.includes('venmo') || desc.includes('paypal')) {
    return 'transfer';
  }

  // Fees
  if (desc.includes('fee') || desc.includes('charge') || desc.includes('interest')) {
    return 'fees';
  }

  // Home Improvement
  if (
    desc.includes('home depot') ||
    desc.includes('lowes') ||
    desc.includes('lowe\'s') ||
    desc.includes('menards') ||
    desc.includes('ace hardware') ||
    desc.includes('hardware') ||
    desc.includes('lumber') ||
    desc.includes('plumbing') ||
    desc.includes('electrical')
  ) {
    return 'home_improvement';
  }

  // Groceries
  if (
    desc.includes('grocery') ||
    desc.includes('whole foods') ||
    desc.includes('trader joe') ||
    desc.includes('safeway') ||
    desc.includes('kroger') ||
    desc.includes('costco') ||
    desc.includes('walmart') ||
    desc.includes('target') ||
    desc.includes('aldi') ||
    desc.includes('publix') ||
    desc.includes('wegmans') ||
    desc.includes('sprouts')
  ) {
    return 'groceries';
  }

  // Dining
  if (
    desc.includes('restaurant') ||
    desc.includes('doordash') ||
    desc.includes('uber eats') ||
    desc.includes('grubhub') ||
    desc.includes('mcdonald') ||
    desc.includes('starbucks') ||
    desc.includes('chipotle') ||
    desc.includes('cafe') ||
    desc.includes('coffee') ||
    desc.includes('pizza') ||
    desc.includes('burger')
  ) {
    return 'dining';
  }

  // Transportation
  if (
    desc.includes('uber') ||
    desc.includes('lyft') ||
    desc.includes('gas') ||
    desc.includes('shell') ||
    desc.includes('chevron') ||
    desc.includes('exxon') ||
    desc.includes('parking') ||
    desc.includes('transit') ||
    desc.includes('metro')
  ) {
    return 'transportation';
  }

  // Utilities
  if (
    desc.includes('electric') ||
    desc.includes('water') ||
    desc.includes('gas bill') ||
    desc.includes('internet') ||
    desc.includes('comcast') ||
    desc.includes('verizon') ||
    desc.includes('at&t') ||
    desc.includes('t-mobile') ||
    desc.includes('utility')
  ) {
    return 'utilities';
  }

  // Entertainment
  if (
    desc.includes('netflix') ||
    desc.includes('spotify') ||
    desc.includes('hulu') ||
    desc.includes('disney') ||
    desc.includes('movie') ||
    desc.includes('theater') ||
    desc.includes('concert') ||
    desc.includes('ticket')
  ) {
    return 'entertainment';
  }

  // Subscriptions
  if (
    desc.includes('subscription') ||
    desc.includes('apple.com') ||
    desc.includes('amazon prime') ||
    desc.includes('membership')
  ) {
    return 'subscriptions';
  }

  // Health
  if (
    desc.includes('pharmacy') ||
    desc.includes('cvs') ||
    desc.includes('walgreens') ||
    desc.includes('doctor') ||
    desc.includes('medical') ||
    desc.includes('hospital') ||
    desc.includes('dental') ||
    desc.includes('health')
  ) {
    return 'health';
  }

  // Travel
  if (
    desc.includes('airline') ||
    desc.includes('hotel') ||
    desc.includes('airbnb') ||
    desc.includes('flight') ||
    desc.includes('travel')
  ) {
    return 'travel';
  }

  // Shopping
  if (
    desc.includes('amazon') ||
    desc.includes('best buy') ||
    desc.includes('apple store') ||
    desc.includes('shop') ||
    desc.includes('store')
  ) {
    return 'shopping';
  }

  return 'other';
}

function calculateSummary(transactions: Transaction[]): StatementSummary {
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

  const byCategory: CategorySummary[] = Array.from(categoryTotals.entries())
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

export function parseChaseCSV(csvContent: string, accountType: 'checking' | 'credit'): ParsedStatement {
  const lines = csvContent.trim().split('\n');
  const transactions: Transaction[] = [];
  let minDate = '';
  let maxDate = '';

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV handling quoted fields
    const fields = parseCSVLine(line);

    if (accountType === 'checking') {
      // Chase checking CSV format: Details,Posting Date,Description,Amount,Type,Balance,Check or Slip #
      const [, postingDate, description, amountStr] = fields;
      const amount = parseFloat(amountStr);

      if (postingDate && description && !isNaN(amount)) {
        const transaction: Transaction = {
          id: generateId(),
          date: formatDate(postingDate),
          description: description.trim(),
          amount: amount,
          type: amount >= 0 ? 'credit' : 'debit',
          category: categorizeTransaction(description, amount),
        };
        transactions.push(transaction);

        // Track date range
        if (!minDate || transaction.date < minDate) minDate = transaction.date;
        if (!maxDate || transaction.date > maxDate) maxDate = transaction.date;
      }
    } else {
      // Chase credit card CSV format: Transaction Date,Post Date,Description,Category,Type,Amount,Memo
      const [transactionDate, , description, , , amountStr] = fields;
      const amount = parseFloat(amountStr);

      if (transactionDate && description && !isNaN(amount)) {
        const transaction: Transaction = {
          id: generateId(),
          date: formatDate(transactionDate),
          description: description.trim(),
          amount: amount,
          type: amount >= 0 ? 'credit' : 'debit',
          category: categorizeTransaction(description, amount),
        };
        transactions.push(transaction);

        if (!minDate || transaction.date < minDate) minDate = transaction.date;
        if (!maxDate || transaction.date > maxDate) maxDate = transaction.date;
      }
    }
  }

  // Sort by date descending (newest first)
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    id: generateId(),
    fileName: 'uploaded.csv',
    accountType,
    statementPeriod: {
      start: minDate,
      end: maxDate,
    },
    transactions,
    summary: calculateSummary(transactions),
    uploadedAt: new Date().toISOString(),
  };
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

function formatDate(dateStr: string): string {
  // Handle MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

export function detectAccountType(csvContent: string): 'checking' | 'credit' {
  const firstLine = csvContent.split('\n')[0].toLowerCase();

  // Chase checking has "Details" as first column
  if (firstLine.includes('details') && firstLine.includes('posting date')) {
    return 'checking';
  }

  // Chase credit has "Transaction Date" as first column
  if (firstLine.includes('transaction date') && firstLine.includes('post date')) {
    return 'credit';
  }

  // Default to checking
  return 'checking';
}
