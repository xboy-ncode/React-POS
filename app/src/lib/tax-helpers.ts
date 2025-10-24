// lib/tax-helpers.ts
export const IGV_RATE = 0.18 // 18%

export function calculateTaxBreakdown(subtotal: number) {
    // El total NO incluye IGV, entonces:
    // subtotal = precio sin IGV
    // igv = subtotal * 0.18
    // total = subtotal + igv
    
    const igv = subtotal * IGV_RATE
    const total = subtotal + igv
    
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        igv: parseFloat(igv.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    }
}