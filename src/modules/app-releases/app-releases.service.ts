import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CreateAppReleaseDto } from './dto/create-app-release.dto';
import { UpdateAppReleaseDto } from './dto/update-app-release.dto';
import { QueryAppReleaseDto } from './dto/query-app-release.dto';

@Injectable()
export class AppReleasesService {
  constructor(private readonly prisma: PrismaService) {}

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  private serializeRelease(release: any) {
    if (!release) return null;
    return {
      ...release,
      fileSize: release.fileSize ? Number(release.fileSize) : 0,
    };
  }

  async createWithFile(
    file: Express.Multer.File,
    dto: CreateAppReleaseDto,
    username?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File APK (.apk) wajib diunggah.');
    }

    // Determine versionCode if omitted
    let versionCode = dto.versionCode;
    if (!versionCode) {
      const highest = await this.prisma.posAppRelease.findFirst({
        orderBy: { versionCode: 'desc' },
      });
      versionCode = highest ? highest.versionCode + 1 : 1;
    } else {
      // check unique versionCode
      const existing = await this.prisma.posAppRelease.findFirst({
        where: { versionCode },
      });
      if (existing) {
        throw new BadRequestException(
          `Version code ${versionCode} sudah terdaftar. Gunakan angka yang lebih tinggi.`,
        );
      }
    }

    const isLatest = dto.isLatest ?? 'Y';

    // If marked as latest, reset any other latest release
    if (isLatest === 'Y') {
      await this.prisma.posAppRelease.updateMany({
        where: { isLatest: 'Y' },
        data: { isLatest: 'N' },
      });
    }

    const relativeUrl = `/uploads/apks/${file.filename}`;
    const formattedSize = this.formatFileSize(file.size);

    const release = await this.prisma.posAppRelease.create({
      data: {
        versionName: dto.versionName,
        versionCode: Number(versionCode),
        fileName: file.filename,
        originalName: file.originalname,
        filePath: relativeUrl,
        fileSize: BigInt(file.size),
        fileSizeFormatted: formattedSize,
        releaseNotes: dto.releaseNotes || null,
        isLatest,
        isActive: dto.isActive ?? 'Y',
        objectCode: 'APP_RELEASE',
        createdBy: username || 'SYSTEM',
      },
    });

    return {
      message: 'APK berhasil diunggah dan dirilis',
      data: this.serializeRelease(release),
    };
  }

  async findAll(query: QueryAppReleaseDto) {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = ((page || 1) - 1) * (limit || 10);
    const take = limit || 10;

    const where: Prisma.PosAppReleaseWhereInput = {
      ...(isActive && { isActive }),
      ...(search && {
        OR: [
          { versionName: { contains: search, mode: 'insensitive' } },
          { releaseNotes: { contains: search, mode: 'insensitive' } },
          { originalName: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const allowedSortFields = [
      'createdAt',
      'versionCode',
      'versionName',
      'downloadCount',
      'fileSize',
    ];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [total, items] = await Promise.all([
      this.prisma.posAppRelease.count({ where }),
      this.prisma.posAppRelease.findMany({
        where,
        skip,
        take,
        orderBy: { [orderField]: sortOrder },
      }),
    ]);

    const totalPages = Math.ceil(total / take) || 1;

    return {
      data: items.map((item) => this.serializeRelease(item)),
      meta: {
        page: Number(page),
        limit: Number(take),
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string) {
    const release = await this.prisma.posAppRelease.findUnique({
      where: { releaseId: id },
    });

    if (!release) {
      throw new NotFoundException(`Rilis APK dengan ID "${id}" tidak ditemukan.`);
    }

    return {
      data: this.serializeRelease(release),
    };
  }

  async getLatest() {
    let release = await this.prisma.posAppRelease.findFirst({
      where: { isActive: 'Y', isLatest: 'Y' },
      orderBy: { versionCode: 'desc' },
    });

    if (!release) {
      release = await this.prisma.posAppRelease.findFirst({
        where: { isActive: 'Y' },
        orderBy: { versionCode: 'desc' },
      });
    }

    if (!release) {
      throw new NotFoundException('Belum ada rilis APK yang aktif.');
    }

    return {
      data: this.serializeRelease(release),
    };
  }

  async update(id: string, dto: UpdateAppReleaseDto, username?: string) {
    const existing = await this.prisma.posAppRelease.findUnique({
      where: { releaseId: id },
    });

    if (!existing) {
      throw new NotFoundException(`Rilis APK dengan ID "${id}" tidak ditemukan.`);
    }

    if (dto.isLatest === 'Y') {
      await this.prisma.posAppRelease.updateMany({
        where: {
          isLatest: 'Y',
          NOT: { releaseId: id },
        },
        data: { isLatest: 'N' },
      });
    }

    const updated = await this.prisma.posAppRelease.update({
      where: { releaseId: id },
      data: {
        ...(dto.versionName !== undefined && { versionName: dto.versionName }),
        ...(dto.versionCode !== undefined && { versionCode: Number(dto.versionCode) }),
        ...(dto.releaseNotes !== undefined && { releaseNotes: dto.releaseNotes }),
        ...(dto.isLatest !== undefined && { isLatest: dto.isLatest }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedBy: username || 'SYSTEM',
      },
    });

    return {
      message: 'Informasi rilis APK berhasil diperbarui',
      data: this.serializeRelease(updated),
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.posAppRelease.findUnique({
      where: { releaseId: id },
    });

    if (!existing) {
      throw new NotFoundException(`Rilis APK dengan ID "${id}" tidak ditemukan.`);
    }

    // Try deleting physical file
    try {
      const fullPath = join(process.cwd(), existing.filePath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    } catch {
      // Ignore physical delete error if file not found
    }

    await this.prisma.posAppRelease.delete({
      where: { releaseId: id },
    });

    return {
      message: 'Rilis APK berhasil dihapus.',
    };
  }

  async getFileForDownload(id: string) {
    const release = await this.prisma.posAppRelease.findUnique({
      where: { releaseId: id },
    });

    if (!release) {
      throw new NotFoundException(`Rilis APK tidak ditemukan.`);
    }

    const fullPath = join(process.cwd(), release.filePath);
    if (!existsSync(fullPath)) {
      throw new NotFoundException(`File fisik APK tidak ditemukan di server.`);
    }

    // Increment download count asynchronously
    await this.prisma.posAppRelease.update({
      where: { releaseId: id },
      data: { downloadCount: { increment: 1 } },
    });

    return {
      filePath: fullPath,
      fileName: `POS-v${release.versionName}.apk`,
      release: this.serializeRelease(release),
    };
  }

  async getLatestFileForDownload() {
    const { data: latest } = await this.getLatest();
    return this.getFileForDownload(latest.releaseId);
  }

  async generateQrCodeDataUrl(url: string): Promise<string> {
    return QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });
  }
}
