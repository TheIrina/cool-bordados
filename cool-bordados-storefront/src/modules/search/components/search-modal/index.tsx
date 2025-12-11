"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import { searchProducts } from "@modules/search/actions"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState, useTransition } from "react"
import Modal from "@modules/common/components/modal"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import debounce from "lodash/debounce"

export default function SearchModal() {
  const { state: isOpen, open, close } = useToggleState()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const params = useParams()
  const countryCode = params?.countryCode as string

  const debouncedSearch = useCallback(
    debounce((q: string, cc: string) => {
      if (!q) {
        setResults([])
        return
      }
      startTransition(async () => {
        try {
          const products = await searchProducts(q, cc)
          setResults(products)
        } catch (e) {
          console.error(e)
        }
      })
    }, 500),
    []
  )

  useEffect(() => {
    debouncedSearch(query, countryCode)
    return () => {
      debouncedSearch.cancel()
    }
  }, [query, countryCode, debouncedSearch])

  useEffect(() => {
    if (!isOpen) {
      setQuery("")
      setResults([])
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      close()
      // Use window.location for full navigation or router.push if within Next.js context properly
      // We are in a client component, so router.push is fine.
      // But we need to make sure we construct the URL correctly.
      // Since we want to go to /store, we can just push.
      const searchParams = new URLSearchParams()
      searchParams.set("q", query)
      window.location.href = `/store?${searchParams.toString()}`
    }
  }

  return (
    <>
      <button onClick={open} className="hover:text-gray-300">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Modal isOpen={isOpen} close={close} size="large" search>
        <div className="flex flex-col w-full bg-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl max-h-[80vh] min-h-[200px] mt-16 border border-white/10 ring-1 ring-white/5">
          {/* Search Header */}
          <div className="flex items-center border-b border-white/10 p-5 gap-4 bg-gradient-to-r from-[#121212] to-[#1a1a1a]">
            <div className="p-2 bg-white/5 rounded-xl">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/60">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-xl text-white placeholder:text-white/40 font-light tracking-wide"
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button onClick={close} className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group">
              <span className="sr-only">Cerrar</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/40 group-hover:text-white/80 transition-colors">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#0f0f0f]/50">
            {isPending && (
              <div className="flex items-center justify-center gap-3 py-12">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
                <span className="text-white/50 text-sm tracking-wide">Buscando...</span>
              </div>
            )}

            {!isPending && query && results.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/30">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm">No se encontraron productos para</p>
                <p className="text-white/70 font-medium mt-1">"{query}"</p>
              </div>
            )}

            {!isPending && !query && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/30">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-white/50 text-sm">Escribe para buscar productos</p>
                <p className="text-white/30 text-xs mt-2">Presiona Enter para ir a la tienda</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2">
              {results.map((product) => (
                <LocalizedClientLink
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-all duration-200 group border border-transparent hover:border-white/10"
                  onClick={close}
                >
                  <div className="h-16 w-16 relative flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10 group-hover:border-white/20 transition-colors">
                    <Thumbnail thumbnail={product.thumbnail} size="full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-base text-white/90 group-hover:text-white transition-colors">{product.title}</span>
                    {product.collection && (
                      <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{product.collection.title}</span>
                    )}
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/50">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
