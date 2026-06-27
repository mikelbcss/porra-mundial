/**
 * Proxy para football-data.org con rotación automática de API keys.
 * Configura hasta 2 claves: FOOTBALL_API_KEY y FOOTBALL_API_KEY_2
 * Si la primera devuelve 429 (rate limit), reintenta con la segunda.
 */
async function tryFetch(apiPath, key) {
  const res = await fetch(`https://api.football-data.org/v4${apiPath}`, {
    headers: { 'X-Auth-Token': key },
  });
  return res;
}

export const handler = async (event) => {
  const path = event.queryStringParameters?.path ?? '';
  if (!path.startsWith('/')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'path inválido' }) };
  }

  const keys = [
    process.env.FOOTBALL_API_KEY,
    process.env.FOOTBALL_API_KEY_2,
  ].filter(Boolean);

  if (!keys.length) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Sin API keys configuradas' }) };
  }

  let lastStatus = 500;
  let lastBody = '';

  for (const key of keys) {
    try {
      const res = await tryFetch(path, key);
      const body = await res.text();
      // Si no es 429 (rate limit), devolvemos esta respuesta
      if (res.status !== 429) {
        return {
          statusCode: res.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          body,
        };
      }
      // 429 → probar con la siguiente key
      lastStatus = res.status;
      lastBody = body;
      console.warn(`API key terminada en ...${key.slice(-4)} agotada (429), rotando...`);
    } catch (err) {
      lastBody = JSON.stringify({ error: String(err) });
    }
  }

  // Todas las keys agotadas
  return {
    statusCode: lastStatus,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: lastBody,
  };
};
