import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Alert } from "@/lib/models"

// PUT /api/alerts/dismiss-all - Dismiss all alerts
export async function PUT() {
  try {
    await connectDB()

    const result = await Alert.updateMany({ dismissed: false }, { dismissed: true })

    return NextResponse.json({
      success: true,
      message: `Dismissed ${result.modifiedCount} alerts`,
      count: result.modifiedCount,
    })
  } catch (error) {
    console.error("Error dismissing all alerts:", error)
    return NextResponse.json({ success: false, error: "Failed to dismiss alerts" }, { status: 500 })
  }
}
