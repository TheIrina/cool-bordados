"use client"

import { useShipping } from "@features/checkout/hooks/use-shipping"
import { ShippingView } from "@features/checkout/ui/shipping-view"
import type { ShippingProps } from "@features/checkout/types/shipping.types"

/**
 * Shipping — Mediator / Wrapper.
 *
 * Connects the Brain (useShipping hook) with the Face (ShippingView).
 * Preserves the public import path `@modules/checkout/components/shipping`.
 */
const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const shippingState = useShipping(cart, availableShippingMethods)

  return <ShippingView {...shippingState} cart={cart} />
}

export default Shipping
