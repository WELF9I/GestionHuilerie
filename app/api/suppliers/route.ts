import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET() {
  try {
    initializeDatabase()
    const db = getDatabase()
    const suppliers = db.prepare("SELECT * FROM suppliers ORDER BY id DESC").all()
    return NextResponse.json(suppliers)
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { name, phone, address, notes } = await request.json()
    const result = db
      .prepare(`
      INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)
    `)
      .run(name, phone || "", address || "", notes || "")
    return NextResponse.json({ id: result.lastInsertRowid, name, phone, address, notes })
  } catch (error) {
    return NextResponse.json({ error: "Erreur" }, { status: 500 })
  }
}
