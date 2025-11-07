import crypto from "crypto"

export interface User {
  id: number
  email: string
  name: string
  role: string
}

export interface AuthToken {
  userId: number
  email: string
  role: string
  iat: number
  exp: number
}

const AUTH_SECRET = process.env.AUTH_SECRET || "dev-secret-key-change-in-production"

// Hardcoded admin credentials
const ADMIN_EMAIL = "admin@huilerie.local"
const ADMIN_PASSWORD = "admin123"
const ADMIN_NAME = "Administrateur"

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + AUTH_SECRET)
    .digest("hex")
}

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  throw new Error("User registration is not supported - use hardcoded admin credentials")
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  // Check against hardcoded admin credentials
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return {
      id: 1,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      role: "admin",
    }
  }

  return null
}

export function generateAuthToken(user: User): string {
  const token = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
  }

  const encoded = Buffer.from(JSON.stringify(token)).toString("base64")
  return encoded
}

export function verifyAuthToken(token: string): AuthToken | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const authToken = JSON.parse(decoded)

    if (authToken.exp < Math.floor(Date.now() / 1000)) {
      return null // Token expired
    }

    return authToken
  } catch {
    return null
  }
}
