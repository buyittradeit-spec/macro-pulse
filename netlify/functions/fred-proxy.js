// Netlify Function: proxies requests to the FRED API so the
// API key never appears in client-side code or page source.
//
// The key is read from an environment variable (FRED_API_KEY),
// set in the Netlify dashboard under:
// Site configuration > Environment variables
//
// Usage from the front end:
// /.netlify/functions/fred-proxy?series=UNRATE
// /.netlify/functions/fred-proxy?series=CPIAUCSL&units=pc1

exports.handler = async function (event) {
  const apiKey = process.env.FRED_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'FRED_API_KEY is not configured on this site.' })
    };
  }

  const params = event.queryStringParameters || {};
  const seriesId = params.series;
  const units = params.units || null;

  if (!seriesId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing required "series" query parameter, e.g. ?series=UNRATE' })
    };
  }

  let url = 'https://api.stlouisfed.org/fred/series/observations' +
    '?series_id=' + encodeURIComponent(seriesId) +
    '&api_key=' + apiKey +
    '&file_type=json' +
    '&sort_order=desc' +
    '&limit=2';

  if (units) {
    url += '&units=' + encodeURIComponent(units);
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to reach FRED API.', details: err.message })
    };    
  }
};
