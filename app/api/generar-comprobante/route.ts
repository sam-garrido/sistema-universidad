import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { pagoId, alumnoId, nombreCompleto, matricula, concepto, monto, folio } = await req.json()

  const supabaseAdmin = createAdminClient()

  // 1. Crear el documento PDF
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([400, 500])
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  let y = 450

  page.drawText('Universidad Ejemplo A.C.', { x: 40, y, size: 16, font: fontBold, color: rgb(0.1, 0.2, 0.6) })
  y -= 30
  page.drawText('Comprobante de Pago', { x: 40, y, size: 14, font: fontBold })
  y -= 40

  const linea = (etiqueta: string, valor: string) => {
    page.drawText(etiqueta, { x: 40, y, size: 11, font: fontBold })
    page.drawText(valor, { x: 160, y, size: 11, font })
    y -= 25
  }

  linea('Folio:', folio || 'N/A')
  linea('Alumno:', nombreCompleto)
  linea('Matrícula:', matricula)
  linea('Concepto:', concepto)
  linea('Monto:', `$${Number(monto).toFixed(2)} MXN`)
  linea('Fecha de pago:', new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }))

  y -= 20
  page.drawText('Este comprobante es válido como constancia de pago.', { x: 40, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) })

  const pdfBytes = await pdfDoc.save()

  // 2. Subir el PDF al bucket "comprobantes", en la carpeta del alumno
  const nombreArchivo = `${alumnoId}/comprobante-${pagoId}.pdf`
  const { error: uploadError } = await supabaseAdmin.storage
    .from('comprobantes')
    .upload(nombreArchivo, pdfBytes, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  // 3. Guardar la ruta del PDF en el registro del pago
  const { error: updateError } = await supabaseAdmin
    .from('pagos')
    .update({ comprobante_url: nombreArchivo })
    .eq('id', pagoId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, path: nombreArchivo })
}