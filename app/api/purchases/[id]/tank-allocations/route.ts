import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()

    // First get the purchase details to access the batch number
    const purchase = db.prepare('SELECT batch_number FROM olive_purchases WHERE id = ?').get(id) as { batch_number: string } | undefined

    if (!purchase) {
      return NextResponse.json({ error: "Achat introuvable" }, { status: 404 })
    }

    // Get tank allocations based on tank movements for this purchase
    // First try to find with batch number format (for original purchases)
    let allocations = db.prepare(`
      SELECT tm.tank_id, tm.quantity_liters as quantity
      FROM tank_movements tm
      WHERE tm.notes LIKE ? AND tm.movement_type = 'entree'
      ORDER BY tm.id
    `).all(`%Achat ${purchase.batch_number}%`) as { tank_id: number, quantity: number }[]

    // If not found with batch number, try with purchase ID format (for updated purchases)
    if (allocations.length === 0) {
      allocations = db.prepare(`
        SELECT tm.tank_id, tm.quantity_liters as quantity
        FROM tank_movements tm
        WHERE tm.notes LIKE ? AND tm.movement_type = 'entree'
        ORDER BY tm.id
      `).all(`%purchase ID: ${id}%`) as { tank_id: number, quantity: number }[]
    }

    return NextResponse.json({ data: allocations })
  } catch (error) {
    console.error("Error in GET /api/purchases/[id]/tank-allocations:", error)
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}