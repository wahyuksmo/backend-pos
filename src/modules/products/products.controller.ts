import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateModifierGroupDto,
  CreateModifierItemDto,
  CreateProductDto,
  CreateProductOutletPriceDto,
  CreateProductVariantDto,
} from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Products & Variants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('PRODUCT', 'createPerm')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: CurrentUserPayload) {
    return this.productsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('PRODUCT', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of products' })
  @ApiResponse({ status: 200, description: 'Paginated products list' })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('PRODUCT', 'readPerm')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ status: 200, description: 'Product details' })
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('PRODUCT', 'deletePerm')
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Variant Management
  @Post(':id/variants')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Add variant to product' })
  async addVariant(
    @Param('id') id: string,
    @Body() dto: CreateProductVariantDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.addVariant(id, dto, user?.username);
  }

  @Delete('variants/:variantId')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Delete product variant' })
  async removeVariant(@Param('variantId') variantId: string) {
    return this.productsService.removeVariant(variantId);
  }

  // Outlet Price Override
  @Post(':id/outlet-prices')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Set outlet price override for product' })
  async setOutletPrice(
    @Param('id') id: string,
    @Body() dto: CreateProductOutletPriceDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.setOutletPrice(id, dto, user?.username);
  }

  @Delete('outlet-prices/:priceId')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Delete outlet price override' })
  async removeOutletPrice(@Param('priceId') priceId: string) {
    return this.productsService.removeOutletPrice(priceId);
  }

  // Modifier Groups & Items
  @Post(':id/modifier-groups')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Add modifier group to product' })
  async addModifierGroup(
    @Param('id') id: string,
    @Body() dto: CreateModifierGroupDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.addModifierGroup(id, dto, user?.username);
  }

  @Delete('modifier-groups/:groupId')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Delete modifier group' })
  async removeModifierGroup(@Param('groupId') groupId: string) {
    return this.productsService.removeModifierGroup(groupId);
  }

  @Post('modifier-groups/:groupId/items')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Add item to modifier group' })
  async addModifierItem(
    @Param('groupId') groupId: string,
    @Body() dto: CreateModifierItemDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.productsService.addModifierItem(groupId, dto, user?.username);
  }

  @Delete('modifier-items/:itemId')
  @RequirePermissions('PRODUCT', 'updatePerm')
  @ApiOperation({ summary: 'Delete modifier item' })
  async removeModifierItem(@Param('itemId') itemId: string) {
    return this.productsService.removeModifierItem(itemId);
  }
}
