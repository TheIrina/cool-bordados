"use client"

import { usePayment } from "@features/checkout/hooks/use-payment"
import { PaymentView } from "@features/checkout/ui/payment-view"
import type { PaymentProps } from "@features/checkout/types/payment.types"

/**
 * Payment — Mediator / Wrapper (~15 lines).
 *
 * Connects the Brain (usePayment hook) with the Face (PaymentView).
 * This file exists solely to preserve the public import path
 * `@modules/checkout/components/payment` used by the Next.js router.
 */
const Payment = ({ cart, availablePaymentMethods }: PaymentProps) => {
  const paymentState = usePayment(cart)

  return (
    <PaymentView
      {...paymentState}
      cart={cart}
      availablePaymentMethods={availablePaymentMethods}
    />
  )
}

export default Payment
