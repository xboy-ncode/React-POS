import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type ColorTheme = "orange" | "yellow" | "rose" | "green" | "blue" | "violet" 

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    defaultColorTheme?: ColorTheme
    storageKey?: string
    colorStorageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    colorTheme: ColorTheme
    setTheme: (theme: Theme) => void
    setColorTheme: (colorTheme: ColorTheme) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    colorTheme: "orange",
    setTheme: () => null,
    setColorTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    defaultColorTheme = "orange",
    storageKey = "vite-ui-theme",
    colorStorageKey = "vite-ui-color-theme",
    ...props
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )
    
    const [colorTheme, setColorTheme] = useState<ColorTheme>(
        () => (localStorage.getItem(colorStorageKey) as ColorTheme) || defaultColorTheme
    )

    useEffect(() => {
        const root = window.document.documentElement

        // Remove all theme classes
        root.classList.remove("light", "dark")
        root.classList.remove("theme-orange", "theme-yellow", "theme-rose", "theme-green", "theme-blue", "theme-violet")

        // Apply dark/light theme
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
        } else {
            root.classList.add(theme)
        }

        // Apply color theme (orange is default, no class needed)
        if (colorTheme !== "orange") {
            root.classList.add(`theme-${colorTheme}`)
        }
    }, [theme, colorTheme])

    const value = {
        theme,
        colorTheme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        setColorTheme: (colorTheme: ColorTheme) => {
            localStorage.setItem(colorStorageKey, colorTheme)
            setColorTheme(colorTheme)
        },
    }

    return (
        <ThemeProviderContext.Provider {...props} value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}