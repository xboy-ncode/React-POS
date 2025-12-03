// src/lib/barcode-validation.ts
export interface BarcodeValidationResult {
    valid: boolean
    error?: string
    formatted?: string
}

/**
 * Valida formato de código de barras
 * Soporta: EAN-13, EAN-8, UPC-A, Code-128, Code-39
 */
export function validateBarcodeFormat(barcode: string): BarcodeValidationResult {
    if (!barcode || !barcode.trim()) {
        return { valid: true } // Barcode es opcional
    }

    const cleaned = barcode.trim()

    // Validar caracteres permitidos (alfanuméricos y algunos especiales)
    if (!/^[A-Za-z0-9\-_]+$/.test(cleaned)) {
        return {
            valid: false,
            error: 'El código de barras solo puede contener letras, números, guiones y guiones bajos'
        }
    }

    // Validar longitud mínima/máxima
    if (cleaned.length < 3) {
        return {
            valid: false,
            error: 'El código de barras debe tener al menos 3 caracteres'
        }
    }

    if (cleaned.length > 50) {
        return {
            valid: false,
            error: 'El código de barras no puede exceder 50 caracteres'
        }
    }

    // Validar formatos específicos comunes
    const lengthValidations = {
        8: 'EAN-8',
        12: 'UPC-A',
        13: 'EAN-13',
        14: 'EAN-14/ITF-14'
    }

    if (lengthValidations[cleaned.length as keyof typeof lengthValidations]) {
        // Es un formato numérico estándar, validar que solo contenga números
        if (!/^\d+$/.test(cleaned)) {
            return {
                valid: false,
                error: `Para ${lengthValidations[cleaned.length as keyof typeof lengthValidations]} el código debe ser numérico`
            }
        }
    }

    return {
        valid: true,
        formatted: cleaned.toUpperCase()
    }
}

/**
 * Valida dígito verificador para EAN-13
 */
export function validateEAN13CheckDigit(barcode: string): boolean {
    if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
        return false
    }

    const digits = barcode.split('').map(Number)
    const checkDigit = digits.pop()!

    let sum = 0
    digits.forEach((digit, index) => {
        sum += index % 2 === 0 ? digit : digit * 3
    })

    const calculatedCheck = (10 - (sum % 10)) % 10
    return calculatedCheck === checkDigit
}

/**
 * Genera un código de barras aleatorio para productos sin código
 */
export function generateInternalBarcode(prefix: string = 'INT'): string {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
}