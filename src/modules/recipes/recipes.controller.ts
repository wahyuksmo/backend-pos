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
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipeDto } from './dto/query-recipe.dto';
import { BulkSaveRecipeDto } from './dto/bulk-save-recipe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Recipes & BOM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('RECIPE', 'createPerm')
  @ApiOperation({ summary: 'Tambah 1 bahan takaran resep' })
  @ApiResponse({ status: 201, description: 'Resep berhasil ditambahkan' })
  async create(@Body() dto: CreateRecipeDto, @CurrentUser() user: CurrentUserPayload) {
    return this.recipesService.create(dto, user?.username);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('RECIPE', 'createPerm')
  @ApiOperation({ summary: 'Simpan seluruh bahan baku resep untuk 1 menu/varian (Master-Detail)' })
  @ApiResponse({ status: 200, description: 'BOM Resep berhasil disimpan' })
  async saveBulk(@Body() dto: BulkSaveRecipeDto, @CurrentUser() user: CurrentUserPayload) {
    return this.recipesService.saveBulk(dto, user?.username);
  }

  @Get()
  @RequirePermissions('RECIPE', 'readPerm')
  @ApiOperation({ summary: 'Daftar resep & takaran bahan flat (paginasi)' })
  @ApiResponse({ status: 200, description: 'Daftar resep' })
  async findAll(@Query() query: QueryRecipeDto) {
    return this.recipesService.findAll(query);
  }

  @Get('grouped')
  @RequirePermissions('RECIPE', 'readPerm')
  @ApiOperation({ summary: 'Daftar resep terkelompok per Produk Menu & Varian (Master-Detail view)' })
  @ApiResponse({ status: 200, description: 'Daftar resep grouped' })
  async findGrouped(@Query() query: QueryRecipeDto) {
    return this.recipesService.findGrouped(query);
  }

  @Get('product/:productId')
  @RequirePermissions('RECIPE', 'readPerm')
  @ApiOperation({ summary: 'Daftar seluruh bahan baku untuk 1 produk & varian' })
  @ApiResponse({ status: 200, description: 'Detail bahan resep produk' })
  async findByProduct(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.recipesService.findByProduct(productId, variantId);
  }

  @Delete('product/:productId')
  @RequirePermissions('RECIPE', 'deletePerm')
  @ApiOperation({ summary: 'Hapus seluruh resep untuk 1 produk & varian' })
  @ApiResponse({ status: 200, description: 'Seluruh resep produk berhasil dihapus' })
  async deleteByProduct(
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.recipesService.deleteByProduct(productId, variantId);
  }

  @Get(':id')
  @RequirePermissions('RECIPE', 'readPerm')
  @ApiOperation({ summary: 'Detail 1 bahan resep berdasarkan ID' })
  @ApiResponse({ status: 200, description: 'Detail resep' })
  async findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('RECIPE', 'updatePerm')
  @ApiOperation({ summary: 'Update takaran 1 bahan resep' })
  @ApiResponse({ status: 200, description: 'Resep berhasil diupdate' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecipeDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.recipesService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('RECIPE', 'deletePerm')
  @ApiOperation({ summary: 'Hapus 1 baris bahan resep' })
  @ApiResponse({ status: 200, description: 'Resep berhasil dihapus' })
  async remove(@Param('id') id: string) {
    return this.recipesService.remove(id);
  }
}
