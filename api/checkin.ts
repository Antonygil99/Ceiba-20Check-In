// api/checkin.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'

/**
 * ENV requeridas:
 * - SHEET_ID = 1Zad4uTmVtHAeNxjEyN5sezr_KkYf6TSkCar4y-TGyM8
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL = xxx@yyy.iam.gserviceaccount.com
 * - GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
 * Comparte la hoja con el email del service account (Editor).
 * Ajusta el 'range' a tu pestaña (ej: 'Respuestas!A:D').
 */

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
  if (!email || !rawKey) {
    throw new Error('Faltan variables de entorno de Google Service Account')
  }
  const key = rawKey.replace(/\\n/g, '\n')

  // 👇 Nuevo formato (objeto) para JWT
  return new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  try {
    const SHEET_ID = process.env.SHEET_ID
    if (!SHEET_ID) throw new Error('Falta SHEET_ID en variables de entorno')

    // Body puede venir como string u objeto
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const { nombre, dia1 = '', dia2 = '', asistio = false } = body || {}

    if (!nombre || typeof nombre !== 'string') {
      return res.status(400).json({ ok: false, error: 'nombre es obligatorio' })
    }

    const auth = getAuth()
    await auth.authorize()

    const sheets = google.sheets({ version: 'v4', auth })
    const timestamp = new Date().toISOString()

    // Ajusta el rango a tu pestaña/hoja
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Respuestas!A:D',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[timestamp, nombre, `${dia1} ${asistio ? '(Asistió)' : ''}`.trim(), dia2]],
      },
    })

    return res.status(200).json({
      ok: true,
      message: 'Check-in guardado en Google Sheets',
      row: { timestamp, nombre, dia1, dia2, asistio: !!asistio },
    })
  } catch (err: any) {
    console.error(err)
    return res.status(500).json({ ok: false, error: err?.message || 'Internal Error' })
  }
}
