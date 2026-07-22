import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Item } from "@/lib/models"

const MOCK_PRODUCTS: Record<string, { name: string; category: string }> = {
  "123456789012": { name: "Organic Milk", category: "Dairy" },
  "234567890123": { name: "Whole Wheat Bread", category: "Bakery" },
  "345678901234": { name: "Greek Yogurt", category: "Dairy" },
  "456789012345": { name: "Chicken Breast", category: "Meat & Seafood" },
  "567890123456": { name: "Bananas", category: "Produce" },
}

// POST /api/items/scan - Handle barcode scanning
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const { barcode, action = "in" } = await req.json()

    if (!barcode) {
      return NextResponse.json({ success: false, error: "Barcode is required" }, { status: 400 })
    }

    const existingItem = await Item.findOne({ barcode })

    if (action === "out") {
      if (!existingItem) {
        return NextResponse.json({ success: false, error: "Item not found for scan out" }, { status: 404 })
      }

      if (existingItem.quantity <= 0) {
        return NextResponse.json({ success: false, error: "Item is already out of stock" }, { status: 400 })
      }

      existingItem.quantity -= 1
      await existingItem.save()

      return NextResponse.json({ success: true, action: "scanned_out", data: existingItem })
    }

    if (existingItem) {
      existingItem.quantity += 1
      await existingItem.save()

      return NextResponse.json({ success: true, action: "quantity_increased", data: existingItem })
    }

    const productInfo = MOCK_PRODUCTS[barcode as string]

    return NextResponse.json({
      success: true,
      action: "new_item_scanned",
      productInfo: productInfo || null,
      barcode,
    })
  } catch (error) {
    console.error("Error processing scan:", error)
    return NextResponse.json({ success: false, error: "Failed to process scan" }, { status: 500 })
  }
}
