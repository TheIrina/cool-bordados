"use client"

import { useCartDropdown } from "@features/layout/hooks/use-cart-dropdown"
import { CartDropdownView } from "@features/layout/ui/cart-dropdown-view"
import type { CartDropdownProps } from "@features/layout/types/cart-dropdown.types"

/**
 * CartDropdown — Mediator / Wrapper.
 *
 * Connects the Brain (useCartDropdown) with the Face (CartDropdownView).
 * Preserves the public import path `@modules/layout/components/cart-dropdown`.
 */
const CartDropdown = ({ cart }: CartDropdownProps) => {
  const dropdownState = useCartDropdown(cart)

  return <CartDropdownView {...dropdownState} cart={cart} />
}

export default CartDropdown
