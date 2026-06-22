/**
 * Proxy serverless para football-data.org.
 * La API key vive solo en el servidor (variable de entorno FOOTBALL_API_KEY),
 * nunca en el bundle del cliente.
 *
 * Uso desde el cliente:
 *   GET /.netlify/functions/football?path=/competitions/WC/matches
 */
export const handler = async (event) => {
  const path = event.queryStringParameters?.path ?? '';

  if (!path.startsWith('/')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'path inválido' }) };
  }

  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'FOOTBALL_API_KEY no configurada' }) };
  }

  const url = `https://api.football-data.org/v4${path}`;

  try {
    const res = await fetch(url, {
      headers: { 'X-Auth-Token': apiKey },
    });

    const body = await res.text();

    // Pasamos los headers de rate-limit para posible uso futuro en el cliente
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    };
    const rl = res.headers.get('X-Requests-Available-Minute');
    if (rl) headers['X-Requests-Available-Minute'] = rl;

    return { statusCode: res.status, headers, body };
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: `Error conectando con football-data.org: ${err.message}` }),
    };
  }
};
