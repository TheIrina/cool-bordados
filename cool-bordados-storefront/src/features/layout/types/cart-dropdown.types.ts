import type { HttpTypes } from "@medusajs/types"

// ---------------------------------------------------------------------------
// Component-level contracts
// ---------------------------------------------------------------------------

/** Props for the CartDropdown mediator (index.tsx). */
export interface CartDropdownProps {
  cart?: HttpTypes.StoreCart | null
}

/** Return type of `useCartDropdown` — the contract between Brain and Face. */
export interface UseCartDropdownReturn {
  // State
  cartDropdownOpen: boolean
  totalItems: number
  subtotal: number

  // Actions
  openAndCancel: () => void
  close: () => void
}

/** Props for the pure view component (cart-dropdown-view.tsx). */
export type CartDropdownViewProps = UseCartDropdownReturn & {
  cart?: HttpTypes.StoreCart | null
}
