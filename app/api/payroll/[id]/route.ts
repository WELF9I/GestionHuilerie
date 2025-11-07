import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { employee_id, payment_date, payment_type, amount, month, notes } = await request.json()

    db.prepare(`
      UPDATE payroll 
      SET employee_id = ?, payment_date = ?, payment_type = ?, amount = ?, month = ?, notes = ?
      WHERE id = ?
    `).run(employee_id, payment_date, payment_type, amount, month, notes, params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    initializeDatabase()
    const db = getDatabase()
    db.prepare("DELETE FROM payroll WHERE id = ?").run(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
