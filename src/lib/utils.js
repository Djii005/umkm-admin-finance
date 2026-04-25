export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export async function generateInvoiceNo(type, prisma) {
  const prefix = type === 'SALE' ? 'INV' : 'PO';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.transaction.count();
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${dateStr}-${seq}`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
