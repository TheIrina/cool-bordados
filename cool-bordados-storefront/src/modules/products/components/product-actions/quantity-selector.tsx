"use client"

import { clx } from "@medusajs/ui"
import React from "react"

type QuantitySelectorProps = {
    quantity: number
    onChange: (qty: number) => void
    max?: number
    disabled?: boolean
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
    quantity,
    onChange,
    max,
    disabled = false,
}) => {
    const handleDecrement = () => {
        if (quantity > 1) {
            onChange(quantity - 1)
        }
    }

    const handleIncrement = () => {
        if (max === undefined || quantity < max) {
            onChange(quantity + 1)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10)
        if (!isNaN(value) && value >= 1) {
            if (max !== undefined && value > max) {
                onChange(max)
            } else {
                onChange(value)
            }
        }
    }

    const canDecrement = quantity > 1 && !disabled
    const canIncrement = (max === undefined || quantity < max) && !disabled

    return (
        <div className="flex flex-col gap-y-2">
            <span className="text-sm">Cantidad</span>
            <div className="inline-flex items-center border border-ui-border-base rounded-rounded overflow-hidden w-fit">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={!canDecrement}
                    className={clx(
                        "flex items-center justify-center w-10 h-10 transition-all duration-150",
                        {
                            "bg-ui-bg-subtle hover:bg-ui-bg-base-hover text-ui-fg-base cursor-pointer": canDecrement,
                            "bg-ui-bg-disabled text-ui-fg-disabled cursor-not-allowed": !canDecrement,
                        }
                    )}
                    aria-label="Disminuir cantidad"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
                <input
                    type="number"
                    value={quantity}
                    onChange={handleInputChange}
                    disabled={disabled}
                    min={1}
                    max={max}
                    className={clx(
                        "w-14 h-10 text-center text-sm font-medium border-x border-ui-border-base focus:outline-none focus:ring-0",
                        "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                        {
                            "bg-ui-bg-disabled text-ui-fg-disabled": disabled,
                            "bg-ui-bg-base text-ui-fg-base": !disabled,
                        }
                    )}
                    aria-label="Cantidad"
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={!canIncrement}
                    className={clx(
                        "flex items-center justify-center w-10 h-10 transition-all duration-150",
                        {
                            "bg-ui-bg-subtle hover:bg-ui-bg-base-hover text-ui-fg-base cursor-pointer": canIncrement,
                            "bg-ui-bg-disabled text-ui-fg-disabled cursor-not-allowed": !canIncrement,
                        }
                    )}
                    aria-label="Aumentar cantidad"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
            </div>
            {max !== undefined && max > 0 && (
                <span className="text-xs text-ui-fg-subtle">
                    {max} disponibles
                </span>
            )}
        </div>
    )
}

export default QuantitySelector
