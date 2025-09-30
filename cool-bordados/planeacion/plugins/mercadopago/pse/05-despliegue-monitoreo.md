# Plan de Despliegue y Monitoreo - PSE con Mercado Pago

## 1. Visión General del Despliegue

### 1.1 Objetivos del Despliegue
- **Disponibilidad**: 99.9% uptime para pagos PSE
- **Seguridad**: Cumplimiento PCI DSS y normativas colombianas
- **Performance**: Tiempo de respuesta < 2 segundos
- **Escalabilidad**: Soporte para 1000+ transacciones concurrentes
- **Monitoreo**: Visibilidad completa del sistema en tiempo real
- **Rollback**: Capacidad de reversión rápida ante problemas

### 1.2 Arquitectura de Despliegue
```mermaid
graph TB
    A[Load Balancer] --> B[Frontend - Next.js]
    A --> C[API Gateway]
    C --> D[MedusaJS Backend]
    D --> E[PostgreSQL]
    D --> F[Redis Cache]
    D --> G[Mercado Pago API]
    
    H[Monitoring Stack] --> I[Prometheus]
    H --> J[Grafana]
    H --> K[AlertManager]
    
    L[Logging Stack] --> M[ELK Stack]
    L --> N[Fluentd]
    
    O[Security] --> P[WAF]
    O --> Q[SSL/TLS]
    O --> R[Secrets Manager]
```

## 2. Configuración de Producción

### 2.1 Variables de Entorno de Producción
```bash
# .env.production
# Mercado Pago - Producción
MERCADOPAGO_ACCESS_TOKEN=APP_USR_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADOPAGO_PUBLIC_KEY=APP_USR_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADOPAGO_WEBHOOK_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
MERCADOPAGO_SANDBOX=false

# Base de Datos
DATABASE_URL=postgresql://user:password@prod-db:5432/medusa_prod
REDIS_URL=redis://prod-redis:6379

# Seguridad
JWT_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
COOKIE_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SESSION_SECRET=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# URLs
FRONTEND_URL=https://cool-bordados.com
BACKEND_URL=https://api.cool-bordados.com
WEBHOOK_BASE_URL=https://api.cool-bordados.com/webhooks

# Logging y Monitoreo
LOG_LEVEL=info
SENTRY_DSN=https://xxxxxxxx@sentry.io/xxxxxxxx
NEW_RELIC_LICENSE_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutos
RATE_LIMIT_MAX=100        # 100 requests por ventana

# SSL/TLS
SSL_CERT_PATH=/etc/ssl/certs/cool-bordados.crt
SSL_KEY_PATH=/etc/ssl/private/cool-bordados.key
```

### 2.2 Configuración de MedusaJS para Producción
```typescript
// medusa-config.prod.ts
import { loadEnv, defineConfig } from '@medusajs/utils'

loadEnv(process.env.NODE_ENV || 'production', process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.FRONTEND_URL,
      adminCors: process.env.ADMIN_URL,
      authCors: process.env.AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
      sessionOptions: {
        name: 'medusa-session',
        resave: false,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        cookie: {
          secure: true,
          httpOnly: true,
          maxAge: 10 * 60 * 1000, // 10 minutos
          sameSite: 'strict'
        }
      }
    }
  },
  
  modules: {
    paymentProviders: [
      {
        resolve: '@nicogorga/medusa-payment-mercadopago',
        options: {
          access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
          sandbox: false,
          webhook_secret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
          // Configuración específica para PSE
          pse: {
            enabled: true,
            timeout: 30000, // 30 segundos
            retry_attempts: 3,
            logging: {
              level: 'info',
              include_sensitive: false
            }
          }
        }
      }
    ],
    
    // Módulo de logging personalizado
    logger: {
      resolve: './src/modules/logger',
      options: {
        level: process.env.LOG_LEVEL || 'info',
        transports: [
          {
            type: 'file',
            filename: '/var/log/medusa/app.log',
            maxsize: 10485760, // 10MB
            maxFiles: 5
          },
          {
            type: 'elasticsearch',
            host: process.env.ELASTICSEARCH_HOST,
            index: 'medusa-logs'
          }
        ]
      }
    },
    
    // Módulo de métricas
    metrics: {
      resolve: './src/modules/metrics',
      options: {
        prometheus: {
          enabled: true,
          port: 9090
        }
      }
    }
  }
})
```

### 2.3 Configuración de Nginx
```nginx
# /etc/nginx/sites-available/cool-bordados
upstream medusa_backend {
    server 127.0.0.1:9000;
    server 127.0.0.1:9001 backup;
}

upstream frontend {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001 backup;
}

# Rate Limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;

server {
    listen 443 ssl http2;
    server_name api.cool-bordados.com;
    
    # SSL Configuration
    ssl_certificate /etc/ssl/certs/cool-bordados.crt;
    ssl_certificate_key /etc/ssl/private/cool-bordados.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # API Routes
    location /store/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://medusa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Webhook Routes (más restrictivo)
    location /webhooks/ {
        limit_req zone=webhook burst=10 nodelay;
        proxy_pass http://medusa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Solo permitir POST
        if ($request_method !~ ^(POST)$) {
            return 405;
        }
    }
    
    # Health Check
    location /health {
        proxy_pass http://medusa_backend;
        access_log off;
    }
}

server {
    listen 443 ssl http2;
    server_name cool-bordados.com;
    
    # SSL Configuration (same as above)
    ssl_certificate /etc/ssl/certs/cool-bordados.crt;
    ssl_certificate_key /etc/ssl/private/cool-bordados.key;
    
    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static Assets
    location /_next/static/ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 3. Proceso de Despliegue

### 3.1 Pipeline de CI/CD
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: cool-bordados/medusa-pse

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: |
          npm run test:unit
          npm run test:integration
          npm run test:e2e
        env:
          MERCADOPAGO_TEST_ACCESS_TOKEN: ${{ secrets.MERCADOPAGO_TEST_ACCESS_TOKEN }}
      
      - name: Security audit
        run: npm audit --audit-level high

  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image: ${{ steps.image.outputs.image }}
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Output image
        id: image
        run: echo "image=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}" >> $GITHUB_OUTPUT

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying ${{ needs.build.outputs.image }} to staging"
          # Aquí iría el comando real de despliegue
      
      - name: Run smoke tests
        run: |
          # Tests básicos en staging
          curl -f https://staging-api.cool-bordados.com/health
          npm run test:smoke -- --baseUrl=https://staging.cool-bordados.com

  deploy-production:
    needs: [build, deploy-staging]
    runs-on: ubuntu-latest
    environment: production
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying ${{ needs.build.outputs.image }} to production"
          # Blue-Green deployment
          kubectl set image deployment/medusa-backend medusa=${{ needs.build.outputs.image }}
          kubectl rollout status deployment/medusa-backend --timeout=300s
      
      - name: Run production smoke tests
        run: |
          curl -f https://api.cool-bordados.com/health
          npm run test:smoke -- --baseUrl=https://cool-bordados.com
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 3.2 Dockerfile Optimizado
```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run medusa
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 medusa
RUN adduser --system --uid 1001 medusa

# Copy built application
COPY --from=builder --chown=medusa:medusa /app/dist ./dist
COPY --from=builder --chown=medusa:medusa /app/node_modules ./node_modules
COPY --from=builder --chown=medusa:medusa /app/package.json ./package.json

USER medusa

EXPOSE 9000

ENV PORT 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

CMD ["npm", "start"]
```

### 3.3 Kubernetes Deployment
```yaml
# k8s/medusa-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: medusa-backend
  labels:
    app: medusa-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: medusa-backend
  template:
    metadata:
      labels:
        app: medusa-backend
    spec:
      containers:
      - name: medusa
        image: ghcr.io/cool-bordados/medusa-pse:latest
        ports:
        - containerPort: 9000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: medusa-secrets
              key: database-url
        - name: MERCADOPAGO_ACCESS_TOKEN
          valueFrom:
            secretKeyRef:
              name: mercadopago-secrets
              key: access-token
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 9000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 9000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: medusa-service
spec:
  selector:
    app: medusa-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 9000
  type: ClusterIP
```

## 4. Monitoreo y Observabilidad

### 4.1 Métricas de Aplicación
```typescript
// src/modules/metrics/service.ts
import { Gauge, Counter, Histogram, register } from 'prom-client'

export class MetricsService {
  private psePaymentCounter: Counter<string>
  private psePaymentDuration: Histogram<string>
  private psePaymentStatus: Gauge<string>
  private webhookCounter: Counter<string>
  private apiResponseTime: Histogram<string>

  constructor() {
    // Contador de pagos PSE
    this.psePaymentCounter = new Counter({
      name: 'pse_payments_total',
      help: 'Total number of PSE payments',
      labelNames: ['status', 'bank', 'document_type']
    })

    // Duración de pagos PSE
    this.psePaymentDuration = new Histogram({
      name: 'pse_payment_duration_seconds',
      help: 'Duration of PSE payment processing',
      labelNames: ['status', 'bank'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    })

    // Estado actual de pagos PSE
    this.psePaymentStatus = new Gauge({
      name: 'pse_payment_status',
      help: 'Current PSE payment status',
      labelNames: ['payment_id', 'status']
    })

    // Contador de webhooks
    this.webhookCounter = new Counter({
      name: 'webhooks_received_total',
      help: 'Total number of webhooks received',
      labelNames: ['source', 'type', 'status']
    })

    // Tiempo de respuesta de API
    this.apiResponseTime = new Histogram({
      name: 'api_response_time_seconds',
      help: 'API response time',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    })

    register.registerMetric(this.psePaymentCounter)
    register.registerMetric(this.psePaymentDuration)
    register.registerMetric(this.psePaymentStatus)
    register.registerMetric(this.webhookCounter)
    register.registerMetric(this.apiResponseTime)
  }

  recordPSEPayment(status: string, bank: string, documentType: string, duration?: number) {
    this.psePaymentCounter.inc({ status, bank, document_type: documentType })
    
    if (duration) {
      this.psePaymentDuration.observe({ status, bank }, duration)
    }
  }

  updatePSEPaymentStatus(paymentId: string, status: string) {
    this.psePaymentStatus.set({ payment_id: paymentId, status }, 1)
  }

  recordWebhook(source: string, type: string, status: string) {
    this.webhookCounter.inc({ source, type, status })
  }

  recordAPIResponse(method: string, route: string, statusCode: number, duration: number) {
    this.apiResponseTime.observe(
      { method, route, status_code: statusCode.toString() },
      duration
    )
  }

  getMetrics() {
    return register.metrics()
  }
}
```

### 4.2 Dashboard de Grafana
```json
{
  "dashboard": {
    "title": "PSE Payments - Cool Bordados",
    "panels": [
      {
        "title": "PSE Payments per Hour",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(pse_payments_total[1h])",
            "legendFormat": "{{status}} - {{bank}}"
          }
        ]
      },
      {
        "title": "Payment Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(pse_payments_total{status=\"approved\"}[5m]) / rate(pse_payments_total[5m]) * 100",
            "legendFormat": "Success Rate %"
          }
        ]
      },
      {
        "title": "Average Payment Duration",
        "type": "stat",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(pse_payment_duration_seconds_bucket[5m]))",
            "legendFormat": "95th Percentile"
          }
        ]
      },
      {
        "title": "Webhook Processing",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(webhooks_received_total[5m])",
            "legendFormat": "{{source}} - {{type}}"
          }
        ]
      },
      {
        "title": "API Response Times",
        "type": "heatmap",
        "targets": [
          {
            "expr": "rate(api_response_time_seconds_bucket[5m])",
            "legendFormat": "{{le}}"
          }
        ]
      },
      {
        "title": "Error Rate by Bank",
        "type": "table",
        "targets": [
          {
            "expr": "rate(pse_payments_total{status=\"rejected\"}[1h]) by (bank)",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

### 4.3 Alertas de Prometheus
```yaml
# alerts/pse-alerts.yml
groups:
- name: pse_payments
  rules:
  - alert: PSEPaymentFailureRateHigh
    expr: rate(pse_payments_total{status="rejected"}[5m]) / rate(pse_payments_total[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "High PSE payment failure rate"
      description: "PSE payment failure rate is {{ $value | humanizePercentage }} over the last 5 minutes"

  - alert: PSEPaymentDurationHigh
    expr: histogram_quantile(0.95, rate(pse_payment_duration_seconds_bucket[5m])) > 30
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "PSE payment duration is high"
      description: "95th percentile of PSE payment duration is {{ $value }}s"

  - alert: WebhookProcessingFailed
    expr: rate(webhooks_received_total{status="error"}[5m]) > 0.01
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Webhook processing failures detected"
      description: "Webhook processing error rate: {{ $value | humanize }} errors/sec"

  - alert: PSEServiceDown
    expr: up{job="medusa-backend"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "PSE service is down"
      description: "PSE payment service has been down for more than 1 minute"

  - alert: DatabaseConnectionIssues
    expr: increase(database_connection_errors_total[5m]) > 5
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database connection issues"
      description: "{{ $value }} database connection errors in the last 5 minutes"
```

### 4.4 Logging Estructurado
```typescript
// src/modules/logger/service.ts
import winston from 'winston'
import { ElasticsearchTransport } from 'winston-elasticsearch'

export class LoggerService {
  private logger: winston.Logger

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]

    // Agregar transporte de Elasticsearch en producción
    if (process.env.NODE_ENV === 'production') {
      transports.push(
        new ElasticsearchTransport({
          level: 'info',
          clientOpts: {
            node: process.env.ELASTICSEARCH_URL
          },
          index: 'medusa-pse-logs'
        })
      )
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: 'medusa-pse',
        version: process.env.APP_VERSION
      },
      transports
    })
  }

  logPSEPayment(event: string, data: any, level: string = 'info') {
    this.logger.log(level, `PSE Payment: ${event}`, {
      event,
      payment_id: data.payment_id,
      amount: data.amount,
      bank: data.bank,
      status: data.status,
      user_id: data.user_id,
      timestamp: new Date().toISOString(),
      // No incluir datos sensibles
      sensitive_data_removed: true
    })
  }

  logWebhook(source: string, type: string, data: any, level: string = 'info') {
    this.logger.log(level, `Webhook received: ${source}/${type}`, {
      source,
      type,
      webhook_id: data.id,
      resource_id: data.resource_id,
      timestamp: new Date().toISOString()
    })
  }

  logError(error: Error, context?: any) {
    this.logger.error('Application error', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString()
    })
  }

  logSecurityEvent(event: string, details: any) {
    this.logger.warn(`Security event: ${event}`, {
      event,
      ip: details.ip,
      user_agent: details.user_agent,
      endpoint: details.endpoint,
      timestamp: new Date().toISOString(),
      severity: 'security'
    })
  }
}
```

## 5. Seguridad en Producción

### 5.1 Configuración de Seguridad
```typescript
// src/security/config.ts
export const SECURITY_CONFIG = {
  // Rate Limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por ventana
    message: 'Demasiadas solicitudes, intenta de nuevo más tarde',
    standardHeaders: true,
    legacyHeaders: false,
    // Rate limiting específico para PSE
    pse: {
      windowMs: 5 * 60 * 1000, // 5 minutos
      max: 10 // máximo 10 intentos de pago por ventana
    }
  },

  // CORS
  cors: {
    origin: [
      'https://cool-bordados.com',
      'https://www.cool-bordados.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Headers de Seguridad
  securityHeaders: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://secure.mlstatic.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.mercadopago.com"],
        frameSrc: ["https://secure.mlstatic.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // Validación de Webhooks
  webhookValidation: {
    requiredHeaders: ['x-signature', 'x-request-id'],
    signatureAlgorithm: 'sha256',
    tolerance: 300 // 5 minutos de tolerancia
  }
}
```

### 5.2 Middleware de Seguridad
```typescript
// src/middleware/security.ts
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { SECURITY_CONFIG } from '../security/config'

export const securityMiddleware = [
  // Helmet para headers de seguridad
  helmet({
    contentSecurityPolicy: SECURITY_CONFIG.securityHeaders.contentSecurityPolicy,
    hsts: SECURITY_CONFIG.securityHeaders.hsts
  }),

  // Rate limiting general
  rateLimit(SECURITY_CONFIG.rateLimiting),

  // Rate limiting específico para PSE
  rateLimit({
    ...SECURITY_CONFIG.rateLimiting.pse,
    skip: (req) => !req.path.includes('/pse/'),
    keyGenerator: (req) => {
      // Rate limit por IP + user session
      return `${req.ip}-${req.session?.id || 'anonymous'}`
    }
  }),

  // Validación de webhook signatures
  (req, res, next) => {
    if (req.path.startsWith('/webhooks/')) {
      const signature = req.headers['x-signature']
      if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature' })
      }
      
      // Validar signature (implementación específica)
      const isValid = validateWebhookSignature(req.body, signature)
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid webhook signature' })
      }
    }
    next()
  }
]
```

## 6. Backup y Recuperación

### 6.1 Estrategia de Backup
```bash
#!/bin/bash
# scripts/backup-production.sh

# Variables
BACKUP_DIR="/backups/medusa-pse"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "Starting database backup..."
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos de configuración
echo "Backing up configuration files..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
  /etc/nginx/sites-available/cool-bordados \
  /etc/ssl/certs/cool-bordados.crt \
  /app/.env.production

# Backup de logs importantes
echo "Backing up logs..."
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz \
  /var/log/medusa/ \
  /var/log/nginx/

# Subir a S3
echo "Uploading to S3..."
aws s3 cp $BACKUP_DIR/ s3://cool-bordados-backups/medusa-pse/ --recursive

# Limpiar backups antiguos
echo "Cleaning old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql" -mtime +$RETENTION_DAYS -delete

echo "Backup completed successfully"
```

### 6.2 Plan de Recuperación ante Desastres
```markdown
# Plan de Recuperación ante Desastres - PSE

## Escenarios de Falla

### 1. Falla de Aplicación
**Tiempo de Recuperación**: 5-10 minutos
**Pasos**:
1. Verificar logs de aplicación
2. Rollback a versión anterior si es necesario
3. Reiniciar servicios
4. Verificar funcionalidad PSE

### 2. Falla de Base de Datos
**Tiempo de Recuperación**: 15-30 minutos
**Pasos**:
1. Activar réplica de lectura como principal
2. Restaurar desde backup más reciente
3. Verificar integridad de datos
4. Reconfigurar aplicación

### 3. Falla de Infraestructura
**Tiempo de Recuperación**: 30-60 minutos
**Pasos**:
1. Activar infraestructura de respaldo
2. Restaurar desde backups
3. Reconfigurar DNS
4. Verificar todos los servicios

### 4. Compromiso de Seguridad
**Tiempo de Recuperación**: Inmediato
**Pasos**:
1. Aislar sistemas afectados
2. Rotar todas las credenciales
3. Analizar logs de seguridad
4. Notificar a usuarios si es necesario
```

## 7. Monitoreo de Negocio

### 7.1 KPIs de PSE
```typescript
// src/modules/business-metrics/service.ts
export class BusinessMetricsService {
  async getPSEMetrics(startDate: Date, endDate: Date) {
    return {
      // Métricas de conversión
      conversion: {
        totalAttempts: await this.getTotalPaymentAttempts(startDate, endDate),
        successfulPayments: await this.getSuccessfulPayments(startDate, endDate),
        conversionRate: 0, // calculado
        averageAmount: await this.getAveragePaymentAmount(startDate, endDate)
      },

      // Métricas por banco
      bankPerformance: await this.getBankPerformance(startDate, endDate),

      // Métricas de tiempo
      timing: {
        averageProcessingTime: await this.getAverageProcessingTime(startDate, endDate),
        p95ProcessingTime: await this.getP95ProcessingTime(startDate, endDate)
      },

      // Métricas de error
      errors: {
        totalErrors: await this.getTotalErrors(startDate, endDate),
        errorsByType: await this.getErrorsByType(startDate, endDate),
        errorRate: 0 // calculado
      }
    }
  }

  async generateDailyReport() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const metrics = await this.getPSEMetrics(yesterday, new Date())
    
    // Enviar reporte por email/Slack
    await this.sendReport(metrics)
  }
}
```

### 7.2 Alertas de Negocio
```yaml
# alerts/business-alerts.yml
groups:
- name: pse_business
  rules:
  - alert: PSEConversionRateLow
    expr: (rate(pse_payments_total{status="approved"}[1h]) / rate(pse_payments_total[1h])) < 0.8
    for: 15m
    labels:
      severity: warning
      team: business
    annotations:
      summary: "PSE conversion rate is below 80%"
      description: "Current PSE conversion rate: {{ $value | humanizePercentage }}"

  - alert: PSERevenueDropSignificant
    expr: sum(rate(pse_payment_amount_total[1h])) < sum(rate(pse_payment_amount_total[1h] offset 24h)) * 0.7
    for: 30m
    labels:
      severity: critical
      team: business
    annotations:
      summary: "Significant drop in PSE revenue"
      description: "PSE revenue is 30% lower than same time yesterday"

  - alert: BankSpecificIssues
    expr: rate(pse_payments_total{status="rejected"}[30m]) by (bank) > 0.3
    for: 10m
    labels:
      severity: warning
      team: technical
    annotations:
      summary: "High rejection rate for bank {{ $labels.bank }}"
      description: "Bank {{ $labels.bank }} has rejection rate of {{ $value | humanizePercentage }}"
```

## 8. Mantenimiento y Actualizaciones

### 8.1 Ventanas de Mantenimiento
```markdown
# Calendario de Mantenimiento

## Mantenimiento Regular
- **Frecuencia**: Domingos 2:00 AM - 4:00 AM COT
- **Duración**: Máximo 2 horas
- **Actividades**:
  - Actualizaciones de seguridad
  - Optimización de base de datos
  - Limpieza de logs
  - Verificación de backups

## Mantenimiento de Emergencia
- **Disponibilidad**: 24/7
- **Tiempo de Respuesta**: 15 minutos
- **Escalación**: Automática después de 30 minutos

## Actualizaciones Mayores
- **Frecuencia**: Mensual
- **Planificación**: Con 1 semana de anticipación
- **Testing**: Obligatorio en staging
- **Rollback**: Plan preparado antes del despliegue
```

### 8.2 Procedimiento de Actualización
```bash
#!/bin/bash
# scripts/update-production.sh

set -e

echo "Starting production update process..."

# 1. Verificar que staging esté funcionando
echo "Verifying staging environment..."
curl -f https://staging-api.cool-bordados.com/health

# 2. Crear backup antes de la actualización
echo "Creating pre-update backup..."
./scripts/backup-production.sh

# 3. Poner aplicación en modo mantenimiento
echo "Enabling maintenance mode..."
kubectl patch deployment medusa-backend -p '{"spec":{"replicas":0}}'
kubectl apply -f k8s/maintenance-page.yaml

# 4. Actualizar base de datos si es necesario
if [ -f "migrations/pending.sql" ]; then
  echo "Running database migrations..."
  psql $DATABASE_URL < migrations/pending.sql
fi

# 5. Desplegar nueva versión
echo "Deploying new version..."
kubectl set image deployment/medusa-backend medusa=$NEW_IMAGE
kubectl rollout status deployment/medusa-backend --timeout=300s

# 6. Verificar que la aplicación esté funcionando
echo "Running health checks..."
sleep 30
curl -f https://api.cool-bordados.com/health

# 7. Ejecutar smoke tests
echo "Running smoke tests..."
npm run test:smoke -- --baseUrl=https://cool-bordados.com

# 8. Deshabilitar modo mantenimiento
echo "Disabling maintenance mode..."
kubectl delete -f k8s/maintenance-page.yaml

echo "Production update completed successfully!"
```

## 9. Plan de Contingencia

### 9.1 Escenarios de Contingencia
```markdown
# Plan de Contingencia PSE

## Escenario 1: Falla de Mercado Pago API
**Probabilidad**: Media
**Impacto**: Alto
**Respuesta**:
1. Activar página de mantenimiento para PSE
2. Redirigir usuarios a métodos de pago alternativos
3. Monitorear estado de la API de Mercado Pago
4. Comunicar a usuarios vía email/redes sociales
5. Reactivar cuando el servicio se restablezca

## Escenario 2: Problemas con Bancos Específicos
**Probabilidad**: Alta
**Impacto**: Medio
**Respuesta**:
1. Identificar banco(s) afectado(s)
2. Deshabilitar banco problemático temporalmente
3. Mostrar mensaje informativo a usuarios
4. Contactar soporte de Mercado Pago
5. Monitorear resolución del problema

## Escenario 3: Ataque DDoS
**Probabilidad**: Baja
**Impacto**: Alto
**Respuesta**:
1. Activar protección DDoS en CDN
2. Implementar rate limiting agresivo
3. Bloquear IPs maliciosas
4. Escalar recursos si es necesario
5. Contactar proveedor de hosting

## Escenario 4: Fuga de Datos
**Probabilidad**: Muy Baja
**Impacto**: Crítico
**Respuesta**:
1. Aislar sistemas afectados inmediatamente
2. Preservar evidencia forense
3. Notificar a autoridades competentes
4. Comunicar a usuarios afectados
5. Implementar medidas correctivas
```

### 9.2 Contactos de Emergencia
```markdown
# Contactos de Emergencia

## Equipo Técnico
- **DevOps Lead**: +57 300 XXX XXXX
- **Backend Developer**: +57 301 XXX XXXX
- **Security Engineer**: +57 302 XXX XXXX

## Proveedores
- **Mercado Pago Soporte**: soporte@mercadopago.com
- **Hosting Provider**: support@provider.com
- **CDN Provider**: emergency@cdn.com

## Escalación
- **CTO**: +57 310 XXX XXXX
- **CEO**: +57 320 XXX XXXX

## Autoridades
- **SIC (Superintendencia)**: +57 1 587 0000
- **Policía Cibernética**: +57 1 515 9111
```

## 10. Métricas de Éxito

### 10.1 KPIs Técnicos
```markdown
# KPIs Técnicos - PSE

## Disponibilidad
- **Objetivo**: 99.9% uptime
- **Medición**: Tiempo total disponible / Tiempo total
- **Alerta**: < 99.5%

## Performance
- **Tiempo de Respuesta API**: < 500ms (promedio)
- **Tiempo de Carga Frontend**: < 2 segundos
- **Tiempo de Procesamiento PSE**: < 30 segundos

## Confiabilidad
- **Tasa de Error**: < 1%
- **Tasa de Éxito de Webhooks**: > 99%
- **Tiempo de Recuperación**: < 5 minutos

## Seguridad
- **Intentos de Ataque Bloqueados**: Monitoreo continuo
- **Vulnerabilidades Críticas**: 0
- **Tiempo de Respuesta a Incidentes**: < 15 minutos
```

### 10.2 KPIs de Negocio
```markdown
# KPIs de Negocio - PSE

## Conversión
- **Tasa de Conversión PSE**: > 80%
- **Abandono en Formulario**: < 20%
- **Tiempo Promedio de Pago**: < 3 minutos

## Volumen
- **Transacciones Diarias**: Crecimiento 10% mensual
- **Valor Promedio de Transacción**: Monitoreo continuo
- **Participación PSE en Total de Pagos**: > 30%

## Satisfacción
- **NPS de Experiencia de Pago**: > 8/10
- **Tickets de Soporte PSE**: < 5% del total
- **Tiempo de Resolución de Problemas**: < 2 horas
```

## 11. Cronograma de Implementación

```mermaid
gantt
    title Cronograma de Despliegue PSE
    dateFormat  YYYY-MM-DD
    section Preparación
    Configuración Infraestructura    :prep1, 2024-01-15, 3d
    Setup Monitoreo                  :prep2, after prep1, 2d
    Configuración Seguridad          :prep3, after prep2, 2d
    
    section Testing
    Testing en Staging               :test1, after prep3, 5d
    Testing de Carga                 :test2, after test1, 2d
    Testing de Seguridad             :test3, after test2, 2d
    
    section Despliegue
    Despliegue a Producción          :deploy1, after test3, 1d
    Monitoreo Intensivo              :deploy2, after deploy1, 7d
    Optimización Post-Deploy         :deploy3, after deploy2, 3d
    
    section Estabilización
    Documentación Final              :stable1, after deploy3, 2d
    Capacitación Equipo              :stable2, after stable1, 2d
    Review y Mejoras                 :stable3, after stable2, 3d
```

---

**Estado**: Plan de Despliegue y Monitoreo Completado  
**Próximo Paso**: Implementación según cronograma  
**Tiempo Estimado de Despliegue**: 4-6 semanas  
**Disponibilidad Objetivo**: 99.9% uptime  
**Monitoreo**: 24/7 con alertas automáticas