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
    // Log the incoming request for debugging
    const requestData = await request.json()
    console.log("Suppliers POST request data:", requestData)
    
    const { name, phone, address, notes } = requestData
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: "Le nom du fournisseur est obligatoire et doit être une chaîne non vide" }, { status: 400 })
    }
    
    initializeDatabase()
    const db = getDatabase()
    
    const result = db
      .prepare(`
      INSERT INTO suppliers (name, phone, address, notes) VALUES (?, ?, ?, ?)
    `)
      .run(name.trim(), phone || null, address || null, notes || null)
    
    const newSupplier = { 
      id: result.lastInsertRowid, 
      name: name.trim(), 
      phone: phone || null, 
      address: address || null, 
      notes: notes || null 
    }
    
    console.log("Supplier created successfully:", newSupplier)
    return NextResponse.json(newSupplier)
  } catch (error) {
    console.error("Suppliers POST error:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la création du fournisseur", 
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
