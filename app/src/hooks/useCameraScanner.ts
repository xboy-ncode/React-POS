// src/hooks/useCameraScanner.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat, NotFoundException } from '@zxing/library'

export interface CameraScannerOptions {
    onScan: (result: string) => void
    onError?: (error: Error) => void
    scanDelay?: number
    enableQR?: boolean
    enableBarcodes?: boolean
    formats?: BarcodeFormat[]
    onScanAttempt?: (info: {
        frameNumber: number
        hasResult: boolean
        result?: string
        format?: string
        error?: string
    }) => void
}

export const useCameraScanner = ({
    onScan,
    onError,
    scanDelay = 300,
    enableQR = false,
    enableBarcodes = true,
    formats,
    onScanAttempt
}: CameraScannerOptions) => {
    const [isScanning, setIsScanning] = useState(false)
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
    const [selectedDevice, setSelectedDevice] = useState<string>('')
    const devicesLoadedRef = useRef(false)
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
    const lastScanRef = useRef<string>('')
    const lastScanTimeRef = useRef<number>(0)
    const scanningRef = useRef<boolean>(false)

    // Inicializar el lector
    useEffect(() => {
        const hints = new Map()
        const allowedFormats: BarcodeFormat[] = []

        if (formats) {
            allowedFormats.push(...formats)
        } else {
            if (enableBarcodes) {
                allowedFormats.push(
                    BarcodeFormat.EAN_13,
                    BarcodeFormat.EAN_8,
                    BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E,
                    BarcodeFormat.CODE_128,
                    BarcodeFormat.CODE_39,
                    BarcodeFormat.CODE_93,
                    BarcodeFormat.ITF,
                    BarcodeFormat.CODABAR
                )
            }
            if (enableQR) {
                allowedFormats.push(
                    BarcodeFormat.QR_CODE,
                    BarcodeFormat.DATA_MATRIX,
                    BarcodeFormat.AZTEC
                )
            }
        }

        hints.set(DecodeHintType.POSSIBLE_FORMATS, allowedFormats)
        hints.set(DecodeHintType.TRY_HARDER, true)
        
        // NUEVO: Hints específicos para mejorar detección de QR
        if (enableQR) {
            hints.set(DecodeHintType.PURE_BARCODE, false) // Buscar en toda la imagen
            // Permitir que el decodificador sea más agresivo con QR codes
        }

        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
            scanningRef.current = false
            setIsScanning(false)
        }

        // Crear reader y asegurarnos de aplicar los hints aunque la versión de la librería
        // no acepte los hints en el constructor (algunos builds los ignoran).
        const reader = new BrowserMultiFormatReader()
        // Preferir API setHints si existe, sino asignar la propiedad internamente
        try {
            if (typeof (reader as any).setHints === 'function') {
                ;(reader as any).setHints(hints)
            } else {
                ;(reader as any).hints = hints
            }
        } catch (e) {
            console.warn('No se pudo aplicar hints vía setHints(), se asignan directamente:', e)
            ;(reader as any).hints = hints
        }
        codeReaderRef.current = reader
        // console.log('🔄 Code reader reinitialized with formats:', allowedFormats.map(f => BarcodeFormat[f]))

        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset()
            }
        }
    }, [enableQR, enableBarcodes, formats])

    // Obtener dispositivos
    useEffect(() => {
        if (devicesLoadedRef.current) {
            return
        }
        
        devicesLoadedRef.current = true
        
        const getDevices = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    const error = new Error(
                        'Camera API not available. Please ensure:\n' +
                        '1. You are using HTTPS (or localhost)\n' +
                        '2. Your browser supports camera access\n' +
                        '3. Camera permissions are granted'
                    )
                    console.error('MediaDevices API not available:', error)
                    onError?.(error)
                    return
                }

                // MEJORADO: Solicitar resolución más alta para mejor detección de QR
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1920, min: 1280 },
                        height: { ideal: 1080, min: 720 },
                        frameRate: { ideal: 30, min: 15 }
                    }
                })
                
                stream.getTracks().forEach(track => track.stop())
                
                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter((device: MediaDeviceInfo) => device.kind === 'videoinput')
                
                setDevices(videoDevices)
                
                if (videoDevices.length === 0) {
                    const error = new Error('No camera devices found')
                    console.error(error)
                    onError?.(error)
                    return
                }
                
                const backCamera = videoDevices.find((device: MediaDeviceInfo) => {
                    const label = device.label.toLowerCase()
                    return label.includes('back') || 
                           label.includes('trasera') ||
                           label.includes('rear') ||
                           label.includes('environment')
                })
                
                const deviceToUse = backCamera?.deviceId || videoDevices[0]?.deviceId || ''
                setSelectedDevice(deviceToUse)
            } catch (error) {
                console.error('Error accessing camera:', error)
                onError?.(error as Error)
            }
        }
        getDevices()
    }, [])

    const startScanning = useCallback(async (videoElement: HTMLVideoElement) => {
        if (!codeReaderRef.current || !selectedDevice || scanningRef.current) {
            console.log('Cannot start scanning:', {
                hasReader: !!codeReaderRef.current,
                hasDevice: !!selectedDevice,
                alreadyScanning: scanningRef.current
            })
            return
        }

        try {
            scanningRef.current = true
            setIsScanning(true)

            videoElement.setAttribute('playsinline', 'true')
            videoElement.setAttribute('autoplay', 'true')
            videoElement.setAttribute('muted', 'true')
            videoElement.style.width = '100%'
            videoElement.style.height = '100%'
            videoElement.style.objectFit = 'cover'
            
            // console.log('🎥 Starting scanner with device:', selectedDevice)
            
            let frameCount = 0
        
            
            await codeReaderRef.current.decodeFromVideoDevice(
                selectedDevice,
                videoElement,
                (result, error) => {
                    frameCount++
                    
                    if (onScanAttempt) {
                        if (result) {
                            const code = result.getText()
                            const format = BarcodeFormat[result.getBarcodeFormat()]
                            onScanAttempt({
                                frameNumber: frameCount,
                                hasResult: true,
                                result: code,
                                format: format
                            })
                        } else if (error && !(error instanceof NotFoundException)) {
                            onScanAttempt({
                                frameNumber: frameCount,
                                hasResult: false,
                                error: error.message
                            })
                        } else {
                            onScanAttempt({
                                frameNumber: frameCount,
                                hasResult: false
                            })
                        }
                    }
                    
                    if (frameCount % 30 === 0) {


                    
                    }
                    
                    if (result) {
                        const code = result.getText()
                        const now = Date.now()

                        // console.log('✅ CODE DETECTED!', {
                        //     code,
                        //     format,
                        //     length: code.length
                        // })

                        if (code !== lastScanRef.current || now - lastScanTimeRef.current > scanDelay) {
                            lastScanRef.current = code
                            lastScanTimeRef.current = now
                            // console.log('🎯 Calling onScan with:', code)
                            onScan(code)
                        } else {
                            // console.log('⏭️ Skipping duplicate scan')
                        }
                    } else {
                        // Fallback: cada N frames intentamos decodificar con rotaciones
                        if (frameCount % 15 === 0) {
                            // try-rotations async but don't block the callback
                            ;(async () => {
                                try {
                                    const success = await tryDecodeCanvasRotations(videoElement)
                                    if (success) {
                                        // nothing else, tryDecodeCanvasRotations llamará a onScan
                                    }
                                } catch (e) {
                                    // ignore
                                }
                            })()
                        }
                    }
                    
                    if (error && !(error instanceof NotFoundException)) {
                            if (error.message && 
                            !error.message.includes('source width is 0') &&
                            !error.message.includes('already playing')) {
                            // console.warn('⚠️ Decode error:', error.message)
                        }
                    }
                }
            )
            
            // console.log('✅ Scanner initialized successfully')
            
        } catch (error) {
            console.error('❌ Error starting scanner:', error)
            scanningRef.current = false
            setIsScanning(false)
            onError?.(error as Error)
        }
    }, [selectedDevice, onScan, onError, scanDelay, onScanAttempt])

    const stopScanning = useCallback(() => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset()
        }
        scanningRef.current = false
        setIsScanning(false)
        lastScanRef.current = ''
    }, [])

    return {
        startScanning,
        stopScanning,
        isScanning,
        devices,
        selectedDevice,
        setSelectedDevice
    }
}
async function tryDecodeCanvasRotations(videoElement: HTMLVideoElement): Promise<boolean> {
    if (!videoElement) return false

    const vw = videoElement.videoWidth || videoElement.clientWidth || 640
    const vh = videoElement.videoHeight || videoElement.clientHeight || 480

    const rotations = [0, 90, 180, 270]
    const DetectorCtor = (window as any).BarcodeDetector

    // Preferred: native BarcodeDetector if available
    const useNative = typeof DetectorCtor === 'function'
    const nativeFormats = [
        'qr_code',
        'data_matrix',
        'aztec',
        'ean_13',
        'ean_8',
        'upc_a',
        'upc_e',
        'code_128',
        'code_39'
    ]

    for (const rot of rotations) {
        // create a canvas sized appropriately for the rotation
        const cw = rot % 180 === 0 ? vw : vh
        const ch = rot % 180 === 0 ? vh : vw
        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        const ctx = canvas.getContext('2d')
        if (!ctx) continue

        // draw the video frame rotated onto the canvas
        ctx.save()
        // move to center
        ctx.translate(cw / 2, ch / 2)
        ctx.rotate((rot * Math.PI) / 180)
        // drawImage expects top-left coordinates relative to the rotated context
        ctx.drawImage(videoElement, -vw / 2, -vh / 2, vw, vh)
        ctx.restore()

        // Try native Detector first (fast)
        if (useNative) {
            try {
                const detector = new DetectorCtor({ formats: nativeFormats })
                // detector.detect accepts HTMLCanvasElement
                const results = await detector.detect(canvas as any)
                if (results && results.length > 0) {
                    // dispatch an event with the detection so callers can hook into it
                    const detail = { result: results[0].rawValue, format: results[0].format }
                    videoElement.dispatchEvent(new CustomEvent('camera-scanner-rotated-scan', { detail }))
                    return true
                }
            } catch {
                // fall through to next rotation / fallback
            }
        }

        // Fallback: try using image -> data URL. Some ZXing builds can decode from an <img> element or image data,
        // but we don't assume a specific API here. Provide a minimal fallback attempting to create an ImageBitmap
        // and again dispatching if the browser recognizes it (useful for external handlers).
        try {
            if ('createImageBitmap' in window) {
                const bitmap = await createImageBitmap(canvas)
                // dispatch event containing bitmap for external decoders (if any listener wants to use it)
                const detail = { bitmap, rotation: rot }
                videoElement.dispatchEvent(new CustomEvent('camera-scanner-rotated-bitmap', { detail }))
                // consumer can attempt to decode the bitmap via other means; we treat generation as success only
                // if a listener handles it. Since we cannot synchronously know that, continue to next rotation.
                bitmap.close()
            }
        } catch {
            // ignore and continue
        }
    }

    return false
}

