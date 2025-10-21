interface BusinessConfig {
    // Datos de la empresa
    name: string
    ruc: string
    address: string
    phone: string
    email: string
    website: string
    city: string
    country: string
    postalCode: string

    // Series de facturación
    invoiceSeries: {
        ticket: string
        boleta: string
        factura: string
    }

    // Configuración fiscal
    igvRate: number
    currency: string
    currencySymbol: string

    // Textos personalizables
    invoiceFooter: string
    invoiceWebsiteText: string
    invoiceAuthText: string

    // Configuración de impresión
    printConfig: {
        logoUrl: string
        showLogo: boolean
    }
}

// Función helper para obtener variable de entorno con fallback
const getEnvVar = (key: string, fallback: string = ''): string => {
    return import.meta.env[key] || fallback
}

const getEnvBool = (key: string, fallback: boolean = false): boolean => {
    const value = import.meta.env[key]
    if (value === undefined) return fallback
    return value === 'true' || value === '1'
}

const getEnvNumber = (key: string, fallback: number = 0): number => {
    const value = import.meta.env[key]
    return value ? Number(value) : fallback
}

// Configuración del negocio
export const businessConfig: BusinessConfig = {
    // Datos de la empresa
    name: getEnvVar('VITE_BUSINESS_NAME', 'Mi Empresa S.A.C.'),
    ruc: getEnvVar('VITE_BUSINESS_RUC', '20000000000'),
    address: getEnvVar('VITE_BUSINESS_ADDRESS', 'Dirección no configurada'),
    phone: getEnvVar('VITE_BUSINESS_PHONE', ''),
    email: getEnvVar('VITE_BUSINESS_EMAIL', ''),
    website: getEnvVar('VITE_BUSINESS_WEBSITE', ''),
    city: getEnvVar('VITE_BUSINESS_CITY', 'Lima'),
    country: getEnvVar('VITE_BUSINESS_COUNTRY', 'Perú'),
    postalCode: getEnvVar('VITE_BUSINESS_POSTAL_CODE', ''),

    // Series de facturación
    invoiceSeries: {
        ticket: getEnvVar('VITE_BUSINESS_INVOICE_SERIES_TICKET', 'T001'),
        boleta: getEnvVar('VITE_BUSINESS_INVOICE_SERIES_BOLETA', 'B001'),
        factura: getEnvVar('VITE_BUSINESS_INVOICE_SERIES_FACTURA', 'F001')
    },

    // Configuración fiscal
    igvRate: getEnvNumber('VITE_BUSINESS_IGV_RATE', 18),
    currency: getEnvVar('VITE_BUSINESS_CURRENCY', 'PEN'),
    currencySymbol: getEnvVar('VITE_BUSINESS_CURRENCY_SYMBOL', 'S/'),

    // Textos personalizables
    invoiceFooter: getEnvVar('VITE_BUSINESS_INVOICE_FOOTER', '¡Gracias por su compra!'),
    invoiceWebsiteText: getEnvVar('VITE_BUSINESS_INVOICE_WEBSITE_TEXT', 'Consulte su comprobante en: www.sunat.gob.pe'),
    invoiceAuthText: getEnvVar('VITE_BUSINESS_INVOICE_AUTH_TEXT', 'Autorizado mediante Resolución de Intendencia N° 034-005-0000000/SUNAT'),

    // Configuración de impresión
    printConfig: {
        logoUrl: getEnvVar('VITE_PRINT_LOGO_URL', ''),
        showLogo: getEnvBool('VITE_PRINT_SHOW_LOGO', false)
    }
}

// Función helper para formatear moneda
export const formatCurrency = (amount: number): string => {
    return `${businessConfig.currencySymbol} ${amount.toFixed(2)}`
}

// Función helper para calcular IGV
export const calculateIGV = (subtotal: number): number => {
    return subtotal * (businessConfig.igvRate / 100)
}

// Función helper para obtener el nombre completo del comprobante
export const getInvoiceTypeName = (type: 'ticket' | 'boleta' | 'factura'): string => {
    const names = {
        ticket: 'TICKET DE VENTA',
        boleta: 'BOLETA DE VENTA ELECTRÓNICA',
        factura: 'FACTURA ELECTRÓNICA'
    }
    return names[type]
}

// Función para generar número de comprobante
export const generateInvoiceNumber = (type: 'ticket' | 'boleta' | 'factura', id: number): string => {
    const series = businessConfig.invoiceSeries[type]
    const number = id.toString().padStart(8, '0')
    return `${series}-${number}`
}

// Validación de configuración al iniciar
export const validateBusinessConfig = (): string[] => {
    const errors: string[] = []

    if (!businessConfig.name) {
        errors.push('VITE_BUSINESS_NAME no está configurado')
    }

    if (!businessConfig.ruc || businessConfig.ruc.length !== 11) {
        errors.push('VITE_BUSINESS_RUC debe tener 11 dígitos')
    }

    if (!businessConfig.address) {
        errors.push('VITE_BUSINESS_ADDRESS no está configurado')
    }

    if (businessConfig.igvRate < 0 || businessConfig.igvRate > 100) {
        errors.push('VITE_BUSINESS_IGV_RATE debe estar entre 0 y 100')
    }

    return errors
}

// Hook para usar la configuración del negocio
import { useEffect } from 'react'

export const useBusinessConfig = () => {
    useEffect(() => {
        if (import.meta.env.DEV) {
            const errors = validateBusinessConfig()
            if (errors.length > 0) {
                console.warn('⚠️ Configuración del negocio incompleta:')
                errors.forEach(error => console.warn(`  - ${error}`))
            } else {
                console.log('✅ Configuración del negocio cargada correctamente')
            }
        }
    }, [])

    return businessConfig
}

// Exportar todo para fácil acceso
export default businessConfig