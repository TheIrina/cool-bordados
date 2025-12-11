"use server"

import { listProducts } from "@lib/data/products"

export async function searchProducts(query: string, countryCode: string) {
  const { response } = await listProducts({
    countryCode,
    queryParams: {
      q: query,
      limit: 6,
    },
  })

  return response.products
}
