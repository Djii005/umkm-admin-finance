/**
 * Seed script for UMKM Admin Finance
 * Populates database with realistic Indonesian UMKM data
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

// Helper: date offset from today (negative = days ago)
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Users ────────────────────────────────────────────────────────────────
  const ownerHash = await bcrypt.hash('password123', SALT_ROUNDS);
  const staffHash = await bcrypt.hash('password123', SALT_ROUNDS);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@umkm.test' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'owner@umkm.test',
      passwordHash: ownerHash,
      role: 'OWNER',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@umkm.test' },
    update: {},
    create: {
      name: 'Siti Rahayu',
      email: 'staff@umkm.test',
      passwordHash: staffHash,
      role: 'STAFF',
    },
  });

  console.log('✅ Users seeded');

  // ─── Business ─────────────────────────────────────────────────────────────
  await prisma.business.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Toko Sejahtera',
      address: 'Jl. Pahlawan No. 45, Surabaya, Jawa Timur 60111',
      phone: '031-5550123',
      taxId: '01.234.567.8-901.000',
      taxRate: 11,
    },
  });

  console.log('✅ Business seeded');

  // ─── Categories ───────────────────────────────────────────────────────────
  const productCategories = await Promise.all([
    prisma.category.create({ data: { name: 'Sembako', type: 'PRODUCT' } }),
    prisma.category.create({ data: { name: 'Minuman', type: 'PRODUCT' } }),
    prisma.category.create({ data: { name: 'Snack & Makanan Ringan', type: 'PRODUCT' } }),
    prisma.category.create({ data: { name: 'Kebersihan & Perawatan', type: 'PRODUCT' } }),
    prisma.category.create({ data: { name: 'Alat Tulis & Kantor', type: 'PRODUCT' } }),
  ]);

  const expenseCategories = await Promise.all([
    prisma.category.create({ data: { name: 'Sewa & Utilitas', type: 'EXPENSE' } }),
    prisma.category.create({ data: { name: 'Gaji Karyawan', type: 'EXPENSE' } }),
    prisma.category.create({ data: { name: 'Operasional', type: 'EXPENSE' } }),
  ]);

  const incomeCategories = await Promise.all([
    prisma.category.create({ data: { name: 'Penjualan Produk', type: 'INCOME' } }),
    prisma.category.create({ data: { name: 'Jasa Titipan', type: 'INCOME' } }),
    prisma.category.create({ data: { name: 'Pendapatan Lain-lain', type: 'INCOME' } }),
  ]);

  const [sembako, minuman, snack, kebersihan, alatTulis] = productCategories;
  const [sewaUtil, gajiKaryawan, operasional] = expenseCategories;
  const [penjualan, jasTitipan, pendapatanLain] = incomeCategories;

  console.log('✅ Categories seeded');

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = await Promise.all([
    // Sembako
    prisma.product.create({
      data: {
        categoryId: sembako.id,
        name: 'Beras Premium 5 kg',
        sku: 'SMB-001',
        buyPrice: 62000,
        sellPrice: 72000,
        stock: 80,
        unit: 'karung',
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: sembako.id,
        name: 'Minyak Goreng 2 L',
        sku: 'SMB-002',
        buyPrice: 28000,
        sellPrice: 33000,
        stock: 60,
        unit: 'botol',
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: sembako.id,
        name: 'Gula Pasir 1 kg',
        sku: 'SMB-003',
        buyPrice: 13000,
        sellPrice: 16000,
        stock: 100,
        unit: 'kg',
        minStock: 15,
      },
    }),
    // Minuman
    prisma.product.create({
      data: {
        categoryId: minuman.id,
        name: 'Air Mineral 600 ml (karton)',
        sku: 'MNM-001',
        buyPrice: 18000,
        sellPrice: 24000,
        stock: 50,
        unit: 'karton',
        minStock: 8,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: minuman.id,
        name: 'Teh Botol Sosro 330 ml',
        sku: 'MNM-002',
        buyPrice: 4500,
        sellPrice: 6000,
        stock: 120,
        unit: 'botol',
        minStock: 20,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: minuman.id,
        name: 'Kopi Sachet (renceng 10)',
        sku: 'MNM-003',
        buyPrice: 15000,
        sellPrice: 20000,
        stock: 70,
        unit: 'renceng',
        minStock: 10,
      },
    }),
    // Snack
    prisma.product.create({
      data: {
        categoryId: snack.id,
        name: 'Chitato Sapi Panggang 68 g',
        sku: 'SNK-001',
        buyPrice: 8500,
        sellPrice: 12000,
        stock: 90,
        unit: 'pcs',
        minStock: 15,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: snack.id,
        name: 'Oreo Original 119 g',
        sku: 'SNK-002',
        buyPrice: 10000,
        sellPrice: 14000,
        stock: 75,
        unit: 'pcs',
        minStock: 10,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: snack.id,
        name: 'Mie Instan Goreng (karton 40)',
        sku: 'SNK-003',
        buyPrice: 85000,
        sellPrice: 100000,
        stock: 30,
        unit: 'karton',
        minStock: 5,
      },
    }),
    // Kebersihan
    prisma.product.create({
      data: {
        categoryId: kebersihan.id,
        name: 'Sabun Mandi Batang',
        sku: 'KBR-001',
        buyPrice: 3500,
        sellPrice: 5000,
        stock: 150,
        unit: 'pcs',
        minStock: 20,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: kebersihan.id,
        name: 'Shampo Sachet 10 ml',
        sku: 'KBR-002',
        buyPrice: 800,
        sellPrice: 1200,
        stock: 300,
        unit: 'pcs',
        minStock: 50,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: kebersihan.id,
        name: 'Detergen Bubuk 1 kg',
        sku: 'KBR-003',
        buyPrice: 15000,
        sellPrice: 20000,
        stock: 55,
        unit: 'pcs',
        minStock: 8,
      },
    }),
    // Alat Tulis
    prisma.product.create({
      data: {
        categoryId: alatTulis.id,
        name: 'Pulpen Ballpoint (lusin)',
        sku: 'ATK-001',
        buyPrice: 12000,
        sellPrice: 18000,
        stock: 40,
        unit: 'lusin',
        minStock: 5,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: alatTulis.id,
        name: 'Buku Tulis 58 lembar',
        sku: 'ATK-002',
        buyPrice: 4000,
        sellPrice: 6000,
        stock: 100,
        unit: 'pcs',
        minStock: 15,
      },
    }),
    prisma.product.create({
      data: {
        categoryId: alatTulis.id,
        name: 'Amplop Coklat (pak 10)',
        sku: 'ATK-003',
        buyPrice: 6500,
        sellPrice: 9000,
        stock: 35,
        unit: 'pak',
        minStock: 5,
      },
    }),
  ]);

  console.log('✅ Products seeded');

  // ─── Customers ────────────────────────────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.create({
      data: { name: 'Ahmad Fauzi', phone: '081234567890', address: 'Jl. Melati No. 12, Surabaya' },
    }),
    prisma.customer.create({
      data: { name: 'Dewi Lestari', phone: '082345678901', address: 'Jl. Mawar No. 5, Surabaya' },
    }),
    prisma.customer.create({
      data: { name: 'Hendra Wijaya', phone: '083456789012', address: 'Jl. Kenanga No. 8, Sidoarjo' },
    }),
    prisma.customer.create({
      data: { name: 'Rina Susanti', phone: '085678901234', address: 'Jl. Dahlia No. 22, Gresik' },
    }),
    prisma.customer.create({
      data: { name: 'Warung Bu Mina', phone: '087890123456', address: 'Pasar Wonokromo Blok B-12' },
    }),
  ]);

  console.log('✅ Customers seeded');

  // ─── Suppliers ────────────────────────────────────────────────────────────
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'CV Maju Bersama',
        phone: '031-8881234',
        address: 'Jl. Raya Darmo No. 100, Surabaya',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'PT Sumber Rejeki',
        phone: '031-7774567',
        address: 'Jl. Industri No. 45, Surabaya',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'UD Karya Mandiri',
        phone: '031-6669012',
        address: 'Jl. Pasar Baru No. 7, Sidoarjo',
      },
    }),
  ]);

  console.log('✅ Suppliers seeded');

  // ─── Transactions ─────────────────────────────────────────────────────────
  const txData = [
    // SALES
    {
      userId: owner.id,
      customerId: customers[0].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-001',
      date: daysAgo(28),
      paymentMethod: 'CASH',
      items: [
        { product: products[0], qty: 3 },
        { product: products[3], qty: 2 },
      ],
    },
    {
      userId: staff.id,
      customerId: customers[1].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-002',
      date: daysAgo(25),
      paymentMethod: 'TRANSFER',
      items: [
        { product: products[4], qty: 10 },
        { product: products[6], qty: 5 },
        { product: products[9], qty: 4 },
      ],
    },
    {
      userId: owner.id,
      customerId: customers[2].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-003',
      date: daysAgo(22),
      paymentMethod: 'CASH',
      items: [
        { product: products[1], qty: 4 },
        { product: products[2], qty: 5 },
        { product: products[8], qty: 2 },
      ],
    },
    {
      userId: staff.id,
      customerId: customers[4].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-004',
      date: daysAgo(18),
      paymentMethod: 'CASH',
      items: [
        { product: products[0], qty: 5 },
        { product: products[1], qty: 3 },
        { product: products[5], qty: 6 },
      ],
    },
    {
      userId: owner.id,
      customerId: customers[3].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-005',
      date: daysAgo(15),
      paymentMethod: 'QRIS',
      items: [
        { product: products[7], qty: 3 },
        { product: products[10], qty: 10 },
        { product: products[13], qty: 4 },
      ],
    },
    {
      userId: staff.id,
      customerId: customers[0].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-006',
      date: daysAgo(12),
      paymentMethod: 'CASH',
      items: [
        { product: products[2], qty: 8 },
        { product: products[11], qty: 2 },
      ],
    },
    {
      userId: owner.id,
      customerId: customers[1].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-007',
      date: daysAgo(8),
      paymentMethod: 'TRANSFER',
      items: [
        { product: products[6], qty: 6 },
        { product: products[8], qty: 3 },
        { product: products[14], qty: 5 },
      ],
    },
    {
      userId: staff.id,
      customerId: customers[4].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-008',
      date: daysAgo(4),
      paymentMethod: 'CASH',
      items: [
        { product: products[3], qty: 5 },
        { product: products[5], qty: 4 },
        { product: products[12], qty: 3 },
      ],
    },
    {
      userId: owner.id,
      customerId: customers[2].id,
      supplierId: null,
      type: 'SALE',
      invoiceNo: 'INV-SALE-009',
      date: daysAgo(2),
      paymentMethod: 'QRIS',
      paymentStatus: 'UNPAID',
      items: [
        { product: products[0], qty: 10 },
        { product: products[4], qty: 24 },
      ],
    },
    // PURCHASES
    {
      userId: owner.id,
      customerId: null,
      supplierId: suppliers[0].id,
      type: 'PURCHASE',
      invoiceNo: 'INV-PUR-001',
      date: daysAgo(27),
      paymentMethod: 'TRANSFER',
      items: [
        { product: products[0], qty: 20, useBuyPrice: true },
        { product: products[1], qty: 24, useBuyPrice: true },
        { product: products[2], qty: 50, useBuyPrice: true },
      ],
    },
    {
      userId: staff.id,
      customerId: null,
      supplierId: suppliers[1].id,
      type: 'PURCHASE',
      invoiceNo: 'INV-PUR-002',
      date: daysAgo(20),
      paymentMethod: 'TRANSFER',
      items: [
        { product: products[3], qty: 20, useBuyPrice: true },
        { product: products[4], qty: 48, useBuyPrice: true },
        { product: products[5], qty: 30, useBuyPrice: true },
      ],
    },
    {
      userId: owner.id,
      customerId: null,
      supplierId: suppliers[2].id,
      type: 'PURCHASE',
      invoiceNo: 'INV-PUR-003',
      date: daysAgo(14),
      paymentMethod: 'CASH',
      items: [
        { product: products[9], qty: 60, useBuyPrice: true },
        { product: products[10], qty: 100, useBuyPrice: true },
        { product: products[11], qty: 24, useBuyPrice: true },
      ],
    },
    {
      userId: staff.id,
      customerId: null,
      supplierId: suppliers[0].id,
      type: 'PURCHASE',
      invoiceNo: 'INV-PUR-004',
      date: daysAgo(7),
      paymentMethod: 'TRANSFER',
      paymentStatus: 'UNPAID',
      items: [
        { product: products[6], qty: 36, useBuyPrice: true },
        { product: products[7], qty: 24, useBuyPrice: true },
        { product: products[8], qty: 10, useBuyPrice: true },
      ],
    },
  ];

  for (const tx of txData) {
    const items = tx.items.map((item) => ({
      productId: item.product.id,
      qty: item.qty,
      price: item.useBuyPrice ? item.product.buyPrice : item.product.sellPrice,
      subtotal: item.qty * (item.useBuyPrice ? item.product.buyPrice : item.product.sellPrice),
    }));

    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const tax = 0;
    const discount = 0;
    const total = subtotal - discount + tax;

    await prisma.transaction.create({
      data: {
        userId: tx.userId,
        customerId: tx.customerId ?? undefined,
        supplierId: tx.supplierId ?? undefined,
        type: tx.type,
        invoiceNo: tx.invoiceNo,
        date: tx.date,
        subtotal,
        tax,
        discount,
        total,
        paymentStatus: tx.paymentStatus ?? 'PAID',
        paymentMethod: tx.paymentMethod,
        items: {
          create: items,
        },
      },
    });
  }

  console.log('✅ Transactions seeded');

  // ─── Finance Entries ───────────────────────────────────────────────────────
  const financeEntries = [
    {
      categoryId: sewaUtil.id,
      type: 'EXPENSE',
      amount: 2500000,
      date: daysAgo(30),
      description: 'Sewa toko bulan ini',
    },
    {
      categoryId: sewaUtil.id,
      type: 'EXPENSE',
      amount: 450000,
      date: daysAgo(29),
      description: 'Tagihan listrik & air',
    },
    {
      categoryId: gajiKaryawan.id,
      type: 'EXPENSE',
      amount: 2000000,
      date: daysAgo(25),
      description: 'Gaji karyawan Siti Rahayu',
    },
    {
      categoryId: operasional.id,
      type: 'EXPENSE',
      amount: 350000,
      date: daysAgo(20),
      description: 'Pembelian alat kebersihan toko',
    },
    {
      categoryId: operasional.id,
      type: 'EXPENSE',
      amount: 200000,
      date: daysAgo(15),
      description: 'Isi bensin motor pengiriman',
    },
    {
      categoryId: penjualan.id,
      type: 'INCOME',
      amount: 1500000,
      date: daysAgo(28),
      description: 'Pendapatan penjualan mingguan ke-1',
    },
    {
      categoryId: penjualan.id,
      type: 'INCOME',
      amount: 2300000,
      date: daysAgo(21),
      description: 'Pendapatan penjualan mingguan ke-2',
    },
    {
      categoryId: jasTitipan.id,
      type: 'INCOME',
      amount: 300000,
      date: daysAgo(18),
      description: 'Komisi titipan produk UMKM lain',
    },
    {
      categoryId: penjualan.id,
      type: 'INCOME',
      amount: 1950000,
      date: daysAgo(14),
      description: 'Pendapatan penjualan mingguan ke-3',
    },
    {
      categoryId: pendapatanLain.id,
      type: 'INCOME',
      amount: 500000,
      date: daysAgo(7),
      description: 'Penjualan kardus bekas & barang afkir',
    },
  ];

  for (const entry of financeEntries) {
    await prisma.finance.create({ data: entry });
  }

  console.log('✅ Finance entries seeded');
  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('   owner@umkm.test  / password123  (role: OWNER)');
  console.log('   staff@umkm.test  / password123  (role: STAFF)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
