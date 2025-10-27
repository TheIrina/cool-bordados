"use client"

import React, { useState, useEffect } from "react"

const messages = [
  "🚚 ENVÍO GRATIS A TODO EL PAÍS",
  "💳 PAGOS SEGUROS",
  "💬 ATENCIÓN PERSONALIZADA",
]

const Banner = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white text-black py-2">
      <div className="container mx-auto flex items-center justify-center">
        <p className="text-sm font-light">
          {messages[currentMessageIndex]}
        </p>
      </div>
    </div>
  )
}

export default Banner