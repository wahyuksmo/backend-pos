import { PrismaClient } from '@prisma/client';

export async function seedPosData(
  prisma: PrismaClient,
  context: {
    adminUser: any;
    spvUser: any;
    cashierUser: any;
    spvGroup: any;
    cashierGroup: any;
  },
) {
  const { adminUser, spvUser, cashierUser } = context;
  console.log('Seeding Master POS Data & Business Transactions...');

  // 1. System Settings
  const settings = [
    { settingKey: 'COMPANY_NAME', settingValue: 'Kopi & Rasa POS Nusantara', valueType: 'string', description: 'Nama Usaha / Brand Toko' },
    { settingKey: 'COMPANY_PHONE', settingValue: '021-5550192', valueType: 'string', description: 'Nomor Telepon Operasional Toko' },
    { settingKey: 'COMPANY_ADDRESS', settingValue: 'Jl. Senopati Raya No. 88, Kebayoran Baru, Jakarta Selatan', valueType: 'string', description: 'Alamat Kantor Pusat' },
    { settingKey: 'CURRENCY', settingValue: 'IDR', valueType: 'string', description: 'Mata Uang Utama' },
    { settingKey: 'CURRENCY_SYMBOL', settingValue: 'Rp', valueType: 'string', description: 'Simbol Mata Uang' },
    { settingKey: 'DEFAULT_TAX_RATE', settingValue: '10', valueType: 'number', description: 'Persentase PB1 Restoran Default (%)' },
    { settingKey: 'ROUNDING_MODE', settingValue: 'ROUND_HALF_UP', valueType: 'string', description: 'Metode Pembulatan Nominal Kembalian' },
    { settingKey: 'ENABLE_KDS', settingValue: 'true', valueType: 'boolean', description: 'Aktifkan Kitchen Display System (KDS)' },
    { settingKey: 'RECEIPT_FOOTER', settingValue: 'Terima kasih atas kunjungan Anda! Ikuti Instagram kami @kopirasa.pos', valueType: 'string', description: 'Pesan Footer Struk Pembayaran' },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { settingKey: s.settingKey },
      update: { settingValue: s.settingValue, valueType: s.valueType, description: s.description },
      create: { ...s, createdBy: 'SYSTEM' },
    });
  }

  // 2. Outlets
  const outletSenopati = await prisma.posOutlet.upsert({
    where: { outletCode: 'OUT-001' },
    update: {
      outletName: 'Kopi & Rasa - Flagship Senopati',
      phone: '021-5550192',
      email: 'senopati@kopirasa.id',
      address: 'Jl. Senopati Raya No. 88, Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
      taxNumber: '01.234.567.8-012.000',
      receiptHeader: 'KOPI & RASA NUSANTARA\nCabang Flagship Senopati - Jakarta Selatan',
      receiptFooter: 'WiFi: KopiRasa-Guest / Pass: kopienakbanget\nFollow IG @kopirasa.pos',
      isCentral: 'Y',
      isActive: 'Y',
    },
    create: {
      outletCode: 'OUT-001',
      outletName: 'Kopi & Rasa - Flagship Senopati',
      phone: '021-5550192',
      email: 'senopati@kopirasa.id',
      address: 'Jl. Senopati Raya No. 88, Kebayoran Baru',
      city: 'Jakarta Selatan',
      province: 'DKI Jakarta',
      postalCode: '12190',
      taxNumber: '01.234.567.8-012.000',
      receiptHeader: 'KOPI & RASA NUSANTARA\nCabang Flagship Senopati - Jakarta Selatan',
      receiptFooter: 'WiFi: KopiRasa-Guest / Pass: kopienakbanget\nFollow IG @kopirasa.pos',
      isCentral: 'Y',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  const outletGI = await prisma.posOutlet.upsert({
    where: { outletCode: 'OUT-002' },
    update: {
      outletName: 'Kopi & Rasa - Grand Indonesia',
      phone: '021-23580199',
      email: 'grandindonesia@kopirasa.id',
      address: 'Grand Indonesia West Mall Lantai LG No. 12A, Jl. M.H. Thamrin No. 1',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10310',
      taxNumber: '01.234.567.8-012.001',
      receiptHeader: 'KOPI & RASA NUSANTARA\nGrand Indonesia West Mall LG',
      receiptFooter: 'Terima kasih telah berkunjung ke outlet kami!',
      isCentral: 'N',
      isActive: 'Y',
    },
    create: {
      outletCode: 'OUT-002',
      outletName: 'Kopi & Rasa - Grand Indonesia',
      phone: '021-23580199',
      email: 'grandindonesia@kopirasa.id',
      address: 'Grand Indonesia West Mall Lantai LG No. 12A, Jl. M.H. Thamrin No. 1',
      city: 'Jakarta Pusat',
      province: 'DKI Jakarta',
      postalCode: '10310',
      taxNumber: '01.234.567.8-012.001',
      receiptHeader: 'KOPI & RASA NUSANTARA\nGrand Indonesia West Mall LG',
      receiptFooter: 'Terima kasih telah berkunjung ke outlet kami!',
      isCentral: 'N',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  const outletDago = await prisma.posOutlet.upsert({
    where: { outletCode: 'OUT-003' },
    update: {
      outletName: 'Kopi & Rasa - Bandung Dago',
      phone: '022-4210988',
      email: 'dago@kopirasa.id',
      address: 'Jl. Ir. H. Juanda No. 120, Dago',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40132',
      taxNumber: '01.234.567.8-012.002',
      receiptHeader: 'KOPI & RASA NUSANTARA\nCabang Dago Bandung Heritage',
      receiptFooter: 'Hatur Nuhun! Sampai jumpa kembali.',
      isCentral: 'N',
      isActive: 'Y',
    },
    create: {
      outletCode: 'OUT-003',
      outletName: 'Kopi & Rasa - Bandung Dago',
      phone: '022-4210988',
      email: 'dago@kopirasa.id',
      address: 'Jl. Ir. H. Juanda No. 120, Dago',
      city: 'Bandung',
      province: 'Jawa Barat',
      postalCode: '40132',
      taxNumber: '01.234.567.8-012.002',
      receiptHeader: 'KOPI & RASA NUSANTARA\nCabang Dago Bandung Heritage',
      receiptFooter: 'Hatur Nuhun! Sampai jumpa kembali.',
      isCentral: 'N',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  // 3. Registers (Terminal Kasir POS)
  const regSeno1 = await prisma.posRegister.upsert({
    where: { registerCode: 'REG-SENO-01' },
    update: { registerName: 'POS Kasir Kasir 1 (Front Senopati)', outletId: outletSenopati.outletId, ipAddress: '192.168.1.101', macAddress: '00:1A:2B:3C:4D:01' },
    create: {
      outletId: outletSenopati.outletId,
      registerCode: 'REG-SENO-01',
      registerName: 'POS Kasir Kasir 1 (Front Senopati)',
      ipAddress: '192.168.1.101',
      macAddress: '00:1A:2B:3C:4D:01',
      notes: 'Terminal Utama Kasir Depan',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  const regSeno2 = await prisma.posRegister.upsert({
    where: { registerCode: 'REG-SENO-02' },
    update: { registerName: 'POS Bar Station (Senopati)', outletId: outletSenopati.outletId, ipAddress: '192.168.1.102', macAddress: '00:1A:2B:3C:4D:02' },
    create: {
      outletId: outletSenopati.outletId,
      registerCode: 'REG-SENO-02',
      registerName: 'POS Bar Station (Senopati)',
      ipAddress: '192.168.1.102',
      macAddress: '00:1A:2B:3C:4D:02',
      notes: 'Terminal Bar Espresso',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  const regGI1 = await prisma.posRegister.upsert({
    where: { registerCode: 'REG-GI-01' },
    update: { registerName: 'POS Kasir Grand Indonesia', outletId: outletGI.outletId, ipAddress: '192.168.2.101', macAddress: '00:1A:2B:3C:4D:03' },
    create: {
      outletId: outletGI.outletId,
      registerCode: 'REG-GI-01',
      registerName: 'POS Kasir Grand Indonesia',
      ipAddress: '192.168.2.101',
      macAddress: '00:1A:2B:3C:4D:03',
      notes: 'Terminal Kasir Mall GI',
      isActive: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  // 4. Dining Tables
  const diningTablesData = [
    { outletId: outletSenopati.outletId, tableCode: 'T-01', tableName: 'Meja 01 (Indoor Depan)', section: 'Indoor Non-Smoking', capacity: 2, status: 'OCCUPIED' },
    { outletId: outletSenopati.outletId, tableCode: 'T-02', tableName: 'Meja 02 (Indoor Tengah)', section: 'Indoor Non-Smoking', capacity: 4, status: 'AVAILABLE' },
    { outletId: outletSenopati.outletId, tableCode: 'T-03', tableName: 'Meja 03 (Indoor Window)', section: 'Indoor Non-Smoking', capacity: 4, status: 'AVAILABLE' },
    { outletId: outletSenopati.outletId, tableCode: 'T-04', tableName: 'Meja 04 (Indoor Sofa)', section: 'Indoor Non-Smoking', capacity: 6, status: 'RESERVED' },
    { outletId: outletSenopati.outletId, tableCode: 'T-VIP-1', tableName: 'Ruang VIP Nusantara', section: 'VIP Lounge', capacity: 10, status: 'AVAILABLE' },
    { outletId: outletSenopati.outletId, tableCode: 'T-OUT-1', tableName: 'Meja Outdoor 01', section: 'Outdoor Terrace', capacity: 4, status: 'AVAILABLE' },
    { outletId: outletSenopati.outletId, tableCode: 'T-OUT-2', tableName: 'Meja Outdoor 02', section: 'Outdoor Terrace', capacity: 4, status: 'AVAILABLE' },
    { outletId: outletGI.outletId, tableCode: 'GI-01', tableName: 'Meja GI 01', section: 'Main Area', capacity: 2, status: 'AVAILABLE' },
    { outletId: outletGI.outletId, tableCode: 'GI-02', tableName: 'Meja GI 02', section: 'Main Area', capacity: 4, status: 'AVAILABLE' },
  ];

  const diningTableMap: Record<string, any> = {};
  for (const dt of diningTablesData) {
    const table = await prisma.posDiningTable.upsert({
      where: { outletId_tableCode: { outletId: dt.outletId, tableCode: dt.tableCode } },
      update: { tableName: dt.tableName, section: dt.section, capacity: dt.capacity, status: dt.status },
      create: { ...dt, createdBy: 'SYSTEM' },
    });
    diningTableMap[`${dt.outletId}_${dt.tableCode}`] = table;
  }

  // 5. Warehouses
  const warehousesData = [
    { warehouseCode: 'WH-CENTRAL', warehouseName: 'Gudang Pusat Logistik Cikarang', warehouseType: 'CENTRAL', isDefault: 'Y', address: 'Kawasan Industri Cikarang Blok C-12' },
    { warehouseCode: 'WH-SENO', warehouseName: 'Gudang Stok Senopati', warehouseType: 'OUTLET', outletId: outletSenopati.outletId, isDefault: 'N', address: 'Senopati Lt. Basement' },
    { warehouseCode: 'WH-GI', warehouseName: 'Gudang Stok Mall GI', warehouseType: 'OUTLET', outletId: outletGI.outletId, isDefault: 'N', address: 'Grand Indonesia LG Service Area' },
    { warehouseCode: 'WH-DAGO', warehouseName: 'Gudang Stok Dago Bandung', warehouseType: 'OUTLET', outletId: outletDago.outletId, isDefault: 'N', address: 'Dago Bandung Lt. 2' },
  ];

  for (const wh of warehousesData) {
    await prisma.posWarehouse.upsert({
      where: { warehouseCode: wh.warehouseCode },
      update: { warehouseName: wh.warehouseName, warehouseType: wh.warehouseType, isDefault: wh.isDefault, outletId: wh.outletId, address: wh.address },
      create: { ...wh, createdBy: 'SYSTEM' },
    });
  }

  // 6. Units (UOM)
  const unitsData = [
    { unitCode: 'PCS', unitName: 'Pieces / Buah', description: 'Satuan per satuan barang jadi' },
    { unitCode: 'CUP', unitName: 'Cup / Gelas', description: 'Penyajian minuman per cup' },
    { unitCode: 'PORSI', unitName: 'Porsi', description: 'Porsi piring / sajian makanan' },
    { unitCode: 'GRAM', unitName: 'Gram (g)', description: 'Satuan berat gram untuk takaran bahan baku' },
    { unitCode: 'KG', unitName: 'Kilogram (kg)', description: 'Satuan berat kilogram bahan baku' },
    { unitCode: 'ML', unitName: 'Mililiter (ml)', description: 'Satuan volume mililiter minuman & sirup' },
    { unitCode: 'LITER', unitName: 'Liter (L)', description: 'Satuan volume liter untuk susu cair' },
    { unitCode: 'PACK', unitName: 'Pack / Bungkus', description: 'Kemasan pack isi multipack' },
    { unitCode: 'BOX', unitName: 'Box / Karton', description: 'Karton karton besar supplier' },
  ];

  const unitMap: Record<string, any> = {};
  for (const u of unitsData) {
    const unit = await prisma.posUnit.upsert({
      where: { unitCode: u.unitCode },
      update: { unitName: u.unitName, description: u.description },
      create: { ...u, createdBy: 'SYSTEM' },
    });
    unitMap[u.unitCode] = unit;
  }

  // 7. Unit Conversions
  const conversions = [
    { fromUnitId: unitMap['KG'].unitId, toUnitId: unitMap['GRAM'].unitId, multiplier: 1000 },
    { fromUnitId: unitMap['LITER'].unitId, toUnitId: unitMap['ML'].unitId, multiplier: 1000 },
    { fromUnitId: unitMap['PACK'].unitId, toUnitId: unitMap['PCS'].unitId, multiplier: 50 },
    { fromUnitId: unitMap['BOX'].unitId, toUnitId: unitMap['PCS'].unitId, multiplier: 24 },
  ];

  for (const c of conversions) {
    await prisma.posUnitConversion.upsert({
      where: { fromUnitId_toUnitId: { fromUnitId: c.fromUnitId, toUnitId: c.toUnitId } },
      update: { multiplier: c.multiplier },
      create: { ...c, createdBy: 'SYSTEM' },
    });
  }

  // 8. Kitchen Stations
  const kitchenStationsData = [
    { outletId: outletSenopati.outletId, stationCode: 'KS-BAR-SENO', stationName: 'Bar & Espresso Station Senopati', printerType: 'NETWORK', printerIp: '192.168.1.201', printerPort: 9100, isKdsEnabled: 'Y' },
    { outletId: outletSenopati.outletId, stationCode: 'KS-HOT-SENO', stationName: 'Hot Kitchen & Fryer Senopati', printerType: 'NETWORK', printerIp: '192.168.1.202', printerPort: 9100, isKdsEnabled: 'Y' },
    { outletId: outletSenopati.outletId, stationCode: 'KS-PASTRY-SENO', stationName: 'Bakery & Pastry Station Senopati', printerType: 'NETWORK', printerIp: '192.168.1.203', printerPort: 9100, isKdsEnabled: 'N' },
    { outletId: outletGI.outletId, stationCode: 'KS-BAR-GI', stationName: 'Bar Station Grand Indonesia', printerType: 'NETWORK', printerIp: '192.168.2.201', printerPort: 9100, isKdsEnabled: 'Y' },
    { outletId: outletGI.outletId, stationCode: 'KS-HOT-GI', stationName: 'Kitchen GI Station', printerType: 'NETWORK', printerIp: '192.168.2.202', printerPort: 9100, isKdsEnabled: 'Y' },
  ];

  const stationMap: Record<string, any> = {};
  for (const ks of kitchenStationsData) {
    const station = await prisma.posKitchenStation.upsert({
      where: { outletId_stationCode: { outletId: ks.outletId, stationCode: ks.stationCode } },
      update: { stationName: ks.stationName, printerType: ks.printerType, printerIp: ks.printerIp, printerPort: ks.printerPort, isKdsEnabled: ks.isKdsEnabled },
      create: { ...ks, createdBy: 'SYSTEM' },
    });
    stationMap[ks.stationCode] = station;
  }

  // 9. Taxes
  const taxesData = [
    { taxCode: 'PB1', taxName: 'PB1 Restoran 10%', rate: 10.00, isInclusive: 'N', description: 'Pajak Daerah Restoran & Minuman' },
    { taxCode: 'PPN11', taxName: 'PPN 11%', rate: 11.00, isInclusive: 'N', description: 'Pajak Pertambahan Nilai Barang Retail' },
    { taxCode: 'TAX_INC', taxName: 'Pajak Termasuk (Inclusive 10%)', rate: 10.00, isInclusive: 'Y', description: 'Pajak sudah termasuk di harga menu' },
    { taxCode: 'NON_TAX', taxName: 'Bebas Pajak (0%)', rate: 0.00, isInclusive: 'N', description: 'Barang tidak kena pajak / bahan mentah' },
  ];

  const taxMap: Record<string, any> = {};
  for (const t of taxesData) {
    const tax = await prisma.posTax.upsert({
      where: { taxCode: t.taxCode },
      update: { taxName: t.taxName, rate: t.rate, isInclusive: t.isInclusive, description: t.description },
      create: { ...t, createdBy: 'SYSTEM' },
    });
    taxMap[t.taxCode] = tax;
  }

  // 10. Brands
  const brandsData = [
    { brandCode: 'BR-KOPIRASA', brandName: 'Kopi & Rasa Signature', description: 'Menu Kopi & Signature Minuman' },
    { brandCode: 'BR-NUSANTARA', brandName: 'Nusantara Heritage Food', description: 'Menu Masakan & Rice Bowl' },
    { brandCode: 'BR-BAKERY', brandName: 'Le Petit Boulangerie', description: 'Pastry, Croissant & Roti Artisan' },
    { brandCode: 'BR-MERCH', brandName: 'K&R Official Merch', description: 'Merchandise, Tumbler & Biji Kopi' },
  ];

  const brandMap: Record<string, any> = {};
  for (const b of brandsData) {
    const brand = await prisma.posBrand.upsert({
      where: { brandCode: b.brandCode },
      update: { brandName: b.brandName, description: b.description },
      create: { ...b, createdBy: 'SYSTEM' },
    });
    brandMap[b.brandCode] = brand;
  }

  // 11. Categories (Hierarchy)
  const catBev = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-BEV' },
    update: { categoryName: 'Minuman / Beverages', icon: 'Coffee', color: '#795548', displayOrder: 1 },
    create: { categoryCode: 'CAT-BEV', categoryName: 'Minuman / Beverages', icon: 'Coffee', color: '#795548', displayOrder: 1, createdBy: 'SYSTEM' },
  });

  const catCoffee = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-COFFEE' },
    update: { categoryName: 'Espresso & Coffee', parentCategoryId: catBev.categoryId, icon: 'Coffee', color: '#4E342E', displayOrder: 1, kitchenStationId: stationMap['KS-BAR-SENO'].stationId },
    create: { categoryCode: 'CAT-COFFEE', categoryName: 'Espresso & Coffee', parentCategoryId: catBev.categoryId, icon: 'Coffee', color: '#4E342E', displayOrder: 1, kitchenStationId: stationMap['KS-BAR-SENO'].stationId, createdBy: 'SYSTEM' },
  });

  const catNonCoffee = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-NONCOFFEE' },
    update: { categoryName: 'Tea & Non-Coffee', parentCategoryId: catBev.categoryId, icon: 'CupSoda', color: '#2E7D32', displayOrder: 2, kitchenStationId: stationMap['KS-BAR-SENO'].stationId },
    create: { categoryCode: 'CAT-NONCOFFEE', categoryName: 'Tea & Non-Coffee', parentCategoryId: catBev.categoryId, icon: 'CupSoda', color: '#2E7D32', displayOrder: 2, kitchenStationId: stationMap['KS-BAR-SENO'].stationId, createdBy: 'SYSTEM' },
  });

  const catFood = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-FOOD' },
    update: { categoryName: 'Makanan / Food', icon: 'Utensils', color: '#E65100', displayOrder: 2 },
    create: { categoryCode: 'CAT-FOOD', categoryName: 'Makanan / Food', icon: 'Utensils', color: '#E65100', displayOrder: 2, createdBy: 'SYSTEM' },
  });

  const catMain = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-MAIN' },
    update: { categoryName: 'Main Course & Rice Bowl', parentCategoryId: catFood.categoryId, icon: 'Soup', color: '#D84315', displayOrder: 1, kitchenStationId: stationMap['KS-HOT-SENO'].stationId },
    create: { categoryCode: 'CAT-MAIN', categoryName: 'Main Course & Rice Bowl', parentCategoryId: catFood.categoryId, icon: 'Soup', color: '#D84315', displayOrder: 1, kitchenStationId: stationMap['KS-HOT-SENO'].stationId, createdBy: 'SYSTEM' },
  });

  const catSnack = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-SNACK' },
    update: { categoryName: 'Snacks & Appetizers', parentCategoryId: catFood.categoryId, icon: 'Cookie', color: '#EF6C00', displayOrder: 2, kitchenStationId: stationMap['KS-HOT-SENO'].stationId },
    create: { categoryCode: 'CAT-SNACK', categoryName: 'Snacks & Appetizers', parentCategoryId: catFood.categoryId, icon: 'Cookie', color: '#EF6C00', displayOrder: 2, kitchenStationId: stationMap['KS-HOT-SENO'].stationId, createdBy: 'SYSTEM' },
  });

  const catBakery = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-BAKERY' },
    update: { categoryName: 'Pastry & Dessert', parentCategoryId: catFood.categoryId, icon: 'Cake', color: '#F57C00', displayOrder: 3, kitchenStationId: stationMap['KS-PASTRY-SENO'].stationId },
    create: { categoryCode: 'CAT-BAKERY', categoryName: 'Pastry & Dessert', parentCategoryId: catFood.categoryId, icon: 'Cake', color: '#F57C00', displayOrder: 3, kitchenStationId: stationMap['KS-PASTRY-SENO'].stationId, createdBy: 'SYSTEM' },
  });

  const catCombo = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-COMBO' },
    update: { categoryName: 'Paket Combo Hemat', icon: 'PackageCheck', color: '#1565C0', displayOrder: 3 },
    create: { categoryCode: 'CAT-COMBO', categoryName: 'Paket Combo Hemat', icon: 'PackageCheck', color: '#1565C0', displayOrder: 3, createdBy: 'SYSTEM' },
  });

  const catRaw = await prisma.posCategory.upsert({
    where: { categoryCode: 'CAT-RAW' },
    update: { categoryName: 'Bahan Baku & Inventory', icon: 'Boxes', color: '#455A64', displayOrder: 4 },
    create: { categoryCode: 'CAT-RAW', categoryName: 'Bahan Baku & Inventory', icon: 'Boxes', color: '#455A64', displayOrder: 4, createdBy: 'SYSTEM' },
  });

  // 12. Products (Raw Materials, Drinks, Foods, Combo)
  // 12.1 Raw Materials
  const rawBean = await prisma.posProduct.upsert({
    where: { productCode: 'RAW-BEAN-01' },
    update: { productName: 'Biji Kopi Arabica House Blend 1kg', productType: 'RAW_MATERIAL', categoryId: catRaw.categoryId, unitId: unitMap['KG'].unitId, taxId: taxMap['NON_TAX'].taxId, costPrice: 165000, sellingPrice: 0, isForSale: 'N', isInventoryTracked: 'Y' },
    create: {
      productCode: 'RAW-BEAN-01',
      sku: 'SKU-RAW-BEAN-01',
      barcode: '899100100001',
      productName: 'Biji Kopi Arabica House Blend 1kg',
      productType: 'RAW_MATERIAL',
      categoryId: catRaw.categoryId,
      unitId: unitMap['KG'].unitId,
      taxId: taxMap['NON_TAX'].taxId,
      costPrice: 165000,
      sellingPrice: 0,
      minStock: 5,
      maxStock: 50,
      isForSale: 'N',
      isInventoryTracked: 'Y',
      description: 'Biji kopi pilihan Aceh Gayo & Toraja medium roast',
      createdBy: 'SYSTEM',
    },
  });

  const rawMilk = await prisma.posProduct.upsert({
    where: { productCode: 'RAW-MILK-01' },
    update: { productName: 'Susu Fresh Milk Pasteurisasi 1 Liter', productType: 'RAW_MATERIAL', categoryId: catRaw.categoryId, unitId: unitMap['LITER'].unitId, taxId: taxMap['NON_TAX'].taxId, costPrice: 19500, sellingPrice: 0, isForSale: 'N', isInventoryTracked: 'Y' },
    create: {
      productCode: 'RAW-MILK-01',
      sku: 'SKU-RAW-MILK-01',
      barcode: '899100100002',
      productName: 'Susu Fresh Milk Pasteurisasi 1 Liter',
      productType: 'RAW_MATERIAL',
      categoryId: catRaw.categoryId,
      unitId: unitMap['LITER'].unitId,
      taxId: taxMap['NON_TAX'].taxId,
      costPrice: 19500,
      sellingPrice: 0,
      minStock: 20,
      maxStock: 200,
      isForSale: 'N',
      isInventoryTracked: 'Y',
      description: 'Susu sapi murni dingin pasteurisasi premium',
      createdBy: 'SYSTEM',
    },
  });

  const rawRice = await prisma.posProduct.upsert({
    where: { productCode: 'RAW-RICE-01' },
    update: { productName: 'Beras Pandan Wangi Premium 1kg', productType: 'RAW_MATERIAL', categoryId: catRaw.categoryId, unitId: unitMap['KG'].unitId, taxId: taxMap['NON_TAX'].taxId, costPrice: 17000, sellingPrice: 0, isForSale: 'N', isInventoryTracked: 'Y' },
    create: {
      productCode: 'RAW-RICE-01',
      sku: 'SKU-RAW-RICE-01',
      barcode: '899100100003',
      productName: 'Beras Pandan Wangi Premium 1kg',
      productType: 'RAW_MATERIAL',
      categoryId: catRaw.categoryId,
      unitId: unitMap['KG'].unitId,
      taxId: taxMap['NON_TAX'].taxId,
      costPrice: 17000,
      sellingPrice: 0,
      minStock: 25,
      maxStock: 300,
      isForSale: 'N',
      isInventoryTracked: 'Y',
      createdBy: 'SYSTEM',
    },
  });

  // 12.2 Finished Goods (Beverages & Foods)
  const prodLatte = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-LATTE' },
    update: {
      productName: 'Caffe Latte Art',
      productType: 'STANDARD',
      categoryId: catCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 9500,
      sellingPrice: 32000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-LATTE',
      sku: 'SKU-PROD-LATTE',
      barcode: '899200200001',
      productName: 'Caffe Latte Art',
      productType: 'STANDARD',
      categoryId: catCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 9500,
      sellingPrice: 32000,
      minStock: 10,
      maxStock: 100,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Double shot espresso dengan steamed fresh milk lembut dan latte art indah',
      imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodAren = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-AREN' },
    update: {
      productName: 'Es Kopi Susu Gula Aren Nusantara',
      productType: 'STANDARD',
      categoryId: catCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 7500,
      sellingPrice: 25000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-AREN',
      sku: 'SKU-PROD-AREN',
      barcode: '899200200002',
      productName: 'Es Kopi Susu Gula Aren Nusantara',
      productType: 'STANDARD',
      categoryId: catCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 7500,
      sellingPrice: 25000,
      minStock: 20,
      maxStock: 200,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Signature kopi susu dengan gula aren cair organik asli Lebak Banten',
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodMatcha = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-MATCHA' },
    update: {
      productName: 'Kyoto Matcha Latte',
      productType: 'STANDARD',
      categoryId: catNonCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 12000,
      sellingPrice: 35000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-MATCHA',
      sku: 'SKU-PROD-MATCHA',
      barcode: '899200200003',
      productName: 'Kyoto Matcha Latte',
      productType: 'STANDARD',
      categoryId: catNonCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 12000,
      sellingPrice: 35000,
      minStock: 10,
      maxStock: 80,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Matcha ceremonial grade asli Uji Kyoto dipadukan susu creamy',
      imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodLychee = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-LYCHEE' },
    update: {
      productName: 'Lychee Iced Tea with Real Fruit',
      productType: 'STANDARD',
      categoryId: catNonCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 6000,
      sellingPrice: 24000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-LYCHEE',
      sku: 'SKU-PROD-LYCHEE',
      barcode: '899200200004',
      productName: 'Lychee Iced Tea with Real Fruit',
      productType: 'STANDARD',
      categoryId: catNonCoffee.categoryId,
      brandId: brandMap['BR-KOPIRASA'].brandId,
      unitId: unitMap['CUP'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
      costPrice: 6000,
      sellingPrice: 24000,
      minStock: 15,
      maxStock: 100,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Teh melati wangi dengan sirup leci dan 2 buah leci utuh segar',
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodNasgur = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-NASGUR' },
    update: {
      productName: 'Nasi Goreng Wagyu Kampoeng',
      productType: 'STANDARD',
      categoryId: catMain.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
      costPrice: 22000,
      sellingPrice: 55000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-NASGUR',
      sku: 'SKU-PROD-NASGUR',
      barcode: '899200200005',
      productName: 'Nasi Goreng Wagyu Kampoeng',
      productType: 'STANDARD',
      categoryId: catMain.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
      costPrice: 22000,
      sellingPrice: 55000,
      minStock: 10,
      maxStock: 100,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Nasi goreng bumbu racik tradisional dengan irisan daging sapi wagyu meltique empuk, acar, dan kerupuk',
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodAyamGeprek = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-AYAMGEPREK' },
    update: {
      productName: 'Nasi Ayam Geprek Sambal Korek',
      productType: 'STANDARD',
      categoryId: catMain.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
      costPrice: 15000,
      sellingPrice: 38000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-AYAMGEPREK',
      sku: 'SKU-PROD-AYAMGEPREK',
      barcode: '899200200006',
      productName: 'Nasi Ayam Geprek Sambal Korek',
      productType: 'STANDARD',
      categoryId: catMain.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
      costPrice: 15000,
      sellingPrice: 38000,
      minStock: 10,
      maxStock: 80,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Ayam krispi gurih digeprek dengan sambal cabai rawit pedas mantap',
      imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodFries = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-TRUFFLE-FRIES' },
    update: {
      productName: 'Truffle Parmesan French Fries',
      productType: 'STANDARD',
      categoryId: catSnack.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
      costPrice: 11000,
      sellingPrice: 32000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-TRUFFLE-FRIES',
      sku: 'SKU-PROD-TRUFFLE-FRIES',
      barcode: '899200200007',
      productName: 'Truffle Parmesan French Fries',
      productType: 'STANDARD',
      categoryId: catSnack.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
      costPrice: 11000,
      sellingPrice: 32000,
      minStock: 10,
      maxStock: 50,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Kentang goreng renyah bertabur keju parmesan parut dan aroma truffle oil',
      imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodCroissant = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-CROISSANT' },
    update: {
      productName: 'French Butter Croissant',
      productType: 'STANDARD',
      categoryId: catBakery.categoryId,
      brandId: brandMap['BR-BAKERY'].brandId,
      unitId: unitMap['PCS'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-PASTRY-SENO'].stationId,
      costPrice: 10000,
      sellingPrice: 28000,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
    },
    create: {
      productCode: 'PROD-CROISSANT',
      sku: 'SKU-PROD-CROISSANT',
      barcode: '899200200008',
      productName: 'French Butter Croissant',
      productType: 'STANDARD',
      categoryId: catBakery.categoryId,
      brandId: brandMap['BR-BAKERY'].brandId,
      unitId: unitMap['PCS'].unitId,
      taxId: taxMap['PB1'].taxId,
      kitchenStationId: stationMap['KS-PASTRY-SENO'].stationId,
      costPrice: 10000,
      sellingPrice: 28000,
      minStock: 5,
      maxStock: 30,
      isForSale: 'Y',
      isInventoryTracked: 'Y',
      description: 'Croissant mentega Prancis renyah di luar, lembut berlapis di dalam',
      imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  const prodComboSiang = await prisma.posProduct.upsert({
    where: { productCode: 'PROD-COMBO-SIANG' },
    update: {
      productName: 'Paket Hemat Makan Siang Kenyang',
      productType: 'COMBO',
      categoryId: catCombo.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      costPrice: 24000,
      sellingPrice: 58000,
      isForSale: 'Y',
      isInventoryTracked: 'N',
    },
    create: {
      productCode: 'PROD-COMBO-SIANG',
      sku: 'SKU-PROD-COMBO-SIANG',
      barcode: '899200200009',
      productName: 'Paket Hemat Makan Siang Kenyang',
      productType: 'COMBO',
      categoryId: catCombo.categoryId,
      brandId: brandMap['BR-NUSANTARA'].brandId,
      unitId: unitMap['PORSI'].unitId,
      taxId: taxMap['PB1'].taxId,
      costPrice: 24000,
      sellingPrice: 58000,
      minStock: 0,
      maxStock: 0,
      isForSale: 'Y',
      isInventoryTracked: 'N',
      description: 'Paket hemat 1 Makanan Utama (Nasi Goreng / Ayam Geprek) + 1 Minuman Segar',
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
      createdBy: 'SYSTEM',
    },
  });

  // 13. Product Variants
  const varLatteReg = await prisma.posProductVariant.upsert({
    where: { variantCode: 'VAR-LATTE-REG' },
    update: { variantName: 'Caffe Latte - Hot 8oz', costPrice: 9500, sellingPrice: 32000 },
    create: { productId: prodLatte.productId, variantCode: 'VAR-LATTE-REG', sku: 'SKU-LATTE-HOT', barcode: '899300300001', variantName: 'Caffe Latte - Hot 8oz', costPrice: 9500, sellingPrice: 32000, createdBy: 'SYSTEM' },
  });

  const varLatteLarge = await prisma.posProductVariant.upsert({
    where: { variantCode: 'VAR-LATTE-LARGE' },
    update: { variantName: 'Caffe Latte - Iced 16oz', costPrice: 11000, sellingPrice: 38000 },
    create: { productId: prodLatte.productId, variantCode: 'VAR-LATTE-LARGE', sku: 'SKU-LATTE-ICE', barcode: '899300300002', variantName: 'Caffe Latte - Iced 16oz', costPrice: 11000, sellingPrice: 38000, createdBy: 'SYSTEM' },
  });

  const varArenIce = await prisma.posProductVariant.upsert({
    where: { variantCode: 'VAR-AREN-ICE' },
    update: { variantName: 'Kopi Susu Aren - Dingin 16oz', costPrice: 7500, sellingPrice: 25000 },
    create: { productId: prodAren.productId, variantCode: 'VAR-AREN-ICE', sku: 'SKU-AREN-ICE', barcode: '899300300003', variantName: 'Kopi Susu Aren - Dingin 16oz', costPrice: 7500, sellingPrice: 25000, createdBy: 'SYSTEM' },
  });

  const varAren1L = await prisma.posProductVariant.upsert({
    where: { variantCode: 'VAR-AREN-1L' },
    update: { variantName: 'Kopi Susu Aren - Kemasan Botol 1 Liter', costPrice: 26000, sellingPrice: 85000 },
    create: { productId: prodAren.productId, variantCode: 'VAR-AREN-1L', sku: 'SKU-AREN-1L', barcode: '899300300004', variantName: 'Kopi Susu Aren - Kemasan Botol 1 Liter', costPrice: 26000, sellingPrice: 85000, createdBy: 'SYSTEM' },
  });

  const varGeprekL1 = await prisma.posProductVariant.upsert({
    where: { variantCode: 'VAR-GEPREK-L1' },
    update: { variantName: 'Ayam Geprek - Level 1 Santuy', costPrice: 15000, sellingPrice: 38000 },
    create: { productId: prodAyamGeprek.productId, variantCode: 'VAR-GEPREK-L1', sku: 'SKU-GEPREK-L1', barcode: '899300300005', variantName: 'Ayam Geprek - Level 1 Santuy', costPrice: 15000, sellingPrice: 38000, createdBy: 'SYSTEM' },
  });

  const varGeprekL3 = await prisma.posProductVariant.upsert({
    where: { variantCode: 'VAR-GEPREK-L3' },
    update: { variantName: 'Ayam Geprek - Level 3 Pedas Nampol', costPrice: 15500, sellingPrice: 38000 },
    create: { productId: prodAyamGeprek.productId, variantCode: 'VAR-GEPREK-L3', sku: 'SKU-GEPREK-L3', barcode: '899300300006', variantName: 'Ayam Geprek - Level 3 Pedas Nampol', costPrice: 15500, sellingPrice: 38000, createdBy: 'SYSTEM' },
  });

  // 14. Product Outlet Prices
  const outletPrices = [
    { productId: prodLatte.productId, variantId: null, outletId: outletGI.outletId, sellingPrice: 35000 },
    { productId: prodAren.productId, variantId: null, outletId: outletGI.outletId, sellingPrice: 28000 },
    { productId: prodNasgur.productId, variantId: null, outletId: outletGI.outletId, sellingPrice: 60000 },
    { productId: prodLatte.productId, variantId: null, outletId: outletDago.outletId, sellingPrice: 30000 },
  ];

  for (const op of outletPrices) {
    const existing = await prisma.posProductOutletPrice.findFirst({
      where: { productId: op.productId, variantId: op.variantId, outletId: op.outletId },
    });
    if (existing) {
      await prisma.posProductOutletPrice.update({
        where: { priceId: existing.priceId },
        data: { sellingPrice: op.sellingPrice },
      });
    } else {
      await prisma.posProductOutletPrice.create({
        data: { ...op, createdBy: 'SYSTEM' },
      });
    }
  }

  // 15. Modifiers (Groups & Items)
  let modGroupSugar = await prisma.posProductModifierGroup.findFirst({
    where: { productId: prodLatte.productId, groupName: 'Tingkat Kemanisan (Sweetness)' },
  });
  if (!modGroupSugar) {
    modGroupSugar = await prisma.posProductModifierGroup.create({
      data: {
        productId: prodLatte.productId,
        groupName: 'Tingkat Kemanisan (Sweetness)',
        minSelect: 1,
        maxSelect: 1,
        isRequired: 'Y',
        createdBy: 'SYSTEM',
        items: {
          create: [
            { itemName: 'Normal Sweet (100%)', extraPrice: 0, createdBy: 'SYSTEM' },
            { itemName: 'Less Sweet (50%)', extraPrice: 0, createdBy: 'SYSTEM' },
            { itemName: 'No Sugar (0%)', extraPrice: 0, createdBy: 'SYSTEM' },
          ],
        },
      },
    });
  }

  let modGroupTopping = await prisma.posProductModifierGroup.findFirst({
    where: { productId: prodLatte.productId, groupName: 'Pilihan Topping & Extra' },
  });
  if (!modGroupTopping) {
    modGroupTopping = await prisma.posProductModifierGroup.create({
      data: {
        productId: prodLatte.productId,
        groupName: 'Pilihan Topping & Extra',
        minSelect: 0,
        maxSelect: 3,
        isRequired: 'N',
        createdBy: 'SYSTEM',
        items: {
          create: [
            { itemName: 'Espresso Extra Shot', extraPrice: 6000, createdBy: 'SYSTEM' },
            { itemName: 'Caramel Sauce Drizzle', extraPrice: 4000, createdBy: 'SYSTEM' },
            { itemName: 'Vanilla Syrup Pump', extraPrice: 5000, createdBy: 'SYSTEM' },
            { itemName: 'Oat Milk Substitution', extraPrice: 8000, createdBy: 'SYSTEM' },
          ],
        },
      },
    });
  }

  let modGroupEgg = await prisma.posProductModifierGroup.findFirst({
    where: { productId: prodNasgur.productId, groupName: 'Pilihan Masakan Telur' },
  });
  if (!modGroupEgg) {
    modGroupEgg = await prisma.posProductModifierGroup.create({
      data: {
        productId: prodNasgur.productId,
        groupName: 'Pilihan Masakan Telur',
        minSelect: 1,
        maxSelect: 1,
        isRequired: 'Y',
        createdBy: 'SYSTEM',
        items: {
          create: [
            { itemName: 'Telur Ceplok Setengah Matang', extraPrice: 0, createdBy: 'SYSTEM' },
            { itemName: 'Telur Ceplok Matang', extraPrice: 0, createdBy: 'SYSTEM' },
            { itemName: 'Telur Dadar Crispy', extraPrice: 0, createdBy: 'SYSTEM' },
          ],
        },
      },
    });
  }

  // 16. Recipes & Bill of Materials
  const existingRecipe = await prisma.posProductRecipe.findFirst({
    where: { productId: prodLatte.productId, ingredientProductId: rawBean.productId },
  });
  if (!existingRecipe) {
    await prisma.posProductRecipe.createMany({
      data: [
        {
          productId: prodLatte.productId,
          ingredientProductId: rawBean.productId,
          unitId: unitMap['GRAM'].unitId,
          quantity: 18.0000,
          wastagePercent: 2.00,
          costPrice: 3000,
          createdBy: 'SYSTEM',
        },
        {
          productId: prodLatte.productId,
          ingredientProductId: rawMilk.productId,
          unitId: unitMap['ML'].unitId,
          quantity: 200.0000,
          wastagePercent: 5.00,
          costPrice: 4100,
          createdBy: 'SYSTEM',
        },
        {
          productId: prodNasgur.productId,
          ingredientProductId: rawRice.productId,
          unitId: unitMap['GRAM'].unitId,
          quantity: 200.0000,
          wastagePercent: 0,
          costPrice: 3400,
          createdBy: 'SYSTEM',
        },
      ],
    });
  }

  // 17. Combo Groups & Items
  let comboFoodGroup = await prisma.posComboGroup.findFirst({
    where: { productId: prodComboSiang.productId, groupName: 'Pilih Makanan Utama' },
  });
  if (!comboFoodGroup) {
    comboFoodGroup = await prisma.posComboGroup.create({
      data: {
        productId: prodComboSiang.productId,
        groupName: 'Pilih Makanan Utama',
        minSelect: 1,
        maxSelect: 1,
        isRequired: 'Y',
        createdBy: 'SYSTEM',
        items: {
          create: [
            { itemProductId: prodNasgur.productId, extraPrice: 0, isDefault: 'Y', createdBy: 'SYSTEM' },
            { itemProductId: prodAyamGeprek.productId, extraPrice: 0, isDefault: 'N', createdBy: 'SYSTEM' },
          ],
        },
      },
    });
  }

  let comboDrinkGroup = await prisma.posComboGroup.findFirst({
    where: { productId: prodComboSiang.productId, groupName: 'Pilih Minuman Segar' },
  });
  if (!comboDrinkGroup) {
    comboDrinkGroup = await prisma.posComboGroup.create({
      data: {
        productId: prodComboSiang.productId,
        groupName: 'Pilih Minuman Segar',
        minSelect: 1,
        maxSelect: 1,
        isRequired: 'Y',
        createdBy: 'SYSTEM',
        items: {
          create: [
            { itemProductId: prodLychee.productId, extraPrice: 0, isDefault: 'Y', createdBy: 'SYSTEM' },
            { itemProductId: prodAren.productId, extraPrice: 3000, isDefault: 'N', createdBy: 'SYSTEM' },
          ],
        },
      },
    });
  }

  // 18. Surcharges
  const surcharges = [
    { surchargeCode: 'SUR-SVC', surchargeName: 'Service Charge Dine-In 5%', surchargeType: 'PERCENTAGE', rateValue: 5.00, isTaxable: 'Y', applicableOrderType: 'DINE_IN', outletId: outletSenopati.outletId },
    { surchargeCode: 'SUR-TAKEAWAY', surchargeName: 'Biaya Kemasan Eco Paper Takeaway', surchargeType: 'FIXED_AMOUNT', rateValue: 2000.00, isTaxable: 'N', applicableOrderType: 'TAKE_AWAY' },
  ];

  for (const sc of surcharges) {
    await prisma.posSurcharge.upsert({
      where: { surchargeCode: sc.surchargeCode },
      update: { surchargeName: sc.surchargeName, surchargeType: sc.surchargeType, rateValue: sc.rateValue, isTaxable: sc.isTaxable, applicableOrderType: sc.applicableOrderType, outletId: sc.outletId },
      create: { ...sc, createdBy: 'SYSTEM' },
    });
  }

  // 19. Sales Channels
  const channels = [
    { channelCode: 'CH-DINEIN', channelName: 'Dine In / Makan di Tempat', orderType: 'DINE_IN', priceMarkupPercent: 0, platformCommissionPercent: 0, autoAcceptOrder: 'Y' },
    { channelCode: 'CH-TAKEAWAY', channelName: 'Take Away / Bungkus', orderType: 'TAKE_AWAY', priceMarkupPercent: 0, platformCommissionPercent: 0, autoAcceptOrder: 'Y' },
    { channelCode: 'CH-GOFOOD', channelName: 'GoFood by Gojek', orderType: 'DELIVERY', priceMarkupPercent: 20.00, platformCommissionPercent: 20.00, autoAcceptOrder: 'Y' },
    { channelCode: 'CH-GRABFOOD', channelName: 'GrabFood', orderType: 'DELIVERY', priceMarkupPercent: 20.00, platformCommissionPercent: 20.00, autoAcceptOrder: 'Y' },
    { channelCode: 'CH-SHOPEE', channelName: 'ShopeeFood', orderType: 'DELIVERY', priceMarkupPercent: 20.00, platformCommissionPercent: 20.00, autoAcceptOrder: 'Y' },
  ];

  const channelMap: Record<string, any> = {};
  for (const ch of channels) {
    const channel = await prisma.posSalesChannel.upsert({
      where: { channelCode: ch.channelCode },
      update: { channelName: ch.channelName, orderType: ch.orderType, priceMarkupPercent: ch.priceMarkupPercent, platformCommissionPercent: ch.platformCommissionPercent, autoAcceptOrder: ch.autoAcceptOrder },
      create: { ...ch, createdBy: 'SYSTEM' },
    });
    channelMap[ch.channelCode] = channel;
  }

  // 20. Customer Groups & Customers
  const grpRegular = await prisma.posCustomerGroup.upsert({
    where: { groupCode: 'CGRP-REG' },
    update: { groupName: 'Pelanggan Reguler', discountPercent: 0, description: 'Pelanggan umum tanpa kartu member' },
    create: { groupCode: 'CGRP-REG', groupName: 'Pelanggan Reguler', discountPercent: 0, description: 'Pelanggan umum tanpa kartu member', createdBy: 'SYSTEM' },
  });

  const grpSilver = await prisma.posCustomerGroup.upsert({
    where: { groupCode: 'CGRP-SILVER' },
    update: { groupName: 'Member Silver Card', discountPercent: 5.00, description: 'Member loyalitas tier Silver' },
    create: { groupCode: 'CGRP-SILVER', groupName: 'Member Silver Card', discountPercent: 5.00, description: 'Member loyalitas tier Silver', createdBy: 'SYSTEM' },
  });

  const grpGold = await prisma.posCustomerGroup.upsert({
    where: { groupCode: 'CGRP-GOLD' },
    update: { groupName: 'Member VIP Gold', discountPercent: 10.00, description: 'Member VIP prioritas dengan benefit spesial' },
    create: { groupCode: 'CGRP-GOLD', groupName: 'Member VIP Gold', discountPercent: 10.00, description: 'Member VIP prioritas dengan benefit spesial', createdBy: 'SYSTEM' },
  });

  const cust1 = await prisma.posCustomer.upsert({
    where: { customerCode: 'CUST-001' },
    update: { customerName: 'Budi Santoso, S.Kom', phone: '081198765432', email: 'budi.santoso@gmail.com', customerGroupId: grpGold.customerGroupId, loyaltyPoints: 1250, creditLimit: 2000000 },
    create: {
      customerCode: 'CUST-001',
      customerName: 'Budi Santoso, S.Kom',
      phone: '081198765432',
      email: 'budi.santoso@gmail.com',
      address: 'Jl. Bumi Indah No. 15, Kebayoran Baru, Jakarta Selatan',
      customerGroupId: grpGold.customerGroupId,
      loyaltyPoints: 1250,
      creditLimit: 2000000,
      createdBy: 'SYSTEM',
    },
  });

  const cust2 = await prisma.posCustomer.upsert({
    where: { customerCode: 'CUST-002' },
    update: { customerName: 'Dr. Siti Rahmawati', phone: '081287654321', email: 'siti.rahma@yahoo.com', customerGroupId: grpSilver.customerGroupId, loyaltyPoints: 480 },
    create: {
      customerCode: 'CUST-002',
      customerName: 'Dr. Siti Rahmawati',
      phone: '081287654321',
      email: 'siti.rahma@yahoo.com',
      address: 'Apartemen Sudirman Tower Lt. 18, Jakarta Pusat',
      customerGroupId: grpSilver.customerGroupId,
      loyaltyPoints: 480,
      creditLimit: 0,
      createdBy: 'SYSTEM',
    },
  });

  const cust3 = await prisma.posCustomer.upsert({
    where: { customerCode: 'CUST-003' },
    update: { customerName: 'Michael Tanuwidjaja', phone: '081377889900', email: 'michael.tan@outlook.com', customerGroupId: grpRegular.customerGroupId, loyaltyPoints: 50 },
    create: {
      customerCode: 'CUST-003',
      customerName: 'Michael Tanuwidjaja',
      phone: '081377889900',
      email: 'michael.tan@outlook.com',
      address: 'Jl. Surya Kencana No. 40, Bogor',
      customerGroupId: grpRegular.customerGroupId,
      loyaltyPoints: 50,
      creditLimit: 0,
      createdBy: 'SYSTEM',
    },
  });

  // 21. Suppliers
  const suppliers = [
    {
      supplierCode: 'SUP-001',
      supplierName: 'PT Roastery Kopi Prima Nusantara',
      contactPerson: 'Hendra Gunawan',
      phone: '081122334455',
      email: 'sales@roasteryprima.id',
      address: 'Kawasan Pergudangan Pluit Blok D No. 8, Jakarta Utara',
      taxNumber: '02.456.789.1-011.000',
      bankName: 'Bank Central Asia (BCA)',
      bankAccountNo: '5420198822',
      bankAccountHolder: 'PT Roastery Kopi Prima',
      paymentTermDays: 30,
    },
    {
      supplierCode: 'SUP-002',
      supplierName: 'CV Dairy Fresh Sejahtera Mandiri',
      contactPerson: 'Dewi Lestari',
      phone: '081233445566',
      email: 'order@dairyfresh.com',
      address: 'Jl. Raya Lembang No. 45, Bandung Barat',
      taxNumber: '03.789.123.4-015.000',
      bankName: 'Bank Mandiri',
      bankAccountNo: '137001928374',
      bankAccountHolder: 'CV Dairy Fresh Sejahtera',
      paymentTermDays: 14,
    },
    {
      supplierCode: 'SUP-003',
      supplierName: 'PT Kemasan Hijau Lestari (Eco Packaging)',
      contactPerson: 'Andi Wijaya',
      phone: '081344556677',
      email: 'info@kemasanhijau.id',
      address: 'Jl. Rungkut Industri III No. 12, Surabaya',
      taxNumber: '01.999.888.7-020.000',
      bankName: 'Bank Central Asia (BCA)',
      bankAccountNo: '8830192831',
      bankAccountHolder: 'PT Kemasan Hijau Lestari',
      paymentTermDays: 30,
    },
    {
      supplierCode: 'SUP-004',
      supplierName: 'Koperasi Tani Segar Alami',
      contactPerson: 'Bambang Sudirjo',
      phone: '081555667788',
      email: 'bambang@segarnusantara.id',
      address: 'Desa Cisarua, Puncak, Bogor',
      taxNumber: '04.555.666.7-022.000',
      bankName: 'Bank Rakyat Indonesia (BRI)',
      bankAccountNo: '034101002341508',
      bankAccountHolder: 'Bambang Sudirjo - Segar Alami',
      paymentTermDays: 7,
    },
  ];

  for (const sup of suppliers) {
    await prisma.posSupplier.upsert({
      where: { supplierCode: sup.supplierCode },
      update: {
        supplierName: sup.supplierName,
        contactPerson: sup.contactPerson,
        phone: sup.phone,
        email: sup.email,
        address: sup.address,
        bankName: sup.bankName,
        bankAccountNo: sup.bankAccountNo,
        paymentTermDays: sup.paymentTermDays,
      },
      create: { ...sup, createdBy: 'SYSTEM' },
    });
  }

  // 22. Payment Methods
  const paymentMethods = [
    { methodCode: 'PM-CASH', methodName: 'Uang Tunai / Cash', methodType: 'CASH', feeType: 'NONE', feeValue: 0, requiresReference: 'N', displayOrder: 1 },
    { methodCode: 'PM-QRIS', methodName: 'QRIS Dinamis (All Bank & E-Wallet)', methodType: 'QRIS', feeType: 'PERCENTAGE', feeValue: 0.70, requiresReference: 'Y', displayOrder: 2 },
    { methodCode: 'PM-DEBIT-BCA', methodName: 'EDC Debit BCA', methodType: 'EDC_DEBIT', feeType: 'NONE', feeValue: 0, requiresReference: 'Y', displayOrder: 3 },
    { methodCode: 'PM-DEBIT-MANDIRI', methodName: 'EDC Debit Mandiri', methodType: 'EDC_DEBIT', feeType: 'NONE', feeValue: 0, requiresReference: 'Y', displayOrder: 4 },
    { methodCode: 'PM-CC-BCA', methodName: 'EDC Kartu Kredit BCA (Visa/Master)', methodType: 'EDC_CREDIT', feeType: 'PERCENTAGE', feeValue: 1.80, requiresReference: 'Y', displayOrder: 5 },
    { methodCode: 'PM-GOPAY', methodName: 'GoPay Online POS', methodType: 'EWALLET', feeType: 'PERCENTAGE', feeValue: 1.50, requiresReference: 'Y', displayOrder: 6 },
    { methodCode: 'PM-TRANSFER', methodName: 'Transfer BCA Virtual Account', methodType: 'BANK_TRANSFER', feeType: 'NONE', feeValue: 0, requiresReference: 'Y', displayOrder: 7 },
  ];

  const payMethodMap: Record<string, any> = {};
  for (const pm of paymentMethods) {
    const method = await prisma.posPaymentMethod.upsert({
      where: { methodCode: pm.methodCode },
      update: { methodName: pm.methodName, methodType: pm.methodType, feeType: pm.feeType, feeValue: pm.feeValue, requiresReference: pm.requiresReference, displayOrder: pm.displayOrder },
      create: { ...pm, createdBy: 'SYSTEM' },
    });
    payMethodMap[pm.methodCode] = method;
  }

  // 23. Discounts
  const discounts = [
    { discountCode: 'DISC-WELCOME10', discountName: 'Diskon Selamat Datang 10%', discountType: 'PERCENTAGE', discountValue: 10.00, minPurchase: 50000, maxDiscount: 25000, requiresApproval: 'N' },
    { discountCode: 'DISC-FLAT20', discountName: 'Voucher Potongan Langsung Rp 20.000', discountType: 'FIXED_AMOUNT', discountValue: 20000.00, minPurchase: 100000, maxDiscount: null, requiresApproval: 'N' },
    { discountCode: 'DISC-SPV-SPEC', discountName: 'Diskon Spesial Otorisasi Supervisor 25%', discountType: 'PERCENTAGE', discountValue: 25.00, minPurchase: 0, maxDiscount: 100000, requiresApproval: 'Y' },
    { discountCode: 'DISC-STAFF', discountName: 'Diskon Karyawan Internal 30%', discountType: 'PERCENTAGE', discountValue: 30.00, minPurchase: 0, maxDiscount: 50000, requiresApproval: 'Y' },
  ];

  const discMap: Record<string, any> = {};
  for (const d of discounts) {
    const disc = await prisma.posDiscount.upsert({
      where: { discountCode: d.discountCode },
      update: { discountName: d.discountName, discountType: d.discountType, discountValue: d.discountValue, minPurchase: d.minPurchase, maxDiscount: d.maxDiscount, requiresApproval: d.requiresApproval },
      create: { ...d, createdBy: 'SYSTEM' },
    });
    discMap[d.discountCode] = disc;
  }

  // 24. Shifts (Register Shifts)
  const shiftYesterday = await prisma.posRegisterShift.upsert({
    where: { shiftCode: 'SHIFT-20261002-01' },
    update: { status: 'CLOSED', expectedCash: 1750000, actualCash: 1750000, cashDifference: 0, totalSalesAmount: 2350000, totalOrdersCount: 8 },
    create: {
      shiftCode: 'SHIFT-20261002-01',
      outletId: outletSenopati.outletId,
      registerId: regSeno1.registerId,
      cashierUserId: cashierUser.userId,
      openedAt: new Date('2026-10-02T08:00:00Z'),
      closedAt: new Date('2026-10-02T16:30:00Z'),
      openingCash: 500000,
      expectedCash: 1750000,
      actualCash: 1750000,
      cashDifference: 0,
      totalSalesAmount: 2350000,
      totalOrdersCount: 8,
      status: 'CLOSED',
      closingNotes: 'Shift selesai tertib, kas pas sesuai rekonsiliasi sistem',
      createdBy: 'cashier1',
    },
  });

  const shiftToday = await prisma.posRegisterShift.upsert({
    where: { shiftCode: 'SHIFT-20261003-01' },
    update: { status: 'OPEN', expectedCash: 850000, totalSalesAmount: 450000, totalOrdersCount: 3 },
    create: {
      shiftCode: 'SHIFT-20261003-01',
      outletId: outletSenopati.outletId,
      registerId: regSeno1.registerId,
      cashierUserId: cashierUser.userId,
      openedAt: new Date('2026-10-03T08:00:00Z'),
      closedAt: null,
      openingCash: 500000,
      expectedCash: 850000,
      actualCash: null,
      cashDifference: null,
      totalSalesAmount: 450000,
      totalOrdersCount: 3,
      status: 'OPEN',
      createdBy: 'cashier1',
    },
  });

  // 25. Cash Movements
  const existingMovements = await prisma.posCashMovement.findFirst({
    where: { shiftId: shiftYesterday.shiftId },
  });
  if (!existingMovements) {
    await prisma.posCashMovement.createMany({
      data: [
        {
          shiftId: shiftYesterday.shiftId,
          movementType: 'CASH_IN',
          amount: 500000,
          reason: 'Modal Awal Kasir Shift Pagi',
          authorizedBy: 'spv1',
          createdBy: 'cashier1',
        },
        {
          shiftId: shiftYesterday.shiftId,
          movementType: 'CASH_OUT',
          amount: 35000,
          reason: 'Beli Es Batu Kristal Tambahan Darurat (Kas Kecil)',
          recipient: 'Warung Es Berkah',
          authorizedBy: 'spv1',
          createdBy: 'cashier1',
        },
        {
          shiftId: shiftToday.shiftId,
          movementType: 'CASH_IN',
          amount: 500000,
          reason: 'Modal Awal Kasir Shift Pagi Hari Ini',
          authorizedBy: 'spv1',
          createdBy: 'cashier1',
        },
      ],
    });
  }

  // 26. Orders (Detailed POS Transactions)
  // Order 1: Dine-In Paid via QRIS
  let order1 = await prisma.posOrder.findUnique({
    where: { orderNumber: 'ORD-20261002-0001' },
  });
  if (!order1) {
    order1 = await prisma.posOrder.create({
      data: {
        orderNumber: 'ORD-20261002-0001',
        invoiceNumber: 'INV/20261002/SENO/0001',
        shiftId: shiftYesterday.shiftId,
        outletId: outletSenopati.outletId,
        registerId: regSeno1.registerId,
        channelId: channelMap['CH-DINEIN'].channelId,
        tableId: diningTableMap[`${outletSenopati.outletId}_T-02`].tableId,
        customerId: cust1.customerId,
        orderType: 'DINE_IN',
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
        guestName: 'Budi Santoso',
        paxCount: 2,
        subtotal: 97000, // Latte (38k) + Nasgur (55k) + modifier extra shot (4k)
        discountAmount: 9700, // VIP Gold 10%
        discountId: null,
        surchargeAmount: 4365, // Service Charge 5%
        taxAmount: 9166, // PB1 10%
        tipAmount: 0,
        roundingAmount: 69,
        totalAmount: 101000,
        paidAmount: 101000,
        changeAmount: 0,
        loyaltyPointsEarned: 10,
        orderedAt: new Date('2026-10-02T12:15:00Z'),
        paidAt: new Date('2026-10-02T12:45:00Z'),
        closedAt: new Date('2026-10-02T13:00:00Z'),
        notes: 'Meja dekat stopkontak, latte less ice',
        createdBy: 'cashier1',
        items: {
          create: [
            {
              productId: prodLatte.productId,
              variantId: varLatteLarge.variantId,
              kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
              itemCode: 'PROD-LATTE',
              itemName: 'Caffe Latte Art',
              variantName: 'Iced 16oz',
              quantity: 1,
              unitPrice: 38000,
              costPrice: 11000,
              subtotal: 42000,
              totalAmount: 42000,
              modifiersAmount: 4000,
              itemStatus: 'SERVED',
              isPrintedToKitchen: 'Y',
              notes: 'Latte art swan, less sweet',
              createdBy: 'cashier1',
              modifiers: {
                create: [
                  {
                    modifierGroupName: 'Pilihan Topping & Extra',
                    modifierItemName: 'Caramel Sauce Drizzle',
                    extraPrice: 4000,
                    quantity: 1,
                    subtotal: 4000,
                    createdBy: 'cashier1',
                  },
                ],
              },
            },
            {
              productId: prodNasgur.productId,
              kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
              itemCode: 'PROD-NASGUR',
              itemName: 'Nasi Goreng Wagyu Kampoeng',
              quantity: 1,
              unitPrice: 55000,
              costPrice: 22000,
              subtotal: 55000,
              totalAmount: 55000,
              itemStatus: 'SERVED',
              isPrintedToKitchen: 'Y',
              notes: 'Telur setengah matang, pedas sedang',
              createdBy: 'cashier1',
              modifiers: {
                create: [
                  {
                    modifierGroupName: 'Pilihan Masakan Telur',
                    modifierItemName: 'Telur Ceplok Setengah Matang',
                    extraPrice: 0,
                    quantity: 1,
                    subtotal: 0,
                    createdBy: 'cashier1',
                  },
                ],
              },
            },
          ],
        },
        payments: {
          create: [
            {
              paymentMethodId: payMethodMap['PM-QRIS'].paymentMethodId,
              paymentMethodCode: 'PM-QRIS',
              paymentMethodName: 'QRIS Dinamis',
              paymentType: 'QRIS',
              amount: 101000,
              tenderedAmount: 101000,
              changeAmount: 0,
              merchantFee: 707,
              referenceNumber: 'QRIS-BCA-992019283719',
              paymentStatus: 'SUCCESS',
              paidAt: new Date('2026-10-02T12:45:00Z'),
              createdBy: 'cashier1',
            },
          ],
        },
      },
    });
  }

  // Order 2: Take Away Paid Cash
  let order2 = await prisma.posOrder.findUnique({
    where: { orderNumber: 'ORD-20261002-0002' },
  });
  if (!order2) {
    order2 = await prisma.posOrder.create({
      data: {
        orderNumber: 'ORD-20261002-0002',
        invoiceNumber: 'INV/20261002/SENO/0002',
        shiftId: shiftYesterday.shiftId,
        outletId: outletSenopati.outletId,
        registerId: regSeno1.registerId,
        channelId: channelMap['CH-TAKEAWAY'].channelId,
        customerId: cust2.customerId,
        orderType: 'TAKE_AWAY',
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
        guestName: 'Dr. Siti Rahmawati',
        paxCount: 1,
        subtotal: 78000, // 2x Aren (50k) + 1x Croissant (28k)
        discountAmount: 3900, // Member Silver 5%
        discountId: null,
        surchargeAmount: 2000, // Biaya paper bag takeaway
        taxAmount: 7610,
        tipAmount: 0,
        roundingAmount: 290,
        totalAmount: 84000,
        paidAmount: 100000,
        changeAmount: 16000,
        loyaltyPointsEarned: 8,
        orderedAt: new Date('2026-10-02T14:10:00Z'),
        paidAt: new Date('2026-10-02T14:12:00Z'),
        closedAt: new Date('2026-10-02T14:15:00Z'),
        notes: 'Take away dibungkus rapi untuk rapat',
        createdBy: 'cashier1',
        items: {
          create: [
            {
              productId: prodAren.productId,
              variantId: varArenIce.variantId,
              kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
              itemCode: 'PROD-AREN',
              itemName: 'Es Kopi Susu Gula Aren',
              variantName: 'Dingin 16oz',
              quantity: 2,
              unitPrice: 25000,
              costPrice: 7500,
              subtotal: 50000,
              totalAmount: 50000,
              itemStatus: 'SERVED',
              isPrintedToKitchen: 'Y',
              notes: 'Normal ice, normal sugar',
              createdBy: 'cashier1',
            },
            {
              productId: prodCroissant.productId,
              kitchenStationId: stationMap['KS-PASTRY-SENO'].stationId,
              itemCode: 'PROD-CROISSANT',
              itemName: 'French Butter Croissant',
              quantity: 1,
              unitPrice: 28000,
              costPrice: 10000,
              subtotal: 28000,
              totalAmount: 28000,
              itemStatus: 'SERVED',
              isPrintedToKitchen: 'Y',
              notes: 'Hangatkan sebentar di toaster',
              createdBy: 'cashier1',
            },
          ],
        },
        payments: {
          create: [
            {
              paymentMethodId: payMethodMap['PM-CASH'].paymentMethodId,
              paymentMethodCode: 'PM-CASH',
              paymentMethodName: 'Uang Tunai / Cash',
              paymentType: 'CASH',
              amount: 84000,
              tenderedAmount: 100000,
              changeAmount: 16000,
              merchantFee: 0,
              paymentStatus: 'SUCCESS',
              paidAt: new Date('2026-10-02T14:12:00Z'),
              createdBy: 'cashier1',
            },
          ],
        },
      },
    });
  }

  // Order 3: Active Open Dine-In on Today's Shift (Kitchen Preparing)
  let order3 = await prisma.posOrder.findUnique({
    where: { orderNumber: 'ORD-20261003-0001' },
  });
  if (!order3) {
    order3 = await prisma.posOrder.create({
      data: {
        orderNumber: 'ORD-20261003-0001',
        shiftId: shiftToday.shiftId,
        outletId: outletSenopati.outletId,
        registerId: regSeno1.registerId,
        channelId: channelMap['CH-DINEIN'].channelId,
        tableId: diningTableMap[`${outletSenopati.outletId}_T-01`].tableId,
        orderType: 'DINE_IN',
        orderStatus: 'IN_PROGRESS',
        paymentStatus: 'UNPAID',
        guestName: 'Rian & Teman',
        paxCount: 2,
        subtotal: 90000, // Combo (58k) + Truffle Fries (32k)
        discountAmount: 0,
        surchargeAmount: 4500, // Service 5%
        taxAmount: 9450, // PB1 10%
        roundingAmount: 50,
        totalAmount: 104000,
        paidAmount: 0,
        changeAmount: 0,
        orderedAt: new Date('2026-10-03T09:20:00Z'),
        notes: 'Pesanan baru masuk dapur',
        createdBy: 'cashier1',
        items: {
          create: [
            {
              productId: prodComboSiang.productId,
              kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
              itemCode: 'PROD-COMBO-SIANG',
              itemName: 'Paket Hemat Makan Siang Kenyang',
              quantity: 1,
              unitPrice: 58000,
              costPrice: 24000,
              subtotal: 58000,
              totalAmount: 58000,
              itemStatus: 'PREPARING',
              isPrintedToKitchen: 'Y',
              kitchenSentAt: new Date('2026-10-03T09:21:00Z'),
              notes: 'Combo: Nasi Goreng Wagyu + Lychee Tea',
              createdBy: 'cashier1',
            },
            {
              productId: prodFries.productId,
              kitchenStationId: stationMap['KS-HOT-SENO'].stationId,
              itemCode: 'PROD-TRUFFLE-FRIES',
              itemName: 'Truffle Parmesan French Fries',
              quantity: 1,
              unitPrice: 32000,
              costPrice: 11000,
              subtotal: 32000,
              totalAmount: 32000,
              itemStatus: 'PREPARING',
              isPrintedToKitchen: 'Y',
              kitchenSentAt: new Date('2026-10-03T09:21:00Z'),
              notes: 'Goreng garing, saus sambal pisah',
              createdBy: 'cashier1',
            },
          ],
        },
      },
    });
  }

  // Order 4: Online Delivery GoFood Order
  let order4 = await prisma.posOrder.findUnique({
    where: { orderNumber: 'ORD-20261003-0002' },
  });
  if (!order4) {
    order4 = await prisma.posOrder.create({
      data: {
        orderNumber: 'ORD-20261003-0002',
        invoiceNumber: 'INV/20261003/GOFOOD/0002',
        shiftId: shiftToday.shiftId,
        outletId: outletSenopati.outletId,
        registerId: regSeno1.registerId,
        channelId: channelMap['CH-GOFOOD'].channelId,
        orderType: 'DELIVERY',
        orderStatus: 'COMPLETED',
        paymentStatus: 'PAID',
        guestName: 'Driver Gojek (Pesanan #GF-9921)',
        paxCount: 1,
        subtotal: 60000,
        discountAmount: 0,
        surchargeAmount: 0,
        taxAmount: 6000,
        totalAmount: 66000,
        paidAmount: 66000,
        changeAmount: 0,
        orderedAt: new Date('2026-10-03T09:45:00Z'),
        paidAt: new Date('2026-10-03T09:45:00Z'),
        closedAt: new Date('2026-10-03T10:05:00Z'),
        notes: 'Driver sudah ambil pesanan',
        createdBy: 'SYSTEM',
        items: {
          create: [
            {
              productId: prodAren.productId,
              variantId: varArenIce.variantId,
              kitchenStationId: stationMap['KS-BAR-SENO'].stationId,
              itemCode: 'PROD-AREN',
              itemName: 'Es Kopi Susu Gula Aren',
              variantName: 'Dingin 16oz',
              quantity: 2,
              unitPrice: 30000, // Mark-up GoFood 20%
              costPrice: 7500,
              subtotal: 60000,
              totalAmount: 60000,
              itemStatus: 'SERVED',
              isPrintedToKitchen: 'Y',
              createdBy: 'SYSTEM',
            },
          ],
        },
        payments: {
          create: [
            {
              paymentMethodId: payMethodMap['PM-GOPAY'].paymentMethodId,
              paymentMethodCode: 'PM-GOPAY',
              paymentMethodName: 'GoPay Online POS',
              paymentType: 'EWALLET',
              amount: 66000,
              tenderedAmount: 66000,
              changeAmount: 0,
              merchantFee: 990,
              referenceNumber: 'GF-PAY-882736192',
              paymentStatus: 'SUCCESS',
              paidAt: new Date('2026-10-03T09:45:00Z'),
              createdBy: 'SYSTEM',
            },
          ],
        },
      },
    });
  }

  // 27. Approval Transactions (Demo Approval Workflow in POS)
  const discountTpl = await prisma.approvalTemplateHeader.findUnique({
    where: { templateCode: 'APPR-DISCOUNT-SPV' },
  });

  if (discountTpl) {
    const existingAppr = await prisma.approvalTransactionHeader.findFirst({
      where: { templateId: discountTpl.templateId, objectId: order1.orderId },
    });
    if (!existingAppr) {
      const apprHeader = await prisma.approvalTransactionHeader.create({
        data: {
          templateId: discountTpl.templateId,
          objectCode: 'SALES_DISCOUNT',
          objectId: order1.orderId,
          totalSteps: 1,
          currentStep: 1,
          status: 'APPROVED',
          createdBy: 'cashier1',
          details: {
            create: [
              {
                stepOrder: 1,
                stepName: 'Persetujuan Supervisor Toko',
                approverType: 'ROLE',
                usergroupId: context.spvGroup.usergroupId,
                actionByUserId: spvUser?.userId,
                action: 'APPROVED',
                notes: 'Diskon VIP Gold 10% disetujui sesuai kartu member aktif',
                actionAt: new Date('2026-10-02T12:20:00Z'),
                createdBy: 'cashier1',
              },
            ],
          },
        },
      });
    }
  }

  // Seeding Initial Stock & Movements
  const allWarehouses = await prisma.posWarehouse.findMany({ where: { isActive: 'Y' } });
  const allProducts = await prisma.posProduct.findMany({ where: { isActive: 'Y' } });

  for (const wh of allWarehouses) {
    for (const prod of allProducts) {
      const initialQty = prod.productType === 'INGREDIENT' ? 250 : 80;
      const minStock = 15;
      const maxStock = 500;

      const existingStock = await prisma.posStock.findFirst({
        where: {
          warehouseId: wh.warehouseId,
          productId: prod.productId,
          variantId: null,
        },
      });

      if (!existingStock) {
        await prisma.posStock.create({
          data: {
            warehouseId: wh.warehouseId,
            productId: prod.productId,
            variantId: null,
            quantity: initialQty,
            minStock,
            maxStock,
            createdBy: 'SYSTEM',
          },
        });
      }

      const existingMov = await prisma.posStockMovement.findFirst({
        where: { warehouseId: wh.warehouseId, productId: prod.productId, movementType: 'IN' },
      });

      if (!existingMov) {
        await prisma.posStockMovement.create({
          data: {
            warehouseId: wh.warehouseId,
            productId: prod.productId,
            movementType: 'IN',
            referenceType: 'MANUAL',
            referenceNumber: 'INIT-STOCK',
            quantity: initialQty,
            balanceBefore: 0,
            balanceAfter: initialQty,
            notes: `Stok awal sistem (${wh.warehouseName})`,
            createdBy: 'SYSTEM',
          },
        });
      }
    }
  }

  console.log('Master POS Data & Dummy Transactions Seeded Successfully!');
}
