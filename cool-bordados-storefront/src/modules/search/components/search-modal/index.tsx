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
        <div className="flex flex-col w-full bg-white rounded-lg overflow-hidden shadow-2xl max-h-[80vh] min-h-[200px] mt-20 border border-gray-100">
            <div className="flex items-center border-b border-gray-100 p-4 gap-4">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <input 
                    type="text"
                    className="flex-1 outline-none text-xl placeholder:text-gray-300 font-light"
                    placeholder="Buscar productos..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                <button onClick={close} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <span className="sr-only">Close</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-400">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                {isPending && <div className="text-center py-10 text-gray-400 text-sm">Buscando...</div>}
                
                {!isPending && query && results.length === 0 && (
                    <div className="text-center py-10 text-gray-400 text-sm">No se encontraron productos para "{query}"</div>
                )}
                
                {!isPending && !query && (
                    <div className="text-center py-10 text-gray-400 text-sm">Escribe para buscar productos</div>
                )}

                <div className="grid grid-cols-1 gap-2">
                    {results.map((product) => (
                        <LocalizedClientLink
                            key={product.id}
                            href={`/products/${product.handle}`}
                            className="flex items-center gap-4 p-3 hover:bg-white hover:shadow-sm rounded-lg transition-all group border border-transparent hover:border-gray-100"
                            onClick={close}
                        >
                            <div className="h-16 w-16 relative flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                <Thumbnail thumbnail={product.thumbnail} size="full" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="font-medium text-base text-gray-900 group-hover:text-black transition-colors">{product.title}</span>
                                {product.collection && (
                                  <span className="text-xs text-gray-500">{product.collection.title}</span>
                                )}
                            </div>
                            <div className="ml-auto">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-300 group-hover:text-gray-500 -rotate-90">
                                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
