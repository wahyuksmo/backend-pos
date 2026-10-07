import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemModifierDto {
  @ApiPropertyOptional({ description: 'ID Grup Modifier' })
  @IsOptional()
  @IsUUID()
  modifierGroupId?: string;

  @ApiPropertyOptional({ description: 'ID Item Modifier' })
  @IsOptional()
  @IsUUID()
  modifierItemId?: string;

  @ApiProperty({ example: 'Topping', description: 'Nama Grup Modifier' })
  @IsNotEmpty()
  @IsString()
  modifierGroupName: string;

  @ApiProperty({ example: 'Extra Cheese', description: 'Nama Item Modifier' })
  @IsNotEmpty()
  @IsString()
  modifierItemName: string;

  @ApiProperty({ example: 5000, description: 'Harga ekstra modifier' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  extraPrice: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class CreateOrderItemDto {
  @ApiProperty({ example: 'prod-uuid', description: 'ID Produk' })
  @IsNotEmpty({ message: 'Produk ID wajib diisi' })
  @IsUUID('all', { message: 'Produk ID harus UUID' })
  productId: string;

  @ApiPropertyOptional({ example: 'variant-uuid', description: 'ID Varian Produk (jika ada)' })
  @IsOptional()
  @IsUUID('all', { message: 'Variant ID harus UUID' })
  variantId?: string;

  @ApiProperty({ example: 1, default: 1, description: 'Jumlah item' })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Qty minimal 0.01' })
  quantity: number;

  @ApiPropertyOptional({ example: 'Kurang manis, es sedikit', description: 'Catatan pesanan dapur' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [OrderItemModifierDto], description: 'Daftar modifier/topping berbayar' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemModifierDto)
  modifiers?: OrderItemModifierDto[];
}

export class CreateOrderPaymentDto {
  @ApiPropertyOptional({ example: 'pay-method-uuid', description: 'ID Metode Pembayaran' })
  @IsOptional()
  @IsUUID('all', { message: 'Metode pembayaran ID harus UUID' })
  paymentMethodId?: string;

  @ApiPropertyOptional({ example: 'PM-CASH', description: 'Kode Metode Pembayaran' })
  @IsOptional()
  @IsString()
  paymentMethodCode?: string;

  @ApiPropertyOptional({ example: 'CASH', description: 'Tipe / Metode Pembayaran (CASH, QRIS)' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ example: 50000, description: 'Nominal pembayaran' })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Nominal pembayaran minimal Rp 1' })
  amount: number;

  @ApiPropertyOptional({ example: 100000, description: 'Nominal uang diterima dari pelanggan (untuk cash)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tenderedAmount?: number;

  @ApiPropertyOptional({ example: 'TRX12345678', description: 'Nomor trace/referensi EDC/QRIS' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ example: '4321', description: '4 digit terakhir kartu' })
  @IsOptional()
  @IsString()
  cardLastFour?: string;

  @ApiPropertyOptional({ example: 'Budi Santoso', description: 'Nama pemegang kartu' })
  @IsOptional()
  @IsString()
  cardHolderName?: string;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'outlet-uuid', description: 'ID Cabang Outlet' })
  @IsNotEmpty({ message: 'Outlet ID wajib diisi' })
  @IsUUID('all', { message: 'Outlet ID harus UUID' })
  outletId: string;

  @ApiPropertyOptional({ description: 'ID Sesi Kasir aktif' })
  @IsOptional()
  @IsUUID('all')
  shiftId?: string;

  @ApiPropertyOptional({ description: 'ID Terminal Kasir (Register)' })
  @IsOptional()
  @IsUUID('all')
  registerId?: string;

  @ApiPropertyOptional({ description: 'ID Saluran Penjualan (Dine-in, GoFood, GrabFood)' })
  @IsOptional()
  @IsUUID('all')
  channelId?: string;

  @ApiPropertyOptional({ description: 'ID Meja Makan (untuk Dine-In)' })
  @IsOptional()
  @IsUUID('all')
  tableId?: string;

  @ApiPropertyOptional({ description: 'ID Pelanggan / Member CRM' })
  @IsOptional()
  @IsUUID('all')
  customerId?: string;

  @ApiPropertyOptional({
    example: 'DINE_IN',
    enum: ['DINE_IN', 'TAKE_AWAY', 'DELIVERY', 'DRIVE_THRU'],
    default: 'DINE_IN',
  })
  @IsOptional()
  @IsIn(['DINE_IN', 'TAKE_AWAY', 'DELIVERY', 'DRIVE_THRU'])
  orderType?: 'DINE_IN' | 'TAKE_AWAY' | 'DELIVERY' | 'DRIVE_THRU';

  @ApiPropertyOptional({ example: 'Meja Depan / Pak Agus', description: 'Nama tamu walk-in' })
  @IsOptional()
  @IsString()
  guestName?: string;

  @ApiPropertyOptional({ example: 2, default: 1, description: 'Jumlah orang di meja' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  paxCount?: number;

  @ApiPropertyOptional({ description: 'ID Diskon Promo yang diaplikasikan' })
  @IsOptional()
  @IsUUID('all')
  discountId?: string;

  @ApiPropertyOptional({ example: 0, description: 'Tip atau donasi sukarela' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tipAmount?: number;

  @ApiPropertyOptional({ example: 'Bungkus rapat', description: 'Catatan pesanan' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Daftar item pesanan' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Pesanan minimal harus memiliki 1 item' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ type: [CreateOrderPaymentDto], description: 'Pembayaran instan (Fast Checkout)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderPaymentDto)
  payments?: CreateOrderPaymentDto[];
}
