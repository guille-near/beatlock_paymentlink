import axios from 'axios';
import cheerio from 'cheerio';

export default async function handler(req, res) {
  console.log('Received request:', req.method, req.body);

  if (req.method === 'POST') {
    try {
      const { beatstarsUrl } = req.body;
      
      if (!beatstarsUrl) {
        console.log('No Beatstars URL provided');
        return res.status(400).json({ error: 'No Beatstars URL provided' });
      }

      console.log('Fetching data from:', beatstarsUrl);
      const response = await axios.get(beatstarsUrl);
      console.log('Response received from Beatstars');

      const $ = cheerio.load(response.data);
      
      // Extract data...
      const trackName = $('.track-title').text().trim() || 'Track name not found';
      const producerName = $('.producer-name').text().trim() || 'Producer name not found';

      console.log('Extracted data:', { trackName, producerName });

      res.status(200).json({ beatInfo: { trackName, producerName } });
    } catch (error) {
      console.error('Error processing beat:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    console.log('Method not allowed:', req.method);
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
