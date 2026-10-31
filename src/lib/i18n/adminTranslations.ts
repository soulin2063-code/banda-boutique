export type AdminLocale = 'ar' | 'fr' | 'en';

export interface AdminTranslations {
  dir: 'rtl' | 'ltr';
  brand: string;
  brand_pro: string;
  brand_tagline: string;
  menu_title: string;
  
  // Nav
  nav_dashboard: string;
  nav_dashboard_desc: string;
  nav_orders: string;
  nav_orders_desc: string;
  nav_products: string;
  nav_products_desc: string;
  nav_categories: string;
  nav_categories_desc: string;
  nav_stock: string;
  nav_stock_desc: string;
  nav_attributes: string;
  nav_attributes_desc: string;
  nav_customers: string;
  nav_customers_desc: string;
  nav_settings: string;
  nav_settings_desc: string;
  nav_view_store: string;
  nav_collapse: string;
  nav_expand: string;
  nav_more: string;

  // Roles & User
  role_admin: string;
  role_sales: string;
  logout: string;
  logging_out: string;

  // Header & Search
  breadcrumb_home: string;
  search_btn_text: string;
  search_placeholder: string;
  search_no_results: string;
  search_hint_click: string;
  search_hint_esc: string;
  visit_store: string;
  pending_badge_tooltip: string;
  select_language: string;

  // Summary Cards
  total_revenue: string;
  total_revenue_sub: string;
  net_profit: string;
  net_profit_sub: string;
  total_orders: string;
  total_orders_sub: string;
  pending_orders: string;
  pending_orders_sub: string;
  avg_order_value: string;
  avg_order_value_sub: string;
  low_stock_alerts: string;
  low_stock_alerts_sub: string;
  cancellation_rate: string;
  cancellation_rate_sub: string;
  compare_last_week: string;
  excellent_perf: string;
  immediate_attention: string;
  normal_rate: string;
  currency: string;

  // Sales Chart
  chart_title: string;
  chart_sub: string;
  chart_revenue_metric: string;
  chart_orders_metric: string;
  chart_period_total: string;
  chart_orders_total: string;
  chart_today: string;

  // Recent Orders Table
  recent_orders_title: string;
  recent_orders_sub: string;
  col_order: string;
  col_customer: string;
  col_wilaya: string;
  col_amount: string;
  col_status: string;
  col_actions: string;
  home_delivery: string;
  desk_delivery: string;
  call_btn: string;
  whatsapp_btn: string;
  print_invoice: string;
  view_all_orders: string;
  no_orders_yet: string;
  items_unit: string;

  // Statuses
  status_pending: string;
  status_confirmed: string;
  status_shipped: string;
  status_delivered: string;
  status_returned: string;
  status_cancelled: string;

  // Wilaya Heatmap
  wilaya_heatmap_title: string;
  wilaya_heatmap_sub: string;
  wilaya_col: string;
  wilaya_orders: string;
  wilaya_pct: string;
  no_geo_data: string;

  // Quick Action Buttons
  quick_actions_title: string;
  quick_actions_sub: string;
  quick_add_product: string;
  quick_add_product_desc: string;
  quick_view_orders: string;
  quick_view_orders_desc: string;
  quick_check_stock: string;
  quick_check_stock_desc: string;
  quick_settings: string;
  quick_settings_desc: string;
}

export const adminTranslations: Record<AdminLocale, AdminTranslations> = {
  ar: {
    dir: 'rtl',
    brand: 'ShopDZ',
    brand_pro: 'Pro',
    brand_tagline: 'لوحة التحكم الذكية',
    menu_title: 'القائمة الرئيسية',

    nav_dashboard: 'لوحة التحكم',
    nav_dashboard_desc: 'المؤشرات والتحليلات البيانية',
    nav_orders: 'إدارة الطلبات',
    nav_orders_desc: 'تأكيد وشحن طلبيات COD',
    nav_products: 'المنتجات',
    nav_products_desc: 'إدارة الكتالوج والأسعار والصور',
    nav_categories: 'التصنيفات',
    nav_categories_desc: 'تنظيم الفئات والأقسام',
    nav_stock: 'المخزون والتنبيهات',
    nav_stock_desc: 'متابعة الكميات ونواقص المنتجات',
    nav_attributes: 'الخصائص والمقاسات',
    nav_attributes_desc: 'المقاسات، الألوان، والتفاصيل',
    nav_customers: 'سجل الزبائن',
    nav_customers_desc: 'بيانات المشترين ومتابعة الشراء',
    nav_settings: 'إعدادات المتجر',
    nav_settings_desc: 'أسعار الشحن للولايات والتوصيل',
    nav_view_store: 'معاينة المتجر ↗',
    nav_collapse: 'تصغير القائمة',
    nav_expand: 'توسيع القائمة',
    nav_more: 'المزيد',

    role_admin: 'مدير النظام الرئيسي',
    role_sales: 'موظف مبيعات',
    logout: 'تسجيل الخروج',
    logging_out: 'جاري الخروج...',

    breadcrumb_home: 'الرئيسية',
    search_btn_text: 'بحث سريع بالأقسام...',
    search_placeholder: 'ابحث عن قسم أو صفحة (الطلبات، المنتجات، المخزون، الشحن...)',
    search_no_results: 'لا توجد نتائج تطابق',
    search_hint_click: 'انقر للتنقل السريع',
    search_hint_esc: 'ESC للإغلاق',
    visit_store: 'زيارة المتجر',
    pending_badge_tooltip: 'طلبات معلقة',
    select_language: 'تغيير اللغة',

    total_revenue: 'المبيعات الإجمالية',
    total_revenue_sub: 'حجم المداخيل المسجلة',
    net_profit: 'صافي الأرباح التقديري',
    net_profit_sub: 'تقدير بهامش ربح ~65%',
    total_orders: 'إجمالي الطلبيات',
    total_orders_sub: 'كافة الطلبيات عبر 58 ولاية',
    pending_orders: 'طلبات تنتظر التأكيد',
    pending_orders_sub: 'تحتاج اتصال هاتفي بالزبون',
    avg_order_value: 'متوسط قيمة الطلب (AOV)',
    avg_order_value_sub: 'معدل إنفاق الزبون في الطلب',
    low_stock_alerts: 'تنبيهات نواقص المخزون',
    low_stock_alerts_sub: 'أصناف بلغت الحد الأدنى',
    cancellation_rate: 'نسبة الإلغاء',
    cancellation_rate_sub: 'طلبيات ألغيت قبل أو أثناء التوصيل',
    compare_last_week: 'مقارنة بالأسبوع الماضي',
    excellent_perf: 'أداء مالي ممتاز',
    immediate_attention: 'تتطلب اهتماماً فورياً',
    normal_rate: 'معدل طبيعي ومستقر',
    currency: 'د.ج',

    chart_title: 'حركة المبيعات والطلبيات (آخر 7 أيام)',
    chart_sub: 'تحليل بياني لحجم المداخيل وأعداد الطلبات اليومية',
    chart_revenue_metric: 'حجم المبيعات (د.ج)',
    chart_orders_metric: 'عدد الطلبيات',
    chart_period_total: 'إجمالي المبيعات',
    chart_orders_total: 'إجمالي الطلبات',
    chart_today: 'اليوم',

    recent_orders_title: 'أحدث الطلبيات المستلمة',
    recent_orders_sub: 'متابعة فورية للطلبات وتحديث حالات التأكيد والشحن عبر الهاتف',
    col_order: 'رقم الطلب والتاريخ',
    col_customer: 'الزبون ومعلومات الاتصال',
    col_wilaya: 'الولاية والتوصيل',
    col_amount: 'المبلغ الإجمالي',
    col_status: 'الحالة الحالية',
    col_actions: 'الإجراءات السريعة',
    home_delivery: 'توصيل للمنزل',
    desk_delivery: 'استلام من المكتب',
    call_btn: 'اتصال',
    whatsapp_btn: 'واتساب',
    print_invoice: 'طباعة الفاتورة',
    view_all_orders: 'عرض كل الطلبيات (المفصلة)',
    no_orders_yet: 'لا توجد طلبيات مسجلة حتى الآن',
    items_unit: 'قطع',

    status_pending: 'قيد الانتظار',
    status_confirmed: 'مؤكد',
    status_shipped: 'تم الشحن',
    status_delivered: 'تم التسليم',
    status_returned: 'مرتجع',
    status_cancelled: 'ملغى',

    wilaya_heatmap_title: 'التوزيع الجغرافي للطلبات (58 ولاية)',
    wilaya_heatmap_sub: 'أكثر الولايات نشاطاً ومبيعاً عبر القطر الجزائري',
    wilaya_col: 'الولاية',
    wilaya_orders: 'الطلبات',
    wilaya_pct: 'النسبة',
    no_geo_data: 'لا توجد بيانات جغرافية مسجلة بعد',

    quick_actions_title: 'العمليات السريعة للوحة الإدارة',
    quick_actions_sub: 'اختصارات مباشرة لأهم مهام تسيير المتجر اليومية',
    quick_add_product: 'إضافة منتج جديد',
    quick_add_product_desc: 'رفع الصور وتحديد الأسعار والمقاسات',
    quick_view_orders: 'معالجة وتأكيد الطلبيات',
    quick_view_orders_desc: 'الاتصال بالزبائن وتجهيز بوليصات الشحن',
    quick_check_stock: 'مراجعة نواقص المخزون',
    quick_check_stock_desc: 'إعادة تزويد الكميات قبل نفاد المنتجات',
    quick_settings: 'تعديل أسعار الشحن',
    quick_settings_desc: 'ضبط تسعيرة التوصيل للمنزل والمكتب لكل ولاية',
  },

  fr: {
    dir: 'ltr',
    brand: 'ShopDZ',
    brand_pro: 'Pro',
    brand_tagline: 'Tableau de bord intelligent',
    menu_title: 'Menu Principal',

    nav_dashboard: 'Tableau de bord',
    nav_dashboard_desc: 'Indicateurs & analyses graphiques',
    nav_orders: 'Commandes',
    nav_orders_desc: 'Confirmer & expédier les commandes COD',
    nav_products: 'Produits',
    nav_products_desc: 'Gérer catalogue, prix & photos',
    nav_categories: 'Catégories',
    nav_categories_desc: 'Organiser catégories & rayons',
    nav_stock: 'Stock & Alertes',
    nav_stock_desc: 'Suivi des quantités & ruptures',
    nav_attributes: 'Attributs & Tailles',
    nav_attributes_desc: 'Tailles, couleurs & variantes',
    nav_customers: 'Clients',
    nav_customers_desc: 'Données acheteurs & historique',
    nav_settings: 'Paramètres',
    nav_settings_desc: 'Tarifs de livraison & wilayas',
    nav_view_store: 'Voir la boutique ↗',
    nav_collapse: 'Réduire le menu',
    nav_expand: 'Agrandir le menu',
    nav_more: 'Plus',

    role_admin: 'Administrateur Principal',
    role_sales: 'Agent commercial',
    logout: 'Déconnexion',
    logging_out: 'Déconnexion...',

    breadcrumb_home: 'Accueil',
    search_btn_text: 'Recherche rapide...',
    search_placeholder: 'Rechercher une section (Commandes, Produits, Stock...)',
    search_no_results: 'Aucun résultat trouvé pour',
    search_hint_click: 'Cliquer pour naviguer',
    search_hint_esc: 'ESC pour fermer',
    visit_store: 'Visiter la boutique',
    pending_badge_tooltip: 'commandes en attente',
    select_language: 'Langue',

    total_revenue: "Chiffre d'affaires total",
    total_revenue_sub: 'Volume total des ventes enregistrées',
    net_profit: 'Bénéfice net estimé',
    net_profit_sub: 'Estimation marge ~65% COD',
    total_orders: 'Total Commandes',
    total_orders_sub: 'Toutes commandes sur 58 wilayas',
    pending_orders: 'À confirmer',
    pending_orders_sub: 'Nécessite appel téléphonique du client',
    avg_order_value: 'Panier moyen (AOV)',
    avg_order_value_sub: 'Dépense moyenne par client',
    low_stock_alerts: 'Alertes stock faible',
    low_stock_alerts_sub: 'Articles atteignant le seuil minimal',
    cancellation_rate: "Taux d'annulation",
    cancellation_rate_sub: 'Commandes annulées avant/pendant livraison',
    compare_last_week: 'vs semaine précédente',
    excellent_perf: 'Excellente performance financière',
    immediate_attention: 'Nécessite attention immédiate',
    normal_rate: 'Taux normal et stable',
    currency: 'DA',

    chart_title: 'Tendance des Ventes & Commandes (7 derniers jours)',
    chart_sub: 'Analyse journalière des revenus et volume de commandes',
    chart_revenue_metric: 'Revenus (DA)',
    chart_orders_metric: 'Nb de commandes',
    chart_period_total: 'Total Ventes',
    chart_orders_total: 'Total Commandes',
    chart_today: "Aujourd'hui",

    recent_orders_title: 'Dernières Commandes Reçues',
    recent_orders_sub: 'Suivi en temps réel & mise à jour des confirmations téléphoniques',
    col_order: 'N° Commande & Date',
    col_customer: 'Client & Coordonnées',
    col_wilaya: 'Wilaya & Livraison',
    col_amount: 'Montant Total',
    col_status: 'Statut Actuel',
    col_actions: 'Actions Rapides',
    home_delivery: 'À domicile',
    desk_delivery: 'Point relais / Stop-desk',
    call_btn: 'Appeler',
    whatsapp_btn: 'WhatsApp',
    print_invoice: 'Facture',
    view_all_orders: 'Voir toutes les commandes',
    no_orders_yet: 'Aucune commande enregistrée pour le moment',
    items_unit: 'art.',

    status_pending: 'En attente',
    status_confirmed: 'Confirmée',
    status_shipped: 'Expédiée',
    status_delivered: 'Livrée',
    status_returned: 'Retournée',
    status_cancelled: 'Annulée',

    wilaya_heatmap_title: 'Distribution Géographique (58 Wilayas)',
    wilaya_heatmap_sub: 'Top wilayas les plus actives à travers l’Algérie',
    wilaya_col: 'Wilaya',
    wilaya_orders: 'Commandes',
    wilaya_pct: 'Part',
    no_geo_data: 'Aucune donnée géographique pour le moment',

    quick_actions_title: 'Actions Rapides du Tableau de Bord',
    quick_actions_sub: 'Raccourcis directs pour la gestion quotidienne de votre boutique',
    quick_add_product: 'Ajouter un produit',
    quick_add_product_desc: 'Uploader photos, fixer prix et gérer variantes',
    quick_view_orders: 'Traiter les commandes',
    quick_view_orders_desc: 'Contacter les clients & préparer les bordereaux',
    quick_check_stock: 'Vérifier le stock faible',
    quick_check_stock_desc: 'Réapprovisionner les articles avant rupture',
    quick_settings: 'Tarifs de livraison',
    quick_settings_desc: 'Ajuster les prix domicile et stop-desk par wilaya',
  },

  en: {
    dir: 'ltr',
    brand: 'ShopDZ',
    brand_pro: 'Pro',
    brand_tagline: 'Smart Admin Dashboard',
    menu_title: 'Main Menu',

    nav_dashboard: 'Dashboard',
    nav_dashboard_desc: 'Key metrics & visual analytics',
    nav_orders: 'Orders',
    nav_orders_desc: 'Confirm & ship COD orders',
    nav_products: 'Products',
    nav_products_desc: 'Manage catalog, prices & photos',
    nav_categories: 'Categories',
    nav_categories_desc: 'Organize categories & sections',
    nav_stock: 'Stock & Alerts',
    nav_stock_desc: 'Monitor quantities & low stock',
    nav_attributes: 'Attributes & Sizes',
    nav_attributes_desc: 'Sizes, colors & variants',
    nav_customers: 'Customers',
    nav_customers_desc: 'Buyer profiles & purchase history',
    nav_settings: 'Settings',
    nav_settings_desc: 'Wilaya delivery rates & shipping',
    nav_view_store: 'View Store ↗',
    nav_collapse: 'Collapse sidebar',
    nav_expand: 'Expand sidebar',
    nav_more: 'More',

    role_admin: 'Super Administrator',
    role_sales: 'Sales Representative',
    logout: 'Logout',
    logging_out: 'Logging out...',

    breadcrumb_home: 'Home',
    search_btn_text: 'Quick search sections...',
    search_placeholder: 'Search sections (Orders, Products, Stock, Shipping...)',
    search_no_results: 'No results found matching',
    search_hint_click: 'Click to navigate',
    search_hint_esc: 'ESC to close',
    visit_store: 'Visit Store',
    pending_badge_tooltip: 'pending orders',
    select_language: 'Language',

    total_revenue: 'Total Revenue',
    total_revenue_sub: 'Total gross sales recorded',
    net_profit: 'Estimated Net Profit',
    net_profit_sub: 'Estimated ~65% COD margin',
    total_orders: 'Total Orders',
    total_orders_sub: 'All orders across 58 wilayas',
    pending_orders: 'Pending Confirmation',
    pending_orders_sub: 'Requires customer verification call',
    avg_order_value: 'Average Order Value (AOV)',
    avg_order_value_sub: 'Average customer spend per order',
    low_stock_alerts: 'Low Stock Alerts',
    low_stock_alerts_sub: 'Items reaching minimum threshold',
    cancellation_rate: 'Cancellation Rate',
    cancellation_rate_sub: 'Orders cancelled prior or during transit',
    compare_last_week: 'vs last week',
    excellent_perf: 'Strong financial performance',
    immediate_attention: 'Requires immediate attention',
    normal_rate: 'Normal & stable rate',
    currency: 'DZD',

    chart_title: 'Sales & Orders Trend (Last 7 Days)',
    chart_sub: 'Daily revenue and order volume analytics',
    chart_revenue_metric: 'Revenue (DZD)',
    chart_orders_metric: 'Orders Count',
    chart_period_total: 'Total Sales',
    chart_orders_total: 'Total Orders',
    chart_today: 'Today',

    recent_orders_title: 'Recent Received Orders',
    recent_orders_sub: 'Real-time order tracking & status update via phone confirmation',
    col_order: 'Order ID & Date',
    col_customer: 'Customer & Contact',
    col_wilaya: 'Wilaya & Delivery',
    col_amount: 'Total Amount',
    col_status: 'Current Status',
    col_actions: 'Quick Actions',
    home_delivery: 'Home Delivery',
    desk_delivery: 'Stop-desk pickup',
    call_btn: 'Call',
    whatsapp_btn: 'WhatsApp',
    print_invoice: 'Print Invoice',
    view_all_orders: 'View all orders (detailed)',
    no_orders_yet: 'No orders recorded yet',
    items_unit: 'items',

    status_pending: 'Pending',
    status_confirmed: 'Confirmed',
    status_shipped: 'Shipped',
    status_delivered: 'Delivered',
    status_returned: 'Returned',
    status_cancelled: 'Cancelled',

    wilaya_heatmap_title: 'Geographic Distribution (58 Wilayas)',
    wilaya_heatmap_sub: 'Top active and buying wilayas across Algeria',
    wilaya_col: 'Wilaya',
    wilaya_orders: 'Orders',
    wilaya_pct: 'Share',
    no_geo_data: 'No geographic data recorded yet',

    quick_actions_title: 'Quick Dashboard Actions',
    quick_actions_sub: 'Direct shortcuts for daily store management workflows',
    quick_add_product: 'Add New Product',
    quick_add_product_desc: 'Upload images, set pricing, colors and sizes',
    quick_view_orders: 'Process Orders',
    quick_view_orders_desc: 'Call customers and prepare shipping waybills',
    quick_check_stock: 'Review Low Stock',
    quick_check_stock_desc: 'Restock inventory before items sell out',
    quick_settings: 'Delivery Rates',
    quick_settings_desc: 'Adjust home and stop-desk delivery fees per wilaya',
  },
};
