const paypalBaseUrl = process.env.PAYPAL_API_BASE_URL || 'https://api-m.sandbox.paypal.com'

function getPaypalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_SECRET
    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    : null
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Faltan las credenciales de PayPal Sandbox')
  }
  return { clientId, clientSecret }
}

export async function getPaypalAccessToken() {
  const { clientId, clientSecret } = getPaypalCredentials()
  const response = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store'
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || 'No se pudo autenticar con PayPal')
  }
  return data.access_token
}

export async function paypalRequest(path, options = {}) {
  const accessToken = await getPaypalAccessToken()
  const response = await fetch(`${paypalBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {})
    },
    cache: 'no-store'
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data?.details?.[0]?.description || data?.message || 'Error en PayPal'
    const error = new Error(message)
    error.status = response.status
    error.paypal = data
    throw error
  }
  return data
}
