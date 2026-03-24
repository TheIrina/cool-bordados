import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de uso y venta de Cool Bordados.",
}

export default function TermsPage() {
  return (
    <div className="py-12 min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="content-container max-w-3xl mx-auto flex flex-col gap-y-8">
        <h1 className="text-3xl font-bold mb-4">Términos y Condiciones</h1>
        
        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">1. Introducción</h2>
          <p className="text-ui-fg-subtle">
            Bienvenido a Cool Bordados. Al acceder y utilizar nuestro sitio web, aceptas estar sujeto a estos términos y condiciones. Lee cuidadosamente antes de realizar cualquier compra.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">2. Condiciones de Compra</h2>
          <p className="text-ui-fg-subtle">
            Nos reservamos el derecho de rechazar cualquier pedido. Los precios de nuestros productos están sujetos a cambios sin previo aviso. Todos los bordados son personalizados o basados en nuestros catálogos.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">3. Métodos de Pago</h2>
          <p className="text-ui-fg-subtle">
            Aceptamos pagos a través de plataformas seguras como MercadoPago, tarjetas de crédito, débito y pago contra entrega (según disponibilidad). No almacenamos información bancaria confidencial en nuestros servidores.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">4. Envíos y Tiempos de Entrega</h2>
          <p className="text-ui-fg-subtle">
            Los tiempos de entrega pueden variar según la zona y la disponibilidad o personalización de los productos. Tratamos de cumplir con los tiempos estimados indicados en el momento del checkout.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">5. Política de Devoluciones</h2>
          <p className="text-ui-fg-subtle">
            Si el producto llega defectuoso o no corresponde a lo ordenado, cuentas con un plazo estipulado por ley para solicitar un cambio o reembolso. Los productos personalizados pueden estar exentos de devolución, salvo por defectos de fábrica o errores en el bordado por parte nuestra.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">6. Modificaciones de Servicio y Precios</h2>
          <p className="text-ui-fg-subtle">
            Los precios de nuestros productos pueden cambiar en cualquier momento. No seremos responsables ante ti o cualquier tercero por ninguna modificación, cambio de precio, suspensión o interrupción del servicio.
          </p>
        </section>
      </div>
    </div>
  )
}
