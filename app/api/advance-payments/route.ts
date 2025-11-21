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
    const supplierId = searchParams.get("supplier_id") || null

    // Calculate offset
    const offset = (page - 1) * limit

    // Build the WHERE clause for supplier filter if provided
    let whereClause = ""
    let countParams: any[] = []
    let dataParams: any[] = []

    if (supplierId) {
      whereClause = "WHERE ap.supplier_id = ?"
      countParams = [supplierId]
      dataParams = [supplierId, limit, offset]
    } else {
      dataParams = [limit, offset]
    }

    // First, get total count for pagination metadata
    const totalCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM advance_payments ap
      LEFT JOIN suppliers s ON ap.supplier_id = s.id
      ${whereClause}
    `).get(countParams) as { count: number }

    const totalCount = totalCountResult.count

    // Get paginated results
    let query = `
      SELECT ap.*, s.name as supplier_name
      FROM advance_payments ap
      LEFT JOIN suppliers s ON ap.supplier_id = s.id
      ${whereClause}
      ORDER BY ap.payment_date DESC, ap.id DESC
      LIMIT ? OFFSET ?
    `

    const payments = db.prepare(query).all(dataParams)

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit)

    // Return both data and pagination metadata
    return NextResponse.json({
      data: payments,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      }
    })
  } catch (error) {
    console.error("Error in GET /api/advance-payments:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { supplier_id, amount, payment_date, notes, payment_type } = await request.json()

    // Validate required fields
    if (!supplier_id || !amount) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Check if supplier exists
    const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id) as { name: string } | undefined
    if (!supplier) {
      return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 400 })
    }

    // Create the advance payment record
    const result = db.prepare(`
      INSERT INTO advance_payments (supplier_id, amount, payment_date, notes, payment_type)
      VALUES (?, ?, ?, ?, ?)
    `).run(supplier_id, Number(amount), payment_date, notes || null, payment_type)

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ id: result.lastInsertRowid, message: "Paiement enregistré avec succès" })
  } catch (error) {
    console.error("Error in POST /api/advance-payments:", error)
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du paiement" }, { status: 500 })
  }
}

