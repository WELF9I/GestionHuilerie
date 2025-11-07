import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const purchases = db
      .prepare(`
      SELECT p.*, s.name as supplier_name FROM olive_purchases p 
      LEFT JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.id DESC
    `)
      .all()
    return NextResponse.json(purchases)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { purchase_date, supplier_id, quantity_kg, unit_price, advance_paid, tank_allocations } = await request.json()

    const total_amount = Number(quantity_kg) * Number(unit_price)
    const remaining_balance = total_amount - Number(advance_paid)
    
    // Get supplier name for batch number
    const supplier = db.prepare('SELECT name FROM suppliers WHERE id = ?').get(supplier_id) as { name: string } | undefined
    const supplierName = supplier?.name || 'Unknown'
    
    // Get count of purchases for this supplier to generate sequential number
    const count = db.prepare('SELECT COUNT(*) as count FROM olive_purchases WHERE supplier_id = ?').get(supplier_id) as { count: number }
    const sequentialNumber = String(count.count + 1).padStart(3, '0')
    
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

    return NextResponse.json({ id: result.lastInsertRowid, batch_number, total_amount, remaining_balance })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
