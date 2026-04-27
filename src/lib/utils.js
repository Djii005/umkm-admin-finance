export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function toInputDate(d) {
  return new Date(d).toISOString().split('T')[0];
}

export async function generateInvoiceNo(type, prisma) {
  const prefix = type === 'SALE' ? 'INV' : 'PO';
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const latest = await prisma.transaction.findFirst({
    where: { invoiceNo: { startsWith: `${prefix}-${dateStr}` } },
    orderBy: { invoiceNo: 'desc' },
    select: { invoiceNo: true },
  });
  let seq = 1;
  if (latest) {
    const parts = latest.invoiceNo.split('-');
    seq = parseInt(parts[parts.length - 1], 10) + 1;
  }
  return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`;
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
