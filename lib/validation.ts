export const VALID_SHELVES = [
  "Refrigerator - Top",
  "Refrigerator - Middle",
  "Refrigerator - Bottom",
  "Freezer - Top",
  "Freezer - Bottom",
  "Pantry - Shelf 1",
  "Pantry - Shelf 2",
  "Pantry - Shelf 3",
  "Counter",
  "Other",
]

export const VALID_CATEGORIES = [
  "Dairy",
  "Bakery",
  "Canned Goods",
  "Frozen",
  "Produce",
  "Meat & Seafood",
  "Snacks",
  "Beverages",
  "Condiments",
  "Grains & Pasta",
  "Other",
]

export function validateItemInput(body: any, { partial = false }: { partial?: boolean } = {}) {
  const errors: string[] = []

  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
      errors.push("Item name is required")
    }
  }

  if (!partial || body.quantity !== undefined) {
    if (!Number.isInteger(body.quantity) || body.quantity < 0) {
      errors.push("Quantity must be a positive integer")
    }
  }

  if (!partial) {
    if (!body.shelf || !VALID_SHELVES.includes(body.shelf)) {
      errors.push("Shelf is required")
    }
    if (!body.category || !VALID_CATEGORIES.includes(body.category)) {
      errors.push("Category is required")
    }
  }

  if (!partial || body.expirationDate !== undefined) {
    if (!body.expirationDate || Number.isNaN(Date.parse(body.expirationDate))) {
      errors.push("Valid expiration date is required")
    }
  }

  return errors
}
