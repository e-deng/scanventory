const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

// Types
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error! status: ${response.status}`,
      }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("API request failed:", error)
    return {
      success: false,
      error: "Network error. Please check your connection and try again.",
    }
  }
}

// Items API
export const itemsApi = {
  async getAll(params?: {
    shelf?: string
    category?: string
    search?: string
    sortBy?: string
    order?: string
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }

    const queryString = queryParams.toString()
    return apiRequest<any[]>(`/items${queryString ? `?${queryString}` : ""}`)
  },

  async getById(id: string): Promise<ApiResponse<any>> {
    if (!id) {
      return {
        success: false,
        error: "Item ID is required",
      }
    }
    return apiRequest<any>(`/items/${id}`)
  },

  async create(itemData: any): Promise<ApiResponse<any>> {
    if (!itemData.name) {
      return {
        success: false,
        error: "Item name is required",
      }
    }

    if (!itemData.expirationDate) {
      return {
        success: false,
        error: "Expiration date is required",
      }
    }

    return apiRequest<any>("/items", {
      method: "POST",
      body: JSON.stringify(itemData),
    })
  },

  async update(id: string, itemData: any): Promise<ApiResponse<any>> {
    if (!id) {
      return {
        success: false,
        error: "Item ID is required",
      }
    }

    return apiRequest<any>(`/items/${id}`, {
      method: "PUT",
      body: JSON.stringify(itemData),
    })
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      return {
        success: false,
        error: "Item ID is required",
      }
    }

    return apiRequest<void>(`/items/${id}`, {
      method: "DELETE",
    })
  },
}

// Alerts API
export const alertsApi = {
  async getAll(params?: {
    dismissed?: string
    severity?: string
  }): Promise<ApiResponse<any[]>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
    }

    const queryString = queryParams.toString()
    return apiRequest<any[]>(`/alerts${queryString ? `?${queryString}` : ""}`)
  },

  async dismiss(id: string): Promise<ApiResponse<any>> {
    if (!id) {
      return {
        success: false,
        error: "Alert ID is required",
      }
    }

    return apiRequest<any>(`/alerts/${id}/dismiss`, {
      method: "PUT",
    })
  },

  async dismissAll(): Promise<ApiResponse<any>> {
    return apiRequest<any>("/alerts/dismiss-all", {
      method: "PUT",
    })
  },
}
