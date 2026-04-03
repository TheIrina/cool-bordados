"use client"

import { RadioGroup } from "@headlessui/react"
import { isMercadopago, isContraEntrega, isStripe as isStripeFunc, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Button, Container, Heading, Text, clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { useMercadopagoFormData } from "../payment-form-provider"
import { Payment as MpPaymentBrick } from "@mercadopago/sdk-react"
import { StoreCart } from "@medusajs/types"
import Checkbox from "@modules/common/components/checkbox"
import ContraEntregaForm from "./contra-entrega-form"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: StoreCart
  availablePaymentMethods: any[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  useEffect(() => {
    if (activeSession?.provider_id) {
        setSelectedPaymentMethod(activeSession.provider_id)
    }
  }, [activeSession?.provider_id])
  const [termsAccepted, setTermsAccepted] = useState(false)

  const { setFormData, setAdditionalData, formData, additionalData, contraEntregaData } = useMercadopagoFormData();

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    console.log("Selected method:", method) // Log ANY selected method
    if (isStripeFunc(method) || isMercadopago(method) || isContraEntrega(method)) {
      console.log("Initiating session for:", method)
      await initiatePaymentSession(cart, {
        provider_id: method,
      }).catch((err) => {
        console.error("Error initiating payment session:", err)
        setError("Error al iniciar la sesión de pago. Por favor intenta nuevamente.")
      })
    }
  }

  const isCoEntrega = isContraEntrega(selectedPaymentMethod);
  const isMp = isMercadopago(selectedPaymentMethod);
  const isStripe = isStripeFunc(selectedPaymentMethod);

  const validateContraEntrega = () => {
    if (!termsAccepted) {
      setError("Debes aceptar los términos y condiciones para continuar.")
      return false
    }

    if (!contraEntregaData) {
      setError("Por favor completa el formulario de contra entrega.")
      return false
    }

    const { fullName, phone, email, address, postalCode, state } = contraEntregaData

    if (fullName.length < 5) {
      setError("El nombre completo debe tener al menos 5 caracteres")
      return false
    }

    if (!/^\d+$/.test(phone.replace(/\s/g, ""))) {
      setError("El teléfono debe contener solo números")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido")
      return false
    }

    if (!address) {
      setError("La dirección es obligatoria")
      return false
    }

    if (!/^\d+$/.test(postalCode)) {
      setError("El código postal debe ser numérico")
      return false
    }

    if (!state) {
      setError("El estado es obligatorio")
      return false
    }

    return true
  }

  const paidByGiftcard =
    (cart as any)?.gift_cards && (cart as any)?.gift_cards?.length > 0 && cart?.total === 0

  const paymentReady =
    (activeSession && cart?.shipping_methods?.length !== undefined && cart?.shipping_methods?.length !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    // setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeFunc(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (isCoEntrega) {
        const isValid = validateContraEntrega()
        
        if (!isValid) {
            setIsLoading(false)
            return
        }
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }

      if (isMp && !(window as any).paymentBrickController) {
        return;
      }

      if (isMp) {
        const additionalData = await (window as any).paymentBrickController!.getAdditionalData();
        const formData = await (window as any).paymentBrickController!.getFormData();
        if (additionalData) {
          setAdditionalData(additionalData);
        }
        if (!formData) {
          return;
        }
        setFormData(formData);
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    //@ts-ignore
    window?.paymentBrickController?.unmount()
  }, [selectedPaymentMethod])

  useEffect(() => {
    return () => {
      //@ts-ignore
      window?.paymentBrickController?.unmount()
    }
  }, [])

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Pago
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Editar
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeFunc(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                        <>
                          <PaymentContainer
                            paymentInfoMap={paymentInfoMap}
                            paymentProviderId={paymentMethod.id}
                            selectedPaymentOptionId={selectedPaymentMethod}
                          />
                          { console.log("paymentMethod.id: ",paymentMethod.id)}
                          {console.log("selectedPaymentMethod:", selectedPaymentMethod)}
                          {isContraEntrega(paymentMethod.id) && selectedPaymentMethod === paymentMethod.id && (
                            <div className="p-4 bg-ui-bg-subtle border border-t-0 rounded-b-rounded -mt-2 mb-4">
                                <ContraEntregaForm cart={cart} />
                                <div className="mt-4 flex items-center gap-x-2">
                                    <Checkbox 
                                    label="Acepto los términos y condiciones de pago contra entrega" 
                                    checked={termsAccepted}
                                    onChange={() => setTermsAccepted(!termsAccepted)}
                                    />
                                </div>
                            </div>
                          )}
                          {isMercadopago(paymentMethod.id) && selectedPaymentMethod === paymentMethod.id && (
                            <div className="p-4 bg-ui-bg-subtle border border-t-0 rounded-b-rounded -mt-2 mb-4">
                                <MpPaymentBrick
                                  initialization={{
                                    amount: (cart as any).amount || cart.total
                                  }}
                                  customization={{
                                    paymentMethods: { creditCard: "all", debitCard: "all" },
                                    visual: {
                                      hidePaymentButton: false,
                                      hideFormTitle: true,
                                    },
                                  }}
                                  onSubmit={async (param) => {
                                    // @ts-ignore
                                    const additionalData = await window.paymentBrickController!.getAdditionalData();
                                    // @ts-ignore
                                    const formData = await window.paymentBrickController!.getFormData();
                                    if (additionalData) {
                                      setAdditionalData(additionalData);
                                    }
                                    if (formData) {
                                      setFormData(formData);
                                      router.push(pathname + "?" + createQueryString("step", "review"), {
                                        scroll: false,
                                      })
                                    }
                                  }}
                                ></MpPaymentBrick>
                            </div>
                          )}
                        </>
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Método de pago
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Tarjeta de regalo
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          {!isMp && !isCoEntrega && (
            <Button
              size="large"
              className="mt-6"
              onClick={handleSubmit}
              isLoading={isLoading}
              disabled={
                (isStripe && !cardComplete) ||
                (!selectedPaymentMethod && !paidByGiftcard)
              }
              data-testid="submit-payment-button"
            >
              {!activeSession && isStripeFunc(selectedPaymentMethod)
                ? " Ingresar datos de tarjeta"
                : "Continuar a revisión"}
            </Button>
          )}

          {isCoEntrega && (
             <Button
                size="large"
                className="mt-6"
                onClick={handleSubmit}
                isLoading={isLoading}
                data-testid="submit-payment-button-contra-entrega"
            >
                Continuar a revisión
            </Button>
          )}
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Método de pago
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Detalles de pago
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeFunc(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : "Se mostrará otro paso"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Método de pago
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Tarjeta de regalo
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
