import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { employee_id, payment_date, payment_type, amount, month, notes } = await request.json()

    // Default the month from payment_date if client didn't provide it
    const monthValue = month || (payment_date ? String(payment_date).slice(0, 7) : null)

    const { id } = await params

    db.prepare(`
      UPDATE payroll 
      SET employee_id = ?, payment_date = ?, payment_type = ?, amount = ?, month = ?, notes = ?
      WHERE id = ?
    `).run(employee_id, payment_date, payment_type, amount, monthValue, notes, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { id } = await params
    db.prepare("DELETE FROM payroll WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
