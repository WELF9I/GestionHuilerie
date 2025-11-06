import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    const { name, phone, address, notes } = await request.json()
    db.prepare(`
      UPDATE suppliers SET name = ?, phone = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(name, phone || "", address || "", notes || "", id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    initializeDatabase()
    const db = getDatabase()
    db.prepare("DELETE FROM suppliers WHERE id = ?").run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
