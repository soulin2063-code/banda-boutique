import { z } from 'zod';

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  sku: z.string().nullable().optional(),
  price_override: z.number().nullable().optional(),
  compare_at_price_override: z.number().nullable().optional(),
  stock_qty: z.number().int().min(0, 'Stock quantity cannot be negative').default(0),
  min_stock_threshold: z.number().int().min(0).default(3),
  cost_price: z.number().nullable().optional(),
  attribute_option_ids: z.array(z.string().uuid()).default([]),
});

export const productImageSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  position: z.number().int().default(0),
  variant_color_option_id: z.string().uuid().nullable().optional(),
});

export const productSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9_-]+$/, 'Must be lowercase alphanumeric, dash or underscore'),
  category_id: z.string().uuid('Category is required'),
  brand_id: z.string().uuid().nullable().optional(),
  base_price: z.number().min(0, 'Base price must be >= 0'),
  compare_at_price: z.number().nullable().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  badge: z.enum(['new', 'sale', 'bestseller']).nullable().optional(),
  is_featured: z.boolean().default(false),
  name_ar: z.string().min(1, 'Arabic name is required'),
  name_fr: z.string().min(1, 'French name is required'),
  name_en: z.string().min(1, 'English name is required'),
  description_ar: z.string().optional().default(''),
  description_fr: z.string().optional().default(''),
  description_en: z.string().optional().default(''),
  images: z.array(productImageSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
  display_attribute_option_ids: z.array(z.string().uuid()).default([]),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;
export type ProductImageInput = z.infer<typeof productImageSchema>;
export type ProductInput = z.infer<typeof productSchema>;
