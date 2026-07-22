import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Item } from "@/lib/models"
import { createExpirationAlert } from "@/lib/alerts"
import { validateItemInput } from "@/lib/validation"

// GET /api/items - Get all items
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const shelf = searchParams.get("shelf")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "addedDate"
    const order = searchParams.get("order") || "desc"

    const query: Record<string, any> = {}
    if (shelf) query.shelf = shelf
    if (category) query.category = category
    if (search) query.name = { $regex: search, $options: "i" }

    const sortOrder = order === "asc" ? 1 : -1
    const items = await Item.find(query).sort({ [sortBy]: sortOrder })

    return NextResponse.json({ success: true, data: items, count: items.length })
  } catch (error) {
    console.error("Error fetching items:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch items" }, { status: 500 })
  }
}

// POST /api/items - Create new item
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()
    const errors = validateItemInput(body)
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 })
    }

    const item = new Item(body)
    await item.save()

    await createExpirationAlert(item)

    return NextResponse.json({ success: true, data: item }, { status: 201 })
  } catch (error) {
    console.error("Error creating item:", error)
    return NextResponse.json({ success: false, error: "Failed to create item" }, { status: 500 })
  }
}
