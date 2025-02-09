# Grocery Receipt Tracker

Tracking grocery expenses using receipt photos. Next.js, React, OpenAI for OCR.

## Features

- Upload grocery receipts via drag-and-drop or camera capture
- Automatic text extraction from receipt images using Claude Vision API
- Display itemized costs and receipt details
- Visualize spending trends over time
- Responsive design for mobile and desktop

## Prerequisites

- Node.js 18.17 or later
- An Anthropic API key for Claude Vision

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/grocery-index.git
cd grocery-index
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_api_key_here
```

4. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **OCR Processing**: Claude Vision API
- **Charts**: Recharts
- **UI Components**: Heroicons

## Project Structure

```
src/
├── app/                # Next.js app router pages and API routes
├── components/         # React components
├── lib/               # Utility functions
└── types/             # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
