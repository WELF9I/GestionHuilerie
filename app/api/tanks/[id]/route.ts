import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    db.prepare("DELETE FROM tanks WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
