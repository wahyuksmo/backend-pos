import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding minimal POS master data...');

  // 1. Outlet (Hanya 1)
  const outlet = await prisma.posOutlet.create({
    data: {
      outletCode: 'OUT-001',
      outletName: 'Kopi & Rasa - Senopati',
      phone: '021-5550192',
      email: 'senopati@kopirasa.id',
      address: 'Jl. Senopati Raya No. 88, Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
      receiptHeader: 'KOPI & RASA NUSANTARA\nCabang Senopati - Jakarta Selatan',
      receiptFooter: 'Terima kasih atas kunjungan Anda!\nFollow IG @kopirasa.pos',
      isCentral: 'Y',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });
  console.log(`Outlet created: ${outlet.outletName} (${outlet.outletCode})`);

  // 2. Warehouse (Hanya 1)
  const warehouse = await prisma.posWarehouse.create({
    data: {
      warehouseCode: 'WH-001',
      warehouseName: 'Gudang Utama Senopati',
      warehouseType: 'OUTLET',
      outletId: outlet.outletId,
      isDefault: 'Y',
      address: 'Senopati Lt. Basement',
      createdBy: 'SYSTEM',
    },
  });
  console.log(`Warehouse created: ${warehouse.warehouseName} (${warehouse.warehouseCode})`);

  // 3. Register Kasir POS (Hanya 1)
  const register = await prisma.posRegister.create({
    data: {
      outletId: outlet.outletId,
      registerCode: 'REG-01',
      registerName: 'POS Kasir Utama',
      ipAddress: '192.168.1.101',
      notes: 'Terminal Kasir Depan',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });
  console.log(`Register created: ${register.registerName} (${register.registerCode})`);

  // 4. Dining Tables (3 meja)
  const tables = [
    { tableCode: 'T-01', tableName: 'Meja 01', capacity: 2, status: 'AVAILABLE', section: 'Indoor' },
    { tableCode: 'T-02', tableName: 'Meja 02', capacity: 4, status: 'AVAILABLE', section: 'Indoor' },
    { tableCode: 'T-03', tableName: 'Meja 03', capacity: 4, status: 'AVAILABLE', section: 'Outdoor' },
  ];
  for (const t of tables) {
    await prisma.posDiningTable.create({
      data: {
        outletId: outlet.outletId,
        ...t,
        createdBy: 'SYSTEM',
      },
    });
  }
  console.log('Dining tables created: 3 tables');

  // 5. Kitchen Station (1 station)
  const station = await prisma.posKitchenStation.create({
    data: {
      outletId: outlet.outletId,
      stationCode: 'KS-BAR',
      stationName: 'Bar & Kitchen Utama',
      isKdsEnabled: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  // 6. Units (Satuan)
  const unitCup = await prisma.posUnit.create({
    data: { unitCode: 'CUP', unitName: 'Cup / Gelas', description: 'Penyajian minuman per cup', createdBy: 'SYSTEM' },
  });
  const unitPorsi = await prisma.posUnit.create({
    data: { unitCode: 'PORSI', unitName: 'Porsi', description: 'Porsi piring makanan', createdBy: 'SYSTEM' },
  });
  const unitPcs = await prisma.posUnit.create({
    data: { unitCode: 'PCS', unitName: 'Pieces / Buah', description: 'Satuan per satuan barang jadi', createdBy: 'SYSTEM' },
  });

  // 7. Taxes
  const taxPb1 = await prisma.posTax.create({
    data: {
      taxCode: 'PB1',
      taxName: 'PB1 Restoran 10%',
      rate: 10.0,
      isInclusive: 'N',
      description: 'Pajak Daerah Restoran',
      createdBy: 'SYSTEM',
    },
  });

  // 8. Categories (2 kategori)
  const catCoffee = await prisma.posCategory.create({
    data: {
      categoryCode: 'CAT-COFFEE',
      categoryName: 'Kopi & Minuman',
      icon: 'Coffee',
      color: '#795548',
      displayOrder: 1,
      kitchenStationId: station.stationId,
      createdBy: 'SYSTEM',
    },
  });
  const catFood = await prisma.posCategory.create({
    data: {
      categoryCode: 'CAT-FOOD',
      categoryName: 'Makanan & Pastry',
      icon: 'Utensils',
      color: '#E65100',
      displayOrder: 2,
      kitchenStationId: station.stationId,
      createdBy: 'SYSTEM',
    },
  });

  // 9. Brand (1 brand)
  const brand = await prisma.posBrand.create({
    data: {
      brandCode: 'BR-KOPIRASA',
      brandName: 'Kopi & Rasa',
      description: 'Brand Utama Kopi & Rasa',
      createdBy: 'SYSTEM',
    },
  });

  // 10. Customer Group & Customer (1 customer guest)
  const custGroup = await prisma.posCustomerGroup.create({
    data: {
      groupCode: 'CGRP-REG',
      groupName: 'Pelanggan Reguler',
      discountPercent: 0,
      description: 'Pelanggan umum walk-in',
      createdBy: 'SYSTEM',
    },
  });
  await prisma.posCustomer.create({
    data: {
      customerCode: 'CUST-001',
      customerName: 'Pelanggan Umum (Guest)',
      phone: '081234567890',
      customerGroupId: custGroup.customerGroupId,
      createdBy: 'SYSTEM',
    },
  });

  // 11. Supplier (1 supplier)
  await prisma.posSupplier.create({
    data: {
      supplierCode: 'SUP-001',
      supplierName: 'PT Suplai Bahan Kopi Prima',
      contactPerson: 'Hendra Gunawan',
      phone: '081122334455',
      address: 'Jakarta',
      createdBy: 'SYSTEM',
    },
  });

  // 12. Payment Methods (3 metode)
  await prisma.posPaymentMethod.createMany({
    data: [
      { methodCode: 'PM-CASH', methodName: 'Uang Tunai / Cash', methodType: 'CASH', feeType: 'NONE', feeValue: 0, requiresReference: 'N', displayOrder: 1, createdBy: 'SYSTEM' },
      { methodCode: 'PM-QRIS', methodName: 'QRIS (All Payment)', methodType: 'QRIS', feeType: 'PERCENTAGE', feeValue: 0.7, requiresReference: 'Y', displayOrder: 2, createdBy: 'SYSTEM' },
      { methodCode: 'PM-DEBIT', methodName: 'EDC Debit BCA', methodType: 'EDC_DEBIT', feeType: 'NONE', feeValue: 0, requiresReference: 'Y', displayOrder: 3, createdBy: 'SYSTEM' },
    ],
  });

  // 13. Sales Channel
  await prisma.posSalesChannel.createMany({
    data: [
      { channelCode: 'CH-DINEIN', channelName: 'Dine In', orderType: 'DINE_IN', createdBy: 'SYSTEM' },
      { channelCode: 'CH-TAKEAWAY', channelName: 'Take Away', orderType: 'TAKE_AWAY', createdBy: 'SYSTEM' },
    ],
  });

  // 14. Discount (1 promo)
  await prisma.posDiscount.create({
    data: {
      discountCode: 'DISC-PROMO10',
      discountName: 'Diskon Promo 10%',
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      minPurchase: 50000,
      maxDiscount: 20000,
      requiresApproval: 'N',
      createdBy: 'SYSTEM',
    },
  });

  // 15. Products (Hanya 4 produk)
  const productDefs = [
    {
      productCode: 'PROD-AREN',
      sku: 'SKU-AREN',
      barcode: '899200200001',
      productName: 'Es Kopi Susu Gula Aren',
      productType: 'STANDARD',
      categoryId: catCoffee.categoryId,
      brandId: brand.brandId,
      unitId: unitCup.unitId,
      taxId: taxPb1.taxId,
      kitchenStationId: station.stationId,
      costPrice: 7500,
      sellingPrice: 25000,
      minStock: 10,
      maxStock: 100,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Signature kopi susu dengan gula aren cair asli',
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
    {
      productCode: 'PROD-AMERICANO',
      sku: 'SKU-AMERICANO',
      barcode: '899200200002',
      productName: 'Iced Americano',
      productType: 'STANDARD',
      categoryId: catCoffee.categoryId,
      brandId: brand.brandId,
      unitId: unitCup.unitId,
      taxId: taxPb1.taxId,
      kitchenStationId: station.stationId,
      costPrice: 4000,
      sellingPrice: 20000,
      minStock: 10,
      maxStock: 100,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Espresso double shot segar dengan es dingin',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
    {
      productCode: 'PROD-NASGUR',
      sku: 'SKU-NASGUR',
      barcode: '899200200003',
      productName: 'Nasi Goreng Spesial',
      productType: 'STANDARD',
      categoryId: catFood.categoryId,
      brandId: brand.brandId,
      unitId: unitPorsi.unitId,
      taxId: taxPb1.taxId,
      kitchenStationId: station.stationId,
      costPrice: 15000,
      sellingPrice: 35000,
      minStock: 10,
      maxStock: 100,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Nasi goreng racikan bumbu khas dengan telur dan ayam',
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
    {
      productCode: 'PROD-CROISSANT',
      sku: 'SKU-CROISSANT',
      barcode: '899200200004',
      productName: 'Butter Croissant',
      productType: 'STANDARD',
      categoryId: catFood.categoryId,
      brandId: brand.brandId,
      unitId: unitPcs.unitId,
      taxId: taxPb1.taxId,
      kitchenStationId: station.stationId,
      costPrice: 10000,
      sellingPrice: 28000,
      minStock: 5,
      maxStock: 50,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Croissant mentega renyah dan lembut',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  ];

  const createdProducts = [];
  for (const p of productDefs) {
    const prod = await prisma.posProduct.create({ data: p });
    createdProducts.push(prod);
    console.log(`Product created: ${prod.productName} (Rp ${prod.sellingPrice})`);
  }

  // 16. Stock Awal (50 pcs per produk di Gudang Utama Senopati)
  for (const prod of createdProducts) {
    await prisma.posStock.create({
      data: {
        warehouseId: warehouse.warehouseId,
        productId: prod.productId,
        quantity: 50,
        minStock: prod.minStock,
        maxStock: prod.maxStock,
        createdBy: 'SYSTEM',
      },
    });

    await prisma.posStockMovement.create({
      data: {
        warehouseId: warehouse.warehouseId,
        productId: prod.productId,
        movementType: 'IN',
        referenceType: 'MANUAL',
        referenceNumber: 'INIT-STOCK',
        quantity: 50,
        balanceBefore: 0,
        balanceAfter: 50,
        notes: `Stok awal produk di ${warehouse.warehouseName}`,
        createdBy: 'SYSTEM',
      },
    });
  }
  console.log('Stock initialized: 50 units for each product in WH-001');

  console.log('Minimal POS Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
