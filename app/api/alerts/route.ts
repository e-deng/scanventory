import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Alert } from "@/lib/models"

// GET /api/alerts - Get all alerts
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const dismissed = searchParams.get("dismissed") ?? "false"
    const severity = searchParams.get("severity")

    const query: Record<string, any> = {}
    if (dismissed !== "all") {
      query.dismissed = dismissed === "true"
    }
    if (severity) {
      query.severity = severity
    }

    const alerts = await Alert.find(query)
      .populate("itemId", "name shelf quantity")
      .sort({ severity: 1, createdAt: -1 })

    return NextResponse.json({ success: true, data: alerts, count: alerts.length })
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch alerts" }, { status: 500 })
  }
}
