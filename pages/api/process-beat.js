import axios from 'axios';
import cheerio from 'cheerio';

async function extractBeatstarsInfo(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const trackName = $('.track-title').text().trim() || 'Track name not found';
    const producerName = $('.producer-name').text().trim() || 'Producer name not found';

    return { trackName, producerName };
  } catch (error) {
    throw new Error(`Failed to extract beat information: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { beatstarsUrl } = req.body;
      
      if (!beatstarsUrl) {
        return res.status(400).json({ error: 'No Beatstars URL provided' });
      }

      const beatInfo = await extractBeatstarsInfo(beatstarsUrl);
      res.status(200).json({ beatInfo });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
