"use client"

import { listCollections } from "@lib/data/collections"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Fragment, useEffect, useState } from "react"
import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"

const CollectionsDropdown = () => {
  const [collections, setCollections] = useState<HttpTypes.StoreCollection[]>(
    []
  )
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const open = () => setDropdownOpen(true)
  const close = () => setDropdownOpen(false)

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const { collections } = await listCollections()
        setCollections(collections)
      } catch (error) {
        console.error("Failed to fetch collections", error)
      }
    }

    fetchCollections()
  }, [])

  return (
    <div
      className="h-full z-50"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <Popover className="relative h-full">
        <PopoverButton className="h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-gray-300 uppercase font-medium tracking-wider">
          Colecciones
        </PopoverButton>
        <Transition
          show={dropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+15px)] -left-4 w-[280px] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-200"
          >
            <div className="p-5 border-b border-neutral-800 bg-black/20">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Colecciones</h3>
            </div>
            <div className="overflow-y-auto max-h-[400px] p-2 flex flex-col gap-1">
              {collections.map((collection) => (
                <LocalizedClientLink
                  key={collection.id}
                  className="px-3 py-2.5 rounded-lg hover:bg-neutral-800/80 hover:text-white transition-all duration-200 text-sm font-medium"
                  href={`/collections/${collection.handle}`}
                >
                  {collection.title}
                </LocalizedClientLink>
              ))}
            </div>
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CollectionsDropdown