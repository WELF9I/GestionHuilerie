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
    const pomace = db.prepare("SELECT * FROM pomace ORDER BY collection_date DESC").all()

    return NextResponse.json({ success: true, data: pomace })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch pomace" },
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
    const { operation_id, quantity_kg, collection_date, destination, notes } = await request.json()

    const result = db
      .prepare(`
      INSERT INTO pomace (operation_id, quantity_kg, collection_date, destination, processing_status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(operation_id, quantity_kg, collection_date, destination, "pending", notes)

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        operation_id,
        quantity_kg,
        collection_date,
        destination,
        processing_status: "pending",
        notes,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create pomace record",
      },
      { status: 400 },
    )
  }
}
