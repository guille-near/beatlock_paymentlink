import axios from 'axios';
import cheerio from 'cheerio';
import Stripe from 'stripe';

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function extractBeatstarsInfo(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const trackName = $('.track-title').text().trim() || 'Track name not found';
    const producerName = $('.producer-name').text().trim() || 'Producer name not found';
    const price = parseFloat($('.price').text().replace('$', '').trim()) || 0;

    // Extraer información de licencias (esto puede variar dependiendo de la estructura de la página de Beatstars)
    const licenses = [];
    $('.license-option').each((i, elem) => {
      const licenseType = $(elem).find('.license-type').text().trim();
      const licensePrice = parseFloat($(elem).find('.license-price').text().replace('$', '').trim());
      licenses.push({ type: licenseType, price: licensePrice });
    });

    return { trackName, producerName, price, licenses };
  } catch (error) {
    console.error('Error extracting Beatstars info:', error);
    throw new Error(`Failed to extract beat information: ${error.message}`);
  }
}

async function createStripePaymentLink(beatInfo, licenseType) {
  try {
    const license = beatInfo.licenses.find(l => l.type === licenseType);
    if (!license) {
      throw new Error(`License type ${licenseType} not found`);
    }

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${beatInfo.trackName} - ${licenseType}`,
            description: `Produced by ${beatInfo.producerName}`,
          },
          unit_amount: Math.round(license.price * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      after_completion: { type: 'redirect', redirect: { url: 'https://yourwebsite.com/thank-you' } },
    });

    return paymentLink.url;
  } catch (error) {
    console.error('Error creating Stripe payment link:', error);
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { beatstarsUrl, licenseType } = req.body;
      
      if (!beatstarsUrl) {
        return res.status(400).json({ error: 'No Beatstars URL provided' });
      }

      if (!licenseType) {
        return res.status(400).json({ error: 'No license type provided' });
      }

      const beatInfo = await extractBeatstarsInfo(beatstarsUrl);
      const paymentLink = await createStripePaymentLink(beatInfo, licenseType);

      res.status(200).json({ 
        beatInfo,
        paymentLink
      });
    } catch (error) {
      console.error('Error in process-beat handler:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
