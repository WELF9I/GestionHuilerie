import { type NextRequest, NextResponse } from "next/server"
import { registerUser } from "@/lib/auth"
import { initializeDatabase } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    initializeDatabase()

    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await registerUser(email, password, name)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Registration failed" }, { status: 400 })
  }
}
