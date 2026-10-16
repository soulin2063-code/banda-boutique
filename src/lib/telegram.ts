export interface TelegramOrderDetails {
  order_id: string;
  customer_name: string;
  phone: string;
  wilaya_name?: string;
  commune_name?: string;
  delivery_type: 'home' | 'desk';
  items_summary: Array<{
    name: string;
    variant_label?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes?: string;
}

export async function notifyNewOrder(order: TelegramOrderDetails): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.info('[Telegram] TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured, skipping alert.');
    return false;
  }

  const deliveryTypeStr = order.delivery_type === 'desk' ? '🏢 توصيل إلى المكتب (Stop Desk)' : '🏠 توصيل إلى باب المنزل (Domicile)';
  
  const itemsText = order.items_summary
    .map((item, idx) => `  ${idx + 1}. <b>${item.name}</b> ${item.variant_label ? `(${item.variant_label})` : ''} × ${item.quantity} = <b>${(item.quantity * item.price).toLocaleString()} DA</b>`)
    .join('\n');

  const message = `
🛍️ <b>طلب جديد — ShopDZ (الدفع عند الاستلام)</b>
━━━━━━━━━━━━━━━━━━
🆔 <b>رقم الطلب:</b> <code>#${order.order_id.slice(0, 8).toUpperCase()}</code>
👤 <b>العميل:</b> ${order.customer_name}
📞 <b>الهاتف:</b> <a href="tel:${order.phone}">${order.phone}</a>
📍 <b>الموقع:</b> ${order.wilaya_name || 'غير محدد'}${order.commune_name ? ` (${order.commune_name})` : ''}
🚚 <b>نوع التوصيل:</b> ${deliveryTypeStr}

📦 <b>المنتجات المطلوبة:</b>
${itemsText}

━━━━━━━━━━━━━━━━━━
💰 <b>المجموع الفرعي:</b> ${order.subtotal.toLocaleString()} DA
🛵 <b>تكلفة التوصيل:</b> ${order.delivery_fee.toLocaleString()} DA
💵 <b>المبلغ الإجمالي:</b> <b>${order.total.toLocaleString()} DA</b>
${order.notes ? `📝 <b>ملاحظات العميل:</b> <i>${order.notes}</i>\n` : ''}
⚡ <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/commandes">فتح لوحة التحكم للتأكيد</a>
`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message.trim(),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const errData = await res.text();
      console.error('[Telegram] Failed to send notification:', errData);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Telegram] Error sending message:', err);
    return false;
  }
}
