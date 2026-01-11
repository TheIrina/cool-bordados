"use client";
import { IAdditionalData, IPaymentFormData } from "@mercadopago/sdk-react/esm/bricks/payment/type";
import { createContext, Dispatch, SetStateAction, useContext, useState } from "react";

export interface ContraEntregaFormData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  references: string;
  postalCode: string;
  state: string;
}

type Props = { children: React.ReactNode };
type PaymentFormContextType = {
    formData: IPaymentFormData | null;
    additionalData: IAdditionalData | null;
    setFormData: Dispatch<SetStateAction<IPaymentFormData | null>>;
    setAdditionalData: Dispatch<SetStateAction<IAdditionalData | null>>;
    contraEntregaData: ContraEntregaFormData | null;
    setContraEntregaData: Dispatch<SetStateAction<ContraEntregaFormData | null>>;
};

const PaymentDataContext = createContext<PaymentFormContextType | null>(null)
export const usePaymentFormData = () => {
    const context = useContext(PaymentDataContext);
    if (!context) {
        throw new Error('usePaymentFormData debe ser utilizado en el scope the un PaymentFormProvider');
    }
    return context;
} 
// Deprecated: use usePaymentFormData instead
export const useMercadopagoFormData = usePaymentFormData;

const PaymentFormProvider: React.FC<Props> = ({ children }) => {
    const [formData, setFormData] = useState<IPaymentFormData | null>(null);
    const [additionalData, setAdditionalData] = useState<IAdditionalData | null>(null);
    const [contraEntregaData, setContraEntregaData] = useState<ContraEntregaFormData | null>(null);

    return (
        <PaymentDataContext.Provider value={{ 
            formData, 
            setFormData, 
            additionalData, 
            setAdditionalData,
            contraEntregaData,
            setContraEntregaData
        }}>
            {children}
        </PaymentDataContext.Provider>
    );
}

export default PaymentFormProvider;