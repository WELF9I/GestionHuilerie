import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()

    // Extract query parameters for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")

    // Calculate offset
    const offset = (page - 1) * limit

    // First, get total count for pagination metadata
    const totalCountResult = db.prepare("SELECT COUNT(*) as count FROM pressing_operations").get() as { count: number }

    const totalCount = totalCountResult.count

    // Get paginated results
    const operations = db
      .prepare(`
      SELECT * FROM pressing_operations
      ORDER BY operation_date DESC
      LIMIT ? OFFSET ?
    `)
      .all(limit, offset)

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit)

    // Return both data and pagination metadata
    return NextResponse.json({
      data: operations,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { operation_date, olives_quantity_kg, total_price, notes } =
      await request.json()

    const result = db
      .prepare(`
      INSERT INTO pressing_operations (operation_date, olives_quantity_kg, total_price, notes)
      VALUES (?, ?, ?, ?)
    `)
      .run(
        operation_date,
        olives_quantity_kg,
        total_price,
        notes || null,
      )

    return NextResponse.json({ id: result.lastInsertRowid })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
