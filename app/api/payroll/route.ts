import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const payroll = db
      .prepare(`
        SELECT p.*, e.name as employee_name, e.salary as employee_salary
        FROM payroll p
        LEFT JOIN employees e ON p.employee_id = e.id
        ORDER BY p.payment_date DESC, p.id DESC
      `)
      .all()
    return NextResponse.json(payroll)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { employee_id, payment_date, payment_type, amount, month, notes } = await request.json()

    // Ensure month is stored in YYYY-MM format. If client didn't provide it,
    // derive it from the payment_date so month-based filters still work.
    const monthValue = month || (payment_date ? String(payment_date).slice(0, 7) : null)

    const result = db
      .prepare(`
        INSERT INTO payroll (employee_id, payment_date, payment_type, amount, month, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(employee_id, payment_date, payment_type, amount, monthValue, notes)

    return NextResponse.json({ id: result.lastInsertRowid })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
