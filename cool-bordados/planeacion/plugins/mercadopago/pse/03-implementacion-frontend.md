# Implementación Frontend - PSE con Mercado Pago

## 1. Arquitectura Frontend

### 1.1 Estructura de Componentes
```
src/
├── components/
│   └── checkout/
│       ├── PSEPaymentForm.tsx
│       ├── BankSelector.tsx
│       ├── DocumentForm.tsx
│       ├── PaymentStatus.tsx
│       └── PSERedirect.tsx
├── hooks/
│   ├── usePSEPayment.ts
│   ├── useBankList.ts
│   └── usePaymentStatus.ts
├── services/
│   ├── pseApi.ts
│   └── mercadopagoSdk.ts
├── types/
│   └── pse.ts
└── utils/
    ├── pseValidation.ts
    └── documentValidation.ts
```

### 1.2 Tipos TypeScript
```typescript
// src/types/pse.ts
export interface PSEFormData {
  document_type: DocumentType
  document_number: string
  bank_code: string
  bank_name: string
  entity_type: 'individual' | 'company'
  email: string
  phone?: string
}

export interface FinancialInstitution {
  id: string
  name: string
  processing_mode: string
  thumbnail: string
}

export interface PSEPaymentResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  redirect_url?: string
  transaction_details?: {
    external_resource_url: string
  }
}

export interface PaymentStatus {
  status: 'idle' | 'loading' | 'redirecting' | 'success' | 'error' | 'pending'
  message?: string
  error?: string
  redirect_url?: string
}

export type DocumentType = 'CC' | 'CE' | 'NIT' | 'PP'

export interface DocumentTypeOption {
  value: DocumentType
  label: string
  description: string
}
```

## 2. Servicios y APIs

### 2.1 Servicio PSE API
```typescript
// src/services/pseApi.ts
import axios from 'axios'
import { PSEFormData, FinancialInstitution, PSEPaymentResponse } from '../types/pse'

class PSEApiService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'http://localhost:9000'
  }

  async getFinancialInstitutions(): Promise<FinancialInstitution[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/store/pse/financial-institutions`)
      return response.data.financial_institutions
    } catch (error) {
      console.error('Error fetching financial institutions:', error)
      throw new Error('No se pudieron cargar los bancos disponibles')
    }
  }

  async validatePSEData(data: Partial<PSEFormData>): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await axios.post(`${this.baseUrl}/store/pse/validate`, data)
      return response.data
    } catch (error) {
      if (error.response?.data?.error) {
        return { valid: false, error: error.response.data.error }
      }
      throw new Error('Error validando datos PSE')
    }
  }

  async initiatePayment(cartId: string, pseData: PSEFormData): Promise<PSEPaymentResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/store/carts/${cartId}/payment-sessions`, {
        provider_id: 'mercadopago-pse',
        data: {
          pse_data: pseData
        }
      })
      return response.data.payment_session
    } catch (error) {
      console.error('Error initiating PSE payment:', error)
      throw new Error('Error al iniciar el pago PSE')
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PSEPaymentResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/store/payments/${paymentId}`)
      return response.data.payment
    } catch (error) {
      console.error('Error fetching payment status:', error)
      throw new Error('Error al consultar el estado del pago')
    }
  }
}

export const pseApiService = new PSEApiService()
```

### 2.2 Hook de Pago PSE
```typescript
// src/hooks/usePSEPayment.ts
import { useState, useCallback } from 'react'
import { useCart } from 'medusa-react'
import { pseApiService } from '../services/pseApi'
import { PSEFormData, PaymentStatus } from '../types/pse'

export const usePSEPayment = () => {
  const { cart } = useCart()
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' })

  const initiatePayment = useCallback(async (pseData: PSEFormData) => {
    if (!cart?.id) {
      throw new Error('No hay carrito disponible')
    }

    setPaymentStatus({ status: 'loading', message: 'Procesando pago...' })

    try {
      // Validar datos antes de enviar
      const validation = await pseApiService.validatePSEData(pseData)
      if (!validation.valid) {
        setPaymentStatus({ 
          status: 'error', 
          error: validation.error || 'Datos inválidos' 
        })
        return
      }

      // Iniciar pago
      const paymentResponse = await pseApiService.initiatePayment(cart.id, pseData)

      if (paymentResponse.redirect_url) {
        setPaymentStatus({
          status: 'redirecting',
          message: 'Redirigiendo al banco...',
          redirect_url: paymentResponse.redirect_url
        })
        
        // Redirigir después de un breve delay
        setTimeout(() => {
          window.location.href = paymentResponse.redirect_url!
        }, 2000)
      } else {
        setPaymentStatus({
          status: 'pending',
          message: 'Pago en proceso de verificación'
        })
      }

    } catch (error) {
      setPaymentStatus({
        status: 'error',
        error: error.message || 'Error procesando el pago'
      })
    }
  }, [cart?.id])

  const resetPaymentStatus = useCallback(() => {
    setPaymentStatus({ status: 'idle' })
  }, [])

  return {
    paymentStatus,
    initiatePayment,
    resetPaymentStatus,
    isLoading: paymentStatus.status === 'loading'
  }
}
```

### 2.3 Hook para Lista de Bancos
```typescript
// src/hooks/useBankList.ts
import { useState, useEffect } from 'react'
import { pseApiService } from '../services/pseApi'
import { FinancialInstitution } from '../types/pse'

export const useBankList = () => {
  const [banks, setBanks] = useState<FinancialInstitution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setLoading(true)
        const institutions = await pseApiService.getFinancialInstitutions()
        setBanks(institutions)
        setError(null)
      } catch (err) {
        setError(err.message || 'Error cargando bancos')
        setBanks([])
      } finally {
        setLoading(false)
      }
    }

    fetchBanks()
  }, [])

  return { banks, loading, error, refetch: () => fetchBanks() }
}
```

## 3. Componentes de UI

### 3.1 Formulario Principal PSE
```tsx
// src/components/checkout/PSEPaymentForm.tsx
import React, { useState } from 'react'
import { PSEFormData, DocumentType } from '../../types/pse'
import { usePSEPayment } from '../../hooks/usePSEPayment'
import { DocumentForm } from './DocumentForm'
import { BankSelector } from './BankSelector'
import { PaymentStatus } from './PaymentStatus'
import { validatePSEForm } from '../../utils/pseValidation'

interface PSEPaymentFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export const PSEPaymentForm: React.FC<PSEPaymentFormProps> = ({
  onSuccess,
  onError
}) => {
  const { paymentStatus, initiatePayment, isLoading } = usePSEPayment()
  const [formData, setFormData] = useState<PSEFormData>({
    document_type: 'CC',
    document_number: '',
    bank_code: '',
    bank_name: '',
    entity_type: 'individual',
    email: '',
    phone: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulario
    const validationErrors = validatePSEForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      await initiatePayment(formData)
      onSuccess?.()
    } catch (error) {
      onError?.(error.message)
    }
  }

  const handleFieldChange = (field: keyof PSEFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (paymentStatus.status !== 'idle') {
    return <PaymentStatus status={paymentStatus} />
  }

  return (
    <div className="pse-payment-form">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pago con PSE
        </h3>
        <p className="text-sm text-gray-600">
          Paga de forma segura desde tu cuenta bancaria
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de Persona */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Persona
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="entity_type"
                value="individual"
                checked={formData.entity_type === 'individual'}
                onChange={(e) => handleFieldChange('entity_type', e.target.value)}
                className="mr-2"
              />
              Persona Natural
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="entity_type"
                value="company"
                checked={formData.entity_type === 'company'}
                onChange={(e) => handleFieldChange('entity_type', e.target.value)}
                className="mr-2"
              />
              Persona Jurídica
            </label>
          </div>
        </div>

        {/* Formulario de Documento */}
        <DocumentForm
          documentType={formData.document_type}
          documentNumber={formData.document_number}
          entityType={formData.entity_type}
          onDocumentTypeChange={(type) => handleFieldChange('document_type', type)}
          onDocumentNumberChange={(number) => handleFieldChange('document_number', number)}
          errors={errors}
        />

        {/* Selector de Banco */}
        <BankSelector
          selectedBankCode={formData.bank_code}
          onBankSelect={(code, name) => {
            handleFieldChange('bank_code', code)
            handleFieldChange('bank_name', name)
          }}
          error={errors.bank_code}
        />

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo Electrónico *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="tu@email.com"
            required
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* Teléfono (Opcional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono (Opcional)
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+57 300 123 4567"
          />
        </div>

        {/* Botón de Pago */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Procesando...' : 'Pagar con PSE'}
        </button>
      </form>

      {/* Información de Seguridad */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Pago Seguro con PSE
            </h4>
            <p className="text-sm text-blue-700 mt-1">
              PSE es el sistema de pagos en línea más seguro de Colombia. 
              Serás redirigido al portal de tu banco para autorizar la transacción.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3.2 Selector de Banco
```tsx
// src/components/checkout/BankSelector.tsx
import React, { useState } from 'react'
import { useBankList } from '../../hooks/useBankList'
import { FinancialInstitution } from '../../types/pse'

interface BankSelectorProps {
  selectedBankCode: string
  onBankSelect: (code: string, name: string) => void
  error?: string
}

export const BankSelector: React.FC<BankSelectorProps> = ({
  selectedBankCode,
  onBankSelect,
  error
}) => {
  const { banks, loading, error: loadError } = useBankList()
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredBanks = banks.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedBank = banks.find(bank => bank.id === selectedBankCode)

  if (loading) {
    return (
      <div className="animate-pulse">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selecciona tu Banco *
        </label>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="text-red-500 text-sm">
        Error cargando bancos: {loadError}
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Selecciona tu Banco *
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 text-left border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {selectedBank ? (
            <div className="flex items-center">
              <img
                src={selectedBank.thumbnail}
                alt={selectedBank.name}
                className="w-6 h-6 mr-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              {selectedBank.name}
            </div>
          ) : (
            <span className="text-gray-500">Selecciona un banco</span>
          )}
          <svg
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {/* Buscador */}
            <div className="p-2 border-b">
              <input
                type="text"
                placeholder="Buscar banco..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Lista de Bancos */}
            <div className="max-h-48 overflow-y-auto">
              {filteredBanks.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No se encontraron bancos
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      onBankSelect(bank.id, bank.name)
                      setIsOpen(false)
                      setSearchTerm('')
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center"
                  >
                    <img
                      src={bank.thumbnail}
                      alt={bank.name}
                      className="w-6 h-6 mr-3"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <span className="text-sm">{bank.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  )
}
```

### 3.3 Formulario de Documento
```tsx
// src/components/checkout/DocumentForm.tsx
import React from 'react'
import { DocumentType } from '../../types/pse'
import { getDocumentTypeOptions } from '../../utils/documentValidation'

interface DocumentFormProps {
  documentType: DocumentType
  documentNumber: string
  entityType: 'individual' | 'company'
  onDocumentTypeChange: (type: DocumentType) => void
  onDocumentNumberChange: (number: string) => void
  errors: Record<string, string>
}

export const DocumentForm: React.FC<DocumentFormProps> = ({
  documentType,
  documentNumber,
  entityType,
  onDocumentTypeChange,
  onDocumentNumberChange,
  errors
}) => {
  const documentOptions = getDocumentTypeOptions(entityType)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tipo de Documento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Documento *
        </label>
        <select
          value={documentType}
          onChange={(e) => onDocumentTypeChange(e.target.value as DocumentType)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.document_type ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          {documentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.document_type && (
          <p className="text-red-500 text-xs mt-1">{errors.document_type}</p>
        )}
      </div>

      {/* Número de Documento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número de Documento *
        </label>
        <input
          type="text"
          value={documentNumber}
          onChange={(e) => {
            // Solo permitir números para CC, CE, NIT
            const value = documentType === 'PP' 
              ? e.target.value.toUpperCase()
              : e.target.value.replace(/\D/g, '')
            onDocumentNumberChange(value)
          }}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.document_number ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder={
            documentType === 'PP' 
              ? 'AB123456' 
              : documentType === 'NIT' 
                ? '900123456' 
                : '12345678'
          }
          maxLength={documentType === 'NIT' ? 10 : documentType === 'PP' ? 12 : 10}
        />
        {errors.document_number && (
          <p className="text-red-500 text-xs mt-1">{errors.document_number}</p>
        )}
        
        {/* Ayuda contextual */}
        <p className="text-xs text-gray-500 mt-1">
          {documentOptions.find(opt => opt.value === documentType)?.description}
        </p>
      </div>
    </div>
  )
}
```

### 3.4 Estado de Pago
```tsx
// src/components/checkout/PaymentStatus.tsx
import React from 'react'
import { PaymentStatus as PaymentStatusType } from '../../types/pse'

interface PaymentStatusProps {
  status: PaymentStatusType
}

export const PaymentStatus: React.FC<PaymentStatusProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        )
      case 'redirecting':
        return (
          <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        )
      case 'success':
        return (
          <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'pending':
        return (
          <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'loading':
      case 'redirecting':
        return 'border-blue-200 bg-blue-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'pending':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getStatusTitle = () => {
    switch (status.status) {
      case 'loading':
        return 'Procesando Pago'
      case 'redirecting':
        return 'Redirigiendo al Banco'
      case 'success':
        return 'Pago Exitoso'
      case 'error':
        return 'Error en el Pago'
      case 'pending':
        return 'Pago Pendiente'
      default:
        return ''
    }
  }

  return (
    <div className={`border-2 rounded-lg p-6 text-center ${getStatusColor()}`}>
      <div className="flex justify-center mb-4">
        {getStatusIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {getStatusTitle()}
      </h3>
      
      {status.message && (
        <p className="text-gray-700 mb-4">
          {status.message}
        </p>
      )}
      
      {status.error && (
        <p className="text-red-600 text-sm mb-4">
          {status.error}
        </p>
      )}

      {status.status === 'redirecting' && (
        <div className="mt-4">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="animate-pulse">●</div>
            <span>Preparando redirección...</span>
            <div className="animate-pulse">●</div>
          </div>
        </div>
      )}

      {status.status === 'pending' && (
        <div className="mt-4 p-3 bg-yellow-100 rounded-md">
          <p className="text-sm text-yellow-800">
            Tu pago está siendo procesado por el banco. 
            Recibirás una confirmación por email una vez se complete.
          </p>
        </div>
      )}

      {status.status === 'error' && (
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Intentar Nuevamente
          </button>
        </div>
      )}
    </div>
  )
}
```

## 4. Utilidades y Validaciones

### 4.1 Validación PSE
```typescript
// src/utils/pseValidation.ts
import { PSEFormData } from '../types/pse'

export const validatePSEForm = (data: PSEFormData): Record<string, string> => {
  const errors: Record<string, string> = {}

  // Validar tipo de documento
  if (!data.document_type) {
    errors.document_type = 'Selecciona un tipo de documento'
  }

  // Validar número de documento
  if (!data.document_number) {
    errors.document_number = 'Ingresa el número de documento'
  } else {
    const documentError = validateDocumentNumber(data.document_type, data.document_number)
    if (documentError) {
      errors.document_number = documentError
    }
  }

  // Validar banco
  if (!data.bank_code) {
    errors.bank_code = 'Selecciona un banco'
  }

  // Validar email
  if (!data.email) {
    errors.email = 'Ingresa tu correo electrónico'
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Ingresa un correo electrónico válido'
  }

  return errors
}

export const validateDocumentNumber = (type: string, number: string): string | null => {
  switch (type) {
    case 'CC': // Cédula de Ciudadanía
      if (!/^\d{6,10}$/.test(number)) {
        return 'La cédula debe tener entre 6 y 10 dígitos'
      }
      break
    case 'CE': // Cédula de Extranjería
      if (!/^\d{6,10}$/.test(number)) {
        return 'La cédula de extranjería debe tener entre 6 y 10 dígitos'
      }
      break
    case 'NIT': // Número de Identificación Tributaria
      if (!/^\d{9,10}$/.test(number)) {
        return 'El NIT debe tener entre 9 y 10 dígitos'
      }
      break
    case 'PP': // Pasaporte
      if (!/^[A-Z0-9]{6,12}$/.test(number)) {
        return 'El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos'
      }
      break
    default:
      return 'Tipo de documento no válido'
  }
  return null
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

### 4.2 Validación de Documentos
```typescript
// src/utils/documentValidation.ts
import { DocumentType, DocumentTypeOption } from '../types/pse'

export const getDocumentTypeOptions = (entityType: 'individual' | 'company'): DocumentTypeOption[] => {
  if (entityType === 'company') {
    return [
      {
        value: 'NIT',
        label: 'NIT',
        description: 'Número de Identificación Tributaria (9-10 dígitos)'
      }
    ]
  }

  return [
    {
      value: 'CC',
      label: 'Cédula de Ciudadanía',
      description: 'Documento de identidad colombiano (6-10 dígitos)'
    },
    {
      value: 'CE',
      label: 'Cédula de Extranjería',
      description: 'Documento para extranjeros residentes (6-10 dígitos)'
    },
    {
      value: 'PP',
      label: 'Pasaporte',
      description: 'Documento internacional (6-12 caracteres)'
    }
  ]
}

export const formatDocumentNumber = (type: DocumentType, number: string): string => {
  // Remover caracteres no válidos
  let cleaned = number.replace(/[^\w]/g, '')
  
  if (type === 'PP') {
    return cleaned.toUpperCase()
  }
  
  // Para documentos numéricos, solo números
  return cleaned.replace(/\D/g, '')
}

export const getDocumentMask = (type: DocumentType): string => {
  switch (type) {
    case 'CC':
    case 'CE':
      return '9999999999' // Máximo 10 dígitos
    case 'NIT':
      return '9999999999' // Máximo 10 dígitos
    case 'PP':
      return 'AAAAAAAAAAAA' // Máximo 12 caracteres
    default:
      return ''
  }
}
```

## 5. Integración con Checkout

### 5.1 Integración en el Checkout de Medusa
```tsx
// src/modules/checkout/components/payment/index.tsx
import React from 'react'
import { PaymentSession } from '@medusajs/medusa'
import { PSEPaymentForm } from '../../../../components/checkout/PSEPaymentForm'

interface PaymentContainerProps {
  paymentSession: PaymentSession
  selected: boolean
  setSelected: () => void
  disabled?: boolean
}

export const PSEPaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentSession,
  selected,
  setSelected,
  disabled = false
}) => {
  return (
    <div className={`border rounded-lg p-4 ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <input
            type="radio"
            checked={selected}
            onChange={setSelected}
            disabled={disabled}
            className="mr-3"
          />
          <div className="flex items-center">
            <img
              src="/icons/pse-logo.svg"
              alt="PSE"
              className="h-8 w-auto mr-3"
            />
            <div>
              <h3 className="font-medium text-gray-900">PSE - Pagos Seguros en Línea</h3>
              <p className="text-sm text-gray-600">Paga desde tu cuenta bancaria</p>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <div className="mt-4">
          <PSEPaymentForm
            onSuccess={() => {
              // Redirigir a página de confirmación
              window.location.href = '/order/confirmed'
            }}
            onError={(error) => {
              console.error('PSE Payment Error:', error)
              // Mostrar error al usuario
            }}
          />
        </div>
      )}
    </div>
  )
}
```

## 6. Manejo de Estados de Retorno

### 6.1 Página de Retorno PSE
```tsx
// src/pages/checkout/pse-return.tsx
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { pseApiService } from '../../services/pseApi'
import { PaymentStatus } from '../../components/checkout/PaymentStatus'

export default function PSEReturnPage() {
  const router = useRouter()
  const { payment_id, status } = router.query
  const [paymentStatus, setPaymentStatus] = useState({ status: 'loading' })

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!payment_id) return

      try {
        const payment = await pseApiService.getPaymentStatus(payment_id as string)
        
        switch (payment.status) {
          case 'approved':
            setPaymentStatus({
              status: 'success',
              message: '¡Pago exitoso! Tu pedido ha sido confirmado.'
            })
            // Redirigir a página de confirmación después de 3 segundos
            setTimeout(() => {
              router.push('/order/confirmed')
            }, 3000)
            break
            
          case 'pending':
            setPaymentStatus({
              status: 'pending',
              message: 'Tu pago está siendo procesado por el banco.'
            })
            break
            
          case 'rejected':
          case 'cancelled':
            setPaymentStatus({
              status: 'error',
              error: 'El pago fue rechazado o cancelado.',
              message: 'Puedes intentar con otro método de pago.'
            })
            break
            
          default:
            setPaymentStatus({
              status: 'error',
              error: 'Estado de pago desconocido.'
            })
        }
      } catch (error) {
        setPaymentStatus({
          status: 'error',
          error: 'Error verificando el estado del pago.'
        })
      }
    }

    checkPaymentStatus()
  }, [payment_id, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <PaymentStatus status={paymentStatus} />
        
        {paymentStatus.status === 'error' && (
          <div className="text-center">
            <button
              onClick={() => router.push('/checkout')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver al Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

## 7. Configuración y Variables de Entorno

### 7.1 Variables de Entorno Frontend
```bash
# .env.local
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-your-public-key
NEXT_PUBLIC_PSE_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=sandbox
```

### 7.2 Configuración de Build
```json
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_MEDUSA_BACKEND_URL: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL,
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
    NEXT_PUBLIC_PSE_ENABLED: process.env.NEXT_PUBLIC_PSE_ENABLED,
  },
  images: {
    domains: ['http2.mlstatic.com'], // Para logos de bancos de Mercado Pago
  },
}

module.exports = nextConfig
```

## 8. Testing Frontend

### 8.1 Tests Unitarios
```typescript
// src/components/checkout/__tests__/PSEPaymentForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PSEPaymentForm } from '../PSEPaymentForm'
import { usePSEPayment } from '../../../hooks/usePSEPayment'

// Mock del hook
jest.mock('../../../hooks/usePSEPayment')

describe('PSEPaymentForm', () => {
  const mockInitiatePayment = jest.fn()
  const mockUsePSEPayment = usePSEPayment as jest.MockedFunction<typeof usePSEPayment>

  beforeEach(() => {
    mockUsePSEPayment.mockReturnValue({
      paymentStatus: { status: 'idle' },
      initiatePayment: mockInitiatePayment,
      resetPaymentStatus: jest.fn(),
      isLoading: false
    })
  })

  it('renders form fields correctly', () => {
    render(<PSEPaymentForm />)
    
    expect(screen.getByText('Tipo de Persona')).toBeInTheDocument()
    expect(screen.getByText('Persona Natural')).toBeInTheDocument()
    expect(screen.getByText('Persona Jurídica')).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo Electrónico/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pagar con PSE/ })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<PSEPaymentForm />)
    
    const submitButton = screen.getByRole('button', { name: /Pagar con PSE/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Ingresa el número de documento/)).toBeInTheDocument()
      expect(screen.getByText(/Selecciona un banco/)).toBeInTheDocument()
      expect(screen.getByText(/Ingresa tu correo electrónico/)).toBeInTheDocument()
    })

    expect(mockInitiatePayment).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    render(<PSEPaymentForm />)
    
    // Llenar formulario
    fireEvent.change(screen.getByLabelText(/Número de Documento/), {
      target: { value: '12345678' }
    })
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/), {
      target: { value: 'test@example.com' }
    })
    
    // Simular selección de banco (esto requeriría más setup del mock)
    // ...

    const submitButton = screen.getByRole('button', { name: /Pagar con PSE/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInitiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          document_number: '12345678',
          email: 'test@example.com'
        })
      )
    })
  })
})
```

## 9. Optimización y Performance

### 9.1 Lazy Loading de Componentes
```typescript
// src/components/checkout/index.ts
import { lazy } from 'react'

export const PSEPaymentForm = lazy(() => 
  import('./PSEPaymentForm').then(module => ({ default: module.PSEPaymentForm }))
)

export const BankSelector = lazy(() => 
  import('./BankSelector').then(module => ({ default: module.BankSelector }))
)
```

### 9.2 Memoización de Componentes
```typescript
// src/components/checkout/BankSelector.tsx
import React, { memo } from 'react'

export const BankSelector = memo<BankSelectorProps>(({
  selectedBankCode,
  onBankSelect,
  error
}) => {
  // ... componente implementation
}, (prevProps, nextProps) => {
  return (
    prevProps.selectedBankCode === nextProps.selectedBankCode &&
    prevProps.error === nextProps.error
  )
})
```

## 10. Próximos Pasos

1. **Implementar componentes base**: Crear los componentes principales del formulario PSE
2. **Integrar con Medusa Checkout**: Conectar con el sistema de checkout existente
3. **Implementar manejo de estados**: Crear la lógica de estados de pago
4. **Testing**: Desarrollar tests unitarios y de integración
5. **Optimización**: Implementar lazy loading y memoización
6. **Documentación**: Crear guía de uso para desarrolladores

---

**Estado**: Guía Frontend Completada  
**Próximo Paso**: Estrategia de Testing  
**Estimación**: 3-4 semanas de desarrollo frontend