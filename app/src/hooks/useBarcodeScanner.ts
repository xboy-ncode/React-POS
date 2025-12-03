import { useEffect, useRef, useCallback } from 'react'

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void
  onError?: (error: string) => void
  minLength?: number
  maxLength?: number
  timeout?: number // Tiempo para considerar que terminó el escaneo (ms)
  enabled?: boolean
  preventDefault?: boolean
}

/**
 * Hook para manejar escaneo de códigos de barras
 * Los lectores de códigos de barras actúan como teclados, enviando caracteres rápidamente
 * y terminando con Enter
 */
export const useBarcodeScanner = ({
  onScan,
  onError,
  minLength = 3,
  maxLength = 50,
  timeout = 100, // 100ms es suficiente - los scanners son más rápidos que humanos
  enabled = true,
  preventDefault = true
}: BarcodeScannerOptions) => {
  const bufferRef = useRef<string>('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timestampsRef = useRef<number[]>([])

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
    timestampsRef.current = []
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const processBarcode = useCallback((barcode: string) => {
    const trimmed = barcode.trim()
    
    // Validar longitud
    if (trimmed.length < minLength) {
      onError?.(`Código muy corto (mínimo ${minLength} caracteres)`)
      return
    }

    if (trimmed.length > maxLength) {
      onError?.(`Código muy largo (máximo ${maxLength} caracteres)`)
      return
    }

    // Validar que no sea solo espacios o caracteres especiales
    if (!/[a-zA-Z0-9]/.test(trimmed)) {
      onError?.('Código inválido')
      return
    }

    onScan(trimmed)
  }, [minLength, maxLength, onScan, onError])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si estamos en un input/textarea (excepto si queremos capturar ahí también)
      const target = e.target as HTMLElement
      const isInputField = 
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable

      // Solo procesar si NO estamos en un campo de entrada
      // O si estamos en el campo específico de barcode
      if (isInputField && !target.dataset.barcodeInput) {
        return
      }

      const now = Date.now()
      
      // Enter: procesar código
      if (e.key === 'Enter') {
        if (preventDefault) e.preventDefault()
        
        if (bufferRef.current.length > 0) {
          processBarcode(bufferRef.current)
          resetBuffer()
        }
        return
      }

      // Escape: cancelar
      if (e.key === 'Escape') {
        resetBuffer()
        return
      }

      // Ignorar teclas especiales (Shift, Ctrl, Alt, etc)
      if (e.key.length > 1) {
        return
      }

      // Agregar carácter al buffer
      bufferRef.current += e.key
      timestampsRef.current.push(now)

      if (preventDefault && !isInputField) {
        e.preventDefault()
      }

      // Limpiar timestamps antiguos (mantener solo los últimos 10)
      if (timestampsRef.current.length > 10) {
        timestampsRef.current = timestampsRef.current.slice(-10)
      }

      // Reset automático después del timeout
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        // Si hemos acumulado texto pero no llegó Enter, podría ser tipeo manual
        // Los scanners son consistentemente rápidos
        if (bufferRef.current.length > 0) {
          // Calcular velocidad promedio de entrada
          if (timestampsRef.current.length >= 2) {
            const intervals = []
            for (let i = 1; i < timestampsRef.current.length; i++) {
              intervals.push(timestampsRef.current[i] - timestampsRef.current[i - 1])
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
            
            // Si el promedio es < 50ms, probablemente es un scanner
            // Los humanos no pueden escribir tan rápido consistentemente
            if (avgInterval < 50 && bufferRef.current.length >= minLength) {
              processBarcode(bufferRef.current)
            }
          }
          
          resetBuffer()
        }
      }, timeout)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      resetBuffer()
    }
  }, [enabled, preventDefault, timeout, minLength, processBarcode, resetBuffer])

  return {
    reset: resetBuffer
  }
}

// Hook complementario para inputs específicos de barcode
export const useBarcodeInput = (
  onSubmit: (barcode: string) => void,
  options?: {
    minLength?: number
    maxLength?: number
    onError?: (error: string) => void
  }
) => {
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleSubmit = useCallback((value: string) => {
    const trimmed = value.trim()
    const minLen = options?.minLength || 3
    const maxLen = options?.maxLength || 50

    if (!trimmed) return

    if (trimmed.length < minLen) {
      options?.onError?.(`Código muy corto (mínimo ${minLen} caracteres)`)
      return
    }

    if (trimmed.length > maxLen) {
      options?.onError?.(`Código muy largo (máximo ${maxLen} caracteres)`)
      return
    }

    onSubmit(trimmed)
  }, [onSubmit, options])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e.currentTarget.value)
    }
  }, [handleSubmit])

  const focus = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  const clear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }, [])

  return {
    inputRef,
    handleKeyDown,
    focus,
    clear,
    handleSubmit: () => {
      if (inputRef.current) {
        handleSubmit(inputRef.current.value)
      }
    }
  }
}