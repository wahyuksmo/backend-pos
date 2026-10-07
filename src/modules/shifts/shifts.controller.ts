import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { CashMovementDto } from './dto/cash-movement.dto';
import { QueryShiftDto } from './dto/query-shift.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('POS Cashier Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('REGISTER_SHIFT', 'createPerm')
  @ApiOperation({ summary: 'Buka sesi kasir (Open Shift)' })
  @ApiResponse({ status: 201, description: 'Sesi shift kasir berhasil dibuka' })
  async openShift(@Body() dto: OpenShiftDto, @CurrentUser() user: CurrentUserPayload) {
    return this.shiftsService.openShift(dto, user.userId, user.username);
  }

  @Post(':id/close')
  @RequirePermissions('REGISTER_SHIFT', 'updatePerm')
  @ApiOperation({ summary: 'Tutup sesi kasir (Close Shift)' })
  @ApiResponse({ status: 200, description: 'Sesi shift kasir berhasil ditutup' })
  async closeShift(
    @Param('id') id: string,
    @Body() dto: CloseShiftDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.shiftsService.closeShift(id, dto, user.username);
  }

  @Post(':id/cash-movement')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('REGISTER_SHIFT', 'updatePerm')
  @ApiOperation({ summary: 'Catat petty cash masuk / keluar kasir' })
  @ApiResponse({ status: 201, description: 'Mutasi kas kasir tercatat' })
  async addCashMovement(
    @Param('id') id: string,
    @Body() dto: CashMovementDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.shiftsService.addCashMovement(id, dto, user.username);
  }

  @Get('active')
  @RequirePermissions('REGISTER_SHIFT', 'readPerm')
  @ApiOperation({ summary: 'Cek shift aktif untuk kasir / register' })
  async getActiveShift(
    @Query('registerId') registerId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.shiftsService.getActiveShift(registerId, user?.userId);
  }

  @Get()
  @RequirePermissions('REGISTER_SHIFT', 'readPerm')
  @ApiOperation({ summary: 'Daftar riwayat sesi kasir (Shifts)' })
  @ApiResponse({ status: 200, description: 'Paginated shifts list' })
  async findAll(@Query() query: QueryShiftDto) {
    return this.shiftsService.findAll(query);
  }

  @Get(':id/summary')
  @RequirePermissions('REGISTER_SHIFT', 'readPerm')
  @ApiOperation({ summary: 'Ringkasan kas shift real-time' })
  @ApiResponse({ status: 200, description: 'Summary real-time sesi kasir' })
  async getShiftSummary(@Param('id') id: string) {
    return this.shiftsService.getShiftSummary(id);
  }

  @Get(':id')
  @RequirePermissions('REGISTER_SHIFT', 'readPerm')
  @ApiOperation({ summary: 'Detail sesi kasir by ID' })
  @ApiResponse({ status: 200, description: 'Detail sesi shift kasir' })
  async findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(id);
  }
}
