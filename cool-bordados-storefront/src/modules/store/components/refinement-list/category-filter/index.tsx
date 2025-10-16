"use client"

import FilterRadioGroup from "@modules/common/components/filter-radio-group"

type Category = {
  id: string
  name: string
  category_children?: Category[]
}

type Props = {
  categories: Category[]
  selectedCategoryId?: string
  setQueryParams: (name: string, value: string) => void
  "data-testid"?: string
}

const flattenCategories = (cats: Category[] = []): { id: string; name: string }[] => {
  const out: { id: string; name: string }[] = []
  const walk = (c: Category) => {
    out.push({ id: c.id, name: c.name })
    if (Array.isArray(c.category_children)) {
      c.category_children.forEach(walk)
    }
  }
  cats.forEach(walk)
  return out
}

const CategoryFilter = ({
  categories,
  selectedCategoryId,
  setQueryParams,
  "data-testid": dataTestId,
}: Props) => {
  const flattened = flattenCategories(categories)

  const items = [
    { value: "all", label: "Categoría: Todas" },
    ...flattened.map((c) => ({ value: c.id, label: c.name })),
  ]

  const value = selectedCategoryId ?? "all"

  const handleChange = (val: string) => {
    if (val === "all") {
      setQueryParams("categoryId", "")
    } else {
      setQueryParams("categoryId", val)
    }
  }

  return (
    <FilterRadioGroup
      title="Categoría"
      items={items}
      value={value}
      handleChange={handleChange}
      data-testid={dataTestId}
    />
  )
}

export default CategoryFilter