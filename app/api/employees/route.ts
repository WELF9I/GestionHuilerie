import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const employees = db.prepare("SELECT * FROM employees ORDER BY id DESC").all()
    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la récupération des employés" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { name, position, salary, hire_date, vacation_balance, notes } = await request.json()

    const result = db
      .prepare(`
      INSERT INTO employees (name, position, salary, hire_date, vacation_balance, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(name, position, Number(salary) || 0, hire_date || null, Number(vacation_balance) || 0, notes || "")

    return NextResponse.json({ id: result.lastInsertRowid, name, position, salary, hire_date, vacation_balance, notes })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}
