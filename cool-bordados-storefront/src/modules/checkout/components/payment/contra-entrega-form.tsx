"use client"

import { StoreCart } from "@medusajs/types"
import { Button, Text, clx } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import { useEffect, useState } from "react"
import { useMercadopagoFormData } from "../payment-form-provider"

type ContraEntregaFormProps = {
  cart: StoreCart
}

const ContraEntregaForm = ({ cart }: ContraEntregaFormProps) => {
  const { setContraEntregaData, contraEntregaData } = useMercadopagoFormData()
  
  // Initialize state with cart data or existing context data
  const [formData, setFormData] = useState({
    fullName: contraEntregaData?.fullName || `${cart.shipping_address?.first_name || ""} ${cart.shipping_address?.last_name || ""}`.trim(),
    phone: contraEntregaData?.phone || cart.shipping_address?.phone || "",
    email: contraEntregaData?.email || cart.email || "",
    address: contraEntregaData?.address || cart.shipping_address?.address_1 || "",
    references: contraEntregaData?.references || cart.shipping_address?.address_2 || "",
    postalCode: contraEntregaData?.postalCode || cart.shipping_address?.postal_code || "",
    state: contraEntregaData?.state || cart.shipping_address?.province || "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validate = (data: typeof formData) => {
    const newErrors: Record<string, string> = {}

    if (data.fullName.length < 5) {
      newErrors.fullName = "El nombre completo debe tener al menos 5 caracteres"
    }

    if (!/^\d+$/.test(data.phone.replace(/\s/g, ""))) {
      newErrors.phone = "El teléfono debe contener solo números"
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Ingresa un correo electrónico válido"
    }

    if (!data.address) {
      newErrors.address = "La dirección es obligatoria"
    }

    if (!/^\d+$/.test(data.postalCode)) {
      newErrors.postalCode = "El código postal debe ser numérico"
    }

    if (!data.state) {
      newErrors.state = "El estado es obligatorio"
    }

    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newData = { ...formData, [name]: value }
    setFormData(newData)
    
    if (touched[name]) {
      const validationErrors = validate(newData)
      setErrors(validationErrors)
    }
    
    // Update context
    setContraEntregaData(newData)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched({ ...touched, [name]: true })
    const validationErrors = validate(formData)
    setErrors(validationErrors)
  }

  // Update context on mount/change
  useEffect(() => {
    setContraEntregaData(formData)
  }, [formData, setContraEntregaData])

  return (
    <div className="flex flex-col gap-y-4 mt-4">
      <Text className="txt-medium-plus text-ui-fg-base">
        Datos para Contra Entrega
      </Text>
      
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Nombre completo"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          errors={errors}
          touched={touched}
        />
        {errors.fullName && touched.fullName && (
          <Text className="text-rose-500 text-small-regular">{errors.fullName}</Text>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <Input
              label="Teléfono"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              errors={errors}
              touched={touched}
            />
            {errors.phone && touched.phone && (
              <Text className="text-rose-500 text-small-regular">{errors.phone}</Text>
            )}
          </div>
          <div className="flex flex-col">
            <Input
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              errors={errors}
              touched={touched}
            />
            {errors.email && touched.email && (
              <Text className="text-rose-500 text-small-regular">{errors.email}</Text>
            )}
          </div>
        </div>

        <Input
          label="Dirección completa (Calle, número, colonia)"
          name="address"
          value={formData.address}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          errors={errors}
          touched={touched}
        />
        {errors.address && touched.address && (
          <Text className="text-rose-500 text-small-regular">{errors.address}</Text>
        )}

        <Input
          label="Referencias adicionales"
          name="references"
          value={formData.references}
          onChange={handleChange}
          onBlur={handleBlur}
          errors={errors}
          touched={touched}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <Input
              label="Código Postal"
              name="postalCode"
              value={formData.postalCode}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              errors={errors}
              touched={touched}
            />
            {errors.postalCode && touched.postalCode && (
              <Text className="text-rose-500 text-small-regular">{errors.postalCode}</Text>
            )}
          </div>
          <div className="flex flex-col">
             <Input
              label="Estado"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              errors={errors}
              touched={touched}
              // readOnly // Depending on if we want to allow editing or strict preload
            />
            {errors.state && touched.state && (
              <Text className="text-rose-500 text-small-regular">{errors.state}</Text>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContraEntregaForm
