/**
 * Habiba Motif Atelier - Live Gallery Artworks Serverless API for Vercel & MongoDB Atlas
 * Fully automated - Zero tokens, zero technical friction for client
 */
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const defaultUri = 'mongodb+srv://yehiarashed2004_db_user:kbXa2ww9NAXVMZY5@cluster0.bimlrnx.mongodb.net/?appName=Cluster0';

function getMongoUri() {
  const envUri = (process.env.MONGODB_URI || '').trim();
  if (envUri.startsWith('mongodb://') || envUri.startsWith('mongodb+srv://')) {
    return envUri;
  }
  return defaultUri;
}

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const uri = getMongoUri();
  const client = new MongoClient(uri, {
    connectTimeoutMS: 15000,
    socketTimeoutMS: 15000,
    serverSelectionTimeoutMS: 15000,
    tls: true,
    retryWrites: true
  });
  await client.connect();
  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  // Universal CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('habiba_motif');
    const collection = db.collection('artworks');

    // 1. GET: Fetch all artworks sorted by order
    if (req.method === 'GET') {
      const docs = await collection.find({}).sort({ order: 1 }).toArray();
      
      if (Array.isArray(docs) && docs.length > 0) {
        const cleanDocs = docs.map(({ _id, ...rest }) => rest);
        return res.status(200).json(cleanDocs);
      }

      // Fallback to local json file if database is freshly initialized
      try {
        const jsonPath = path.join(process.cwd(), 'assets', 'data', 'artworks.json');
        if (fs.existsSync(jsonPath)) {
          const fallbackData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            // Seed database automatically
            await collection.insertMany(fallbackData.map(({ _id, ...rest }) => rest));
            return res.status(200).json(fallbackData);
          }
        }
      } catch (e) {
        console.warn('Fallback seed warning:', e.message);
      }

      return res.status(200).json([]);
    }

    // 2. POST or PUT: Automatically save full updated artworks list
    if (req.method === 'POST' || req.method === 'PUT') {
      let bodyData = req.body;
      if (typeof bodyData === 'string') {
        try {
          bodyData = JSON.parse(bodyData);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid JSON body' });
        }
      }

      const artworks = Array.isArray(bodyData)
        ? bodyData
        : (bodyData && Array.isArray(bodyData.artworks) ? bodyData.artworks : null);

      if (!artworks) {
        return res.status(400).json({ error: 'Missing artworks array in payload' });
      }

      // Delete existing documents and write new array cleanly
      await collection.deleteMany({});

      if (artworks.length > 0) {
        const cleanArtworks = artworks.map((item, index) => {
          const copy = { ...item };
          delete copy._id; // Prevent immutable _id error
          if (!copy.order) copy.order = index + 1;
          return copy;
        });

        await collection.insertMany(cleanArtworks);
      }

      return res.status(200).json({
        success: true,
        count: artworks.length,
        message: 'Artworks synced automatically to MongoDB Atlas'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Artworks API Serverless error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
