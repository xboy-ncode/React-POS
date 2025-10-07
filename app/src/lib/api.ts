
import { useAuth } from '../store/auth'

// Lightweight API wrapper using fetch
export async function api(path: string, options: RequestInit = {}) {
    const token = useAuth.getState().token
    const res = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
    })
    if (!res.ok) {
        const text = await res.text()
        throw new Error(text || res.statusText)
    }
    try {
        return await res.json()
    } catch {
        return null
    }
}
