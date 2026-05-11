import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { DeviceReviewNotesService } from './device-review-notes.service';
import { DeviceReviewNote } from './device-review-note.entity';

@ApiTags('device-review-notes')
@ApiBearerAuth('access-token')
@Controller('device/:deviceId/review-notes')
export class DeviceReviewNotesController {
  constructor(private readonly notes: DeviceReviewNotesService) {}

  @Get()
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'List review notes for a device' })
  list(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Query('openOnly') openOnly?: string,
  ): Promise<DeviceReviewNote[]> {
    return this.notes.list(deviceId, openOnly === 'true');
  }

  @Post()
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Add a field-anchored review note' })
  create(
    @Param('deviceId', ParseIntPipe) deviceId: number,
    @Body() body: { fieldName?: string | null; body: string },
    @UserDecorator() user: ILoggedInUser,
  ): Promise<DeviceReviewNote> {
    return this.notes.create(
      deviceId,
      body.fieldName ?? null,
      body.body,
      user.email,
    );
  }

  @Patch(':noteId/resolve')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Mark a review note as resolved' })
  resolve(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<DeviceReviewNote> {
    return this.notes.resolve(noteId, user.email);
  }

  @Patch(':noteId/reopen')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Update')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Re-open a previously resolved note' })
  reopen(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ): Promise<DeviceReviewNote> {
    return this.notes.reopen(noteId);
  }

  @Delete(':noteId')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Delete')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Delete a review note' })
  async remove(
    @Param('deviceId', ParseIntPipe) _deviceId: number,
    @Param('noteId', ParseIntPipe) noteId: number,
  ): Promise<{ ok: true }> {
    await this.notes.delete(noteId);
    return { ok: true };
  }
}
