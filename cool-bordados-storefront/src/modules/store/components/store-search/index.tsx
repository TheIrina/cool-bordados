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
    <div className="w-full max-w-[320px] relative group">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Buscar productos..."
          className="w-full h-11 pl-11 pr-10 text-sm bg-[#1a1a1a]/90 backdrop-blur-sm text-white placeholder:text-white/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 hover:bg-[#1a1a1a] hover:border-white/15 transition-all duration-200"
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/50">
            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {query ? (
            <button
              onClick={() => {
                setQuery("")
                debouncedSearch("")
              }}
              className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 focus:outline-none transition-all duration-200"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default StoreSearch
