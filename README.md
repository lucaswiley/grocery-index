# 🛒 Grocery Index

A modern web application for tracking and analyzing grocery expenses using receipt photos. Upload your receipts and get instant insights into your spending patterns with detailed item breakdowns and price analysis.

## ✨ Features

- 📸 **Smart Receipt Upload**:
  - Drag-and-drop or click to upload
  - Automatic image compression
  - Support for JPEG and PNG formats

- 🧠 **AI-Powered Analysis**:
  - OpenAI Vision API for accurate text extraction
  - Automatic item and price detection
  - Per-unit price calculation

- 📊 **Rich Visualizations**:
  - Bar chart showing total spending by item
  - Scatter plot for price-per-unit analysis
  - Color-coded indicators for expense levels

- 📓 **Detailed Receipt History**:
  - Expandable receipt cards
  - Chronological organization
  - Item-level price breakdown
  - Unit price information

- 📱 **Modern UI/UX**:
  - Clean, accessible interface
  - Responsive design for all devices
  - Interactive charts and tooltips
  - Smooth animations and transitions

## 💻 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Heroicons
- **AI**: OpenAI Vision API
- **Image Processing**: browser-image-compression

## 🔧 Setup

1. Clone and install:
   ```bash
   git clone https://github.com/yourusername/grocery-index.git
   cd grocery-index
   npm install
   ```

2. Configure environment:
   ```env
   # .env.local
   OPENAI_API_KEY=your_api_key_here
   ```

3. Start development:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## 📚 Project Structure

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

## 📘 Usage Guide

1. **Upload a Receipt**:
   - Click upload or drag a photo
   - Wait for AI processing
   - Review extracted items

2. **Analyze Spending**:
   - View total costs in bar chart
   - Check unit prices in scatter plot
   - Spot spending patterns

3. **Manage History**:
   - Click receipts to expand
   - View detailed breakdowns
   - Track spending over time

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - Feel free to use and modify for your own receipt tracking needs.
