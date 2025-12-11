"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import debounce from "lodash/debounce"

const StoreSearch = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  // Sync internal state with URL params
  useEffect(() => {
    setQuery(searchParams.get("q") || "")
  }, [searchParams])

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      if (value === "") {
        params.delete(name)
      } else {
        params.set(name, value)
      }

      return params.toString()
    },
    [searchParams]
  )

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      const query = createQueryString("q", value)
      router.push(`${pathname}?${query}`)
    }, 500),
    [pathname, createQueryString, router]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    debouncedSearch(val)
  }

  return (
    <div className="w-full max-w-[300px] relative group">
       <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Buscar productos..."
            className="w-full h-10 pl-3 pr-10 text-sm bg-ui-bg-field border border-ui-border-base rounded-md focus:outline-none focus:ring-0 focus:shadow-none focus:border-gray-900 hover:bg-ui-bg-field-hover transition-all"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {query ? (
                <button 
                    onClick={() => {
                        setQuery("")
                        debouncedSearch("")
                    }}
                    className="text-ui-fg-subtle hover:text-ui-fg-base focus:outline-none"
                >
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                </button>
            ) : (
                <div className="text-ui-fg-muted pointer-events-none">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
          </div>
       </div>
    </div>
  )
}

export default StoreSearch
