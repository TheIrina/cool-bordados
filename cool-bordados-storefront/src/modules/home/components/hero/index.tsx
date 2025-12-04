import { Github } from "@medusajs/icons"
import { Button, Heading } from "@medusajs/ui"

const Hero = () => {
  return (
    <div className="h-[94vh] w-full border-b border-ui-border-base relative bg-ui-bg-subtle">
      {/* Video de fondo */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/video.webm" type="video/webm" />
      </video>

      {/* Overlay para mejorar la legibilidad del texto */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center small:p-32 gap-6">
        <span>
          <Heading
            level="h1"
            className="text-3xl leading-10 text-white font-normal"
          >
            Cool Bordados
          </Heading>
          <Heading
            level="h2"
            className="text-3xl leading-10 text-white font-normal"
          >
            Bordados personalizados de alta calidad
          </Heading>
        </span>
        <Button variant="secondary">
          Explorar productos
        </Button>
      </div>
    </div>
  )
}

export default Hero
