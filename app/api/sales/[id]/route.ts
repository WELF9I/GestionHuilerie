import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()

    // First, get the sale details to restore inventory if needed
    const sale = db.prepare("SELECT tank_id, quantity_liters FROM oil_sales WHERE id = ?").get(id) as { tank_id: number | null, quantity_liters: number }

    if (sale && sale.tank_id) {
      // Restore the quantity back to the tank
      const currentTank = db.prepare("SELECT current_volume FROM tanks WHERE id = ?").get(sale.tank_id) as { current_volume: number }
      if (currentTank) {
        const newVolume = currentTank.current_volume + sale.quantity_liters
        db.prepare("UPDATE tanks SET current_volume = ? WHERE id = ?").run(newVolume, sale.tank_id)
      }
    }

    // Delete the sale record
    db.prepare("DELETE FROM oil_sales WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
