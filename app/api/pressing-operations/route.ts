import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"
import { verifyAuthToken } from "@/lib/auth"

function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null
  return authHeader.slice(7)
}

export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    initializeDatabase()
    const db = getDatabase()
    const operations = db
      .prepare(`
      SELECT po.*, s.name as supplier_name
      FROM pressing_operations po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.operation_date DESC
    `)
      .all()

    return NextResponse.json({ success: true, data: operations })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch operations" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request)
    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    initializeDatabase()
    const db = getDatabase()
    const { operation_date, supplier_id, raw_material_type, quantity_kg, oil_output_liters, waste_kg, notes } =
      await request.json()

    const result = db
      .prepare(`
      INSERT INTO pressing_operations (operation_date, supplier_id, raw_material_type, quantity_kg, oil_output_liters, waste_kg, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .run(operation_date, supplier_id, raw_material_type, quantity_kg, oil_output_liters, waste_kg, notes)

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        operation_date,
        supplier_id,
        raw_material_type,
        quantity_kg,
        oil_output_liters,
        waste_kg,
        notes,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create operation" },
      { status: 400 },
    )
  }
}
