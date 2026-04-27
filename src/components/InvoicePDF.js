import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateInvoicePDF(transaction, business) {
  const doc = new jsPDF();
  const biz = business || { name: 'Toko Saya', address: '', phone: '' };

  // Header bar
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(biz.name, 14, 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (biz.address) doc.text(biz.address, 14, 23);
  if (biz.phone) doc.text(`Telp: ${biz.phone}`, 14, 29);

  doc.setFontSize(11);
  doc.text('INVOICE', 160, 14, { align: 'center' });
  doc.setFontSize(9);
  doc.text(transaction.invoiceNo, 160, 21, { align: 'center' });

  // Reset text color
  doc.setTextColor(50, 50, 50);

  // Invoice info block
  const infoY = 45;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Kepada:', 14, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(transaction.customer?.name || 'Walk-in Customer', 14, infoY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Tanggal:', 140, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    new Date(transaction.date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    140,
    infoY + 6
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 140, infoY + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(
    transaction.paymentStatus === 'PAID' ? 'Lunas' : 'Belum Lunas',
    140,
    infoY + 19
  );

  // Items table
  const tableData = (transaction.items || []).map((item, i) => [
    i + 1,
    item.product?.name || '-',
    item.qty,
    item.product?.unit || 'pcs',
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.price),
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(item.subtotal),
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Produk', 'Qty', 'Satuan', 'Harga', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  const fmtCurrency = (n) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n);

  // Summary section
  const summaryX = 140;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX, finalY);
  doc.text(fmtCurrency(transaction.subtotal), 196, finalY, { align: 'right' });

  if (transaction.discount > 0) {
    doc.text('Diskon:', summaryX, finalY + 6);
    doc.text(`- ${fmtCurrency(transaction.discount)}`, 196, finalY + 6, {
      align: 'right',
    });
  }

  if (transaction.tax > 0) {
    doc.text('Pajak:', summaryX, finalY + 12);
    doc.text(fmtCurrency(transaction.tax), 196, finalY + 12, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.line(summaryX, finalY + 16, 196, finalY + 16);
  doc.text('TOTAL:', summaryX, finalY + 22);
  doc.text(fmtCurrency(transaction.total), 196, finalY + 22, { align: 'right' });

  // Footer
  const footerY = Math.min(finalY + 40, 270);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Terima kasih atas kepercayaan Anda!', 105, footerY, {
    align: 'center',
  });

  doc.save(`${transaction.invoiceNo}.pdf`);
}
