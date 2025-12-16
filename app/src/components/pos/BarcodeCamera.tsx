// src/components/pos/BarcodeCamera.tsx
import React, { useRef, useEffect, useState } from 'react'
import { Camera, X, SwitchCamera, Loader2, RotateCw, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCameraScanner } from '@/hooks/useCameraScanner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface BarcodeCameraProps {
    onScan: (barcode: string) => Promise<void> | void
    onClose?: () => void
    enableQR?: boolean
    scanDelay?: number
    autoCloseOnSuccess?: boolean // NUEVO
    autoCloseDelay?: number // NUEVO
}

export const BarcodeCamera: React.FC<BarcodeCameraProps> = ({
    onScan,
    onClose,
    enableQR: initialEnableQR = true,
    scanDelay = 300,
    autoCloseOnSuccess = true, // NUEVO: cerrar automáticamente por defecto
    autoCloseDelay = 1000 // NUEVO: esperar 1 segundo antes de cerrar
}) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [lastScanned, setLastScanned] = useState<string>('')
    const [enableQR, setEnableQR] = useState(initialEnableQR)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string>('')
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [successMessage, setSuccessMessage] = useState<string>('') // NUEVO
    const processingRef = useRef(false) // NUEVO: ref para evitar race conditions
    const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null) // NUEVO
    
    const [, setDebugInfo] = useState({
        frames: 0,
        lastScan: '',
        lastFormat: '',
        videoSize: { width: 0, height: 0 },
        scanning: false,
        attempts: 0,
        successfulScans: 0,
        lastAttempt: 0,
        fps: 0,
        recentAttempts: [] as Array<{
            time: number
            hasResult: boolean
            result?: string
            format?: string
        }>
    })
    const attemptCountRef = useRef(0)
    const successCountRef = useRef(0)
    const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Detectar orientación del dispositivo
    useEffect(() => {
        const handleOrientationChange = () => {
            const isLandscape = window.innerWidth > window.innerHeight
            setOrientation(isLandscape ? 'landscape' : 'portrait')
        }

        handleOrientationChange()
        window.addEventListener('resize', handleOrientationChange)
        window.addEventListener('orientationchange', handleOrientationChange)

        return () => {
            window.removeEventListener('resize', handleOrientationChange)
            window.removeEventListener('orientationchange', handleOrientationChange)
        }
    }, [])

    const handleScan = async (code: string) => {
        // MEJORADO: Prevenir procesamiento múltiple
        if (processingRef.current || isProcessing) {
            console.log('🚫 Already processing, ignoring scan:', code)
            return
        }

        // console.log('🎯 Processing scan:', code)
        
        processingRef.current = true
        setIsProcessing(true)
        setLastScanned(code)
        setError('')
        
        successCountRef.current += 1

        // NUEVO: Detener el scanner inmediatamente
        stopScanning()
        
        try {
            await onScan(code)
            
            // NUEVO: Mostrar mensaje de éxito
            setSuccessMessage('✅ Producto agregado al carrito')
            
            // NUEVO: Auto-cerrar si está habilitado
            if (autoCloseOnSuccess && onClose) {
                // console.log(`⏱️ Auto-closing in ${autoCloseDelay}ms...`)
                autoCloseTimerRef.current = setTimeout(() => {
                    // console.log('✅ Auto-closing scanner')
                    onClose()
                }, autoCloseDelay)
            }
            
        } catch (error) {
            console.error('❌ Error processing scan:', error)
            setError('Error al procesar el código')
            
            // NUEVO: En caso de error, reiniciar el scanner después de un momento
            setTimeout(() => {
                if (videoRef.current && selectedDevice) {
                    // console.log('🔄 Restarting scanner after error')
                    processingRef.current = false
                    setIsProcessing(false)
                    startScanning(videoRef.current)
                }
            }, 2000)
        } finally {
            // Solo resetear el flag si NO hay auto-close
            if (!autoCloseOnSuccess) {
                setTimeout(() => {
                    processingRef.current = false
                    setIsProcessing(false)
                    // Reiniciar scanner
                    if (videoRef.current && selectedDevice) {
                        startScanning(videoRef.current)
                    }
                }, scanDelay)
            }
        }
    }

    const handleError = (error: Error) => {
        console.error('Scanner error:', error)
        
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
            setError('Permiso de cámara denegado. Por favor, habilita el acceso a la cámara.')
        } else if (error.message.includes('not found') || error.message.includes('NotFoundError')) {
            setError('No se encontró ninguna cámara disponible')
        } else if (error.message.includes('Camera API not available')) {
            setError('La cámara no está disponible. Asegúrate de usar HTTPS o localhost.')
        }
    }

    const {
        startScanning,
        stopScanning,
        isScanning,
        devices,
        selectedDevice,
        setSelectedDevice
    } = useCameraScanner({
        onScan: handleScan,
        onError: handleError,
        scanDelay: scanDelay * 2, // DUPLICAR el delay interno para más seguridad
        enableQR,
        enableBarcodes: true,
        onScanAttempt: (info) => {
            attemptCountRef.current += 1
            
            setDebugInfo(prev => {
                const newRecentAttempts = [
                    {
                        time: Date.now(),
                        hasResult: info.hasResult,
                        result: info.result,
                        format: info.format
                    },
                    ...prev.recentAttempts.slice(0, 4)
                ]
                
                return {
                    ...prev,
                    attempts: attemptCountRef.current,
                    successfulScans: successCountRef.current,
                    lastAttempt: Date.now(),
                    lastScan: info.result || prev.lastScan,
                    lastFormat: info.format || prev.lastFormat,
                    recentAttempts: newRecentAttempts
                }
            })
        }
    })

    // Iniciar scanner
    useEffect(() => {
        if (!videoRef.current || !selectedDevice || isProcessing) {
            return
        }

        let mounted = true

        const initScanner = async () => {
            if (isScanning) {
                stopScanning()
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            if (!mounted || isProcessing) return

            if (videoRef.current && selectedDevice) {
                await startScanning(videoRef.current)
                
                if (mounted) {
                    setDebugInfo(prev => ({
                        ...prev,
                        scanning: true,
                        videoSize: {
                            width: videoRef.current?.clientWidth || 0,
                            height: videoRef.current?.clientHeight || 0
                        }
                    }))
                }
            }
        }

        const timer = setTimeout(() => {
            initScanner()
        }, 100)

        return () => {
            mounted = false
            clearTimeout(timer)
        }
    }, [selectedDevice, enableQR, isProcessing])
    
    // Actualizar estado de scanning
    useEffect(() => {
        setDebugInfo(prev => ({
            ...prev,
            scanning: isScanning
        }))
    }, [isScanning])
    
    // Calcular FPS real
    useEffect(() => {
        if (!isScanning) {
            if (fpsIntervalRef.current) {
                clearInterval(fpsIntervalRef.current)
                fpsIntervalRef.current = null
            }
            return
        }
        
        let lastAttemptsCount = attemptCountRef.current
        let lastCheckTime = Date.now()
        
        fpsIntervalRef.current = setInterval(() => {
            const currentAttempts = attemptCountRef.current
            const currentTime = Date.now()
            const attemptsInInterval = currentAttempts - lastAttemptsCount
            const elapsedSeconds = (currentTime - lastCheckTime) / 1000
            const fps = Math.round(attemptsInInterval / elapsedSeconds)
            
            setDebugInfo(prev => ({
                ...prev,
                fps: fps
            }))
            
            lastAttemptsCount = currentAttempts
            lastCheckTime = currentTime
        }, 1000)
        
        return () => {
            if (fpsIntervalRef.current) {
                clearInterval(fpsIntervalRef.current)
            }
        }
    }, [isScanning])
    
    // Cleanup
    useEffect(() => {
        return () => {
            stopScanning()
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current)
            }
            if (fpsIntervalRef.current) {
                clearInterval(fpsIntervalRef.current)
            }
        }
    }, [])

    const getFrameSize = () => {
        if (orientation === 'landscape') {
            return { width: 'w-96', height: 'h-48' }
        }
        return { width: 'w-64', height: 'h-64' }
    }

    const frameSize = getFrameSize()

    return (
        <div className="fixed inset-0 z-50 bg-black">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-lg font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5" />
                        Escanear Código
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white hover:bg-white/20"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Controles */}
                <div className="space-y-3">
                    {devices.length > 1 && (
                        <Select 
                            value={selectedDevice} 
                            onValueChange={setSelectedDevice}
                            disabled={isProcessing}
                        >
                            <SelectTrigger className="bg-black/50 text-white border-white/30">
                                <SwitchCamera className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Seleccionar cámara" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.map((device) => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Cámara ${device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <div className="flex items-center justify-between bg-black/50 rounded-lg px-4 py-2">
                        <Label htmlFor="qr-toggle" className="text-white text-sm">
                            Habilitar códigos QR
                        </Label>
                        <Switch
                            id="qr-toggle"
                            checked={enableQR}
                            onCheckedChange={setEnableQR}
                            disabled={isProcessing}
                        />
                    </div>

                    {/* Indicador de orientación */}
                    {!enableQR && orientation === 'portrait' && !isProcessing && (
                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg px-4 py-2 flex items-center gap-2">
                            <RotateCw className="w-4 h-4 text-yellow-300" />
                            <span className="text-yellow-300 text-sm">
                                Gira el dispositivo horizontalmente para mejores resultados
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Video Container */}
            <div className="w-full h-full flex items-center justify-center bg-black">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    autoPlay
                    muted
                />
            </div>

            {/* Overlay de escaneo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`relative ${frameSize.width} ${frameSize.height}`}>
                    <div className={`absolute inset-0 border-2 rounded-lg shadow-lg transition-colors ${
                        isProcessing ? 'border-blue-500' : 'border-white'
                    }`}>
                        <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                            isProcessing ? 'border-blue-500' : 'border-green-500'
                        }`} />
                        <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                            isProcessing ? 'border-blue-500' : 'border-green-500'
                        }`} />
                        <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                            isProcessing ? 'border-blue-500' : 'border-green-500'
                        }`} />
                        <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                            isProcessing ? 'border-blue-500' : 'border-green-500'
                        }`} />
                        
                        {isScanning && !isProcessing && (
                            <div className="absolute inset-x-0 h-0.5 bg-green-500 animate-scan-line" />
                        )}

                        {/* Icono de éxito */}
                        {isProcessing && successMessage && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute -bottom-8 left-0 right-0 text-center text-white/80 text-xs">
                        {isProcessing 
                            ? '⏳ Procesando...' 
                            : enableQR ? '🔲 Modo QR + Código de Barras' : '📊 Modo Código de Barras'
                        }
                    </div>
                </div>
            </div>

            {/* Loading inicial */}
            {!isScanning && !error && !isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
                        <p className="text-white text-lg">Iniciando cámara...</p>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 space-y-2">
                {/* Debug Info Panel - Más pequeño
                <details className="bg-blue-500/20 rounded-lg border border-blue-500/50">
                    <summary className="cursor-pointer p-2 text-white text-xs font-mono">
                        📊 Debug Info (click para expandir)
                    </summary>
                    <div className="p-3 text-xs font-mono text-white space-y-2 max-h-48 overflow-y-auto">
                        <div className="grid grid-cols-3 gap-2">
                            <div>Scanner: {debugInfo.scanning ? '✅' : '❌'}</div>
                            <div className={
                                debugInfo.fps < 10 ? 'text-red-400' : 
                                debugInfo.fps < 20 ? 'text-yellow-400' : 
                                'text-green-400'
                            }>
                                FPS: {debugInfo.fps}
                            </div>
                            <div>
                                {orientation === 'landscape' ? '🔄 Horizontal' : '📱 Vertical'}
                            </div>
                        </div>

                        <div className="pt-2 border-t border-blue-500/30">
                            <div className="grid grid-cols-2 gap-2">
                                <div>Intentos: <span className="text-blue-300">{debugInfo.attempts}</span></div>
                                <div>Éxitos: <span className="text-green-400">{debugInfo.successfulScans}</span></div>
                            </div>
                        </div>

                        {debugInfo.recentAttempts.length > 0 && (
                            <div className="pt-2 border-t border-blue-500/30">
                                <div className="text-[10px] text-white/70 mb-1">
                                    📋 Últimos {debugInfo.recentAttempts.length} intentos:
                                </div>
                                <div className="space-y-1">
                                    {debugInfo.recentAttempts.map((attempt, i) => (
                                        <div 
                                            key={i}
                                            className={`text-[9px] p-1 rounded ${
                                                attempt.hasResult 
                                                    ? 'bg-green-500/20 text-green-300' 
                                                    : 'bg-gray-500/20 text-gray-400'
                                            }`}
                                        >
                                            {attempt.hasResult ? (
                                                <>
                                                    <div className="font-bold">✅ {attempt.format}</div>
                                                    <div className="truncate">{attempt.result}</div>
                                                </>
                                            ) : (
                                                <div>⭕ Sin código</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </details> */}
                
                {/* Estado actual - MÁS PROMINENTE */}
                {error ? (
                    <div className="text-center bg-red-500/20 rounded-lg p-4 border-2 border-red-500/50">
                        <p className="text-red-400 font-semibold">{error}</p>
                    </div>
                ) : successMessage ? (
                    <div className="text-center bg-green-500/20 rounded-lg p-4 border-2 border-green-500/50">
                        <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                        <p className="text-green-400 font-semibold">{successMessage}</p>
                        {lastScanned && (
                            <p className="text-white font-mono text-sm mt-2 break-all">{lastScanned}</p>
                        )}
                        {autoCloseOnSuccess && (
                            <p className="text-white/60 text-xs mt-2">Cerrando automáticamente...</p>
                        )}
                    </div>
                ) : isProcessing ? (
                    <div className="flex items-center justify-center gap-2 text-white bg-blue-500/20 rounded-lg p-4 border-2 border-blue-500/50">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="font-semibold">Procesando código...</span>
                    </div>
                ) : lastScanned && !isScanning ? (
                    <div className="text-center bg-green-500/20 rounded-lg p-3 border border-green-500/50">
                        <p className="text-white/60 text-sm">Último código:</p>
                        <p className="text-white font-mono text-lg break-all">{lastScanned}</p>
                    </div>
                ) : isScanning ? (
                    <div className="text-center bg-white/10 rounded-lg p-3 border border-white/30">
                        <p className="text-white/80 font-medium">
                            {enableQR ? '🔲 Coloca el QR o código de barras dentro del marco' : '📊 Coloca el código de barras dentro del marco'}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    )
}