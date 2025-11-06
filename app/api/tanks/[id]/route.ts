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
      return NextResponse.json({ 
        error: "Impossible de supprimer cette citerne car elle a des mouvements associés. Supprimez d'abord les mouvements." 
      }, { status: 400 })
    }
    
    db.prepare("DELETE FROM tanks WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression de la citerne" }, { status: 500 })
  }
}
