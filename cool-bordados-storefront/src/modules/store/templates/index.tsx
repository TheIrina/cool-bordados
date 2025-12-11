import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { listCategories } from "@lib/data/categories"
import PaginatedProducts from "./paginated-products"
import StoreSearch from "@modules/store/components/store-search"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  categoryId,
  searchQuery,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  categoryId?: string
  searchQuery?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const categories = await listCategories()

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} categories={categories} selectedCategoryId={categoryId} searchQuery={searchQuery} />
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-4">
          <h1 className="text-2xl-semi" data-testid="store-page-title">Todos los productos</h1>
          <StoreSearch />
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={countryCode}
            categoryId={categoryId}
            searchQuery={searchQuery}
          />
        </Suspense>
      </div>
    </div>
  )
}

export default StoreTemplate
