import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, initializeDatabase } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
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
    initializeDatabase()
    const db = getDatabase()
    const { collection_date, quantity_kg, status, customer_buyer, sale_price, notes } = await request.json()

    const result = db
      .prepare(`
      INSERT INTO pomace (collection_date, quantity_kg, status, customer_buyer, sale_price, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
      .run(collection_date, quantity_kg, status || 'stocké', customer_buyer, sale_price, notes)

    return NextResponse.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        collection_date,
        quantity_kg,
        status: status || 'stocké',
        customer_buyer,
        sale_price,
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

export async function PUT(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { id, collection_date, quantity_kg, status, customer_buyer, sale_price, notes } = await request.json()

    db.prepare(`
      UPDATE pomace
      SET collection_date = ?, quantity_kg = ?, status = ?, customer_buyer = ?, sale_price = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(collection_date, quantity_kg, status, customer_buyer, sale_price, notes, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update pomace record",
      },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initializeDatabase()
    const db = getDatabase()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    db.prepare("DELETE FROM pomace WHERE id = ?").run(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete pomace record",
      },
      { status: 500 },
    )
  }
}
