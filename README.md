# Nexify Tools — Premium File Conversion & PDF Engine

Nexify Tools is a high-performance, full-stack file conversion and PDF editing platform. Designed for both end-users and developers, it provides a seamless interface for transforming files across hundreds of formats and a robust suite of professional PDF manipulation tools.

## ✨ Key Features

### 🔄 Intelligent File Conversion
- **Multi-Format Support**: Seamlessly convert between Images, Videos, Audio, Documents, Spreadsheets, and Code files.
- **Category-Aware Engine**: Smart suggestions based on file type (e.g., Image → Document, Video → Audio).
- **Batch Processing**: Handle multiple files with real-time progress tracking.

### 📄 Professional PDF Suite
- **Merge & Split**: Combine multiple PDFs or extract specific page ranges.
- **Security**: Protect documents with high-grade encryption or unlock protected files.
- **Optimization**: Compress PDFs for web use or flatten interactive forms.
- **Edit & Annotate**: Add watermarks, page numbers, headers, and footers.
- **Page Management**: Rotate, delete, reverse, duplicate, or insert blank pages.
- **Digital Signatures**: Sign documents with custom signature images.

### 🛠️ Developer Ecosystem
- **API Key Management**: Generate and revoke API keys to integrate Nexify's engine into your own apps.
- **Usage Analytics**: Track conversion history and API usage statistics via a personal dashboard.

## 🚀 Tech Stack

- **Frontend**: React 18, Vite, Framer Motion (Animations), Lucide React (Icons), Vanilla CSS.
- **Backend**: Node.js, Express.
- **Database**: SQLite (via `better-sqlite3`) for user data and activity logs.
- **Authentication**: Passport.js (Google OAuth 2.0 & Local Strategy), JWT.
- **Processing Engines**:
  - `pdf-lib` for advanced PDF manipulation.
  - `jimp` for image processing.
  - `fluent-ffmpeg` for media handling.
  - `adm-zip` for archive management.

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (for certain PDF crypto operations)
- FFmpeg (for media conversions)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/itsAyush5/Project-11-Nexify-Tools.git
   cd Project-11-Nexify-Tools
   ```

2. Install dependencies for all packages:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   Create a `.env` file in the `api/` directory (see `.env.example` for reference):
   ```env
   PORT=5000
   SESSION_SECRET=your_secret_here
   GOOGLE_CLIENT_ID=your_google_id
   GOOGLE_CLIENT_SECRET=your_google_secret
   CLOUDCONVERT_API_KEY=your_key
   ```

### Running Locally

Start both the backend API and frontend client concurrently:
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 🛡️ License

Distributed under the MIT License. See `LICENSE` for more information.

---
Made with ❤️ by [Ayush Kunkulol](https://github.com/itsAyush5)
