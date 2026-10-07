import {
  BadRequestException,
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
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { AppReleasesService } from './app-releases.service';
import { CreateAppReleaseDto } from './dto/create-app-release.dto';
import { UpdateAppReleaseDto } from './dto/update-app-release.dto';
import { QueryAppReleaseDto } from './dto/query-app-release.dto';

const uploadApksDir = join(process.cwd(), 'uploads', 'apks');
if (!existsSync(uploadApksDir)) {
  mkdirSync(uploadApksDir, { recursive: true });
}

@ApiTags('APK Releases')
@Controller('app-releases')
export class AppReleasesController {
  constructor(private readonly releasesService: AppReleasesService) {}

  // 1. PUBLIC / DIRECT DOWNLOAD LATEST APK
  @Get('latest/download')
  @ApiOperation({ summary: 'Unduh file APK rilis terbaru langsung' })
  async downloadLatest(@Res() res: Response) {
    const fileInfo = await this.releasesService.getLatestFileForDownload();
    return res.download(fileInfo.filePath, fileInfo.fileName);
  }

  // 2. PUBLIC / CLIENT CHECK LATEST APK
  @Get('latest')
  @ApiOperation({ summary: 'Cek metadata rilis APK terbaru untuk mobile app' })
  async getLatest(@Req() req: Request) {
    const res = await this.releasesService.getLatest();
    const host = req.get('host') || 'localhost:7780';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const downloadUrl = `${baseUrl}/api/v1/app-releases/${res.data.releaseId}/download`;
    const qrCode = await this.releasesService.generateQrCodeDataUrl(downloadUrl);

    return {
      ...res,
      downloadUrl,
      qrCode,
    };
  }

  // 3. DOWNLOAD BY RELEASE ID
  @Get(':id/download')
  @ApiOperation({ summary: 'Unduh file APK berdasarkan ID' })
  async downloadById(@Param('id') id: string, @Res() res: Response) {
    const fileInfo = await this.releasesService.getFileForDownload(id);
    return res.download(fileInfo.filePath, fileInfo.fileName);
  }

  // 4. GET QR CODE DATA URL
  @Get(':id/qrcode')
  @ApiOperation({ summary: 'Dapatkan QR Code data URL untuk download APK' })
  async getQrCode(@Param('id') id: string, @Req() req: Request) {
    const release = await this.releasesService.findOne(id);
    const host = req.get('host') || 'localhost:7780';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const downloadUrl = `${baseUrl}/api/v1/app-releases/${id}/download`;
    const qrCode = await this.releasesService.generateQrCodeDataUrl(downloadUrl);

    return {
      releaseId: id,
      versionName: release.data.versionName,
      downloadUrl,
      qrCode,
    };
  }

  // 5. LIST RELEASES (PROTECTED)
  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('APP_RELEASES', 'read')
  @ApiOperation({ summary: 'Daftar semua rilis APK dengan pagination' })
  async findAll(@Query() query: QueryAppReleaseDto, @Req() req: Request) {
    const result = await this.releasesService.findAll(query);
    const host = req.get('host') || 'localhost:7780';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    // Add downloadUrl for each release
    const enhancedData = result.data.map((item) => ({
      ...item,
      downloadUrl: `${baseUrl}/api/v1/app-releases/${item.releaseId}/download`,
      directFileUrl: `${baseUrl}${item.filePath}`,
    }));

    return {
      ...result,
      data: enhancedData,
    };
  }

  // 6. GET DETAIL BY ID (PROTECTED)
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('APP_RELEASES', 'read')
  @ApiOperation({ summary: 'Detail rilis APK' })
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const res = await this.releasesService.findOne(id);
    const host = req.get('host') || 'localhost:7780';
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;
    const downloadUrl = `${baseUrl}/api/v1/app-releases/${id}/download`;
    const qrCode = await this.releasesService.generateQrCodeDataUrl(downloadUrl);

    return {
      ...res,
      downloadUrl,
      qrCode,
    };
  }

  // 7. UPLOAD APK AND CREATE RELEASE (PROTECTED)
  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('APP_RELEASES', 'create')
  @ApiOperation({ summary: 'Unggah file APK baru dan simpan rilis' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'versionName'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'File APK (.apk)' },
        versionName: { type: 'string', example: '1.0.0' },
        versionCode: { type: 'integer', example: 1 },
        releaseNotes: { type: 'string', example: 'Rilis fitur kasir baru' },
        isLatest: { type: 'string', example: 'Y' },
        isActive: { type: 'string', example: 'Y' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          if (!existsSync(uploadApksDir)) {
            mkdirSync(uploadApksDir, { recursive: true });
          }
          cb(null, uploadApksDir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${timestamp}-${safeName}`);
        },
      }),
      limits: {
        fileSize: 350 * 1024 * 1024, // 350MB
      },
      fileFilter: (req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ext === '.apk') {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Format file harus berupa paket Android APK (.apk)!'),
            false,
          );
        }
      },
    }),
  )
  async uploadApk(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateAppReleaseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) {
      throw new BadRequestException('File APK (.apk) wajib diunggah.');
    }
    return this.releasesService.createWithFile(file, dto, user?.username);
  }

  // 8. UPDATE RELEASE (PROTECTED)
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('APP_RELEASES', 'update')
  @ApiOperation({ summary: 'Perbarui informasi rilis APK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppReleaseDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.releasesService.update(id, dto, user?.username);
  }

  // 9. DELETE RELEASE (PROTECTED)
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('APP_RELEASES', 'delete')
  @ApiOperation({ summary: 'Hapus rilis APK' })
  async remove(@Param('id') id: string) {
    return this.releasesService.remove(id);
  }
}
