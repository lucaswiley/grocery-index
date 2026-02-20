# Grocery Index

Tracking and analyzing grocery expenses using receipt photos. Upload your receipts and get instant insights into your spending patterns with detailed item breakdowns and price analysis.

## Features

- **Smart Receipt Upload**: Drag-and-drop or click to upload with automatic image compression. Supports JPEG and PNG formats.

- **AI-Powered Analysis**: Uses OpenAI Vision API for accurate text extraction, automatic item and price detection, and per-unit price calculation.

- **Rich Visualizations**: Bar chart showing total spending by item, scatter plot for price-per-unit analysis, and color-coded indicators for expense levels.

- **Detailed Receipt History**: Expandable receipt cards with chronological organization, item-level price breakdown, and unit price information.

- **Modern UI/UX**: Clean, accessible interface with responsive design, interactive charts, and smooth animations.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Heroicons
- **AI**: OpenAI Vision API
- **Image Processing**: browser-image-compression

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/yourusername/grocery-index.git
   cd grocery-index
   npm install
   ```

2. Configure environment:
   ```
   # .env.local
   OPENAI_API_KEY=your_api_key_here
   ```

3. Start development:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/              # Next.js app router and API routes
├── components/       # React components
│   ├── ReceiptList    # Expandable receipt history
│   ├── ReceiptUploader # File upload handling
│   └── SpendingChart  # Data visualizations
├── lib/             # Utility functions
│   └── uploadReceipt  # Image processing and API calls
└── types/           # TypeScript interfaces
```

## Usage

1. **Upload a Receipt**: Click upload or drag a photo, wait for AI processing, and review extracted items.

2. **Analyze Spending**: View total costs in bar chart, check unit prices in scatter plot, and spot spending patterns.

3. **Manage History**: Click receipts to expand, view detailed breakdowns, and track spending over time.

## Contributing

Contributions welcome:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License
