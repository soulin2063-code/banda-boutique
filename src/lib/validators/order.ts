import { z } from 'zod';

export const orderCustomerSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(?:0|\+?213)[5-7]\d{8}$/, 'Numéro de téléphone algérien invalide (ex: 0555123456)'),
  full_name: z.string().trim().min(2, 'Le nom complet est requis'),
  email: z.string().trim().email('Email invalide').optional().or(z.literal('')),
});

export const orderAddressSchema = z.object({
  wilaya_id: z.number().int().min(1).max(58, 'Wilaya invalide (1 à 58)'),
  commune_id: z.string().uuid('Commune invalide'),
  address_text: z.string().trim().min(3, "L'adresse est requise").optional().or(z.literal('')),
  delivery_type: z.enum(['home', 'desk']),
});

export const orderItemInputSchema = z.object({
  product_variant_id: z.string().uuid('ID de variante invalide'),
  quantity: z.number().int().min(1, 'La quantité doit être supérieure à 0').max(99, 'Quantité trop élevée'),
});

export const createOrderSchema = z.object({
  customer: orderCustomerSchema,
  address: orderAddressSchema,
  items: z.array(orderItemInputSchema).min(1, 'Au moins un produit est requis').max(20, 'Trop d\'articles'),
  payment_type: z.enum(['cod_full', 'deposit', 'installment']).default('cod_full'),
  notes: z.string().trim().max(500).optional(),
  /**
   * حقل Honeypot ضد السبام والبوتات.
   * القرار الأمني: حقل مخفي لا يُملأ من الإنسان.
   * إذا جاء بقيمة → البوت ملأه → نرفض الطلب بهدوء.
   * يجب أن يبقى فارغاً دائماً في النموذج الحقيقي.
   */
  _hp: z.string().max(0, 'Bot detected').optional().default(''),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderCustomerInput = z.infer<typeof orderCustomerSchema>;
export type OrderAddressInput = z.infer<typeof orderAddressSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
