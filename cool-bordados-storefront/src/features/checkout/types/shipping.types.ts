import type { HttpTypes } from "@medusajs/types"

// ---------------------------------------------------------------------------
// Extended shipping option — adds service_zone properties missing from base type
// ---------------------------------------------------------------------------

interface FulfillmentSetLocation {
  address: HttpTypes.StoreCartAddress
}

interface FulfillmentSet {
  type: "pickup" | "shipping"
  location?: FulfillmentSetLocation
}

interface ServiceZone {
  fulfillment_set?: FulfillmentSet
}

/** Extended shipping option that surfaces service_zone for pickup detection. */
export interface ExtendedShippingOption extends HttpTypes.StoreCartShippingOption {
  service_zone?: ServiceZone
}

// ---------------------------------------------------------------------------
// Component-level contracts
// ---------------------------------------------------------------------------

/** Props for the Shipping mediator (index.tsx). */
export interface ShippingProps {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

/** Return type of `useShipping` — the contract between Brain and Face. */
export interface UseShippingReturn {
  // State
  isOpen: boolean
  isLoading: boolean
  isLoadingPrices: boolean
  error: string | null
  shippingMethodId: string | null
  showPickupOptions: string
  calculatedPricesMap: Record<string, number>

  // Derived data
  shippingMethods: ExtendedShippingOption[]
  pickupMethods: ExtendedShippingOption[]
  hasPickupOptions: boolean

  // Actions
  handleEdit: () => void
  handleSubmit: () => void
  handleSetShippingMethod: (id: string, variant: "shipping" | "pickup") => Promise<void>
}

/** Props for the pure view component (shipping-view.tsx). */
export type ShippingViewProps = UseShippingReturn & {
  cart: HttpTypes.StoreCart
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const PICKUP_OPTION_ON = "__PICKUP_ON"
export const PICKUP_OPTION_OFF = "__PICKUP_OFF"
