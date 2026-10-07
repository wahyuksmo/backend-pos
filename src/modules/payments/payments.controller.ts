import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';
import { GenerateQrisDto } from './dto/generate-qris.dto';
import { SimulateQrisDto } from './dto/simulate-qris.dto';

@ApiTags('Payment Gateway & Dynamic QRIS')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('qris/generate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate dynamic QRIS with realistic QR string & data URL' })
  @ApiResponse({ status: 201, description: 'QRIS generated successfully' })
  async generateQris(@Body() dto: GenerateQrisDto) {
    return this.paymentsService.generateQris(dto);
  }

  @Get('qris/:transactionId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check real-time payment status of QRIS transaction' })
  @ApiResponse({ status: 200, description: 'QRIS payment status' })
  async checkQrisStatus(@Param('transactionId') transactionId: string) {
    return this.paymentsService.checkQrisStatus(transactionId);
  }

  @Post('qris/simulate-success')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Simulate successful customer QRIS scan & payment' })
  @ApiResponse({ status: 200, description: 'Payment marked as SUCCESS and order settled' })
  async simulateQrisSuccess(
    @Body() dto: SimulateQrisDto,
    @CurrentUser('username') username?: string,
  ) {
    return this.paymentsService.simulateQrisSuccess(dto, username || 'KASIR_DEMO');
  }

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Incoming payment webhook callback from gateway' })
  @ApiResponse({ status: 200, description: 'Webhook received' })
  async handleWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(payload);
  }
}
