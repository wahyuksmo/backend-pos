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
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { QueryBrandDto } from './dto/query-brand.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('BRAND', 'createPerm')
  @ApiOperation({ summary: 'Create new brand' })
  @ApiResponse({ status: 201, description: 'Brand successfully created' })
  async create(@Body() dto: CreateBrandDto, @CurrentUser() user: CurrentUserPayload) {
    return this.brandsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('BRAND', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of brands' })
  @ApiResponse({ status: 200, description: 'Paginated brands list' })
  async findAll(@Query() query: QueryBrandDto) {
    return this.brandsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('BRAND', 'readPerm')
  @ApiOperation({ summary: 'Get brand details by ID' })
  @ApiResponse({ status: 200, description: 'Brand details' })
  async findOne(@Param('id') id: string) {
    return this.brandsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('BRAND', 'updatePerm')
  @ApiOperation({ summary: 'Update brand' })
  @ApiResponse({ status: 200, description: 'Brand updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBrandDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.brandsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('BRAND', 'deletePerm')
  @ApiOperation({ summary: 'Delete brand' })
  @ApiResponse({ status: 200, description: 'Brand deleted' })
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
