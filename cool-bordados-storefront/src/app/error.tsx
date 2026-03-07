"use client"

import { ArrowUpRightMini } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import Link from "next/link"
import { useEffect } from "react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
            <h1 className="text-2xl-semi text-ui-fg-base">Error del Servidor</h1>
            <p className="text-small-regular text-ui-fg-base">
                Ha ocurrido un error inesperado. Por favor, intenta de nuevo más tarde.
            </p>
            <div className="flex gap-4 mt-4">
                <button
                    className="flex gap-x-1 items-center group bg-ui-bg-interactive text-ui-fg-on-color px-4 py-2 rounded-md hover:bg-ui-bg-interactive-hover"
                    onClick={() => reset()}
                >
                    <Text>Intentar de nuevo</Text>
                </button>
                <Link
                    className="flex gap-x-1 items-center group px-4 py-2 rounded-md border border-ui-border-base hover:bg-ui-bg-subtle"
                    href="/"
                >
                    <Text>Ir a la página principal</Text>
                    <ArrowUpRightMini
                        className="group-hover:rotate-45 ease-in-out duration-150"
                    />
                </Link>
            </div>
        </div>
    )
}
