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
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { QueryPaymentMethodDto } from './dto/query-payment-method.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Payment Methods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('PAYMENT_METHOD', 'createPerm')
  @ApiOperation({ summary: 'Create new payment method' })
  @ApiResponse({ status: 201, description: 'Payment method successfully created' })
  async create(@Body() dto: CreatePaymentMethodDto, @CurrentUser() user: CurrentUserPayload) {
    return this.paymentMethodsService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('PAYMENT_METHOD', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of payment methods' })
  @ApiResponse({ status: 200, description: 'Paginated payment methods list' })
  async findAll(@Query() query: QueryPaymentMethodDto) {
    return this.paymentMethodsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('PAYMENT_METHOD', 'readPerm')
  @ApiOperation({ summary: 'Get payment method details by ID' })
  @ApiResponse({ status: 200, description: 'Payment method details' })
  async findOne(@Param('id') id: string) {
    return this.paymentMethodsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('PAYMENT_METHOD', 'updatePerm')
  @ApiOperation({ summary: 'Update payment method' })
  @ApiResponse({ status: 200, description: 'Payment method updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.paymentMethodsService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('PAYMENT_METHOD', 'deletePerm')
  @ApiOperation({ summary: 'Delete payment method (soft delete)' })
  @ApiResponse({ status: 200, description: 'Payment method deleted' })
  async remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(id);
  }
}
