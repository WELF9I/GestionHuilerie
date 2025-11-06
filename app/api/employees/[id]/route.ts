import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    const { name, position, salary, hire_date, vacation_balance, notes } = await request.json()

    db.prepare(`
      UPDATE employees 
      SET name = ?, position = ?, salary = ?, hire_date = ?, vacation_balance = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, position, Number(salary) || 0, hire_date || null, Number(vacation_balance) || 0, notes || "", id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    db.prepare("DELETE FROM employees WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
