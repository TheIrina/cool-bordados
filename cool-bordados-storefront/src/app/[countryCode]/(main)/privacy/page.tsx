import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de privacidad y manejo de datos de Cool Bordados.",
}

export default function PrivacyPage() {
  return (
    <div className="py-12 min-h-[calc(100vh-64px)] overflow-x-hidden">
      <div className="content-container max-w-3xl mx-auto flex flex-col gap-y-8">
        <h1 className="text-3xl font-bold mb-4">Política de Privacidad</h1>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">1. Recopilación de Información</h2>
          <p className="text-ui-fg-subtle">
            Recopilamos información personal cuando te registras en nuestro sitio, realizas un pedido o te suscribes a nuestro boletín. Los datos recopilados incluyen tu nombre, dirección de correo electrónico, número de teléfono y dirección de envío y facturación.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">2. Uso de la Información</h2>
          <p className="text-ui-fg-subtle">
            Cualquier información que recopilemos sobre ti puede ser utilizada para:
            <ul className="list-disc ml-6 mt-2">
              <li>Procesar las transacciones y enviar los productos de manera efectiva.</li>
              <li>Mejorar el servicio al cliente y el soporte.</li>
              <li>Enviarte correos electrónicos periódicos sobre el estado de tu orden.</li>
              <li>Prevenir fraudes y asegurar el funcionamiento técnico correcto del sitio.</li>
            </ul>
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">3. Protección de tus Datos</h2>
          <p className="text-ui-fg-subtle">
            Implementamos diversas medidas de seguridad para mantener la seguridad de tu información personal cuando realizas un pedido. Utilizamos plataformas de procesamiento de pagos externas confiables, por lo que tus datos de pago (tarjetas) se transmiten de manera encriptada y segura.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">4. Divulgación a Terceros</h2>
          <p className="text-ui-fg-subtle">
            No vendemos, intercambiamos, ni transferimos a terceros tu información personal identificable. Esto no incluye a los terceros de confianza que nos asisten en la operación de nuestro sitio web, realizar nuestro negocio, o darte servicio, siempre que dichas partes acuerden mantener esta información confidencial (ej. pasarelas de pago y empresas de envío).
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">5. Uso de Cookies</h2>
          <p className="text-ui-fg-subtle">
            Nuestras cookies mejoran el acceso a nuestro sitio e identifican a los visitantes habituales. Además, nuestras cookies mejoran la experiencia del usuario haciendo un seguimiento de sus intereses, y se requieren para mantener el estado de tu carrito de compras.
          </p>
        </section>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">6. Consentimiento</h2>
          <p className="text-ui-fg-subtle">
            Al utilizar nuestro sitio, aceptas nuestra política de privacidad web. En caso de solicitar la eliminación, modificación o conocer los datos que almacenamos sobre ti, puedes ponerte en contacto con nosotros en cualquier momento.
          </p>
        </section>
      </div>
    </div>
  )
}
