export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      wilayas: {
        Row: {
          id: number;
          code: string;
          name_ar: string;
          name_fr: string;
        };
        Insert: {
          id: number;
          code: string;
          name_ar: string;
          name_fr: string;
        };
        Update: {
          id?: number;
          code?: string;
          name_ar?: string;
          name_fr?: string;
        };
        Relationships: [];
      };
      communes: {
        Row: {
          id: string;
          wilaya_id: number;
          name_ar: string;
          name_fr: string;
        };
        Insert: {
          id?: string;
          wilaya_id: number;
          name_ar: string;
          name_fr: string;
        };
        Update: {
          id?: string;
          wilaya_id?: number;
          name_ar?: string;
          name_fr?: string;
        };
        Relationships: [
          {
            foreignKeyName: "communes_wilaya_id_fkey";
            columns: ["wilaya_id"];
            isOneToOne: false;
            referencedRelation: "wilayas";
            referencedColumns: ["id"];
          }
        ];
      };
      brands: {
        Row: {
          id: string;
          slug: string;
          name: string;
          logo_url: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          logo_url?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          logo_url?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          slug: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          slug: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      category_translations: {
        Row: {
          category_id: string;
          locale: 'ar' | 'fr' | 'en';
          name: string;
        };
        Insert: {
          category_id: string;
          locale: 'ar' | 'fr' | 'en';
          name: string;
        };
        Update: {
          category_id?: string;
          locale?: 'ar' | 'fr' | 'en';
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      attributes: {
        Row: {
          id: string;
          slug: string;
          input_type: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
          is_variant_defining: boolean;
        };
        Insert: {
          id?: string;
          slug: string;
          input_type: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
          is_variant_defining?: boolean;
        };
        Update: {
          id?: string;
          slug?: string;
          input_type?: 'select' | 'multiselect' | 'text' | 'number' | 'boolean';
          is_variant_defining?: boolean;
        };
        Relationships: [];
      };
      attribute_translations: {
        Row: {
          attribute_id: string;
          locale: 'ar' | 'fr' | 'en';
          name: string;
        };
        Insert: {
          attribute_id: string;
          locale: 'ar' | 'fr' | 'en';
          name: string;
        };
        Update: {
          attribute_id?: string;
          locale?: 'ar' | 'fr' | 'en';
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_translations_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          }
        ];
      };
      attribute_options: {
        Row: {
          id: string;
          attribute_id: string;
          value_slug: string;
          hex_color: string | null;
        };
        Insert: {
          id?: string;
          attribute_id: string;
          value_slug: string;
          hex_color?: string | null;
        };
        Update: {
          id?: string;
          attribute_id?: string;
          value_slug?: string;
          hex_color?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_options_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          }
        ];
      };
      attribute_option_translations: {
        Row: {
          option_id: string;
          locale: 'ar' | 'fr' | 'en';
          label: string;
        };
        Insert: {
          option_id: string;
          locale: 'ar' | 'fr' | 'en';
          label: string;
        };
        Update: {
          option_id?: string;
          locale?: 'ar' | 'fr' | 'en';
          label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attribute_option_translations_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "attribute_options";
            referencedColumns: ["id"];
          }
        ];
      };
      category_attributes: {
        Row: {
          category_id: string;
          attribute_id: string;
          is_required: boolean;
        };
        Insert: {
          category_id: string;
          attribute_id: string;
          is_required?: boolean;
        };
        Update: {
          category_id?: string;
          attribute_id?: string;
          is_required?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "category_attributes_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "category_attributes_attribute_id_fkey";
            columns: ["attribute_id"];
            isOneToOne: false;
            referencedRelation: "attributes";
            referencedColumns: ["id"];
          }
        ];
      };
      products: {
        Row: {
          id: string;
          brand_id: string | null;
          category_id: string;
          slug: string;
          base_price: number;
          compare_at_price: number | null;
          status: 'draft' | 'active' | 'archived';
          badge: 'new' | 'sale' | 'bestseller' | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          category_id: string;
          slug: string;
          base_price: number;
          compare_at_price?: number | null;
          status?: 'draft' | 'active' | 'archived';
          badge?: 'new' | 'sale' | 'bestseller' | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string | null;
          category_id?: string;
          slug?: string;
          base_price?: number;
          compare_at_price?: number | null;
          status?: 'draft' | 'active' | 'archived';
          badge?: 'new' | 'sale' | 'bestseller' | null;
          is_featured?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: false;
            referencedRelation: "brands";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_translations: {
        Row: {
          product_id: string;
          locale: 'ar' | 'fr' | 'en';
          name: string;
          description: string | null;
          meta_title: string | null;
          meta_description: string | null;
        };
        Insert: {
          product_id: string;
          locale: 'ar' | 'fr' | 'en';
          name: string;
          description?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Update: {
          product_id?: string;
          locale?: 'ar' | 'fr' | 'en';
          name?: string;
          description?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          position: number;
          variant_color_option_id: string | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          position?: number;
          variant_color_option_id?: string | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          position?: number;
          variant_color_option_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          price_override: number | null;
          compare_at_price_override: number | null;
          stock_qty: number;
          min_stock_threshold: number;
          cost_price: number | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          price_override?: number | null;
          compare_at_price_override?: number | null;
          stock_qty?: number;
          min_stock_threshold?: number;
          cost_price?: number | null;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string | null;
          price_override?: number | null;
          compare_at_price_override?: number | null;
          stock_qty?: number;
          min_stock_threshold?: number;
          cost_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_attribute_values: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          attribute_option_id: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          attribute_option_id: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          attribute_option_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_attribute_values_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attribute_values_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_attribute_values_attribute_option_id_fkey";
            columns: ["attribute_option_id"];
            isOneToOne: false;
            referencedRelation: "attribute_options";
            referencedColumns: ["id"];
          }
        ];
      };
      delivery_rates: {
        Row: {
          id: string;
          wilaya_id: number;
          commune_id: string | null;
          home_price: number | null;
          desk_price: number | null;
          carrier: string;
          eta_days: number | null;
        };
        Insert: {
          id?: string;
          wilaya_id: number;
          commune_id?: string | null;
          home_price?: number | null;
          desk_price?: number | null;
          carrier?: string;
          eta_days?: number | null;
        };
        Update: {
          id?: string;
          wilaya_id?: number;
          commune_id?: string | null;
          home_price?: number | null;
          desk_price?: number | null;
          carrier?: string;
          eta_days?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "delivery_rates_wilaya_id_fkey";
            columns: ["wilaya_id"];
            isOneToOne: false;
            referencedRelation: "wilayas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "delivery_rates_commune_id_fkey";
            columns: ["commune_id"];
            isOneToOne: false;
            referencedRelation: "communes";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          phone: string;
          full_name: string;
          email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          phone: string;
          full_name: string;
          email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string;
          email?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          wilaya_id: number;
          commune_id: string;
          address_text: string | null;
          delivery_type: 'home' | 'desk';
        };
        Insert: {
          id?: string;
          customer_id: string;
          wilaya_id: number;
          commune_id: string;
          address_text?: string | null;
          delivery_type: 'home' | 'desk';
        };
        Update: {
          id?: string;
          customer_id?: string;
          wilaya_id?: number;
          commune_id?: string;
          address_text?: string | null;
          delivery_type?: 'home' | 'desk';
        };
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "addresses_wilaya_id_fkey";
            columns: ["wilaya_id"];
            isOneToOne: false;
            referencedRelation: "wilayas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "addresses_commune_id_fkey";
            columns: ["commune_id"];
            isOneToOne: false;
            referencedRelation: "communes";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          customer_id: string;
          address_id: string;
          status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
          subtotal: number;
          delivery_fee: number;
          total: number;
          deposit_paid: number | null;
          payment_type: 'cod_full' | 'deposit' | 'installment';
          notes: string | null;
          created_at: string;
          confirmed_at: string | null;
          confirmation_token: string | null;
          carrier_tracking_id: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          address_id: string;
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
          subtotal: number;
          delivery_fee: number;
          total: number;
          deposit_paid?: number | null;
          payment_type?: 'cod_full' | 'deposit' | 'installment';
          notes?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          confirmation_token?: string | null;
          carrier_tracking_id?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          address_id?: string;
          status?: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'returned' | 'cancelled';
          subtotal?: number;
          delivery_fee?: number;
          total?: number;
          deposit_paid?: number | null;
          payment_type?: 'cod_full' | 'deposit' | 'installment';
          notes?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          confirmation_token?: string | null;
          carrier_tracking_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_address_id_fkey";
            columns: ["address_id"];
            isOneToOne: false;
            referencedRelation: "addresses";
            referencedColumns: ["id"];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_variant_id: string;
          quantity: number;
          unit_price: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_variant_id: string;
          quantity: number;
          unit_price: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_variant_id?: string;
          quantity?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          changed_by: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          changed_by?: string;
          changed_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: string;
          changed_by?: string;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          customer_id: string | null;
          rating: number;
          comment: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_id?: string | null;
          rating: number;
          comment?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          customer_id?: string | null;
          rating?: number;
          comment?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist_items: {
        Row: {
          customer_id: string;
          product_id: string;
          added_at: string;
        };
        Insert: {
          customer_id: string;
          product_id: string;
          added_at?: string;
        };
        Update: {
          customer_id?: string;
          product_id?: string;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      checkout_leads: {
        Row: {
          id: string;
          phone: string;
          product_id: string | null;
          wilaya_id: number | null;
          created_at: string;
          contacted: boolean;
        };
        Insert: {
          id?: string;
          phone: string;
          product_id?: string | null;
          wilaya_id?: number | null;
          created_at?: string;
          contacted?: boolean;
        };
        Update: {
          id?: string;
          phone?: string;
          product_id?: string | null;
          wilaya_id?: number | null;
          created_at?: string;
          contacted?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "checkout_leads_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkout_leads_wilaya_id_fkey";
            columns: ["wilaya_id"];
            isOneToOne: false;
            referencedRelation: "wilayas";
            referencedColumns: ["id"];
          }
        ];
      };
      carrier_credentials: {
        Row: {
          id: string;
          carrier: string;
          api_id: string;
          api_token: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          carrier: string;
          api_id: string;
          api_token: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          carrier?: string;
          api_id?: string;
          api_token?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
