interface MedusaErrorResponse {
  response?: {
    data: { message?: string } | string
    status: number
    headers: Record<string, string>
  }
  config?: {
    url: string
    baseURL: string
  }
  request?: unknown
  message?: string
}

export default function medusaError(error: MedusaErrorResponse): never {
  if (error.response) {
    const u = new URL(error.config?.url ?? "", error.config?.baseURL ?? "")
    console.error("Resource:", u.toString())
    console.error("Response data:", error.response.data)
    console.error("Status code:", error.response.status)
    console.error("Headers:", error.response.headers)

    const data = error.response.data
    const message = typeof data === "string" ? data : data.message ?? "Unknown error"

    throw new Error(message.charAt(0).toUpperCase() + message.slice(1) + ".")
  } else if (error.request) {
    throw new Error("No response received: " + String(error.request))
  } else {
    throw new Error("Error setting up the request: " + (error.message ?? "Unknown"))
  }
}
