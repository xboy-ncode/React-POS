// lib/users-adapter.ts
import { api } from './api'
import type { Role, Permission } from '../store/auth'

type User = {
    id: string
    name: string
    email: string
    role: Role
    permissions?: Permission[]
    createdAt?: string
    updatedAt?: string
    lastLogin?: string
    isActive?: boolean
}

// Mapear rol de DB a frontend
const mapRoleFromAPI = (dbRole: string): Role => {
    const roleMap: Record<string, Role> = {
        'ADMIN': 'admin',
        'CAJERO': 'cashier',
        'MANAGER': 'manager'
    }
    return roleMap[dbRole] || 'cashier'
}

// Mapear rol de frontend a DB
const mapRoleToAPI = (role: Role): string => {
    const roleMap: Record<Role, string> = {
        'admin': 'ADMIN',
        'cashier': 'CAJERO',
        'manager': 'MANAGER'
    }
    return roleMap[role] || 'CAJERO'
}

// Mapear usuario de API a frontend
const mapUserFromAPI = (apiUser: any): User => {
    return {
        id: apiUser.id_usuario.toString(),
        name: apiUser.nombre_usuario,
        email: apiUser.nombre_usuario + '@local.com', // Email ficticio ya que tu DB no lo tiene
        role: mapRoleFromAPI(apiUser.rol),
        createdAt: apiUser.fecha_creacion,
        updatedAt: apiUser.fecha_creacion,
        isActive: true, // Tu DB no tiene este campo, por defecto true
        permissions: getDefaultPermissionsForRole(mapRoleFromAPI(apiUser.rol))
    }
}

// Obtener permisos por defecto según rol
function getDefaultPermissionsForRole(role: Role): Permission[] {
    const permissionsByRole: Record<Role, Permission[]> = {
        admin: [
            'inventory:read', 'inventory:write',
            'sales:read', 'sales:write',
            'customers:read', 'customers:write',
            'users:read', 'users:write',
            'settings:write'
        ],
        manager: [
            'inventory:read', 'inventory:write',
            'sales:read', 'sales:write',
            'customers:read', 'customers:write',
            'users:read'
        ],
        cashier: [
            'inventory:read',
            'sales:read', 'sales:write',
            'customers:read'
        ]
    }
    return permissionsByRole[role] || []
}

// Cargar todos los usuarios
export async function loadUsers(): Promise<{ items: User[], total: number }> {
    try {
        const response = await api('/users')

        if (response?.usuarios && Array.isArray(response.usuarios)) {
            const users = response.usuarios.map(mapUserFromAPI)
            return {
                items: users,
                total: users.length
            }
        }

        return { items: [], total: 0 }
    } catch (error: any) {
        console.error('Error loading users:', error)
        throw new Error(error.message || 'Error al cargar usuarios')
    }
}

// Obtener usuario por ID
export async function getUser(id: string): Promise<User> {
    try {
        const response = await api(`/users/${id}`)
        return mapUserFromAPI(response)
    } catch (error: any) {
        console.error('Error getting user:', error)
        throw new Error(error.message || 'Error al obtener usuario')
    }
}

// Crear nuevo usuario
export async function createUser(userData: Partial<User> & { password?: string }): Promise<User> {
    try {
        const payload = {
            nombre_usuario: userData.name?.trim(),
            clave: userData.password || generatePassword(),
            rol: mapRoleToAPI(userData.role || 'cashier')
        }

        console.log('Creando usuario - Enviando a API:', payload)

        const response = await api('/users', {
            method: 'POST',
            body: JSON.stringify(payload)
        })

        return mapUserFromAPI(response.usuario)
    } catch (error: any) {
        console.error('Error creating user:', error)
        throw new Error(error.message || 'Error al crear usuario')
    }
}

// Actualizar usuario existente
export async function updateUser(id: string, userData: Partial<User> & { password?: string }): Promise<User> {
    try {
        const payload: any = {}

        if (userData.name !== undefined) {
            payload.nombre_usuario = userData.name.trim()
        }

        if (userData.password) {
            payload.clave = userData.password
        }

        if (userData.role !== undefined) {
            payload.rol = mapRoleToAPI(userData.role)
        }

        console.log('Actualizando usuario - Enviando a API:', payload)

        const response = await api(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        })

        return mapUserFromAPI(response.usuario)
    } catch (error: any) {
        console.error('Error updating user:', error)
        throw new Error(error.message || 'Error al actualizar usuario')
    }
}

// Eliminar usuario
export async function deleteUser(id: string): Promise<void> {
    try {
        await api(`/users/${id}`, {
            method: 'DELETE'
        })
    } catch (error: any) {
        console.error('Error deleting user:', error)
        throw new Error(error.message || 'Error al eliminar usuario')
    }
}

// Generar contraseña aleatoria
function generatePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}