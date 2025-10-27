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
        <PopoverButton className="h-full">
          <LocalizedClientLink
            className="hover:text-gray-300"
            href="/collections"
          >
            Colecciones
          </LocalizedClientLink>
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
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-white border-x border-b border-gray-200 w-[200px] text-ui-fg-base"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">Colecciones</h3>
            </div>
            <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-4 no-scrollbar p-px">
              {collections.map((collection) => (
                <LocalizedClientLink
                  key={collection.id}
                  className="block hover:text-gray-300"
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