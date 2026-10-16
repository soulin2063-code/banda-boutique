import { z } from 'zod';

export const attributeOptionSchema = z.object({
  id: z.string().uuid().optional(),
  value_slug: z.string().min(1, 'Value slug is required').regex(/^[a-z0-9_-]+$/, 'Must be lowercase alphanumeric, dash or underscore'),
  label_ar: z.string().min(1, 'Arabic label is required'),
  label_fr: z.string().min(1, 'French label is required'),
  label_en: z.string().min(1, 'English label is required'),
  hex_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color (#rrggbb)').nullable().optional(),
});

export const attributeSchema = z.object({
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9_-]+$/, 'Slug must be lowercase alphanumeric, dash or underscore'),
  input_type: z.enum(['select', 'multiselect', 'text', 'number', 'boolean']),
  is_variant_defining: z.boolean().default(false),
  name_ar: z.string().min(1, 'Arabic name is required'),
  name_fr: z.string().min(1, 'French name is required'),
  name_en: z.string().min(1, 'English name is required'),
  options: z.array(attributeOptionSchema).default([]),
  category_ids: z.array(z.string().uuid()).default([]),
});

export type AttributeOptionInput = z.infer<typeof attributeOptionSchema>;
export type AttributeInput = z.infer<typeof attributeSchema>;
