"use client"

import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import QuantitySelector from "@modules/products/components/product-actions/quantity-selector"
import ProductPrice from "@modules/products/components/product-price"
import MobileActions from "@modules/products/components/product-actions/mobile-actions"
import type { ProductActionsViewProps } from "../types/product-actions.types"

/**
 * ProductActionsView — "The Face" of the ProductActions feature.
 *
 * Purely presentational. Renders variant options, quantity selector,
 * price display, and add-to-cart button. Zero business logic.
 */
export const ProductActionsView = ({
  options,
  isAdding,
  quantity,
  selectedVariant,
  isValidVariant,
  inStock,
  maxQuantity,
  inView,
  actionsRef,
  setOptionValue,
  setQuantity,
  handleAddToCart,
  product,
  disabled,
}: ProductActionsViewProps) => {
  return (
    <>
      <div className="flex flex-col gap-y-4" ref={actionsRef}>
        {/* Quantity Selector */}
        <QuantitySelector
          quantity={quantity}
          onChange={setQuantity}
          max={maxQuantity}
          disabled={!!disabled || isAdding}
        />

        {/* Options/Sizes */}
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {/* Price Display */}
        <ProductPrice
          product={product}
          variant={selectedVariant}
          quantity={quantity}
        />

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Seleccionar variante"
            : !inStock || !isValidVariant
              ? "Agotado"
              : `Agregar ${quantity} al carrito`}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
