"use client"

import { HttpTypes } from "@medusajs/types"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { UseCartDropdownReturn } from "../types/cart-dropdown.types"

/**
 * useCartDropdown — "The Brain" of the CartDropdown feature.
 *
 * Encapsulates dropdown open/close state, timed auto-open on cart
 * item changes, and derived totals.
 */
export function useCartDropdown(
  cart?: HttpTypes.StoreCart | null
): UseCartDropdownReturn {
  // ── State ────────────────────────────────────────────────────────────
  const [activeTimer, setActiveTimer] = useState<
    ReturnType<typeof setTimeout> | undefined
  >(undefined)
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  // ── Derived ──────────────────────────────────────────────────────────
  const totalItems =
    cart?.items?.reduce((acc, item) => {
      return acc + item.quantity
    }, 0) || 0

  const subtotal = cart?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems || 0)

  // ── Internal helpers ─────────────────────────────────────────────────
  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const timedOpen = () => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  const pathname = usePathname()

  // Auto-open dropdown when items change (except on cart page)
  useEffect(() => {
    if (itemRef.current !== totalItems && !pathname.includes("/cart")) {
      timedOpen()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalItems, itemRef.current])

  // ── Public API ───────────────────────────────────────────────────────
  return {
    cartDropdownOpen,
    totalItems,
    subtotal,
    openAndCancel,
    close,
  }
}
