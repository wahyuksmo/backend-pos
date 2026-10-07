import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedPosData } from './seed_pos_data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding POS Administration & Approval System...');

  // 1. Password Policies
  const policies = [
    { code: 'MIN_LENGTH', value: '8', message: 'Password minimal 8 karakter' },
    { code: 'REQUIRE_UPPERCASE', value: '1', message: 'Password harus mengandung huruf besar' },
    { code: 'REQUIRE_LOWERCASE', value: '1', message: 'Password harus mengandung huruf kecil' },
    { code: 'REQUIRE_NUMBER', value: '1', message: 'Password harus mengandung angka' },
    { code: 'REQUIRE_SPECIAL_CHAR', value: '1', message: 'Password harus mengandung simbol/spesial karakter' },
    { code: 'PASSWORD_EXPIRY_DAYS', value: '90', message: 'Password kadaluarsa setiap 90 hari' },
  ];

  for (const pol of policies) {
    await prisma.passwordPolicy.upsert({
      where: { code: pol.code },
      update: { value: pol.value, message: pol.message },
      create: {
        code: pol.code,
        value: pol.value,
        message: pol.message,
        createdBy: 'SYSTEM',
      },
    });
  }

  // 2. Usergroups
  const superadminGroup = await prisma.userGroup.upsert({
    where: { usergroupCode: 'SUPERADMIN' },
    update: { usergroupName: 'Super Administrator' },
    create: {
      usergroupCode: 'SUPERADMIN',
      usergroupName: 'Super Administrator',
      createdBy: 'SYSTEM',
    },
  });

  const spvGroup = await prisma.userGroup.upsert({
    where: { usergroupCode: 'SUPERVISOR' },
    update: { usergroupName: 'Store Supervisor' },
    create: {
      usergroupCode: 'SUPERVISOR',
      usergroupName: 'Store Supervisor',
      createdBy: 'SYSTEM',
    },
  });

  const cashierGroup = await prisma.userGroup.upsert({
    where: { usergroupCode: 'CASHIER' },
    update: { usergroupName: 'Kasir POS' },
    create: {
      usergroupCode: 'CASHIER',
      usergroupName: 'Kasir POS',
      createdBy: 'SYSTEM',
    },
  });

  // 3. Superadmin User (password: Password123!)
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      fullname: 'Administrator POS',
      email: 'admin@pos.local',
      usergroupId: superadminGroup.usergroupId,
    },
    create: {
      username: 'admin',
      fullname: 'Administrator POS',
      email: 'admin@pos.local',
      phone: '081234567890',
      password: passwordHash,
      isActive: 'Y',
      isLocked: 'N',
      needResetPassword: 'N',
      usergroupId: superadminGroup.usergroupId,
      createdBy: 'SYSTEM',
    },
  });

  // Supervisor user
  const spvUser = await prisma.user.upsert({
    where: { username: 'spv1' },
    update: { usergroupId: spvGroup.usergroupId },
    create: {
      username: 'spv1',
      fullname: 'Supervisor Toko 1',
      email: 'spv1@pos.local',
      phone: '081234567891',
      password: passwordHash,
      isActive: 'Y',
      usergroupId: spvGroup.usergroupId,
      createdBy: 'SYSTEM',
    },
  });

  // Cashier user
  const cashierUser = await prisma.user.upsert({
    where: { username: 'cashier1' },
    update: { usergroupId: cashierGroup.usergroupId },
    create: {
      username: 'cashier1',
      fullname: 'Kasir Shift 1',
      email: 'cashier1@pos.local',
      phone: '081234567892',
      password: passwordHash,
      isActive: 'Y',
      usergroupId: cashierGroup.usergroupId,
      createdBy: 'SYSTEM',
    },
  });

  // 4. Menus - Clean Enterprise POS Grouping Hierarchy
  const dashboardMenu = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000001' },
    update: {
      menuName: 'DASHBOARD',
      menuTitle: 'Dashboard',
      menuIcon: 'LayoutDashboard',
      menuUrl: '/',
      menuPosition: 1,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000001',
      menuName: 'DASHBOARD',
      menuTitle: 'Dashboard',
      menuIcon: 'LayoutDashboard',
      menuUrl: '/',
      menuPosition: 1,
      createdBy: 'SYSTEM',
    },
  });

  // 4.1 Parent Groups
  const operationsGroup = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000100' },
    update: {
      menuName: 'OPERATIONS',
      menuTitle: 'Operasional Kasir',
      menuIcon: 'Store',
      menuUrl: null,
      menuPosition: 2,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000100',
      menuName: 'OPERATIONS',
      menuTitle: 'Operasional Kasir',
      menuIcon: 'Store',
      menuPosition: 2,
      createdBy: 'SYSTEM',
    },
  });

  const catalogGroup = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000200' },
    update: {
      menuName: 'CATALOG',
      menuTitle: 'Katalog & Menu',
      menuIcon: 'Package',
      menuUrl: null,
      menuPosition: 3,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000200',
      menuName: 'CATALOG',
      menuTitle: 'Katalog & Menu',
      menuIcon: 'Package',
      menuPosition: 3,
      createdBy: 'SYSTEM',
    },
  });

  const inventoryGroup = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000300' },
    update: {
      menuName: 'INVENTORY',
      menuTitle: 'Inventori & Cabang',
      menuIcon: 'Warehouse',
      menuUrl: null,
      menuPosition: 4,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000300',
      menuName: 'INVENTORY',
      menuTitle: 'Inventori & Cabang',
      menuIcon: 'Warehouse',
      menuPosition: 4,
      createdBy: 'SYSTEM',
    },
  });

  const crmGroup = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000400' },
    update: {
      menuName: 'CUSTOMERS_PROMO',
      menuTitle: 'Pelanggan & Promosi',
      menuIcon: 'Users',
      menuUrl: null,
      menuPosition: 5,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000400',
      menuName: 'CUSTOMERS_PROMO',
      menuTitle: 'Pelanggan & Promosi',
      menuIcon: 'Users',
      menuPosition: 5,
      createdBy: 'SYSTEM',
    },
  });

  const approvalGroup = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000500' },
    update: {
      menuName: 'APPROVALS',
      menuTitle: 'Persetujuan',
      menuIcon: 'GitPullRequest',
      menuUrl: null,
      menuPosition: 6,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000500',
      menuName: 'APPROVALS',
      menuTitle: 'Persetujuan',
      menuIcon: 'GitPullRequest',
      menuPosition: 6,
      createdBy: 'SYSTEM',
    },
  });

  const adminParentMenu = await prisma.menu.upsert({
    where: { menuId: '00000000-0000-0000-0000-000000000010' },
    update: {
      menuName: 'ADMINISTRATION',
      menuTitle: 'Administrasi Sistem',
      menuIcon: 'ShieldAlert',
      menuUrl: null,
      menuPosition: 7,
      pid: null,
    },
    create: {
      menuId: '00000000-0000-0000-0000-000000000010',
      menuName: 'ADMINISTRATION',
      menuTitle: 'Administrasi Sistem',
      menuIcon: 'ShieldAlert',
      menuPosition: 7,
      createdBy: 'SYSTEM',
    },
  });

  // 4.2 Sub-menu items classified by domain
  const categorizedSubMenus = [
    // Operasional Kasir
    { id: '00000000-0000-0000-0000-000000000036', pid: operationsGroup.menuId, name: 'POS_ORDER', title: 'Kasir POS', icon: 'ShoppingCart', url: '/pos', pos: 1 },
    { id: '00000000-0000-0000-0000-000000000034', pid: operationsGroup.menuId, name: 'ORDERS', title: 'Riwayat Pesanan', icon: 'Receipt', url: '/orders', pos: 2 },
    { id: '00000000-0000-0000-0000-000000000035', pid: operationsGroup.menuId, name: 'SHIFTS', title: 'Sesi Kasir (Shift)', icon: 'Clock', url: '/shifts', pos: 3 },
    { id: '00000000-0000-0000-0000-000000000022', pid: operationsGroup.menuId, name: 'REGISTERS', title: 'Terminal Kasir', icon: 'Monitor', url: '/registers', pos: 4 },
    { id: '00000000-0000-0000-0000-000000000023', pid: operationsGroup.menuId, name: 'DINING_TABLES', title: 'Meja Resto', icon: 'UtensilsCrossed', url: '/dining-tables', pos: 5 },
    { id: '00000000-0000-0000-0000-000000000030', pid: operationsGroup.menuId, name: 'KITCHEN_STATIONS', title: 'Kitchen Station', icon: 'Printer', url: '/kitchen-stations', pos: 6 },
    { id: '00000000-0000-0000-0000-000000000032', pid: operationsGroup.menuId, name: 'SALES_CHANNELS', title: 'Saluran Penjualan', icon: 'ShoppingBag', url: '/sales-channels', pos: 7 },
    { id: '00000000-0000-0000-0000-000000000037', pid: operationsGroup.menuId, name: 'REPORTS', title: 'Laporan & Analitik', icon: 'FileText', url: '/reports', pos: 8 },

    // Katalog & Menu
    { id: '00000000-0000-0000-0000-000000000029', pid: catalogGroup.menuId, name: 'PRODUCTS', title: 'Katalog Produk', icon: 'Package', url: '/products', pos: 1 },
    { id: '00000000-0000-0000-0000-000000000026', pid: catalogGroup.menuId, name: 'CATEGORIES', title: 'Kategori Produk', icon: 'Layers', url: '/categories', pos: 2 },
    { id: '00000000-0000-0000-0000-000000000027', pid: catalogGroup.menuId, name: 'BRANDS', title: 'Merek Produk', icon: 'Tag', url: '/brands', pos: 3 },
    { id: '00000000-0000-0000-0000-00000000002f', pid: catalogGroup.menuId, name: 'RECIPES', title: 'Resep & BOM Menu', icon: 'Utensils', url: '/recipes', pos: 4 },
    { id: '00000000-0000-0000-0000-000000000025', pid: catalogGroup.menuId, name: 'UNITS', title: 'Satuan Barang', icon: 'Scale', url: '/units', pos: 5 },
    { id: '00000000-0000-0000-0000-000000000033', pid: catalogGroup.menuId, name: 'UNIT_CONVERSIONS', title: 'Konversi Satuan', icon: 'ArrowLeftRight', url: '/unit-conversions', pos: 6 },

    // Inventori & Cabang
    { id: '00000000-0000-0000-0000-000000000021', pid: inventoryGroup.menuId, name: 'OUTLETS', title: 'Master Outlet', icon: 'Store', url: '/outlets', pos: 1 },
    { id: '00000000-0000-0000-0000-000000000024', pid: inventoryGroup.menuId, name: 'WAREHOUSES', title: 'Master Gudang', icon: 'Warehouse', url: '/warehouses', pos: 2 },
    { id: '00000000-0000-0000-0000-00000000002c', pid: inventoryGroup.menuId, name: 'SUPPLIERS', title: 'Data Supplier', icon: 'Truck', url: '/suppliers', pos: 3 },
    { id: '00000000-0000-0000-0000-000000000038', pid: inventoryGroup.menuId, name: 'INVENTORY_STOCKS', title: 'Saldo & Kartu Stok', icon: 'Boxes', url: '/inventory', pos: 4 },
    { id: '00000000-0000-0000-0000-000000000039', pid: inventoryGroup.menuId, name: 'STOCK_ADJUSTMENTS', title: 'Penyesuaian Stok', icon: 'ClipboardCheck', url: '/inventory/adjustments', pos: 5 },
    { id: '00000000-0000-0000-0000-00000000003a', pid: inventoryGroup.menuId, name: 'STOCK_TRANSFERS', title: 'Transfer Stok', icon: 'ArrowLeftRight', url: '/inventory/transfers', pos: 6 },
    { id: '00000000-0000-0000-0000-00000000003b', pid: inventoryGroup.menuId, name: 'PRODUCTIONS', title: 'Produksi Olahan', icon: 'Cpu', url: '/inventory/productions', pos: 7 },

    // Pelanggan & Promosi
    { id: '00000000-0000-0000-0000-00000000002b', pid: crmGroup.menuId, name: 'CUSTOMERS', title: 'Data Pelanggan', icon: 'UserCheck', url: '/customers', pos: 1 },
    { id: '00000000-0000-0000-0000-00000000002a', pid: crmGroup.menuId, name: 'CUSTOMER_GROUPS', title: 'Grup Pelanggan', icon: 'Users', url: '/customer-groups', pos: 2 },
    { id: '00000000-0000-0000-0000-00000000002e', pid: crmGroup.menuId, name: 'DISCOUNTS', title: 'Diskon & Promosi', icon: 'BadgePercent', url: '/discounts', pos: 3 },
    { id: '00000000-0000-0000-0000-00000000002d', pid: crmGroup.menuId, name: 'PAYMENT_METHODS', title: 'Metode Pembayaran', icon: 'CreditCard', url: '/payment-methods', pos: 4 },
    { id: '00000000-0000-0000-0000-000000000028', pid: crmGroup.menuId, name: 'TAXES', title: 'Pajak & Biaya', icon: 'Percent', url: '/taxes', pos: 5 },
    { id: '00000000-0000-0000-0000-000000000031', pid: crmGroup.menuId, name: 'SURCHARGES', title: 'Biaya & Surcharge', icon: 'ReceiptPercent', url: '/surcharges', pos: 6 },

    // Persetujuan (Approval)
    { id: '00000000-0000-0000-0000-000000000017', pid: approvalGroup.menuId, name: 'APPROVAL_TEMPLATES', title: 'Template Approval', icon: 'GitPullRequest', url: '/settings/approval-templates', pos: 1 },

    // Administrasi Sistem
    { id: '00000000-0000-0000-0000-000000000011', pid: adminParentMenu.menuId, name: 'USERS', title: 'Manajemen Pengguna', icon: 'Users', url: '/users', pos: 1 },
    { id: '00000000-0000-0000-0000-000000000012', pid: adminParentMenu.menuId, name: 'USERGROUPS', title: 'Role & Grup Pengguna', icon: 'Shield', url: '/usergroups', pos: 2 },
    { id: '00000000-0000-0000-0000-000000000013', pid: adminParentMenu.menuId, name: 'PERMISSIONS', title: 'Hak Akses Role', icon: 'KeyRound', url: '/permissions', pos: 3 },
    { id: '00000000-0000-0000-0000-000000000014', pid: adminParentMenu.menuId, name: 'MENUS', title: 'Manajemen Menu', icon: 'Menu', url: '/menus', pos: 4 },
    { id: '00000000-0000-0000-0000-000000000015', pid: adminParentMenu.menuId, name: 'PASSWORD_POLICIES', title: 'Kebijakan Password', icon: 'Lock', url: '/password-policies', pos: 5 },
    { id: '00000000-0000-0000-0000-000000000016', pid: adminParentMenu.menuId, name: 'SETTINGS', title: 'Pengaturan Sistem', icon: 'Settings', url: '/settings', pos: 6 },
    { id: '00000000-0000-0000-0000-000000000018', pid: adminParentMenu.menuId, name: 'APP_RELEASES', title: 'Manajemen APK', icon: 'Smartphone', url: '/apk-management', pos: 7 },
  ];

  const allMenuIds = [
    dashboardMenu.menuId,
    operationsGroup.menuId,
    catalogGroup.menuId,
    inventoryGroup.menuId,
    crmGroup.menuId,
    approvalGroup.menuId,
    adminParentMenu.menuId,
  ];

  for (const item of categorizedSubMenus) {
    const m = await prisma.menu.upsert({
      where: { menuId: item.id },
      update: {
        menuName: item.name,
        menuTitle: item.title,
        menuIcon: item.icon,
        menuUrl: item.url,
        menuPosition: item.pos,
        pid: item.pid,
      },
      create: {
        menuId: item.id,
        pid: item.pid,
        menuName: item.name,
        menuTitle: item.title,
        menuIcon: item.icon,
        menuUrl: item.url,
        menuPosition: item.pos,
        createdBy: 'SYSTEM',
      },
    });
    allMenuIds.push(m.menuId);
  }

  // Clean up legacy flat MASTER_DATA parent if exists
  await prisma.userPermission.deleteMany({
    where: { menuId: '00000000-0000-0000-0000-000000000020' },
  });
  await prisma.menu.deleteMany({
    where: { menuId: '00000000-0000-0000-0000-000000000020' },
  });

  // 5. User Permissions for SUPERADMIN
  for (const menuId of allMenuIds) {
    await prisma.userPermission.upsert({
      where: {
        usergroupId_menuId: {
          usergroupId: superadminGroup.usergroupId,
          menuId,
        },
      },
      update: {
        createPerm: 'Y',
        readPerm: 'Y',
        updatePerm: 'Y',
        deletePerm: 'Y',
        exportPerm: 'Y',
        importPerm: 'Y',
      },
      create: {
        usergroupId: superadminGroup.usergroupId,
        menuId,
        createPerm: 'Y',
        readPerm: 'Y',
        updatePerm: 'Y',
        deletePerm: 'Y',
        exportPerm: 'Y',
        importPerm: 'Y',
        createdBy: 'SYSTEM',
      },
    });
  }

  // 5.1 User Permissions for CASHIER
  const cashierPerms = [
    { menuId: '00000000-0000-0000-0000-000000000001', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000100', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000036', r: 'Y', c: 'Y', u: 'Y', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000034', r: 'Y', c: 'Y', u: 'Y', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000035', r: 'Y', c: 'Y', u: 'Y', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000022', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000023', r: 'Y', c: 'N', u: 'Y', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000030', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000032', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000200', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000029', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000026', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000027', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002f', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000025', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000400', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002b', r: 'Y', c: 'Y', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002a', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002e', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002d', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000028', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000031', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
  ];

  for (const p of cashierPerms) {
    await prisma.userPermission.upsert({
      where: {
        usergroupId_menuId: {
          usergroupId: cashierGroup.usergroupId,
          menuId: p.menuId,
        },
      },
      update: {
        readPerm: p.r,
        createPerm: p.c,
        updatePerm: p.u,
        deletePerm: p.d,
        exportPerm: p.e,
        importPerm: p.i,
      },
      create: {
        usergroupId: cashierGroup.usergroupId,
        menuId: p.menuId,
        readPerm: p.r,
        createPerm: p.c,
        updatePerm: p.u,
        deletePerm: p.d,
        exportPerm: p.e,
        importPerm: p.i,
        createdBy: 'SYSTEM',
      },
    });
  }

  // 5.2 User Permissions for SUPERVISOR
  const spvPerms = [
    { menuId: '00000000-0000-0000-0000-000000000001', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000100', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000036', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000034', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000035', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000022', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000023', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000030', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000032', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000037', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000200', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'Y' },
    { menuId: '00000000-0000-0000-0000-000000000029', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'Y' },
    { menuId: '00000000-0000-0000-0000-000000000026', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000027', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002f', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000025', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000033', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000300', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000021', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000024', r: 'Y', c: 'N', u: 'Y', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002c', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000038', r: 'Y', c: 'N', u: 'N', d: 'N', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000039', r: 'Y', c: 'Y', u: 'Y', d: 'N', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000003a', r: 'Y', c: 'Y', u: 'Y', d: 'N', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000400', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002b', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002a', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002e', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-00000000002d', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000028', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000031', r: 'Y', c: 'Y', u: 'Y', d: 'Y', e: 'Y', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000500', r: 'Y', c: 'N', u: 'Y', d: 'N', e: 'N', i: 'N' },
    { menuId: '00000000-0000-0000-0000-000000000017', r: 'Y', c: 'N', u: 'Y', d: 'N', e: 'N', i: 'N' },
  ];

  for (const p of spvPerms) {
    await prisma.userPermission.upsert({
      where: {
        usergroupId_menuId: {
          usergroupId: spvGroup.usergroupId,
          menuId: p.menuId,
        },
      },
      update: {
        readPerm: p.r,
        createPerm: p.c,
        updatePerm: p.u,
        deletePerm: p.d,
        exportPerm: p.e,
        importPerm: p.i,
      },
      create: {
        usergroupId: spvGroup.usergroupId,
        menuId: p.menuId,
        readPerm: p.r,
        createPerm: p.c,
        updatePerm: p.u,
        deletePerm: p.d,
        exportPerm: p.e,
        importPerm: p.i,
        createdBy: 'SYSTEM',
      },
    });
  }

  // 6. System Objects Registry (pos_objects)
  const objects = [
    { objectCode: 'USER', tableName: 'pos_users', description: 'Pengguna Sistem POS' },
    { objectCode: 'USERGROUP', tableName: 'pos_usergroups', description: 'Grup / Role Pengguna POS' },
    { objectCode: 'USER_PERMISSION', tableName: 'pos_userpermissions', description: 'Matriks Hak Akses Menu' },
    { objectCode: 'MENU', tableName: 'pos_menu', description: 'Menu Navigasi POS' },
    { objectCode: 'SETTING', tableName: 'pos_settings', description: 'Konfigurasi Parameter POS' },
    { objectCode: 'PASSWORD_POLICY', tableName: 'pos_passwordpolicy', description: 'Kebijakan Keamanan Password' },
    { objectCode: 'OUTLET', tableName: 'pos_outlets', description: 'Master Cabang / Outlet Toko' },
    { objectCode: 'REGISTER', tableName: 'pos_registers', description: 'Master Terminal Kasir (Register)' },
    { objectCode: 'DINING_TABLE', tableName: 'pos_dining_tables', description: 'Master Meja F&B / Dine-In' },
    { objectCode: 'WAREHOUSE', tableName: 'pos_warehouses', description: 'Master Gudang & Lokasi Stok' },
    { objectCode: 'UNIT', tableName: 'pos_units', description: 'Master Satuan Produk (UOM)' },
    { objectCode: 'CATEGORY', tableName: 'pos_categories', description: 'Master Kategori Produk' },
    { objectCode: 'BRAND', tableName: 'pos_brands', description: 'Master Merek / Brand' },
    { objectCode: 'TAX', tableName: 'pos_taxes', description: 'Master Pajak & Service Charge' },
    { objectCode: 'PRODUCT', tableName: 'pos_products', description: 'Master Data Produk' },
    { objectCode: 'PRODUCT_VARIANT', tableName: 'pos_product_variants', description: 'Master Varian Produk' },
    { objectCode: 'PRODUCT_PRICE', tableName: 'pos_product_outlet_prices', description: 'Harga Khusus Outlet' },
    { objectCode: 'MODIFIER_GROUP', tableName: 'pos_product_modifier_groups', description: 'Grup Opsi Tambahan / Modifier' },
    { objectCode: 'MODIFIER_ITEM', tableName: 'pos_product_modifier_items', description: 'Item Opsi Tambahan / Modifier' },
    { objectCode: 'CUSTOMER_GROUP', tableName: 'pos_customer_groups', description: 'Master Grup Pelanggan' },
    { objectCode: 'CUSTOMER', tableName: 'pos_customers', description: 'Master Data Pelanggan' },
    { objectCode: 'SUPPLIER', tableName: 'pos_suppliers', description: 'Master Data Supplier' },
    { objectCode: 'PAYMENT_METHOD', tableName: 'pos_payment_methods', description: 'Master Metode Pembayaran' },
    { objectCode: 'DISCOUNT', tableName: 'pos_discounts', description: 'Master Diskon & Promo', isApprovable: 'Y' },
    { objectCode: 'PURCHASE_ORDER', tableName: 'pos_purchase_orders', description: 'Pengajuan Purchase Order (PO)', isApprovable: 'Y' },
    { objectCode: 'SALES_DISCOUNT', tableName: 'pos_sales_discounts', description: 'Persetujuan Diskon Penjualan Khusus', isApprovable: 'Y' },
    { objectCode: 'VOID_TRANSACTION', tableName: 'pos_void_transactions', description: 'Persetujuan Void / Batal Transaksi Kasir', isApprovable: 'Y' },
    { objectCode: 'CASH_EXPENSE', tableName: 'pos_cash_expenses', description: 'Pengeluaran Kas Operasional Toko', isApprovable: 'Y' },
    { objectCode: 'PRICE_CHANGE', tableName: 'pos_price_changes', description: 'Perubahan Harga Jual Barang', isApprovable: 'Y' },
    { objectCode: 'UNIT_CONVERSION', tableName: 'pos_unit_conversions', description: 'Konversi Satuan Barang (UOM)' },
    { objectCode: 'KITCHEN_STATION', tableName: 'pos_kitchen_stations', description: 'Master Kitchen Station & Printer Routing' },
    { objectCode: 'RECIPE', tableName: 'pos_product_recipes', description: 'Master Resep & BOM Menu Olahan' },
    { objectCode: 'SURCHARGE', tableName: 'pos_surcharges', description: 'Master Surcharge & Biaya Layanan' },
    { objectCode: 'SALES_CHANNEL', tableName: 'pos_sales_channels', description: 'Master Saluran Penjualan & Order Type' },
    { objectCode: 'COMBO_GROUP', tableName: 'pos_combo_groups', description: 'Grup Pilihan Menu Combo' },
    { objectCode: 'COMBO_ITEM', tableName: 'pos_combo_items', description: 'Item Opsi Menu Combo' },
    { objectCode: 'ORDER', tableName: 'pos_orders', description: 'Transaksi Pesanan Penjualan POS', isApprovable: 'Y' },
    { objectCode: 'REGISTER_SHIFT', tableName: 'pos_register_shifts', description: 'Sesi Kasir (Shift Cash Drawer)' },
    { objectCode: 'STOCK', tableName: 'pos_stocks', description: 'Saldo Stok Gudang POS' },
    { objectCode: 'STOCK_MOVEMENT', tableName: 'pos_stock_movements', description: 'Kartu Mutasi & Ledger Stok' },
    { objectCode: 'STOCK_TRANSFER', tableName: 'pos_stock_transfers', description: 'Dokumen Transfer Stok Antar Gudang', isApprovable: 'Y' },
    { objectCode: 'STOCK_ADJUSTMENT', tableName: 'pos_stock_adjustments', description: 'Penyesuaian & Opname Stok', isApprovable: 'Y' },
  ];

  for (const obj of objects) {
    await prisma.systemObject.upsert({
      where: { objectCode: obj.objectCode },
      update: {
        tableName: obj.tableName,
        description: obj.description,
        isApprovable: obj.isApprovable || 'N',
      },
      create: {
        objectCode: obj.objectCode,
        tableName: obj.tableName,
        description: obj.description,
        isApprovable: obj.isApprovable || 'N',
        isAuditable: 'Y',
        isActive: 'Y',
        createdBy: 'SYSTEM',
      },
    });
  }

  // 7. Default Approval Templates for POS
  const discountTemplate = await prisma.approvalTemplateHeader.upsert({
    where: { templateCode: 'APPR-DISCOUNT-SPV' },
    update: {
      templateName: 'Persetujuan Diskon Kasir Khusus',
      objectCode: 'SALES_DISCOUNT',
    },
    create: {
      templateCode: 'APPR-DISCOUNT-SPV',
      templateName: 'Persetujuan Diskon Kasir Khusus',
      objectCode: 'SALES_DISCOUNT',
      description: 'Persetujuan diskon manual kasir di atas batas nominal',
      createdBy: 'SYSTEM',
      details: {
        create: [
          {
            stepOrder: 1,
            stepName: 'Persetujuan Supervisor Toko',
            approverType: 'ROLE',
            usergroupId: spvGroup.usergroupId,
            canRevise: 'N',
            createdBy: 'SYSTEM',
          },
        ],
      },
    },
  });

  const voidTemplate = await prisma.approvalTemplateHeader.upsert({
    where: { templateCode: 'APPR-VOID-ITEM' },
    update: {
      templateName: 'Persetujuan Pembatalan Transaksi / Void Struk',
      objectCode: 'VOID_TRANSACTION',
    },
    create: {
      templateCode: 'APPR-VOID-ITEM',
      templateName: 'Persetujuan Pembatalan Transaksi / Void Struk',
      objectCode: 'VOID_TRANSACTION',
      description: 'Approval supervisor saat void transaksi kasir',
      createdBy: 'SYSTEM',
      details: {
        create: [
          {
            stepOrder: 1,
            stepName: 'Otorisasi Supervisor',
            approverType: 'ROLE',
            usergroupId: spvGroup.usergroupId,
            canRevise: 'N',
            createdBy: 'SYSTEM',
          },
        ],
      },
    },
  });

  // 8. Master POS Data & Business Transactions
  await seedPosData(prisma, {
    adminUser,
    spvUser,
    cashierUser,
    spvGroup,
    cashierGroup,
  });

  // 9. Initial APK Release
  const releaseCount = await prisma.posAppRelease.count();
  if (releaseCount === 0) {
    await prisma.posAppRelease.create({
      data: {
        versionName: '1.0.0',
        versionCode: 1,
        fileName: 'pos-cashier-v1.0.0.apk',
        originalName: 'app-debug.apk',
        filePath: '/uploads/apks/pos-cashier-v1.0.0.apk',
        fileSize: BigInt(146246572),
        fileSizeFormatted: '139.47 MB',
        releaseNotes: 'Rilis perdana aplikasi kasir Android POS Enterprise (Flutter Edition). Fitur lengkap kasir, pemesanan, cetak struk via bluetooth printer, dan sinkronisasi realtime.',
        isLatest: 'Y',
        isActive: 'Y',
        downloadCount: 0,
        createdBy: 'SYSTEM',
      },
    });
  }

  console.log('POS Administration, Master Data & Transactions Seeding Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
