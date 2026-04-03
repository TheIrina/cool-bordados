"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import { HttpTypes } from "@medusajs/types"
import type { ExtendedCart } from "@features/checkout/types/payment.types"
import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({ cart }: { cart: ExtendedCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Revisión
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Al hacer clic en el botón de Finalizar Compra, confirmas que has
                leído, comprendido y aceptado nuestros Términos de Uso, Términos de Venta y
                Política de Devoluciones y reconoces haber leído nuestra Política de Privacidad.
              </Text>
            </div>
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </>
      )}
    </div>
  )
}

export default Review
