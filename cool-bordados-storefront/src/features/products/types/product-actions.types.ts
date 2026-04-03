import type { HttpTypes } from "@medusajs/types"

// ---------------------------------------------------------------------------
// Component-level contracts
// ---------------------------------------------------------------------------

/** Props for the ProductActions mediator (index.tsx). */
export interface ProductActionsProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

/** A typed variant option (eliminates `varopt: any`). */
export interface VariantOption {
  option_id: string
  value: string
}

/** Return type of `useProductActions` — the contract between Brain and Face. */
export interface UseProductActionsReturn {
  // State
  options: Record<string, string | undefined>
  isAdding: boolean
  quantity: number

  // Derived
  selectedVariant: HttpTypes.StoreProductVariant | undefined
  isValidVariant: boolean
  inStock: boolean
  maxQuantity: number | undefined
  inView: boolean
  actionsRef: React.RefObject<HTMLDivElement | null>

  // Actions
  setOptionValue: (optionId: string, value: string) => void
  setQuantity: (quantity: number) => void
  handleAddToCart: () => Promise<void>
}

/** Props for the pure view component (product-actions-view.tsx). */
export type ProductActionsViewProps = UseProductActionsReturn & {
  product: HttpTypes.StoreProduct
  disabled?: boolean
}
