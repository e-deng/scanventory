"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Scan,
  AlertTriangle,
  TrendingUp,
  Plus,
  Minus,
  Edit,
  Trash2,
  Grid3X3,
  Refrigerator,
  Archive,
  Bell,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

import { itemsApi, alertsApi } from "@/lib/api"

interface PantryItem {
  id: string
  name: string
  quantity: number
  shelf: string
  expirationDate: string
  category: string
  barcode?: string
  addedDate: string
}

interface ExpirationAlert {
  id: string
  itemId: string
  itemName: string
  expirationDate: string
  daysUntilExpiry: number
  severity: "critical" | "warning" | "expired"
  dismissed: boolean
  createdAt: string
}

const CATEGORIES = [
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

const SHELVES = [
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

const SHELF_AREAS = {
  Refrigerator: {
    icon: Refrigerator,
    color: "bg-blue-100 border-blue-200",
    shelves: ["Refrigerator - Top", "Refrigerator - Middle", "Refrigerator - Bottom"],
  },
  Freezer: {
    icon: Archive,
    color: "bg-cyan-100 border-cyan-200",
    shelves: ["Freezer - Top", "Freezer - Bottom"],
  },
  Pantry: {
    icon: Archive,
    color: "bg-amber-100 border-amber-200",
    shelves: ["Pantry - Shelf 1", "Pantry - Shelf 2", "Pantry - Shelf 3"],
  },
  Other: {
    icon: Grid3X3,
    color: "bg-gray-100 border-gray-200",
    shelves: ["Counter", "Other"],
  },
}

export default function ScanventoryApp() {
  const [isLoading, setIsLoading] = useState(false)

  const [items, setItems] = useState<PantryItem[]>([])
  const [alerts, setAlerts] = useState<ExpirationAlert[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scanMode, setScanMode] = useState<"in" | "out">("in")
  const [viewMode, setViewMode] = useState<"list" | "shelves">("list")
  const [selectedShelfArea, setSelectedShelfArea] = useState<string>("all")
  const { toast } = useToast()

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Form state for add/edit modals
  const [formData, setFormData] = useState({
    name: "",
    quantity: 1,
    shelf: "",
    expirationDate: "",
    category: "",
    barcode: "",
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load items
      const itemsResponse = await itemsApi.getAll()
      
      if (itemsResponse.success && itemsResponse.data) {
        // Convert MongoDB _id to id for frontend compatibility
        const itemsWithId = itemsResponse.data.map((item) => ({
          ...item,
          id: item._id,
          addedDate: new Date(item.addedDate).toISOString().split('T')[0],
          expirationDate: new Date(item.expirationDate).toISOString().split('T')[0],
        }))
        setItems(itemsWithId)
      }

      // Load alerts
      const alertsResponse = await alertsApi.getAll({ dismissed: "false" })
      
      if (alertsResponse.success && alertsResponse.data) {
        const alertsWithId = alertsResponse.data.map((alert) => ({
          ...alert,
          id: alert._id,
          expirationDate: new Date(alert.expirationDate).toISOString().split('T')[0],
          createdAt: new Date(alert.createdAt).toISOString().split('T')[0],
        }))
        setAlerts(alertsWithId)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // useEffect(() => {
  //   localStorage.setItem("scanventory-items", JSON.stringify(items))
  // }, [items])

  // useEffect(() => {
  //   localStorage.setItem("scanventory-alerts", JSON.stringify(alerts))
  // }, [alerts])

  // Generate alerts for expiring items
  useEffect(() => {
    const generateAlerts = () => {
      const today = new Date()
      const newAlerts: ExpirationAlert[] = []

      items.forEach((item) => {
        const expDate = new Date(item.expirationDate)
        const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Create alerts for items expiring within 7 days or already expired
        if (daysUntilExpiry <= 7) {
          const existingAlert = alerts.find((alert) => alert.itemId === item.id && !alert.dismissed)

          if (!existingAlert) {
            let severity: "critical" | "warning" | "expired"
            if (daysUntilExpiry < 0) severity = "expired"
            else if (daysUntilExpiry <= 3) severity = "critical"
            else severity = "warning"

            newAlerts.push({
              id: `alert-${item.id}-${Date.now()}`,
              itemId: item.id,
              itemName: item.name,
              expirationDate: item.expirationDate,
              daysUntilExpiry,
              severity,
              dismissed: false,
              createdAt: new Date().toISOString(),
            })
          }
        }
      })

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...prev, ...newAlerts])

        // Show toast notification for new critical alerts
        const criticalAlerts = newAlerts.filter(
          (alert) => alert.severity === "critical" || alert.severity === "expired",
        )
        if (criticalAlerts.length > 0) {
          toast({
            title: "Expiration Alert!",
            description: `${criticalAlerts.length} item(s) need immediate attention`,
            variant: "destructive",
          })
        }
      }
    }

    if (items.length > 0) {
      generateAlerts()
    }
  }, [items, toast])

  // Calculate dashboard stats
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const uniqueItems = items.length
  const expiringItems = items.filter((item) => {
    const expDate = new Date(item.expirationDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }).length

  const lowStockItems = items.filter((item) => item.quantity <= 2).length
  const activeAlerts = alerts.filter((alert) => !alert.dismissed)
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "critical" || alert.severity === "expired")

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shelf.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedShelfArea === "all") return matchesSearch

    const shelfArea = Object.entries(SHELF_AREAS).find(([_, area]) => area.shelves.includes(item.shelf))

    return matchesSearch && shelfArea && shelfArea[0] === selectedShelfArea
  })

  const groupItemsByShelf = (items: PantryItem[]) => {
    const grouped: Record<string, PantryItem[]> = {}
    items.forEach((item) => {
      if (!grouped[item.shelf]) {
        grouped[item.shelf] = []
      }
      grouped[item.shelf].push(item)
    })
    return grouped
  }

  const getExpiryStatus = (expirationDate: string) => {
    const expDate = new Date(expirationDate)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) return { status: "expired", color: "destructive", text: "Expired" }
    if (daysUntilExpiry <= 3) return { status: "critical", color: "destructive", text: `${daysUntilExpiry}d left` }
    if (daysUntilExpiry <= 7) return { status: "warning", color: "secondary", text: `${daysUntilExpiry}d left` }
    return { status: "good", color: "outline", text: `${daysUntilExpiry}d left` }
  }

  const dismissAlert = async (alertId: string) => {
    try {
      const response = await alertsApi.dismiss(alertId)
      if (response.success) {
        setAlerts((prev) => prev.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert)))
        toast({
          title: "Alert Dismissed",
          description: "The alert has been dismissed.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alert.",
        variant: "destructive",
      })
    }
  }

  const dismissAllAlerts = async () => {
    try {
      const response = await alertsApi.dismissAll()
      if (response.success) {
        setAlerts((prev) => prev.map((alert) => ({ ...alert, dismissed: true })))
        toast({
          title: "All Alerts Dismissed",
          description: "All alerts have been dismissed.",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss alerts.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      quantity: 1,
      shelf: "",
      expirationDate: "",
      category: "",
      barcode: "",
    })
  }

      const handleBarcodeDetected = async (barcode: string, productInfo?: any) => {
    if (scanMode === "in") {
      // Check if item already exists
      const existingItem = items.find((item) => item.barcode === barcode)

      // For manual barcode entry (no productInfo), always open form
      if (!productInfo) {
        if (existingItem) {
          // Pre-fill with existing item data
          setFormData({
            name: existingItem.name,
            quantity: existingItem.quantity + 1,
            shelf: existingItem.shelf,
            expirationDate: "", // Always let user set expiration date
            category: existingItem.category,
            barcode: barcode,
          })
        } else {
          // Try to fetch product data from OpenFoodFacts API
          let fetchedProductInfo = null
          try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
            if (response.ok) {
              const data = await response.json()
              if (data.status === 1 && data.product) {
                fetchedProductInfo = {
                  name: data.product.product_name || data.product.brands || "Unknown Product",
                  category: data.product.categories_tags?.[0]?.replace('en:', '') || "Other",
                }
              }
            }
          } catch (error) {
            console.warn("Failed to fetch product data:", error)
          }

          if (fetchedProductInfo) {
            // Map categories and set shelf
            const categoryMapping: { [key: string]: string } = {
              'dairy': 'Dairy',
              'bakery': 'Bakery',
              'fruits': 'Produce',
              'vegetables': 'Produce',
              'meat': 'Meat & Seafood',
              'snacks': 'Snacks',
              'beverages': 'Beverages',
              'condiments': 'Condiments',
            }

            const mappedCategory = categoryMapping[fetchedProductInfo.category.toLowerCase()] || 'Other'
            let shelf = "Pantry - Shelf 1"
            if (mappedCategory === "Dairy") shelf = "Refrigerator - Top"
            else if (mappedCategory === "Produce") shelf = "Counter"
            else if (mappedCategory === "Meat & Seafood") shelf = "Freezer - Top"

            setFormData({
              name: fetchedProductInfo.name,
              quantity: 1,
              shelf: shelf,
              expirationDate: "", // Always let user set expiration date
              category: mappedCategory,
              barcode: barcode,
            })
          } else {
            setFormData({
              name: "",
              quantity: 1,
              shelf: "",
              expirationDate: "",
              category: "",
              barcode: barcode,
            })
          }
        }
        
        setIsAddModalOpen(true)
        setIsScannerOpen(false)
        return
      }

      // For demo buttons, auto-increase quantity if item exists
      if (existingItem) {
        adjustQuantity(existingItem.id, 1)
        toast({
          title: "Item Updated",
          description: `Added 1 ${existingItem.name} to your pantry.`,
        })
        setIsScannerOpen(false)
        return
      }

      // Try to fetch product data from OpenFoodFacts API for demo buttons
      let fetchedProductInfo = productInfo
      if (!productInfo) {
        try {
          const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
          if (response.ok) {
            const data = await response.json()
            if (data.status === 1 && data.product) {
              fetchedProductInfo = {
                name: data.product.product_name || data.product.brands || "Unknown Product",
                category: data.product.categories_tags?.[0]?.replace('en:', '') || "Other",
              }
            }
          }
        } catch (error) {
          console.warn("Failed to fetch product data:", error)
        }
      }

      // Pre-fill form with product info and open add modal
      if (fetchedProductInfo) {
        // Map OpenFoodFacts categories to our categories
        const categoryMapping: { [key: string]: string } = {
          'dairy': 'Dairy',
          'bakery': 'Bakery',
          'fruits': 'Produce',
          'vegetables': 'Produce',
          'meat': 'Meat & Seafood',
          'snacks': 'Snacks',
          'beverages': 'Beverages',
          'condiments': 'Condiments',
        }

        const mappedCategory = categoryMapping[fetchedProductInfo.category.toLowerCase()] || 'Other'
        
        // Determine shelf based on category
        let shelf = "Pantry - Shelf 1"
        if (mappedCategory === "Dairy") shelf = "Refrigerator - Top"
        else if (mappedCategory === "Produce") shelf = "Counter"
        else if (mappedCategory === "Meat & Seafood") shelf = "Freezer - Top"

        // Always open form with pre-filled data so user can set expiration date
        setFormData({
          name: fetchedProductInfo.name,
          quantity: 1,
          shelf: shelf,
          expirationDate: "", // Leave empty so user can set it
          category: mappedCategory,
          barcode: barcode,
        })
        setIsAddModalOpen(true)
        setIsScannerOpen(false)
      } else {
        // No product data found, open manual form
        setFormData({
          name: "",
          quantity: 1,
          shelf: "",
          expirationDate: "",
          category: "",
          barcode: barcode,
        })
        setIsAddModalOpen(true)
        setIsScannerOpen(false)
      }
    } else if (scanMode === "out") {
      // Scan out mode - find and decrease quantity
      const existingItem = items.find((item) => item.barcode === barcode)

      if (existingItem) {
        adjustQuantity(existingItem.id, -1)
        toast({
          title: "Item Removed",
          description: `Removed 1 ${existingItem.name} from your pantry.`,
        })
        setIsScannerOpen(false) // Close scanner modal after successful scan out
      } else {
        toast({
          title: "Item Not Found",
          description: "This item is not in your pantry.",
          variant: "destructive",
        })
      }
    }
  }

  const openScanner = (mode: "in" | "out") => {
    setScanMode(mode)
    setIsScannerOpen(true)
  }

  const handleAddItem = async () => {
    if (!formData.name || !formData.shelf || !formData.expirationDate || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert the date to ensure it's treated as local time, not UTC
      const expirationDate = new Date(formData.expirationDate + 'T12:00:00')
      
      const response = await itemsApi.create({
        name: formData.name,
        quantity: formData.quantity,
        shelf: formData.shelf,
        expirationDate: expirationDate.toISOString(),
        category: formData.category,
        barcode: formData.barcode,
      })

      if (response.success && response.data) {
        const newItem = {
          ...response.data,
          id: response.data._id,
          addedDate: new Date(response.data.addedDate).toISOString().split('T')[0],
          expirationDate: new Date(response.data.expirationDate).toISOString().split('T')[0],
        }

        setItems([...items, newItem])
        setIsAddModalOpen(false)
        resetForm()
        toast({
          title: "Item Added",
          description: `${formData.name} has been added to your pantry.`,
        })
        
        // Reload data to ensure everything is up to date
        await loadData()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !formData.name || !formData.shelf || !formData.expirationDate || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      // Convert the date to ensure it's treated as local time, not UTC
      const expirationDate = new Date(formData.expirationDate + 'T12:00:00')
      
      const response = await itemsApi.update(editingItem.id, {
        name: formData.name,
        quantity: formData.quantity,
        shelf: formData.shelf,
        expirationDate: expirationDate.toISOString(),
        category: formData.category,
        barcode: formData.barcode,
      })

      if (response.success && response.data) {
        const updatedItem = {
          ...response.data,
          id: response.data._id,
          addedDate: new Date(response.data.addedDate).toISOString().split('T')[0],
          expirationDate: new Date(response.data.expirationDate).toISOString().split('T')[0],
        }

        const updatedItems = items.map((item) => (item.id === editingItem.id ? updatedItem : item))

        setItems(updatedItems)
        setIsEditModalOpen(false)
        setEditingItem(null)
        resetForm()
        toast({
          title: "Item Updated",
          description: `${formData.name} has been updated.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    const itemToDelete = items.find((item) => item.id === itemId)

    try {
      const response = await itemsApi.delete(itemId)
      if (response.success) {
        setItems(items.filter((item) => item.id !== itemId))
        setAlerts((prev) => prev.map((alert) => (alert.itemId === itemId ? { ...alert, dismissed: true } : alert)))

        toast({
          title: "Item Deleted",
          description: `${itemToDelete?.name} has been removed from your pantry.`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      })
    }
  }

  const adjustQuantity = async (itemId: string, change: number) => {
    const item = items.find((item) => item.id === itemId)
    if (!item) return

    const newQuantity = Math.max(0, item.quantity + change)

    if (newQuantity === 0) {
      // Delete item if quantity reaches 0
      await handleDeleteItem(itemId)
      return
    }

    try {
      const response = await itemsApi.update(itemId, { quantity: newQuantity })
      if (response.success) {
        const updatedItems = items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
        setItems(updatedItems)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openEditModal = (item: PantryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      quantity: item.quantity,
      shelf: item.shelf,
      expirationDate: item.expirationDate,
      category: item.category,
      barcode: item.barcode || "",
    })
    setIsEditModalOpen(true)
  }

  const openAddModal = () => {
    resetForm()
    setIsAddModalOpen(true)
  }

  const renderItemCard = (item: PantryItem) => {
    const expiryInfo = getExpiryStatus(item.expirationDate)
    const hasAlert = activeAlerts.some((alert) => alert.itemId === item.id)

    return (
      <div
        key={item.id}
        className={`flex items-center justify-between p-4 rounded-lg border ${
          hasAlert ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {hasAlert && <AlertTriangle className="w-4 h-4 text-red-500" />}
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
            <Badge variant={expiryInfo.color as any} className="text-xs">
              {expiryInfo.text}
            </Badge>
            {item.barcode && (
              <Badge variant="secondary" className="text-xs font-mono">
                {item.barcode}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
            <span>Qty: {item.quantity}</span>
            <span>•</span>
            <span>{item.shelf}</span>
            <span>•</span>
                            <span>Exp: {new Date(item.expirationDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="border-orange-200 hover:bg-orange-50 bg-transparent"
            onClick={() => adjustQuantity(item.id, -1)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-200 hover:bg-orange-50 bg-transparent"
            onClick={() => adjustQuantity(item.id, 1)}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-200 hover:bg-orange-50 bg-transparent"
            onClick={() => openEditModal(item)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 hover:bg-red-50 bg-transparent text-red-600"
            onClick={() => handleDeleteItem(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-white shadow-sm border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Archive className="h-8 w-8 text-orange-500" />
              <h1 className="text-2xl font-bold text-gray-900 font-serif">Scanventory</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome to Scanventory</span>
            </div>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              <Archive className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
              <p className="text-xs text-gray-500">{uniqueItems} unique products</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{expiringItems}</div>
              <p className="text-xs text-gray-500">Within 7 days</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{lowStockItems}</div>
              <p className="text-xs text-gray-500">≤2 items remaining</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{activeAlerts.length}</div>
              <p className="text-xs text-gray-500">{criticalAlerts.length} critical</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8 border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
            <CardDescription>Manage your pantry inventory efficiently</CardDescription>
          </CardHeader>
                  <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              className="h-20 bg-orange-500 hover:bg-orange-600 text-white flex flex-col items-center justify-center space-y-2"
              onClick={() => openScanner("in")}
            >
              <Scan className="w-6 h-6" />
              <span>Scan Item In</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 border-orange-200 hover:bg-orange-50 flex flex-col items-center justify-center space-y-2 bg-transparent"
              onClick={() => openScanner("out")}
            >
              <Minus className="w-6 h-6 text-orange-600" />
              <span>Scan Item Out</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 border-orange-200 hover:bg-orange-50 flex flex-col items-center justify-center space-y-2 bg-transparent"
              onClick={openAddModal}
            >
              <Plus className="w-6 h-6 text-orange-600" />
              <span>Add Manually</span>
            </Button>
          </div>
        </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Pantry Organization</CardTitle>
                <CardDescription>Your items organized by location and shelf</CardDescription>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    className={
                      viewMode === "list"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "border-orange-200 hover:bg-orange-50 bg-transparent"
                    }
                    onClick={() => setViewMode("list")}
                  >
                    List View
                  </Button>
                  <Button
                    variant={viewMode === "shelves" ? "default" : "outline"}
                    size="sm"
                    className={
                      viewMode === "shelves"
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "border-orange-200 hover:bg-orange-50 bg-transparent"
                    }
                    onClick={() => setViewMode("shelves")}
                  >
                    Shelf View
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Shelf Area Filter */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedShelfArea === "all" ? "default" : "outline"}
                size="sm"
                className={
                  selectedShelfArea === "all"
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "border-orange-200 hover:bg-orange-50 bg-transparent"
                }
                onClick={() => setSelectedShelfArea("all")}
              >
                All Areas
              </Button>
              {Object.entries(SHELF_AREAS).map(([areaName, area]) => {
                const Icon = area.icon
                return (
                  <Button
                    key={areaName}
                    variant={selectedShelfArea === areaName ? "default" : "outline"}
                    size="sm"
                    className={
                      selectedShelfArea === areaName
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "border-orange-200 hover:bg-orange-50 bg-transparent"
                    }
                    onClick={() => setSelectedShelfArea(areaName)}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    {areaName}
                  </Button>
                )
              })}
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search items, categories, or shelves..."
                className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Inventory Display */}
            {viewMode === "list" ? (
              <div className="space-y-3">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Archive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No items found matching your criteria.</p>
                  </div>
                ) : (
                  filteredItems.map(renderItemCard)
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(SHELF_AREAS).map(([areaName, area]) => {
                  const areaItems = filteredItems.filter((item) => area.shelves.includes(item.shelf))
                  if (areaItems.length === 0 && selectedShelfArea !== "all" && selectedShelfArea !== areaName)
                    return null

                  const Icon = area.icon
                  const groupedItems = groupItemsByShelf(areaItems)

                  return (
                    <div key={areaName} className={`p-4 rounded-lg border-2 ${area.color}`}>
                      <div className="flex items-center space-x-3 mb-4">
                        <Icon className="w-6 h-6 text-gray-700" />
                        <h3 className="text-lg font-semibold text-gray-900">{areaName}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {areaItems.length} items
                        </Badge>
                      </div>

                      {areaItems.length === 0 ? (
                        <p className="text-gray-500 text-sm">No items in this area</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(groupedItems).map(([shelf, shelfItems]) => (
                            <div key={shelf} className="bg-white p-3 rounded-lg border border-gray-200">
                              <h4 className="font-medium text-gray-800 mb-2 text-sm">{shelf}</h4>
                              <div className="space-y-2">{shelfItems.map(renderItemCard)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add New Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Location *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                >
                  <option value="">Select a shelf</option>
                  {SHELVES.map((shelf) => (
                    <option key={shelf} value={shelf}>
                      {shelf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleAddItem}>
                Add Item
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-300 bg-transparent"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Edit Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number.parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shelf Location *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                >
                  <option value="">Select a shelf</option>
                  {SHELVES.map((shelf) => (
                    <option key={shelf} value={shelf}>
                      {shelf}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barcode (Optional)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" onClick={handleEditItem}>
                Update Item
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-300 bg-transparent"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      {isAlertsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Expiration Alerts</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAlertsModalOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No active alerts. Your pantry is well managed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeAlerts
                  .sort((a, b) => {
                    // Sort by severity: expired > critical > warning
                    const severityOrder = { expired: 0, critical: 1, warning: 2 }
                    return severityOrder[a.severity] - severityOrder[b.severity]
                  })
                  .map((alert) => {
                    const item = items.find((i) => i.id === alert.itemId)
                    if (!item) return null

                    return (
                      <div
                        key={alert.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          alert.severity === "expired"
                            ? "bg-red-50 border-red-500"
                            : alert.severity === "critical"
                              ? "bg-orange-50 border-orange-500"
                              : "bg-yellow-50 border-yellow-500"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <AlertTriangle
                                className={`w-4 h-4 ${
                                  alert.severity === "expired"
                                    ? "text-red-500"
                                    : alert.severity === "critical"
                                      ? "text-orange-500"
                                      : "text-yellow-500"
                                }`}
                              />
                              <h3 className="font-medium text-gray-900">{alert.itemName}</h3>
                              <Badge
                                variant={
                                  alert.severity === "expired"
                                    ? "destructive"
                                    : alert.severity === "critical"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-xs"
                              >
                                {alert.severity === "expired"
                                  ? "EXPIRED"
                                  : alert.severity === "critical"
                                    ? "CRITICAL"
                                    : "WARNING"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {alert.severity === "expired"
                                ? `Expired ${Math.abs(alert.daysUntilExpiry)} day(s) ago`
                                : `Expires in ${alert.daysUntilExpiry} day(s)`}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {item.shelf} • Qty: {item.quantity} • Exp:{" "}
                              {new Date(alert.expirationDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissAlert(alert.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {activeAlerts.length > 0 && (
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={dismissAllAlerts} className="border-gray-300 bg-transparent">
                  Dismiss All
                </Button>
                <Button
                  onClick={() => setIsAlertsModalOpen(false)}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{scanMode === "in" ? "Scan Item In" : "Scan Item Out"}</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsScannerOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center py-8">
              <Scan className="w-16 h-16 mx-auto mb-4 text-orange-500" />
              <p className="text-gray-600 mb-4">
                {scanMode === "in"
                  ? "Point your camera at a barcode to add items to your pantry"
                  : "Point your camera at a barcode to remove items from your pantry"}
              </p>

              {/* Demo Scanner - In a real app, this would be a camera component */}
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <p className="text-gray-500 text-sm mb-4">Camera view would appear here</p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => await handleBarcodeDetected("3017620422003")}
                  >
                    Demo: Scan Nutella
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => await handleBarcodeDetected("5000159407236")}
                  >
                    Demo: Scan Snickers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => await handleBarcodeDetected("3017620422003")}
                  >
                    Demo: Scan Ferrero Rocher
                  </Button>
                </div>
              </div>

              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">Or enter barcode manually:</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter barcode..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyPress={async (e) => {
                      if (e.key === "Enter" && e.currentTarget.value) {
                        await handleBarcodeDetected(e.currentTarget.value)
                        e.currentTarget.value = ""
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={async (e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      if (input.value) {
                        await handleBarcodeDetected(input.value)
                        input.value = ""
                      }
                    }}
                  >
                    Scan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
