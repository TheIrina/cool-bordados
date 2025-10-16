"use client"
import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React, { useMemo, useState, useRef } from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  // TODO: Fix image typings
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  // Build ordered list of image urls (include thumbnail if present)
  const imageUrls = useMemo(() => {
    const list = (images || [])
      .map((img) => (typeof img === "string" ? img : img?.url))
      .filter(Boolean) as string[]

    if (thumbnail && !list.includes(thumbnail)) {
      return [thumbnail, ...list]
    }
    return list.length ? list : thumbnail ? [thumbnail] : []
  }, [images, thumbnail])

  const [index, setIndex] = useState(0)

  // Touch swipe support
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  const showPrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)
  }

  const showNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIndex((prev) => (prev + 1) % imageUrls.length)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const start = touchStartX.current
    const end = touchEndX.current
    touchStartX.current = null
    touchEndX.current = null
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) > 40) {
      // swipe right -> previous, swipe left -> next
      if (delta > 0) {
        showPrev()
      } else {
        showNext()
      }
    }
  }

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-4 bg-ui-bg-subtle shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-shadow ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {imageUrls.length ? (
        <>
          <Image
            key={imageUrls[index]}
            src={imageUrls[index]}
            alt="Thumbnail"
            className="absolute inset-0 object-cover object-center transition-opacity duration-200"
            draggable={false}
            quality={50}
            sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
            fill
            priority={false}
          />

          {imageUrls.length > 1 && (
            <>
              {/* Controls */}
              <button
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={showPrev}
              >
                ‹
              </button>
              <button
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={showNext}
              >
                ›
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {imageUrls.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir a imagen ${i + 1}`}
                    className={clx(
                      "h-1.5 w-1.5 rounded-full transition-opacity",
                      i === index ? "bg-white" : "bg-white/50"
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIndex(i)
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <ImageOrPlaceholder image={undefined} size={size} />
      )}
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  return image ? (
    <Image
      src={image}
      alt="Thumbnail"
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
