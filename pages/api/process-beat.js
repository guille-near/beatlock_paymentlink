import Cors from 'cors';
import axios from 'axios';
import cheerio from 'cheerio';

// Inicializar el middleware CORS
const cors = Cors({
  methods: ['POST', 'GET', 'HEAD'],
});

// Función auxiliar para ejecutar middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // Ejecutar middleware CORS
  await runMiddleware(req, res, cors);

  console.log('API handler started');
  
  if (req.method !== 'POST') {
    console.log(`Method not allowed: ${req.method}`);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    console.log('Request body:', req.body);
    const { beatstarsUrl } = req.body;

    if (!beatstarsUrl) {
      console.log('No Beatstars URL provided');
      return res.status(400).json({ error: 'No Beatstars URL provided' });
    }

    console.log('Fetching data from:', beatstarsUrl);
    const response = await axios.get(beatstarsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 segundos de timeout
    });
    console.log('Response received from Beatstars');

    const $ = cheerio.load(response.data);
    
    // Extract data
    const trackName = $('.track-title').text().trim() || 'Track name not found';
    const producerName = $('.producer-name').text().trim() || 'Producer name not found';
    
    // Extract license information (adjust selectors as needed)
    const licenses = [];
    $('.license-option').each((i, elem) => {
      const type = $(elem).find('.license-type').text().trim();
      const price = parseFloat($(elem).find('.license-price').text().replace('$', '').trim());
      licenses.push({ type, price });
    });

    console.log('Extracted data:', { trackName, producerName, licenses });

    res.status(200).json({ 
      beatInfo: { 
        trackName, 
        producerName, 
        licenses 
      } 
    });
  } catch (error) {
    console.error('Detailed error:', error);
    
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error request:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
