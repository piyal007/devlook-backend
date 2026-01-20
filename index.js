const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const client = new MongoClient(process.env.MONGODB_URI);
let db;
let newsCollection;

async function connectDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB successfully!");
    
    db = client.db("devlook");
    newsCollection = db.collection("news");
    
    // Create indexes for better query performance
    await newsCollection.createIndex({ pubDate: -1 });
    await newsCollection.createIndex({ country: 1 });
    await newsCollection.createIndex({ category: 1 });
    await newsCollection.createIndex({ link: 1 }, { unique: true });
    
    console.log("✅ Database and indexes ready!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}

connectDB();

// Fetch and store news from API
async function fetchAndStoreNews(country, category = null, language = "en") {
  try {
    const params = {
      country: country,
      apikey: process.env.NEWS_API_KEY || "pub_95b5ca87f1294c6dbac3a979c08d31a6",
      language: language,
    };

    if (category) {
      params.category = category;
    }

    const response = await axios.get("https://newsdata.io/api/1/latest", {
      params: params,
    });

    if (response.data.results && response.data.results.length > 0) {
      const articles = response.data.results.map((article) => ({
        ...article,
        country: country,
        fetchedAt: new Date(),
        status: "active",
      }));

      // Insert articles, skip duplicates
      const operations = articles.map((article) => ({
        updateOne: {
          filter: { link: article.link },
          update: { $set: article },
          upsert: true,
        },
      }));

      const result = await newsCollection.bulkWrite(operations);
      console.log(
        `✅ Stored ${result.upsertedCount} new articles, updated ${result.modifiedCount}`
      );
      return result;
    }
  } catch (error) {
    console.error("❌ Error fetching news:", error.message);
    throw error;
  }
}

// API Routes

// Get news with filters
app.get("/api/news", async (req, res) => {
  try {
    const {
      country,
      category,
      language,
      source,
      status = "active",
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Build query
    const query = {};

    if (country) query.country = country;
    if (category && category !== "") query.category = { $in: [category] };
    // Language is stored as array in DB, e.g., ["english"]
    if (language) {
      // Map common language codes to full names
      const langMap = {
        en: "english",
        es: "spanish",
        fr: "french",
        de: "german",
      };
      const langName = langMap[language] || language;
      query.language = { $in: [langName] };
    }
    if (source) query.source_id = source;
    if (status) query.status = status;

    // Date range filter
    if (startDate || endDate) {
      query.pubDate = {};
      if (startDate) query.pubDate.$gte = startDate;
      if (endDate) query.pubDate.$lte = endDate;
    }

    console.log("Query:", JSON.stringify(query));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const articles = await newsCollection
      .find(query)
      .sort({ pubDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    const total = await newsCollection.countDocuments(query);

    console.log(`Found ${articles.length} articles, total: ${total}`);

    res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      results: articles,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch fresh news and store in DB
app.post("/api/news/fetch", async (req, res) => {
  try {
    const { country, category, language } = req.body;

    if (!country) {
      return res
        .status(400)
        .json({ success: false, error: "Country is required" });
    }

    const result = await fetchAndStoreNews(country, category, language);

    res.json({
      success: true,
      message: "News fetched and stored successfully",
      result,
    });
  } catch (error) {
    console.error("Error in fetch endpoint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get available filters
app.get("/api/filters", async (req, res) => {
  try {
    const categories = await newsCollection.distinct("category");
    const countries = await newsCollection.distinct("country");
    const languages = await newsCollection.distinct("language");
    const sources = await newsCollection.distinct("source_id");

    res.json({
      success: true,
      filters: {
        categories: categories.filter(Boolean),
        countries: countries.filter(Boolean),
        languages: languages.filter(Boolean),
        sources: sources.filter(Boolean),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "DevLook News API", status: "running" });
});

// Debug endpoint to see all data
app.get("/api/debug/all", async (req, res) => {
  try {
    const allArticles = await newsCollection.find({}).limit(5).toArray();
    const count = await newsCollection.countDocuments({});
    res.json({
      total: count,
      sample: allArticles,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
