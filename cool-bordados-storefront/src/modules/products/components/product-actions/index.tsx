"use client"

import { useProductActions } from "@features/products/hooks/use-product-actions"
import { ProductActionsView } from "@features/products/ui/product-actions-view"
import type { ProductActionsProps } from "@features/products/types/product-actions.types"

/**
 * ProductActions — Mediator / Wrapper.
 *
 * Connects the Brain (useProductActions) with the Face (ProductActionsView).
 * Preserves the public import path `@modules/products/components/product-actions`.
 */
export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const actionsState = useProductActions(product)

  return (
    <ProductActionsView
      {...actionsState}
      product={product}
      disabled={disabled}
    />
  )
}
