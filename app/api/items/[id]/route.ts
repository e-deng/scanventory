import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Item, Alert } from "@/lib/models"
import { createExpirationAlert } from "@/lib/alerts"
import { validateItemInput } from "@/lib/validation"

type Params = { params: Promise<{ id: string }> }

// GET /api/items/:id - Get single item
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const { id } = await params

    const item = await Item.findOne({ _id: id })
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error("Error fetching item:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch item" }, { status: 500 })
  }
}

// PUT /api/items/:id - Update item
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const { id } = await params
    const body = await req.json()

    const errors = validateItemInput(body, { partial: true })
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: "Validation failed", details: errors }, { status: 400 })
    }

    const item = await Item.findOneAndUpdate({ _id: id }, body, {
      new: true,
      runValidators: true,
    })

    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
    }

    if (body.expirationDate) {
      await createExpirationAlert(item)
    }

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error("Error updating item:", error)
    return NextResponse.json({ success: false, error: "Failed to update item" }, { status: 500 })
  }
}

// DELETE /api/items/:id - Delete item
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB()
    const { id } = await params

    const item = await Item.findOneAndDelete({ _id: id })
    if (!item) {
      return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 })
    }

    await Alert.deleteMany({ itemId: item._id })

    return NextResponse.json({ success: true, message: "Item deleted successfully" })
  } catch (error) {
    console.error("Error deleting item:", error)
    return NextResponse.json({ success: false, error: "Failed to delete item" }, { status: 500 })
  }
}
