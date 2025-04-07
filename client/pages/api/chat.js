// pages/api/chat.js

/**
 * API handler for chat completions using OpenRouter
 */
export default async function handler(req, res) {
  // Handle status check with GET request
  if (req.method === 'GET') {
    try {
      // Check if the API key is configured
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return res.status(200).json({ 
          status: 'error', 
          message: 'OpenRouter API key not configured' 
        });
      }
  
      // Return success status
      return res.status(200).json({ 
        status: 'ready',
        message: 'Chat API is ready'
      });
    } catch (error) {
      console.error('Status check error:', error);
      return res.status(500).json({ 
        status: 'error',
        message: 'Error checking API status' 
      });
    }
  }

  // Only allow POST requests for chat completions
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { model, messages, temperature, max_tokens } = req.body;

    // Validate required parameters
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    // Get API key directly from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('OpenRouter API key not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Site info for OpenRouter referral
    const siteUrl = process.env.SITE_URL || 'https://tummy-time.app';
    const siteName = 'Tummy Time Baby Care Assistant';

    // Make request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-Title': siteName
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 500,
      }),
    });

    // Get response data
    const data = await response.json();

    // Check for errors in OpenRouter response
    if (!response.ok) {
      console.error('OpenRouter API error:', data);
      return res.status(response.status).json({
        message: data.error?.message || 'Error from OpenRouter API',
        error: data.error
      });
    }

    // Return successful response
    return res.status(200).json(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}