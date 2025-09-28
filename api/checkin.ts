// api/checkin.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!
  // Convierte '\n' en saltos reales por si la env var viene escapada
  const key = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  return new google.auth.JWT(
    email,
    undefined,
    key,
    ['https://www.googleapis.com/auth/spreadsheets']
  )
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  try {
    const { name, email, extra } = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!name || !email) {
      return res.status(400).json({ ok: false, error: 'name and email are required' })
    }

    // 1) Append a Google Sheet
    const auth = getAuth()
    await auth.authorize()
    const sheets = google.sheets({ version: 'v4', auth })
    const SHEET_ID = process.env.SHEET_ID!
    const timestamp = new Date().toISOString()

    // Ajusta el rango a la pestaña donde quieres escribir, por ejemplo 'Respuestas!A:D'
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Respuestas!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, name, email, extra ?? '']],
      },
    })

    // 2) Devuelve los datos que el frontend usará para armar el CSV descargable
    return res.status(200).json({
      ok: true,
      row: { timestamp, name, email, extra: extra ?? '' },
      message: 'Check-in guardado en Google Sheets',
    })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ ok: false, error: err?.message || 'Internal Error' })
  }
}
