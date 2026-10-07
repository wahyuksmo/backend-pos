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
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Discounts & Promotions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('DISCOUNT', 'createPerm')
  @ApiOperation({ summary: 'Create new discount' })
  @ApiResponse({ status: 201, description: 'Discount successfully created' })
  async create(@Body() dto: CreateDiscountDto, @CurrentUser() user: CurrentUserPayload) {
    return this.discountsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('DISCOUNT', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of discounts' })
  @ApiResponse({ status: 200, description: 'Paginated discounts list' })
  async findAll(@Query() query: QueryDiscountDto) {
    return this.discountsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('DISCOUNT', 'readPerm')
  @ApiOperation({ summary: 'Get discount details by ID' })
  @ApiResponse({ status: 200, description: 'Discount details' })
  async findOne(@Param('id') id: string) {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('DISCOUNT', 'updatePerm')
  @ApiOperation({ summary: 'Update discount' })
  @ApiResponse({ status: 200, description: 'Discount updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.discountsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('DISCOUNT', 'deletePerm')
  @ApiOperation({ summary: 'Delete discount (soft delete)' })
  @ApiResponse({ status: 200, description: 'Discount deleted' })
  async remove(@Param('id') id: string) {
    return this.discountsService.remove(id);
  }
}
