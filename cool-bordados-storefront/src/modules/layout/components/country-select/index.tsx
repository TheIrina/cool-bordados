"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { Fragment, useEffect, useMemo, useState } from "react"
import ReactCountryFlag from "react-country-flag"

import { StateType } from "@lib/hooks/use-toggle-state"
import { useParams, usePathname } from "next/navigation"
import { updateRegion } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"

type CountryOption = {
  country: string
  region: string
  label: string
}

type CountrySelectProps = {
  toggleState: StateType
  regions: HttpTypes.StoreRegion[]
}

const CountrySelect = ({ toggleState, regions }: CountrySelectProps) => {
  const [current, setCurrent] = useState<
    | { country: string | undefined; region: string; label: string | undefined }
    | undefined
  >(undefined)

  const { countryCode } = useParams()
  const currentPath = usePathname().split(`/${countryCode}`)[1]

  const { state, close } = toggleState

  const options: CountryOption[] = useMemo(() => {
    return regions
      ?.map((region) => {
        return region.countries?.map((country) => ({
          country: country.iso_2,
          region: region.id,
          label: country.display_name,
        }))
      })
      .flat()
      .filter((option): option is CountryOption => 
        Boolean(option && option.country && option.label)
      )
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [regions])

  useEffect(() => {
    if (countryCode) {
      const option = options?.find((o) => o?.country === countryCode)
      setCurrent(option)
    }
  }, [options, countryCode])

  const handleChange = (option: CountryOption) => {
    updateRegion(option.country, currentPath)
    close()
  }

  return (
    <div className="relative w-full">
      <Listbox
        as="div"
        onChange={handleChange}
        defaultValue={
          countryCode
            ? options?.find((o) => o?.country === countryCode)
            : undefined
        }
      >
        <ListboxButton className="w-full py-2 px-3 rounded-lg hover:bg-neutral-800/50 transition-colors text-left focus:outline-none">
          <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold mb-1">Envío a</div>
          <div className="flex items-center gap-x-2 text-sm font-medium text-neutral-200">
            {current && (
              <>

                <ReactCountryFlag
                  svg
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "2px",
                  }}
                  countryCode={current.country ?? ""}
                />
                <span className="truncate">{current.label}</span>
              </>
            )}
          </div>
        </ListboxButton>

        <Transition
          show={state}
          as={Fragment}
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions
            static
            className="absolute bottom-full left-0 mb-2 w-full min-w-[240px] max-h-[300px] overflow-y-auto z-[100] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1 no-scrollbar focus:outline-none"
          >
            <div className="px-3 py-2 border-b border-neutral-800 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">Seleccionar país</span>
            </div>
            {options?.map((o, index) => (
              <ListboxOption
                key={index}
                value={o}
                className={({ active }) => clx(
                  "py-2.5 px-3 rounded-lg cursor-pointer flex items-center gap-x-3 text-sm transition-all duration-200",
                  active ? "bg-neutral-800 text-white" : "text-neutral-400 hover:text-neutral-200"
                )}
              >

                <ReactCountryFlag
                  svg
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                  }}
                  countryCode={o?.country ?? ""}
                />
                <span className="font-medium">{o?.label}</span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </Listbox>
    </div>
  )
}

export default CountrySelect
