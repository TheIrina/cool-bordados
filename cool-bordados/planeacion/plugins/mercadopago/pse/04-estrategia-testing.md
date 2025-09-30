# Estrategia de Testing - PSE con Mercado Pago

## 1. Visión General de Testing

### 1.1 Objetivos de Testing
- **Funcionalidad**: Verificar que todos los flujos de pago PSE funcionen correctamente
- **Seguridad**: Validar que los datos sensibles se manejen de forma segura
- **Usabilidad**: Asegurar una experiencia de usuario fluida
- **Integración**: Confirmar la correcta comunicación entre componentes
- **Performance**: Validar tiempos de respuesta aceptables
- **Compatibilidad**: Verificar funcionamiento en diferentes dispositivos y navegadores

### 1.2 Tipos de Testing
```mermaid
graph TD
    A[Testing PSE] --> B[Unit Testing]
    A --> C[Integration Testing]
    A --> D[E2E Testing]
    A --> E[API Testing]
    A --> F[Security Testing]
    A --> G[Performance Testing]
    A --> H[Manual Testing]
```

## 2. Configuración del Entorno de Testing

### 2.1 Entornos de Testing
```yaml
# Configuración de entornos
environments:
  unit:
    description: "Testing unitario local"
    database: "sqlite_memory"
    external_apis: "mocked"
    
  integration:
    description: "Testing de integración"
    database: "postgresql_test"
    external_apis: "sandbox"
    
  e2e:
    description: "Testing end-to-end"
    database: "postgresql_staging"
    external_apis: "sandbox"
    frontend: "staging_build"
    
  staging:
    description: "Pre-producción"
    database: "postgresql_staging"
    external_apis: "sandbox"
    monitoring: "enabled"
```

### 2.2 Datos de Prueba PSE
```typescript
// tests/fixtures/pse-test-data.ts
export const PSE_TEST_DATA = {
  // Datos válidos para testing
  validPersonaNatural: {
    document_type: 'CC',
    document_number: '12345678',
    bank_code: '1007', // Bancolombia
    bank_name: 'Bancolombia',
    entity_type: 'individual' as const,
    email: 'test@example.com',
    phone: '+57 300 123 4567'
  },
  
  validPersonaJuridica: {
    document_type: 'NIT',
    document_number: '900123456',
    bank_code: '1019', // Scotiabank Colpatria
    bank_name: 'Scotiabank Colpatria',
    entity_type: 'company' as const,
    email: 'empresa@example.com'
  },
  
  // Datos inválidos para testing de validación
  invalidData: {
    emptyDocument: {
      document_type: 'CC',
      document_number: '',
      bank_code: '1007',
      entity_type: 'individual' as const,
      email: 'test@example.com'
    },
    
    invalidEmail: {
      document_type: 'CC',
      document_number: '12345678',
      bank_code: '1007',
      entity_type: 'individual' as const,
      email: 'invalid-email'
    },
    
    invalidDocumentLength: {
      document_type: 'CC',
      document_number: '123', // Muy corto
      bank_code: '1007',
      entity_type: 'individual' as const,
      email: 'test@example.com'
    }
  },
  
  // Respuestas simuladas de Mercado Pago
  mercadoPagoResponses: {
    paymentApproved: {
      id: 'test_payment_123',
      status: 'approved',
      transaction_amount: 50000,
      transaction_details: {
        external_resource_url: 'https://sandbox.mercadopago.com.co/pse/redirect/test_123'
      }
    },
    
    paymentPending: {
      id: 'test_payment_456',
      status: 'pending',
      transaction_amount: 75000,
      transaction_details: {
        external_resource_url: 'https://sandbox.mercadopago.com.co/pse/redirect/test_456'
      }
    },
    
    paymentRejected: {
      id: 'test_payment_789',
      status: 'rejected',
      status_detail: 'cc_rejected_insufficient_amount',
      transaction_amount: 100000
    }
  }
}

// Bancos de prueba
export const TEST_BANKS = [
  {
    id: '1007',
    name: 'Bancolombia',
    processing_mode: 'aggregator',
    thumbnail: 'https://http2.mlstatic.com/storage/logos-api-admin/bancolombia.png'
  },
  {
    id: '1019',
    name: 'Scotiabank Colpatria',
    processing_mode: 'aggregator',
    thumbnail: 'https://http2.mlstatic.com/storage/logos-api-admin/colpatria.png'
  },
  {
    id: '1040',
    name: 'Banco Agrario',
    processing_mode: 'aggregator',
    thumbnail: 'https://http2.mlstatic.com/storage/logos-api-admin/banco-agrario.png'
  }
]
```

## 3. Unit Testing

### 3.1 Testing de Servicios Backend
```typescript
// tests/unit/services/pse-payment.test.ts
import { PSEPaymentService } from '../../../src/modules/pse-payment/service'
import { PSE_TEST_DATA } from '../../fixtures/pse-test-data'

describe('PSEPaymentService', () => {
  let pseService: PSEPaymentService
  let mockMercadoPagoAPI: jest.Mocked<any>

  beforeEach(() => {
    mockMercadoPagoAPI = {
      getPaymentMethods: jest.fn(),
      createPayment: jest.fn(),
      getPayment: jest.fn()
    }
    
    pseService = new PSEPaymentService({}, {
      access_token: 'test_token',
      sandbox: true
    })
    
    // Inyectar mock
    pseService['mercadoPagoAPI'] = mockMercadoPagoAPI
  })

  describe('getFinancialInstitutions', () => {
    it('should return list of financial institutions', async () => {
      mockMercadoPagoAPI.getPaymentMethods.mockResolvedValue([
        {
          id: 'pse',
          financial_institutions: TEST_BANKS
        }
      ])

      const institutions = await pseService.getFinancialInstitutions()
      
      expect(institutions).toHaveLength(3)
      expect(institutions[0]).toHaveProperty('id', '1007')
      expect(institutions[0]).toHaveProperty('name', 'Bancolombia')
    })

    it('should handle empty financial institutions', async () => {
      mockMercadoPagoAPI.getPaymentMethods.mockResolvedValue([
        { id: 'pse', financial_institutions: [] }
      ])

      const institutions = await pseService.getFinancialInstitutions()
      
      expect(institutions).toEqual([])
    })
  })

  describe('validatePSEData', () => {
    it('should validate correct PSE data', async () => {
      const result = await pseService.validatePSEData(PSE_TEST_DATA.validPersonaNatural)
      
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid document type', async () => {
      const invalidData = {
        ...PSE_TEST_DATA.validPersonaNatural,
        document_type: 'INVALID' as any
      }
      
      const result = await pseService.validatePSEData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Tipo de documento inválido')
    })

    it('should reject invalid document number for CC', async () => {
      const invalidData = {
        ...PSE_TEST_DATA.validPersonaNatural,
        document_number: '123' // Muy corto
      }
      
      const result = await pseService.validatePSEData(invalidData)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('debe tener entre 6 y 10 dígitos')
    })
  })

  describe('initiatePayment', () => {
    it('should create payment successfully', async () => {
      mockMercadoPagoAPI.createPayment.mockResolvedValue(
        PSE_TEST_DATA.mercadoPagoResponses.paymentPending
      )

      const result = await pseService.initiatePayment({
        amount: 50000,
        currency_code: 'COP',
        session_id: 'test_session_123',
        context: {
          email: 'test@example.com',
          pse_data: PSE_TEST_DATA.validPersonaNatural
        }
      })

      expect(result.session_data.id).toBe('test_payment_456')
      expect(result.session_data.status).toBe('pending')
      expect(mockMercadoPagoAPI.createPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          transaction_amount: 50000,
          payment_method_id: 'pse',
          payer: expect.objectContaining({
            email: 'test@example.com',
            identification: {
              type: 'CC',
              number: '12345678'
            }
          })
        })
      )
    })

    it('should throw error for invalid PSE data', async () => {
      await expect(
        pseService.initiatePayment({
          amount: 50000,
          currency_code: 'COP',
          session_id: 'test_session_123',
          context: {
            email: 'test@example.com',
            pse_data: PSE_TEST_DATA.invalidData.emptyDocument
          }
        })
      ).rejects.toThrow('Número de documento inválido')
    })
  })

  describe('getWebhookActionAndData', () => {
    it('should handle approved payment webhook', async () => {
      mockMercadoPagoAPI.getPayment.mockResolvedValue(
        PSE_TEST_DATA.mercadoPagoResponses.paymentApproved
      )

      const result = await pseService.getWebhookActionAndData({
        payload: {
          data: { id: 'test_payment_123' },
          rawData: Buffer.from('{}'),
          headers: {}
        }
      })

      expect(result.action).toBe('captured')
      expect(result.data.amount.toNumber()).toBe(50000)
    })

    it('should handle rejected payment webhook', async () => {
      mockMercadoPagoAPI.getPayment.mockResolvedValue(
        PSE_TEST_DATA.mercadoPagoResponses.paymentRejected
      )

      const result = await pseService.getWebhookActionAndData({
        payload: {
          data: { id: 'test_payment_789' },
          rawData: Buffer.from('{}'),
          headers: {}
        }
      })

      expect(result.action).toBe('failed')
      expect(result.data.error).toBe('cc_rejected_insufficient_amount')
    })
  })
})
```

### 3.2 Testing de Componentes Frontend
```typescript
// tests/unit/components/PSEPaymentForm.test.tsx
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PSEPaymentForm } from '../../../src/components/checkout/PSEPaymentForm'
import { usePSEPayment } from '../../../src/hooks/usePSEPayment'
import { useBankList } from '../../../src/hooks/useBankList'
import { PSE_TEST_DATA, TEST_BANKS } from '../../fixtures/pse-test-data'

// Mocks
jest.mock('../../../src/hooks/usePSEPayment')
jest.mock('../../../src/hooks/useBankList')

const mockUsePSEPayment = usePSEPayment as jest.MockedFunction<typeof usePSEPayment>
const mockUseBankList = useBankList as jest.MockedFunction<typeof useBankList>

describe('PSEPaymentForm', () => {
  const mockInitiatePayment = jest.fn()
  const mockOnSuccess = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    mockUsePSEPayment.mockReturnValue({
      paymentStatus: { status: 'idle' },
      initiatePayment: mockInitiatePayment,
      resetPaymentStatus: jest.fn(),
      isLoading: false
    })

    mockUseBankList.mockReturnValue({
      banks: TEST_BANKS,
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    jest.clearAllMocks()
  })

  it('renders all form fields', () => {
    render(<PSEPaymentForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    expect(screen.getByText('Tipo de Persona')).toBeInTheDocument()
    expect(screen.getByText('Persona Natural')).toBeInTheDocument()
    expect(screen.getByText('Persona Jurídica')).toBeInTheDocument()
    expect(screen.getByLabelText(/Tipo de Documento/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Número de Documento/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Selecciona tu Banco/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo Electrónico/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pagar con PSE/ })).toBeInTheDocument()
  })

  it('validates required fields on submit', async () => {
    const user = userEvent.setup()
    render(<PSEPaymentForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    const submitButton = screen.getByRole('button', { name: /Pagar con PSE/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/Ingresa el número de documento/)).toBeInTheDocument()
      expect(screen.getByText(/Selecciona un banco/)).toBeInTheDocument()
      expect(screen.getByText(/Ingresa tu correo electrónico/)).toBeInTheDocument()
    })

    expect(mockInitiatePayment).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    render(<PSEPaymentForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    // Llenar formulario
    const documentInput = screen.getByLabelText(/Número de Documento/)
    await user.type(documentInput, '12345678')

    const emailInput = screen.getByLabelText(/Correo Electrónico/)
    await user.type(emailInput, 'test@example.com')

    // Simular selección de banco
    const bankSelector = screen.getByLabelText(/Selecciona tu Banco/)
    await user.click(bankSelector)
    
    const bancolombia = screen.getByText('Bancolombia')
    await user.click(bancolombia)

    const submitButton = screen.getByRole('button', { name: /Pagar con PSE/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockInitiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({
          document_type: 'CC',
          document_number: '12345678',
          bank_code: '1007',
          bank_name: 'Bancolombia',
          entity_type: 'individual',
          email: 'test@example.com'
        })
      )
    })
  })

  it('shows loading state during payment processing', () => {
    mockUsePSEPayment.mockReturnValue({
      paymentStatus: { status: 'loading', message: 'Procesando pago...' },
      initiatePayment: mockInitiatePayment,
      resetPaymentStatus: jest.fn(),
      isLoading: true
    })

    render(<PSEPaymentForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    expect(screen.getByText('Procesando pago...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pagar con PSE/ })).not.toBeInTheDocument()
  })

  it('validates document number format for different document types', async () => {
    const user = userEvent.setup()
    render(<PSEPaymentForm onSuccess={mockOnSuccess} onError={mockOnError} />)

    // Cambiar a NIT
    const nitRadio = screen.getByDisplayValue('company')
    await user.click(nitRadio)

    const documentInput = screen.getByLabelText(/Número de Documento/)
    await user.type(documentInput, '123') // NIT muy corto

    const submitButton = screen.getByRole('button', { name: /Pagar con PSE/ })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/debe tener entre 9 y 10 dígitos/)).toBeInTheDocument()
    })
  })
})
```

## 4. Integration Testing

### 4.1 Testing de API Endpoints
```typescript
// tests/integration/api/pse.test.ts
import request from 'supertest'
import { createApp } from '../../../src/app'
import { PSE_TEST_DATA, TEST_BANKS } from '../../fixtures/pse-test-data'

describe('PSE API Endpoints', () => {
  let app: any
  let mockMercadoPagoAPI: jest.Mocked<any>

  beforeAll(async () => {
    app = await createApp({ test: true })
  })

  beforeEach(() => {
    // Mock Mercado Pago API
    mockMercadoPagoAPI = {
      getPaymentMethods: jest.fn().mockResolvedValue([
        { id: 'pse', financial_institutions: TEST_BANKS }
      ]),
      createPayment: jest.fn(),
      getPayment: jest.fn()
    }
  })

  describe('GET /store/pse/financial-institutions', () => {
    it('should return list of financial institutions', async () => {
      const response = await request(app)
        .get('/store/pse/financial-institutions')
        .expect(200)

      expect(response.body).toHaveProperty('financial_institutions')
      expect(response.body.financial_institutions).toHaveLength(3)
      expect(response.body.financial_institutions[0]).toHaveProperty('id', '1007')
      expect(response.body.financial_institutions[0]).toHaveProperty('name', 'Bancolombia')
    })

    it('should handle API errors gracefully', async () => {
      mockMercadoPagoAPI.getPaymentMethods.mockRejectedValue(
        new Error('API Error')
      )

      const response = await request(app)
        .get('/store/pse/financial-institutions')
        .expect(500)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Error al obtener instituciones financieras')
    })
  })

  describe('POST /store/pse/validate', () => {
    it('should validate correct PSE data', async () => {
      const response = await request(app)
        .post('/store/pse/validate')
        .send(PSE_TEST_DATA.validPersonaNatural)
        .expect(200)

      expect(response.body).toHaveProperty('valid', true)
      expect(response.body).toHaveProperty('message', 'Datos PSE válidos')
    })

    it('should reject invalid document type', async () => {
      const invalidData = {
        ...PSE_TEST_DATA.validPersonaNatural,
        document_type: 'INVALID'
      }

      const response = await request(app)
        .post('/store/pse/validate')
        .send(invalidData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toContain('Tipo de documento inválido')
    })

    it('should reject empty document number', async () => {
      const response = await request(app)
        .post('/store/pse/validate')
        .send(PSE_TEST_DATA.invalidData.emptyDocument)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /webhooks/mercadopago/pse', () => {
    it('should process approved payment webhook', async () => {
      mockMercadoPagoAPI.getPayment.mockResolvedValue(
        PSE_TEST_DATA.mercadoPagoResponses.paymentApproved
      )

      const webhookPayload = {
        id: 'test_payment_123',
        type: 'payment',
        data: { id: 'test_payment_123' }
      }

      const response = await request(app)
        .post('/webhooks/mercadopago/pse')
        .send(webhookPayload)
        .set('x-signature', 'valid_signature')
        .expect(200)

      expect(response.body).toHaveProperty('received', true)
    })

    it('should reject invalid webhook signature', async () => {
      const webhookPayload = {
        id: 'test_payment_123',
        type: 'payment',
        data: { id: 'test_payment_123' }
      }

      const response = await request(app)
        .post('/webhooks/mercadopago/pse')
        .send(webhookPayload)
        .set('x-signature', 'invalid_signature')
        .expect(401)

      expect(response.body).toHaveProperty('error', 'Webhook signature inválida')
    })
  })
})
```

### 4.2 Testing de Flujo Completo
```typescript
// tests/integration/pse-flow.test.ts
import { PSEPaymentService } from '../../src/modules/pse-payment/service'
import { PSE_TEST_DATA } from '../fixtures/pse-test-data'

describe('PSE Payment Flow Integration', () => {
  let pseService: PSEPaymentService

  beforeEach(() => {
    pseService = new PSEPaymentService({}, {
      access_token: process.env.MERCADOPAGO_TEST_ACCESS_TOKEN,
      sandbox: true
    })
  })

  it('should complete full PSE payment flow', async () => {
    // 1. Obtener instituciones financieras
    const institutions = await pseService.getFinancialInstitutions()
    expect(institutions.length).toBeGreaterThan(0)

    // 2. Validar datos PSE
    const validation = await pseService.validatePSEData(PSE_TEST_DATA.validPersonaNatural)
    expect(validation.valid).toBe(true)

    // 3. Iniciar pago
    const paymentResponse = await pseService.initiatePayment({
      amount: 50000,
      currency_code: 'COP',
      session_id: 'test_session_integration',
      context: {
        email: 'integration@test.com',
        pse_data: PSE_TEST_DATA.validPersonaNatural
      }
    })

    expect(paymentResponse.session_data).toHaveProperty('id')
    expect(paymentResponse.session_data).toHaveProperty('status')
    expect(['pending', 'approved']).toContain(paymentResponse.session_data.status)

    // 4. Simular webhook (si el pago está pendiente)
    if (paymentResponse.session_data.status === 'pending') {
      const webhookResult = await pseService.getWebhookActionAndData({
        payload: {
          data: { id: paymentResponse.session_data.id },
          rawData: Buffer.from('{}'),
          headers: {}
        }
      })

      expect(['authorized', 'captured', 'failed']).toContain(webhookResult.action)
    }
  }, 30000) // Timeout extendido para llamadas reales a la API
})
```

## 5. End-to-End Testing

### 5.1 Configuración E2E con Playwright
```typescript
// tests/e2e/pse-payment.spec.ts
import { test, expect } from '@playwright/test'
import { PSE_TEST_DATA } from '../fixtures/pse-test-data'

test.describe('PSE Payment E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de checkout
    await page.goto('/checkout')
    
    // Agregar producto al carrito si es necesario
    await page.click('[data-testid="add-to-cart"]')
    await page.waitForSelector('[data-testid="checkout-form"]')
  })

  test('should complete PSE payment flow successfully', async ({ page }) => {
    // 1. Seleccionar método de pago PSE
    await page.click('[data-testid="payment-method-pse"]')
    await expect(page.locator('[data-testid="pse-form"]')).toBeVisible()

    // 2. Llenar formulario PSE
    await page.selectOption('[data-testid="document-type"]', 'CC')
    await page.fill('[data-testid="document-number"]', PSE_TEST_DATA.validPersonaNatural.document_number)
    await page.fill('[data-testid="email"]', PSE_TEST_DATA.validPersonaNatural.email)

    // 3. Seleccionar banco
    await page.click('[data-testid="bank-selector"]')
    await page.click('[data-testid="bank-option-1007"]') // Bancolombia

    // 4. Enviar formulario
    await page.click('[data-testid="submit-pse-payment"]')

    // 5. Verificar estado de carga
    await expect(page.locator('[data-testid="payment-loading"]')).toBeVisible()

    // 6. Verificar redirección (o estado pendiente)
    await page.waitForSelector('[data-testid="payment-status"]', { timeout: 10000 })
    
    const status = await page.textContent('[data-testid="payment-status"]')
    expect(['Redirigiendo al banco', 'Pago en proceso']).toContain(status)
  })

  test('should show validation errors for invalid data', async ({ page }) => {
    // Seleccionar método de pago PSE
    await page.click('[data-testid="payment-method-pse"]')

    // Intentar enviar formulario vacío
    await page.click('[data-testid="submit-pse-payment"]')

    // Verificar errores de validación
    await expect(page.locator('[data-testid="error-document-number"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-bank"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible()
  })

  test('should handle bank selection correctly', async ({ page }) => {
    await page.click('[data-testid="payment-method-pse"]')

    // Abrir selector de banco
    await page.click('[data-testid="bank-selector"]')
    await expect(page.locator('[data-testid="bank-list"]')).toBeVisible()

    // Buscar banco
    await page.fill('[data-testid="bank-search"]', 'Bancolombia')
    await expect(page.locator('[data-testid="bank-option-1007"]')).toBeVisible()

    // Seleccionar banco
    await page.click('[data-testid="bank-option-1007"]')
    await expect(page.locator('[data-testid="selected-bank"]')).toContainText('Bancolombia')
  })

  test('should work on mobile devices', async ({ page }) => {
    // Simular dispositivo móvil
    await page.setViewportSize({ width: 375, height: 667 })

    await page.click('[data-testid="payment-method-pse"]')

    // Verificar que el formulario sea responsive
    await expect(page.locator('[data-testid="pse-form"]')).toBeVisible()
    
    // Verificar que los campos sean accesibles en móvil
    const documentInput = page.locator('[data-testid="document-number"]')
    await expect(documentInput).toBeVisible()
    
    const boundingBox = await documentInput.boundingBox()
    expect(boundingBox?.height).toBeGreaterThan(40) // Altura mínima para touch
  })
})
```

### 5.2 Testing de Compatibilidad Cross-Browser
```typescript
// tests/e2e/cross-browser.spec.ts
import { test, devices } from '@playwright/test'

const browsers = [
  { name: 'Chrome', ...devices['Desktop Chrome'] },
  { name: 'Firefox', ...devices['Desktop Firefox'] },
  { name: 'Safari', ...devices['Desktop Safari'] },
  { name: 'Mobile Chrome', ...devices['Pixel 5'] },
  { name: 'Mobile Safari', ...devices['iPhone 12'] }
]

browsers.forEach(({ name, ...device }) => {
  test.describe(`PSE Payment - ${name}`, () => {
    test.use(device)

    test('should load PSE form correctly', async ({ page }) => {
      await page.goto('/checkout')
      await page.click('[data-testid="payment-method-pse"]')
      
      await expect(page.locator('[data-testid="pse-form"]')).toBeVisible()
      await expect(page.locator('[data-testid="document-type"]')).toBeVisible()
      await expect(page.locator('[data-testid="bank-selector"]')).toBeVisible()
    })
  })
})
```

## 6. Performance Testing

### 6.1 Testing de Carga de APIs
```typescript
// tests/performance/api-load.test.ts
import { performance } from 'perf_hooks'
import { PSEPaymentService } from '../../src/modules/pse-payment/service'

describe('PSE API Performance', () => {
  let pseService: PSEPaymentService

  beforeEach(() => {
    pseService = new PSEPaymentService({}, {
      access_token: process.env.MERCADOPAGO_TEST_ACCESS_TOKEN,
      sandbox: true
    })
  })

  test('getFinancialInstitutions should respond within 2 seconds', async () => {
    const start = performance.now()
    
    await pseService.getFinancialInstitutions()
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeLessThan(2000) // 2 segundos
  })

  test('validatePSEData should respond within 100ms', async () => {
    const start = performance.now()
    
    await pseService.validatePSEData({
      document_type: 'CC',
      document_number: '12345678',
      bank_code: '1007',
      entity_type: 'individual'
    })
    
    const end = performance.now()
    const duration = end - start
    
    expect(duration).toBeLessThan(100) // 100ms
  })

  test('should handle concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, () => 
      pseService.getFinancialInstitutions()
    )

    const start = performance.now()
    const results = await Promise.all(promises)
    const end = performance.now()

    expect(results).toHaveLength(10)
    expect(end - start).toBeLessThan(5000) // 5 segundos para 10 requests concurrentes
  })
})
```

### 6.2 Testing de Performance Frontend
```typescript
// tests/performance/frontend-performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('PSE Frontend Performance', () => {
  test('should load PSE form within performance budget', async ({ page }) => {
    // Iniciar medición de performance
    await page.goto('/checkout')
    
    const startTime = Date.now()
    await page.click('[data-testid="payment-method-pse"]')
    await page.waitForSelector('[data-testid="pse-form"]')
    const endTime = Date.now()

    const loadTime = endTime - startTime
    expect(loadTime).toBeLessThan(1000) // 1 segundo
  })

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/checkout')
    
    // Medir métricas de performance
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals = {}
          
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              vitals.fcp = entry.startTime
            }
            if (entry.name === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            }
          })
          
          resolve(vitals)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
      })
    })

    expect(metrics.fcp).toBeLessThan(1800) // FCP < 1.8s
    expect(metrics.lcp).toBeLessThan(2500) // LCP < 2.5s
  })
})
```

## 7. Security Testing

### 7.1 Testing de Validación de Datos
```typescript
// tests/security/data-validation.test.ts
import { PSEPaymentService } from '../../src/modules/pse-payment/service'

describe('PSE Security - Data Validation', () => {
  let pseService: PSEPaymentService

  beforeEach(() => {
    pseService = new PSEPaymentService({}, {
      access_token: 'test_token',
      sandbox: true
    })
  })

  test('should sanitize malicious input', async () => {
    const maliciousData = {
      document_type: 'CC',
      document_number: '<script>alert("xss")</script>12345678',
      bank_code: '1007',
      entity_type: 'individual'
    }

    const result = await pseService.validatePSEData(maliciousData)
    
    // El número de documento debería estar sanitizado
    expect(result.valid).toBe(false)
    expect(result.error).toContain('inválido')
  })

  test('should reject SQL injection attempts', async () => {
    const sqlInjectionData = {
      document_type: 'CC',
      document_number: "'; DROP TABLE users; --",
      bank_code: '1007',
      entity_type: 'individual'
    }

    const result = await pseService.validatePSEData(sqlInjectionData)
    expect(result.valid).toBe(false)
  })

  test('should validate webhook signatures', async () => {
    const validSignature = 'valid_signature_hash'
    const invalidSignature = 'invalid_signature'
    
    const payload = { id: 'test_payment_123' }

    const validResult = await pseService.validateWebhookSignature(payload, validSignature)
    const invalidResult = await pseService.validateWebhookSignature(payload, invalidSignature)

    expect(validResult).toBe(true)
    expect(invalidResult).toBe(false)
  })
})
```

### 7.2 Testing de Autorización
```typescript
// tests/security/authorization.test.ts
import request from 'supertest'
import { createApp } from '../../src/app'

describe('PSE Security - Authorization', () => {
  let app: any

  beforeAll(async () => {
    app = await createApp({ test: true })
  })

  test('should require authentication for sensitive endpoints', async () => {
    await request(app)
      .post('/admin/pse/transactions')
      .expect(401)
  })

  test('should validate API keys', async () => {
    await request(app)
      .get('/store/pse/financial-institutions')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401)
  })

  test('should rate limit webhook endpoints', async () => {
    const webhookPayload = {
      id: 'test_payment_123',
      type: 'payment',
      data: { id: 'test_payment_123' }
    }

    // Hacer múltiples requests rápidos
    const promises = Array.from({ length: 20 }, () =>
      request(app)
        .post('/webhooks/mercadopago/pse')
        .send(webhookPayload)
    )

    const responses = await Promise.all(promises)
    
    // Algunos requests deberían ser rate limited
    const rateLimitedResponses = responses.filter(res => res.status === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })
})
```

## 8. Manual Testing

### 8.1 Checklist de Testing Manual
```markdown
# PSE Manual Testing Checklist

## Funcionalidad Básica
- [ ] El formulario PSE se carga correctamente
- [ ] Los campos requeridos están marcados con asterisco
- [ ] La validación en tiempo real funciona
- [ ] El selector de bancos muestra todas las opciones
- [ ] La búsqueda de bancos funciona correctamente
- [ ] Los tipos de documento cambian según persona natural/jurídica

## Validaciones
- [ ] Validación de número de documento por tipo
- [ ] Validación de formato de email
- [ ] Validación de campos requeridos
- [ ] Mensajes de error claros y útiles
- [ ] Validación de longitud de campos

## Flujo de Pago
- [ ] Iniciación de pago exitosa
- [ ] Redirección al banco funciona
- [ ] Manejo de estados de pago (pending, approved, rejected)
- [ ] Webhooks se procesan correctamente
- [ ] Notificaciones por email funcionan

## UX/UI
- [ ] Diseño responsive en móvil
- [ ] Accesibilidad (navegación por teclado)
- [ ] Estados de carga visibles
- [ ] Mensajes de éxito/error claros
- [ ] Información de seguridad visible

## Compatibilidad
- [ ] Chrome (última versión)
- [ ] Firefox (última versión)
- [ ] Safari (última versión)
- [ ] Edge (última versión)
- [ ] iOS Safari
- [ ] Android Chrome

## Seguridad
- [ ] Datos sensibles no se logean
- [ ] HTTPS en producción
- [ ] Validación de webhooks
- [ ] Sanitización de inputs
- [ ] Rate limiting funciona
```

### 8.2 Escenarios de Testing Manual
```markdown
# Escenarios de Testing PSE

## Escenario 1: Pago Exitoso - Persona Natural
1. Navegar a checkout
2. Seleccionar PSE como método de pago
3. Seleccionar "Persona Natural"
4. Ingresar CC: 12345678
5. Seleccionar Bancolombia
6. Ingresar email válido
7. Hacer clic en "Pagar con PSE"
8. Verificar redirección al banco
9. Completar pago en simulador bancario
10. Verificar confirmación de pago

## Escenario 2: Pago Rechazado
1. Seguir pasos 1-7 del Escenario 1
2. En simulador bancario, seleccionar "Rechazar pago"
3. Verificar mensaje de error
4. Verificar opción de reintentar

## Escenario 3: Validación de Datos
1. Navegar a checkout
2. Seleccionar PSE
3. Intentar enviar formulario vacío
4. Verificar mensajes de error
5. Ingresar datos inválidos uno por uno
6. Verificar validación en tiempo real

## Escenario 4: Persona Jurídica
1. Navegar a checkout
2. Seleccionar PSE
3. Seleccionar "Persona Jurídica"
4. Verificar que solo aparece opción NIT
5. Ingresar NIT válido
6. Completar flujo de pago

## Escenario 5: Mobile Testing
1. Abrir en dispositivo móvil
2. Verificar diseño responsive
3. Probar selección de banco en móvil
4. Verificar que teclado numérico aparece para documento
5. Completar flujo de pago
```

## 9. Automatización de Testing

### 9.1 Pipeline de CI/CD
```yaml
# .github/workflows/pse-testing.yml
name: PSE Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/test
          MERCADOPAGO_TEST_ACCESS_TOKEN: ${{ secrets.MERCADOPAGO_TEST_ACCESS_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit
      - run: npm run test:security
```

### 9.2 Reportes de Testing
```typescript
// scripts/generate-test-report.ts
import fs from 'fs'
import path from 'path'

interface TestResults {
  unit: { passed: number; failed: number; coverage: number }
  integration: { passed: number; failed: number }
  e2e: { passed: number; failed: number }
  security: { vulnerabilities: number; issues: string[] }
}

export function generateTestReport(results: TestResults) {
  const report = `
# PSE Testing Report
Generated: ${new Date().toISOString()}

## Summary
- **Unit Tests**: ${results.unit.passed} passed, ${results.unit.failed} failed
- **Integration Tests**: ${results.integration.passed} passed, ${results.integration.failed} failed
- **E2E Tests**: ${results.e2e.passed} passed, ${results.e2e.failed} failed
- **Code Coverage**: ${results.unit.coverage}%
- **Security Issues**: ${results.security.vulnerabilities}

## Security Issues
${results.security.issues.map(issue => `- ${issue}`).join('\n')}

## Recommendations
${results.unit.coverage < 80 ? '- Increase unit test coverage to at least 80%' : ''}
${results.security.vulnerabilities > 0 ? '- Address security vulnerabilities before deployment' : ''}
${results.e2e.failed > 0 ? '- Fix failing E2E tests before release' : ''}
`

  fs.writeFileSync(path.join(__dirname, '../reports/test-report.md'), report)
}
```

## 10. Métricas y Monitoreo de Testing

### 10.1 Métricas de Calidad
```typescript
// scripts/test-metrics.ts
export interface TestMetrics {
  coverage: {
    lines: number
    functions: number
    branches: number
    statements: number
  }
  performance: {
    averageApiResponseTime: number
    frontendLoadTime: number
    webhookProcessingTime: number
  }
  reliability: {
    testPassRate: number
    flakiness: number
    meanTimeToFailure: number
  }
}

export const TARGET_METRICS: TestMetrics = {
  coverage: {
    lines: 80,
    functions: 80,
    branches: 70,
    statements: 80
  },
  performance: {
    averageApiResponseTime: 500, // ms
    frontendLoadTime: 2000, // ms
    webhookProcessingTime: 100 // ms
  },
  reliability: {
    testPassRate: 95, // %
    flakiness: 5, // %
    meanTimeToFailure: 168 // hours
  }
}
```

## 11. Próximos Pasos

1. **Implementar testing unitario**: Crear tests para servicios y componentes
2. **Configurar testing de integración**: Setup de base de datos y APIs de prueba
3. **Desarrollar tests E2E**: Implementar flujos completos con Playwright
4. **Setup de CI/CD**: Configurar pipeline de testing automatizado
5. **Monitoreo continuo**: Implementar métricas y alertas de calidad

---

**Estado**: Estrategia de Testing Completada  
**Próximo Paso**: Plan de Despliegue y Monitoreo  
**Cobertura Objetivo**: 80% código, 100% flujos críticos  
**Herramientas**: Jest, Playwright, Supertest, Artillery