import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    
    // Check if there are any movements referencing this tank
    const movements = db.prepare("SELECT COUNT(*) as count FROM tank_movements WHERE tank_id = ?").get(id) as { count: number }
    
    if (movements.count > 0) {
      // Instead of preventing deletion, implement soft deletion
      // Mark the tank as inactive instead of deleting it
      db.prepare("UPDATE tanks SET is_active = 0 WHERE id = ?").run(id)
      return NextResponse.json({ 
        success: true,
        message: "Citerne désactivée (soft delete). Les mouvements historiques sont conservés.",
        type: "soft_delete"
      })
    } else {
      // No movements - safe to hard delete
      db.prepare("DELETE FROM tanks WHERE id = ?").run(id)
      return NextResponse.json({ 
        success: true,
        message: "Citerne supprimée définitivement.",
        type: "hard_delete"
      })
    }
  } catch (error) {
    console.error("Erreur lors de la suppression:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de la citerne" }, { status: 500 })
  }
}
