import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
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
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { FieldCaptureService } from './field-capture.service';
import { FieldCapture, FieldCaptureStatus } from './field-capture.entity';
import {
  CreateFieldCaptureDTO,
  FieldCaptureBody,
} from './dto/create-field-capture.dto';
import {
  ApproveFieldCaptureDTO,
  RejectFieldCaptureDTO,
} from './dto/review-field-capture.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { RolesGuard } from '../../guards/RolesGuard';
import { Roles } from '../user/decorators/roles.decorator';
import { Role } from '../../utils/enums/role.enum';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { SerialMatch } from './ocr-confusables';

/**
 * Field capture: a site operator photographs a nameplate, the serial is read on
 * the phone, and the result lands here as a pending capture.
 *
 * ACL note: operator-side routes sit on DEVICE_MANAGEMENT_CRUDL (SiteOperator
 * holds full CRUD there, Reviewer holds Read only) and reviewer-side routes on
 * DEVICE_REVIEWS_MANAGEMENT_CRUDL. Both modules are already seeded and granted,
 * so no new ACL rows are needed — which is the whole reason for reusing them.
 * The role lists below are what actually keeps an operator from approving their
 * own capture, since SiteOperator also happens to hold the reviews module.
 */
@ApiTags('Field Capture')
@ApiBearerAuth('access-token')
@Controller('field-capture')
export class FieldCaptureController {
  constructor(private readonly service: FieldCaptureService) {}

  @Post()
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.SiteOperator, Role.Registrant, Role.Admin)
  @Permission('Write')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    description: 'Nameplate photo plus the capture payload',
    schema: {
      type: 'object',
      properties: {
        photo: { type: 'string', format: 'binary' },
        capture: { $ref: '#/components/schemas/CreateFieldCaptureDTO' },
      },
    },
  })
  @ApiOperation({
    summary: 'Submit a field capture',
    description:
      'Idempotent on clientCaptureId: re-posting a queued capture returns the ' +
      'stored one rather than creating a duplicate.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Capture stored.' })
  public async create(
    @UserDecorator() user: ILoggedInUser,
    @Body() body: FieldCaptureBody,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<FieldCapture> {
    // Dual-path, same shape as POST /device: multipart sends the capture as a
    // JSON string in `capture`, plain JSON sends it as the body.
    let raw: unknown;
    if (body?.capture != null) {
      try {
        raw =
          typeof body.capture === 'string'
            ? JSON.parse(body.capture)
            : body.capture;
      } catch {
        throw new BadRequestException('`capture` is not valid JSON');
      }
    } else {
      raw = body;
    }

    const dto = plainToClass(CreateFieldCaptureDTO, raw);
    try {
      await validateOrReject(dto);
    } catch (errors) {
      throw new BadRequestException({
        success: false,
        message: 'Invalid capture payload',
        errors,
      });
    }

    return this.service.create(user, dto, photo);
  }

  @Get('serial-candidates')
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.SiteOperator, Role.Registrant, Role.Admin)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Serials in this organization that could be what was scanned',
    description:
      'Ranked by edit distance over confusable-folded keys, so an O/0 or 8/B ' +
      'substitution costs nothing. An exact hit means the device is already ' +
      'registered and the operator should verify rather than register. No hit ' +
      'is the useful signal: a new install, or a swapped unit.',
  })
  public async serialCandidates(
    @UserDecorator() user: ILoggedInUser,
    @Query('serial') serial: string,
  ): Promise<SerialMatch[]> {
    if (!serial) {
      throw new BadRequestException('`serial` is required');
    }
    return this.service.findSerialCandidates(user.organizationId, serial);
  }

  @Get('mine')
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.SiteOperator, Role.Registrant, Role.Admin)
  @Permission('Read')
  @ACLModules('DEVICE_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: "This organization's own captures" })
  public async mine(
    @UserDecorator() user: ILoggedInUser,
    @Query('status') status?: FieldCaptureStatus,
  ): Promise<FieldCapture[]> {
    return this.service.findMany({
      status,
      organizationId: user.organizationId,
    });
  }

  @Get()
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.Reviewer, Role.SeniorReviewer, Role.Admin)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Review queue' })
  public async queue(
    @Query('status') status: FieldCaptureStatus = FieldCaptureStatus.Pending,
  ): Promise<FieldCapture[]> {
    return this.service.findMany({ status });
  }

  @Get(':uuid')
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.Reviewer, Role.SeniorReviewer, Role.Admin)
  @Permission('Read')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'One capture, with a signed URL for the nameplate photo',
  })
  public async detail(
    @Param('uuid') uuid: string,
  ): Promise<FieldCapture & { photoUrl: string }> {
    return this.service.findOneWithPhoto(uuid);
  }

  @Post(':uuid/approve')
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.Reviewer, Role.SeniorReviewer, Role.Admin)
  @Permission('Update')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Approve a capture and create the device',
    description:
      'The only path from a capture to a device row. Field overrides in the ' +
      'body are merged over the submitted payload, so a reviewer who can read ' +
      'the photo better than the scanner did fixes the serial here.',
  })
  public async approve(
    @UserDecorator() user: ILoggedInUser,
    @Param('uuid') uuid: string,
    @Body() dto: ApproveFieldCaptureDTO,
  ): Promise<FieldCapture> {
    return this.service.approve(user, uuid, dto);
  }

  @Post(':uuid/reject')
  @UseGuards(AuthVerifiedGuard(['jwt']), RolesGuard, PermissionGuard)
  @Roles(Role.Reviewer, Role.SeniorReviewer, Role.Admin)
  @Permission('Update')
  @ACLModules('DEVICE_REVIEWS_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Reject a capture, with a reason' })
  public async reject(
    @UserDecorator() user: ILoggedInUser,
    @Param('uuid') uuid: string,
    @Body() dto: RejectFieldCaptureDTO,
  ): Promise<FieldCapture> {
    return this.service.reject(user, uuid, dto);
  }
}
