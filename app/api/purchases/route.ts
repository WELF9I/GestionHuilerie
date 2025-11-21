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
    const supplierName = searchParams.get("supplier_name") || null

    // Calculate offset
    const offset = (page - 1) * limit

    // Build the WHERE clause for supplier filter if provided
    let whereClause = ""
    let countParams: any[] = []
    let dataParams: any[] = []
    let statsWhereClause = ""
    let statsParams: any[] = []

    if (supplierId) {
      whereClause += "WHERE p.supplier_id = ?"
      countParams = [supplierId]
      dataParams = [supplierId, limit, offset]
      statsWhereClause += "WHERE p.supplier_id = ?"
      statsParams = [supplierId]
    } else if (supplierName) {
      whereClause += "WHERE s.name LIKE ?"
      const searchTerm = `%${supplierName}%`
      countParams = [searchTerm]
      dataParams = [searchTerm, limit, offset]
      statsWhereClause += "WHERE s.name LIKE ?"
      statsParams = [searchTerm]
    } else {
      dataParams = [limit, offset]
    }

    // Get the overall stats (total amounts for all purchases matching the filter)
    let statsQuery = `
      SELECT
        SUM(total_amount) as total_purchased,
        SUM(advance_paid) as total_advance
      FROM olive_purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${statsWhereClause}
    `

    const statsResult = db.prepare(statsQuery).get(statsParams) as { total_purchased: number | null, total_advance: number | null }

    const totalPurchased = statsResult.total_purchased || 0
    const totalAdvance = statsResult.total_advance || 0

    // Get total count for pagination metadata
    const totalCountResult = db.prepare(`
      SELECT COUNT(*) as count
      FROM olive_purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
    `).get(countParams) as { count: number }

    const totalCount = totalCountResult.count

    // Get paginated results
    let query = `
      SELECT
        p.*,
        s.name as supplier_name,
        (SELECT MAX(payment_date) FROM purchase_payments WHERE purchase_id = p.id) as last_payment_date
      FROM olive_purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
    `

    const purchases = db.prepare(query).all(dataParams)

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit)

    // Return both data, pagination metadata, and overall stats
    return NextResponse.json({
      data: purchases,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
      },
      stats: {
        totalPurchased,
        totalAdvance,
        totalRemaining: totalPurchased - totalAdvance,
      }
    })
  } catch (error) {
    console.error("Error in GET /api/purchases:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { purchase_date, supplier_id, quantity_kg, unit_price, advance_paid, tank_allocations } = await request.json()

    // Validate required fields
    if (!purchase_date || !supplier_id || !quantity_kg || !unit_price) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Check if supplier exists
    const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id) as { name: string } | undefined
    if (!supplier) {
      return NextResponse.json({ error: "Fournisseur introuvable" }, { status: 400 })
    }

    const total_amount = Number(quantity_kg) * Number(unit_price)
    const remaining_balance = total_amount - Number(advance_paid)
    
    const supplierName = supplier.name
    
    // Get count of purchases for this supplier to generate sequential number
    const count = db.prepare('SELECT COUNT(*) as count FROM olive_purchases WHERE supplier_id = ?').get(supplier_id) as { count: number }
    const sequentialNumber = String(count.count + 1).padStart(6, '0')
    
    const batch_number = `LOT-${supplierName}-${sequentialNumber}`

    const result = db
      .prepare(`
      INSERT INTO olive_purchases (purchase_date, supplier_id, quantity_kg, unit_price, total_amount, advance_paid, remaining_balance, batch_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
      .run(
        purchase_date,
        supplier_id,
        quantity_kg,
        unit_price,
        total_amount,
        advance_paid,
        remaining_balance,
        batch_number,
      )

    // Update tank volumes if tank allocations provided
    if (tank_allocations && Array.isArray(tank_allocations)) {
      for (const allocation of tank_allocations) {
        if (allocation.tank_id && allocation.quantity) {
          db.prepare(`
            UPDATE tanks 
            SET current_volume = current_volume + ?
            WHERE id = ?
          `).run(Number(allocation.quantity), allocation.tank_id)

          // Record tank movement
          db.prepare(`
            INSERT INTO tank_movements (tank_id, movement_type, quantity_liters, movement_date, notes)
            VALUES (?, 'entree', ?, ?, ?)
          `).run(
            allocation.tank_id,
            Number(allocation.quantity),
            purchase_date,
            `Achat ${batch_number}`
          )
        }
      }
    }

    // Ensure WAL checkpoint for data consistency
    db.pragma("wal_checkpoint(TRUNCATE)")

    return NextResponse.json({ id: result.lastInsertRowid, batch_number, total_amount, remaining_balance })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

