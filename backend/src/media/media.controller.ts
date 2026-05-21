import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';
import { Roles } from '../core/roles.guard';
import { ROLES } from '../core/roles.constants';
import { Request } from 'express';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles(...ROLES.ALL)
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadMediaDto, @Req() req: Request) {
    return this.mediaService.upload(file, {
      tags: dto.tags,
      studentId: dto.studentId,
      uploadedBy: (req as any).user.userId,
    });
  }

  @Get()
  @Roles(...ROLES.ALL)
  findAll(@Query('tags') tags?: string, @Query('studentId') studentId?: string) {
    return this.mediaService.findAll(tags, studentId ? Number(studentId) : undefined);
  }

  @Get(':id')
  @Roles(...ROLES.ALL)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.findOne(id);
  }

  @Get(':id/file')
  @Roles(...ROLES.ALL)
  async getFile(@Param('id', ParseIntPipe) id: number, @Req() res: any) {
    const media = await this.mediaService.getFilePath(id);
    res.res.sendFile(media.storagePath);
  }

  @Delete(':id')
  @Roles(...ROLES.DELETE)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
