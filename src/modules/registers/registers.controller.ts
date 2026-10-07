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
import { RegistersService } from './registers.service';
import { CreateRegisterDto } from './dto/create-register.dto';
import { UpdateRegisterDto } from './dto/update-register.dto';
import { QueryRegisterDto } from './dto/query-register.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permission.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('Master Registers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('registers')
export class RegistersController {
  constructor(private readonly registersService: RegistersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('REGISTER', 'createPerm')
  @ApiOperation({ summary: 'Create new register' })
  @ApiResponse({ status: 201, description: 'Register successfully created' })
  async create(@Body() dto: CreateRegisterDto, @CurrentUser() user: CurrentUserPayload) {
    return this.registersService.create(dto, user?.username);
  }

  @Get()
  @RequirePermissions('REGISTER', 'readPerm')
  @ApiOperation({ summary: 'Retrieve paginated list of registers' })
  @ApiResponse({ status: 200, description: 'Paginated registers list' })
  async findAll(@Query() query: QueryRegisterDto) {
    return this.registersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('REGISTER', 'readPerm')
  @ApiOperation({ summary: 'Get register details by ID' })
  @ApiResponse({ status: 200, description: 'Register details' })
  async findOne(@Param('id') id: string) {
    return this.registersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('REGISTER', 'updatePerm')
  @ApiOperation({ summary: 'Update register' })
  @ApiResponse({ status: 200, description: 'Register updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRegisterDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.registersService.update(id, dto, user?.username);
  }

  @Delete(':id')
  @RequirePermissions('REGISTER', 'deletePerm')
  @ApiOperation({ summary: 'Delete register' })
  @ApiResponse({ status: 200, description: 'Register deleted' })
  async remove(@Param('id') id: string) {
    return this.registersService.remove(id);
  }
}
