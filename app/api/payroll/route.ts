import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()

    // Extract query parameters for pagination and filtering
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const month = searchParams.get("month") || null

    // Calculate offset
    const offset = (page - 1) * limit

    // Build the WHERE clause for month filter if provided
    let whereClause = ""
    let countParams: any[] = []
    let dataParams: any[] = []
    let statsWhereClause = ""
    let statsParams: any[] = []

    if (month) {
      whereClause = "WHERE p.month = ?"
      countParams = [month]
      dataParams = [month, limit, offset]
      statsWhereClause = "WHERE p.month = ?"
      statsParams = [month]
    } else {
      dataParams = [limit, offset]
    }

    // Get overall stats for all payroll records matching filter
    const statsResult = db.prepare(`
      SELECT
        SUM(CASE WHEN payment_type = 'salary' THEN amount ELSE 0 END) as total_salary,
        SUM(CASE WHEN payment_type = 'advance' THEN amount ELSE 0 END) as total_advances
      FROM payroll p
      ${statsWhereClause}
    `).get(statsParams) as { total_salary: number | null, total_advances: number | null }

    const totalSalary = statsResult.total_salary || 0
    const totalAdvances = statsResult.total_advances || 0

    // First, get total count for pagination metadata
    const totalCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM payroll p
      LEFT JOIN employees e ON p.employee_id = e.id
      ${whereClause}
    `).get(countParams) as { count: number }

    const totalCount = totalCountResult.count

    // Get paginated results
    let query = `
      SELECT p.*, e.name as employee_name, e.salary as employee_salary
      FROM payroll p
      LEFT JOIN employees e ON p.employee_id = e.id
      ${whereClause}
      ORDER BY p.payment_date DESC, p.id DESC
      LIMIT ? OFFSET ?
    `

    const payroll = db.prepare(query).all(dataParams)

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit)

    // Return both data, pagination metadata, and overall stats
    return NextResponse.json({
      data: payroll,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
      stats: {
        totalSalary,
        totalAdvances,
        totalPaid: totalSalary, // Total salary payments made
      }
    })
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
