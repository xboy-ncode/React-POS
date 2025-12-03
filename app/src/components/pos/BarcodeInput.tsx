// src/components/pos/BarcodeInput.tsx (actualizado)
import React, { useState, useEffect } from 'react'
import { Barcode, Check, X, Loader2, Camera } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useBarcodeInput } from '../../hooks/useBarcodeScanner'
import { BarcodeCamera } from './BarcodeCamera'

interface BarcodeInputProps {
    onScan: (barcode: string) => Promise<void> | void
    placeholder?: string
    disabled?: boolean
    autoFocus?: boolean
    className?: string
    minLength?: number
    maxLength?: number
    showFeedback?: boolean
    enableCamera?: boolean // Nueva prop
    enableQR?: boolean // Nueva prop
}

export const BarcodeInput: React.FC<BarcodeInputProps> = ({
    onScan,
    placeholder = 'Escanear código de barras',
    disabled = false,
    autoFocus = false,
    className = '',
    minLength = 3,
    maxLength = 50,
    showFeedback = true,
    enableCamera = true,
    enableQR = true
}) => {
    const [value, setValue] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [error, setError] = useState<string>('')
    const [showCamera, setShowCamera] = useState(false)

    const handleSubmit = async (barcode: string) => {
        if (!barcode.trim() || disabled) return

        setStatus('loading')
        setError('')

        try {
            await onScan(barcode)

            if (showFeedback) {
                setStatus('success')
                setTimeout(() => {
                    setValue('')
                    setStatus('idle')
                    barcodeInput.focus()
                }, 500)
            } else {
                setValue('')
                setStatus('idle')
            }
        } catch (err) {
            setStatus('error')
            setError(err instanceof Error ? err.message : 'Error al procesar código')

            setTimeout(() => {
                setStatus('idle')
                setError('')
            }, 2000)
        }
    }

    const handleCameraScan = async (barcode: string) => {
        await handleSubmit(barcode)
        // Cerrar cámara después de escaneo exitoso
        if (status === 'success') {
            setShowCamera(false)
        }
    }

    const handleError = (errorMsg: string) => {
        setError(errorMsg)
        setStatus('error')
        setTimeout(() => {
            setStatus('idle')
            setError('')
        }, 2000)
    }

    const barcodeInput = useBarcodeInput(handleSubmit, {
        minLength,
        maxLength,
        onError: handleError
    })

    useEffect(() => {
        if (autoFocus && !disabled && !showCamera) {
            barcodeInput.focus()
        }
    }, [autoFocus, disabled, showCamera])

    const getStatusIcon = () => {
        switch (status) {
            case 'loading':
                return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            case 'success':
                return <Check className="w-4 h-4 text-green-500" />
            case 'error':
                return <X className="w-4 h-4 text-red-500" />
            default:
                return <Barcode className="w-4 h-4 text-muted-foreground" />
        }
    }

    const getInputClassName = () => {
        const base = `pl-10 ${enableCamera ? 'pr-12' : 'pr-4'} font-mono transition-colors ${className}`

        if (status === 'success') return `${base} border-green-500 focus:border-green-500`
        if (status === 'error') return `${base} border-red-500 focus:border-red-500`

        return base
    }

    return (
        <>
            <div className="relative w-full">
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        {getStatusIcon()}
                    </div>
                    <Input
                        ref={barcodeInput.inputRef}
                        data-barcode-input="true"
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={barcodeInput.handleKeyDown}
                        disabled={disabled || status === 'loading'}
                        className={getInputClassName()}
                        autoComplete="off"
                        spellCheck={false}
                    />
                    {enableCamera && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            onClick={() => setShowCamera(true)}
                            disabled={disabled || status === 'loading'}
                        >
                            <Camera className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                {error && showFeedback && (
                    <div className="absolute top-full left-0 right-0 mt-1">
                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1">
                            {error}
                        </div>
                    </div>
                )}
            </div>

            {showCamera && (
                <BarcodeCamera
                    onScan={handleCameraScan}
                    onClose={() => setShowCamera(false)}
                    enableQR={enableQR}
                    autoCloseOnSuccess={true} // Cerrar automáticamente (recomendado)
                    autoCloseDelay={1000} // Esperar 1 segundo antes de cerrar
                />
            )}
        </>
    )
}