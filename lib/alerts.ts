import { Alert } from "@/lib/models"
import type { IItem } from "@/lib/models/Item"

// Recompute severity and (re)create the expiration alert for an item.
export async function createExpirationAlert(item: IItem & { _id: unknown }) {
  const today = new Date()
  const expiry = new Date(item.expirationDate)
  const diffTime = expiry.getTime() - today.getTime()
  const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let severity: "critical" | "warning" | "expired" | undefined
  if (daysUntilExpiry < 0) severity = "expired"
  else if (daysUntilExpiry <= 2) severity = "critical"
  else if (daysUntilExpiry <= 7) severity = "warning"
  else {
    // No alert needed; clear any stale alert for this item
    await Alert.deleteMany({ itemId: item._id })
    return
  }

  await Alert.deleteMany({ itemId: item._id })

  const alert = new Alert({
    itemId: item._id,
    itemName: item.name,
    expirationDate: item.expirationDate,
    daysUntilExpiry,
    severity,
    userId: item.userId,
  })

  await alert.save()
}
