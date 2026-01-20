# DevLook Backend - News API Server

Express.js backend server for the DevLook news aggregator application. Fetches news from NewsData.io API and stores them in MongoDB with advanced filtering capabilities.

## 🌐 Live API

**Base URL**: [https://devlook-backend.vercel.app](https://devlook-backend.vercel.app)

## 📦 Repository

**Backend**: [https://github.com/piyal007/devlook-backend](https://github.com/piyal007/devlook-backend)
**Frontend**: [https://github.com/piyal007/developer-look](https://github.com/piyal007/developer-look)

## ✨ Features

- 🔄 Fetch and store news from NewsData.io API
- 💾 MongoDB integration with duplicate prevention
- 🔍 Advanced filtering (country, category, language, date range)
- 🚫 Automatic duplicate detection using unique indexes
- 🌐 CORS enabled for frontend integration
- ⚡ Serverless deployment on Vercel
- 📊 Debug endpoints for monitoring

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.2.1
- **Database**: MongoDB 7.0.0
- **HTTP Client**: Axios
- **Environment**: dotenv
- **CORS**: cors middleware
- **Dev Tools**: nodemon

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- NewsData.io API key ([Get one here](https://newsdata.io/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/piyal007/devlook-backend.git
cd devlook-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
NEWS_API_KEY=your_newsdata_io_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Server will run on [http://localhost:5000](http://localhost:5000)

## 📡 API Endpoints

### GET `/`
Health check endpoint

**Response:**
```json
{
  "message": "DevLook News API",
  "status": "running"
}
```

### GET `/api/news`
Fetch news with filters from database

**Query Parameters:**
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `country` | string | Country code | `us`, `gb`, `ca`, `au`, `in`, `de`, `fr`, `jp` |
| `category` | string | News category | `business`, `technology`, `sports`, `entertainment` |
| `language` | string | Language code | `en`, `es`, `fr`, `de` |
| `source` | string | News source ID | `cnn`, `bbc`, etc. |
| `status` | string | Article status | `active` (default) |
| `startDate` | string | Start date | `2026-01-01` |
| `endDate` | string | End date | `2026-01-31` |
| `page` | number | Page number | `1` (default) |
| `limit` | number | Results per page | `20` (default) |

**Example Request:**
```bash
GET /api/news?country=us&category=technology&language=en&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "results": [
    {
      "_id": "...",
      "title": "Article Title",
      "description": "Article description...",
      "link": "https://...",
      "image_url": "https://...",
      "category": ["technology"],
      "language": ["english"],
      "country": "us",
      "pubDate": "2026-01-20",
      "source_id": "source_name",
      "source_name": "Source Name",
      "creator": ["Author Name"],
      "status": "active",
      "fetchedAt": "2026-01-20T10:00:00.000Z"
    }
  ]
}
```

### POST `/api/news/fetch`
Fetch fresh news from NewsData.io API and store in database

**Request Body:**
```json
{
  "country": "us",
  "category": "technology",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "message": "News fetched and stored successfully",
  "result": {
    "upsertedCount": 10,
    "modifiedCount": 0
  }
}
```

### GET `/api/filters`
Get available filter options from database

**Response:**
```json
{
  "success": true,
  "filters": {
    "categories": ["business", "technology", "sports", "entertainment"],
    "countries": ["us", "gb", "ca", "au", "in", "de", "fr", "jp"],
    "languages": ["english", "spanish", "french", "german"],
    "sources": ["cnn", "bbc", "reuters", "techcrunch"]
  }
}
```

### GET `/api/debug/all`
Debug endpoint to view database contents (first 5 articles)

**Response:**
```json
{
  "total": 168,
  "sample": [...]
}
```

## 🗄️ Database Schema

### Collection: `news`

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  link: String (unique),
  image_url: String,
  category: [String],
  language: [String],
  country: String,
  pubDate: String,
  source_id: String,
  source_name: String,
  source_priority: Number,
  source_url: String,
  creator: [String],
  video_url: String,
  ai_tag: String,
  ai_region: String,
  ai_org: String,
  sentiment: String,
  sentiment_stats: String,
  duplicate: Boolean,
  status: String,
  fetchedAt: Date,
  createdAt: Date
}
```

### Indexes
- `pubDate: -1` (descending)
- `country: 1`
- `category: 1`
- `link: 1` (unique)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `NEWS_API_KEY` | NewsData.io API key | Yes |
| `NODE_ENV` | Environment (production/development) | No |

### CORS Configuration

Allowed origins:
- `http://localhost:3000` (local development)
- `http://localhost:3001`
- `https://devlook-backend.vercel.app`
- `https://developer-look-murex.vercel.app`
- All `*.vercel.app` domains

### Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

## 🛠️ Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Clean duplicate articles from database
node cleanDuplicates.js
```

## 📝 Project Structure

```
devlook-backend/
├── index.js              # Main server file
├── cleanDuplicates.js    # Database cleanup utility
├── vercel.json           # Vercel deployment config
├── package.json          # Dependencies
├── .env                  # Environment variables (not in git)
├── .gitignore
└── README.md
```

## 🔄 Data Flow

1. Frontend requests news with filters → `GET /api/news`
2. Backend queries MongoDB with filters
3. If no results found → Automatically triggers `POST /api/news/fetch`
4. Backend fetches from NewsData.io API
5. Articles stored in MongoDB (duplicates prevented)
6. Results returned to frontend

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check if IP is whitelisted in MongoDB Atlas
- Ensure database user has proper permissions

### API Rate Limits
- NewsData.io free tier: 200 requests/day
- Consider caching and reusing stored data

### Duplicate Articles
Run cleanup script:
```bash
node cleanDuplicates.js
```

### Serverless Timeout
- Vercel free tier: 10s timeout
- Optimize queries with proper indexes
- Reduce batch sizes for bulk operations

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables in Vercel
```
MONGODB_URI=your_mongodb_connection_string
NEWS_API_KEY=your_newsdata_io_api_key
NODE_ENV=production
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Piyal**
- GitHub: [@piyal007](https://github.com/piyal007)

## 🙏 Acknowledgments

- [NewsData.io](https://newsdata.io/) for the news API
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting
- [Vercel](https://vercel.com/) for serverless deployment

