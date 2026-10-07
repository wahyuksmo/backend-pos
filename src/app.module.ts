import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import configuration from './config/configuration';
import { DatabaseModule } from './infrastructure/database/database.module';
import { SecurityModule } from './infrastructure/security/security.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { UsergroupsModule } from './modules/usergroups/usergroups.module';
import { MenusModule } from './modules/menus/menus.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PasswordPoliciesModule } from './modules/password-policies/password-policies.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { HealthModule } from './modules/health/health.module';

// 14 POS Master Data Modules
import { OutletsModule } from './modules/outlets/outlets.module';
import { RegistersModule } from './modules/registers/registers.module';
import { DiningTablesModule } from './modules/dining-tables/dining-tables.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { UnitsModule } from './modules/units/units.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { ProductsModule } from './modules/products/products.module';
import { CustomerGroupsModule } from './modules/customer-groups/customer-groups.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { DiscountsModule } from './modules/discounts/discounts.module';

// F&B Enterprise Master Modules
import { KitchenStationsModule } from './modules/kitchen-stations/kitchen-stations.module';
import { SurchargesModule } from './modules/surcharges/surcharges.module';
import { SalesChannelsModule } from './modules/sales-channels/sales-channels.module';
import { UnitConversionsModule } from './modules/unit-conversions/unit-conversions.module';
import { RecipesModule } from './modules/recipes/recipes.module';

// POS Transactions & Shifts
import { ShiftsModule } from './modules/shifts/shifts.module';
import { OrdersModule } from './modules/orders/orders.module';
import { UploadModule } from './modules/upload/upload.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ProductionsModule } from './modules/productions/productions.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AppReleasesModule } from './modules/app-releases/app-releases.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate Limiting (Throttler)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl') || 60,
          limit: config.get<number>('throttle.limit') || 100,
        },
      ],
    }),

    // Global Core & Infrastructure
    DatabaseModule,
    SecurityModule,

    // Feature Modules: Administrasi Sistem sampai Approval
    HealthModule,
    AuthModule,
    UsersModule,
    UsergroupsModule,
    MenusModule,
    PermissionsModule,
    PasswordPoliciesModule,
    SettingsModule,
    ApprovalsModule,

    // 14 POS Master Data Modules
    OutletsModule,
    RegistersModule,
    DiningTablesModule,
    WarehousesModule,
    UnitsModule,
    CategoriesModule,
    BrandsModule,
    TaxesModule,
    ProductsModule,
    CustomerGroupsModule,
    CustomersModule,
    SuppliersModule,
    PaymentMethodsModule,
    DiscountsModule,

    // F&B Enterprise Master Modules
    KitchenStationsModule,
    SurchargesModule,
    SalesChannelsModule,
    UnitConversionsModule,
    RecipesModule,

    // POS Transactions & Shifts
    ShiftsModule,
    OrdersModule,
    ReportsModule,
    InventoryModule,
    ProductionsModule,

    // File Uploads
    UploadModule,

    // Payments & Payment Gateways
    PaymentsModule,

    // APK Releases & Mobile Management
    AppReleasesModule,
  ],

  providers: [
    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },

    // Global Guards: JWT Auth Guard (Public endpoints bypassed via @Public())
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global Guards: Throttler (Rate Limit)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
