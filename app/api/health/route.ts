import { NextResponse } from "next/server"

// GET /api/health - Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Scanventory API is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
