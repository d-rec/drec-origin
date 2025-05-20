import { NullOrUndefinedResultInterceptor } from '@energyweb/origin-backend-utils';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  HttpStatus,
  Param,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  ParseIntPipe,
  NotFoundException,
  Put,
  BadRequestException,
  Query,
  DefaultValuePipe,
  ValidationPipe,
  Logger,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiSecurity,
  ApiNotFoundResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  OrganizationDTO,
  NewOrganizationDTO,
  BindBlockchainAccountDTO,
  organizationDocuments,
} from './dto';
import { OrganizationService } from './organization.service';
import { UserService } from '../user/user.service';
import { InvitationService } from '../invitation/invitation.service';
import { UserDTO } from '../user/dto/user.dto';
import { UserDecorator } from '../user/decorators/user.decorator';
import { Role } from '../../utils/enums/role.enum';
import { Roles } from '../user/decorators/roles.decorator';
import {
  ensureOrganizationRole,
  ILoggedInUser,
  isRole,
  IUser,
  responseSuccess,
} from '../../models';
import { AuthVerifiedGuard, PermissionGuard, RolesGuard } from '../../guards';
import { SuccessResponseDTO } from '@energyweb/origin-backend-utils';
import { InvitationDTO } from '../invitation/dto/invitation.dto';
import { UpdateMemberDTO } from './dto/organization-update-member.dto';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { OrganizationFilterDTO } from '../admin/dto/organization-filter.dto';
import { Organization } from './organization.entity';
import {
  DocumentEntity,
  DocumentTargetType,
  DocumentType,
} from '../document-uploads/entities/documents.entity';
import { DocumentUploadsService } from '../document-uploads/document-uploads.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import multer from 'multer';
import { FileTypes } from '../../utils/enums/file-types.enum';

@ApiTags('Organization')
@ApiBearerAuth('access-token')
@ApiSecurity('drec')
@Controller('/Organization')
@UseInterceptors(NullOrUndefinedResultInterceptor)
export class OrganizationController {
  private readonly logger = new Logger(OrganizationController.name);

  constructor(
    private readonly organizationService: OrganizationService,
    private userService: UserService,
    private invitationService: InvitationService,
    private readonly documentUploadsService: DocumentUploadsService,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  /**
   *
   * @param param0
   * @returns
   */

  @Post('/upload/verification-documents')
  @UseGuards(AuthGuard(['jwt', 'oauth2-client-password']))
  @Roles(Role.OrganizationAdmin)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'incorporationCertificate', maxCount: 1 },
        { name: 'legalRepresentativePassport', maxCount: 1 },
        { name: 'addressProof', maxCount: 1 },
        { name: 'ownersDeclaration', maxCount: 1 },
      ],
      {
        storage: multer.memoryStorage(),
        fileFilter: (req, file, callback) => {
          const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
          ];
          if (!allowedMimeTypes.includes(file.mimetype)) {
            return callback(
              new BadRequestException(
                'Invalid file type. Only PDF, JPEG, and PNG files are allowed.',
              ),
              false,
            );
          }
          callback(null, true);
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload a document',
    description:
      'Upload a single document file (PDF, JPEG, or PNG) associated with a specific target type and document type. The file will be linked to the authenticated user.',
  })
  @ApiQuery({
    name: 'targetType',
    enum: DocumentTargetType,
    description: 'Type of entity the document belongs to (e.g., ORGANIZATION)',
    required: true,
    example: DocumentTargetType.ORGANIZATION,
  })
  @ApiBody({
    description: 'Device registration with documents',
    schema: {
      type: 'object',
      properties: {
        incorporationCertificate: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        legalRepresentativePassport: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        addressProof: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
        ownersDeclaration: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document has been successfully uploaded and processed.',
    type: DocumentEntity,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Invalid file type, missing document, or invalid parameters.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have permission to upload documents.',
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found - Target entity specified in targetType does not exist.',
  })
  async uploadVerificationDocuments(
    @UploadedFiles() files: organizationDocuments,
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Query('targetType') targetType: DocumentTargetType,
  ): Promise<void[]> {
    const organization = await this.organizationService.findOne(organizationId);
    const targetId = organization.id;
    const allFileTypes = [
      FileTypes.IncorporationCertificate,
      FileTypes.LegalRepresentativePassport,
      FileTypes.AddressProof,
      FileTypes.OwnersDeclaration,
    ];
    const missingFiles = allFileTypes.filter((fileType) => {
      const fileArray = files[fileType];
      return !Array.isArray(fileArray) || fileArray.length === 0;
    });

    if (missingFiles.length > 0) {
      throw new BadRequestException(
        `Missing required file types: ${missingFiles.join(', ')}`,
      );
    }
    const documentTypeMap: Record<string, DocumentType> = {
      incorporationCertificate: DocumentType.INCORPORATION_CERTIFICATE,
      legalRepresentativePassport: DocumentType.LEGAL_REPRESENTATIVE_PASSPORT,
      addressProof: DocumentType.ADDRESS_PROOF,
      ownersDeclaration: DocumentType.OWNERS_DECLARATION,
    };
    const uploadedDocuments = await Promise.all(
      Object.entries(files).flatMap(([fileKey, fileArray]) => {
        const documentType = documentTypeMap[fileKey];
        return fileArray.map((file) =>
          this.documentUploadsService.upload(
            targetId,
            targetType,
            documentType,
            file,
          ),
        );
      }),
    );

    await this.organizationRepository.update(targetId, {
      verifiedAt: new Date(),
    });

    return uploadedDocuments;
  }

  @Get('/me')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get My Organization',
    description:
      'Retrieves the organization details of the currently authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Returns the organization details of the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  async getMyOrganization(
    @UserDecorator() { organizationId }: ILoggedInUser,
  ): Promise<OrganizationDTO | undefined> {
    this.logger.verbose('With in getOrg at org controller');
    return await this.organizationService.findOne(organizationId);
  }
  /**
   * This Api route to get all organization of apiuser
   * @param param0
   * @returns
   */
  @Get('/apiuser/all_organization')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Roles(Role.ApiUser)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: 'Get All Organizations for API User',
    description:
      'Fetches all organizations associated with the authenticated API user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [OrganizationDTO],
    description:
      'Returns an array of OrganizationDTO objects representing all organizations.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  async getAllOrganizations(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Query(ValidationPipe) filterDTO: OrganizationFilterDTO,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<{
    organizations: Organization[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in getAllOrganizations`);
    return await this.organizationService.getAll(
      filterDTO,
      pageNumber,
      limit,
      loggedUser,
    );
  }

  /**
   *
   * @param param0
   * @param pageNumber
   * @param limit
   * @returns
   */
  @Get('/users')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiQuery({ name: 'pageNumber', type: Number, required: false })
  @ApiQuery({ name: 'limit', type: Number, required: false })
  @ApiOperation({
    summary: 'Get Users in Organization',
    description:
      'Retrieves all users associated with the authenticated user’s organization. Supports pagination through query parameters.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [UserDTO],
    description:
      'Returns an array of UserDTO objects representing the users in the organization.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  @ApiNotFoundResponse({
    description:
      'Not Found. There are no users associated with this organization.',
  })
  async getOrganizationUsers(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Query('pageNumber', new DefaultValuePipe(1), ParseIntPipe)
    pageNumber: number,
    @Query('limit', new DefaultValuePipe(0), ParseIntPipe) limit: number,
  ): Promise<{
    users: IUser[];
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }> {
    this.logger.verbose(`With in getOrganizationUsers`);
    if (loggedUser.role === Role.ApiUser) {
      return this.organizationService.findApiUserOrganizationUsers(
        loggedUser.api_user_id,
        pageNumber,
        limit,
      );
    } else {
      return this.organizationService.findOrganizationUsers(
        loggedUser.organizationId,
        pageNumber,
        limit,
        loggedUser.role,
      );
    }
  }

  /**
   * It is GET api to fetch an organization renord.
   * @param {organizationId} is type of number which is the identifier of an organization
   * @return { OrganizationDTO | undefined } OrganizationDTO is for success response
   * and undefined when there is no particular record not available.
   */
  @Get('/:id')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  //  @Roles(Role.Admin)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get Organization by ID',
    description:
      'Fetches organization details based on the provided organization ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: OrganizationDTO,
    description: 'Returns the organization details for the specified ID.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Not Found. The organization with the specified ID does not exist.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  async getOrganizationById(
    @Param('id', new ParseIntPipe()) organizationId: number,
  ): Promise<OrganizationDTO | undefined> {
    this.logger.verbose(`With in getOrganizationById`);
    return this.organizationService.findOne(organizationId);
  }
  /**
   *
   * @param organizationId
   * @param loggedUser
   * @returns
   */
  @Get('/:id/invitations')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Permission('Read')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Get Invitations for Organization',
    description:
      'Retrieves all invitations associated with the specified organization. The user must be a member or admin of the organization to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: [InvitationDTO],
    description:
      'Returns an array of InvitationDTO objects representing the invitations for the specified organization.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Unauthorized access. The user must be authenticated to access this endpoint.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to access this resource.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Not Found. The specified organization does not exist or has no invitations.',
  })
  async getInvitationsForOrganization(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<InvitationDTO[]> {
    this.logger.verbose(`With in getInvitationsForOrganization`);
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);

    const organization = await this.organizationService.findOne(organizationId);

    return organization?.invitations.map((inv) =>
      InvitationDTO.fromInvitation(inv),
    );
  }
  /**
   * This api route use for add organization afte user login (but now it directly added at register time)
   * @param organizationToRegister
   * @param loggedUser
   * @returns {OrganizationDTO}
   */
  @Post()
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.OrganizationAdmin)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Register a New Organization',
    description:
      'Creates a new organization with the provided registration data.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: OrganizationDTO,
    description:
      'Returns the newly created OrganizationDTO object containing the organization details.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Bad Request. The provided organization data is invalid or missing required fields.',
  })
  public async register(
    @Body() organizationToRegister: NewOrganizationDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<OrganizationDTO> {
    this.logger.verbose(`With in register`);
    if (loggedUser.organizationId) {
      this.logger.error(
        `There is already an organization assigned to this account`,
      );
      throw new BadRequestException({
        success: false,
        message: `There is already an organization assigned to this account`,
      });
    }
    return await this.organizationService.create(
      organizationToRegister,
      loggedUser,
    );
  }
  /**
   * This Api route use for change the user role
   * @param organizationId ;number "in api param is id"
   * @param memberId :number "in api param is userId"
   * @body {role}
   * @param loggedUser
   * @returns {SuccessResponseDTO}
   */
  @Put(':id/change-role/:userId')
  @UseGuards(AuthVerifiedGuard('jwt'), RolesGuard, PermissionGuard)
  @Roles(Role.OrganizationAdmin, Role.Admin)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiBody({ type: UpdateMemberDTO })
  @ApiOperation({
    summary: 'Change Member Role',
    description:
      'Changes the role of a user within the organization based on the provided organization ID and user ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description:
      'Returns a success response indicating the role has been changed.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to change the role.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Not Found. The specified organization or user does not exist.',
  })
  async changeMemberRole(
    @Param('id', new ParseIntPipe()) organizationId: number,
    @Param('userId', new ParseIntPipe()) memberId: number,
    @Body() { role }: UpdateMemberDTO,
    @UserDecorator() loggedUser: ILoggedInUser,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in changeMemberRole`);
    this.ensureOrganizationMemberOrAdmin(loggedUser, organizationId);

    try {
      ensureOrganizationRole(role);
    } catch (e) {
      this.logger.error(`Forbidden Error`);
      throw new ForbiddenException();
    }

    await this.organizationService.changeMemberRole(
      loggedUser.organizationId,
      memberId,
      role,
    );

    return responseSuccess();
  }

  /**
   * This api route for Set blockchain address and singh for organization(for now we using static default value)
   * @param param0
   * @param param1
   * @returns {BindBlockchainAccountDTO}
   */
  @Post('chain-address')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiBody({ type: BindBlockchainAccountDTO })
  @ApiOperation({
    summary: 'Set Blockchain Address',
    description:
      'Sets the blockchain address for the organization using the provided signed message.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description:
      'Returns a success response indicating the blockchain address has been set.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Not Found. The user is not part of an organization.',
  })
  public async setBlockchainAddress(
    @UserDecorator() { organizationId }: ILoggedInUser,
    @Body() { signedMessage }: BindBlockchainAccountDTO,
  ): Promise<SuccessResponseDTO> {
    this.logger.verbose(`With in setBlockchainAddress`);
    if (!organizationId) {
      this.logger.error(`User is not a part of an organization.`);
      throw new NotFoundException('User is not a part of an organization.');
    }

    return this.organizationService.setBlockchainAddress(
      organizationId,
      signedMessage,
    );
  }

  private ensureOrganizationMemberOrAdmin(
    user: ILoggedInUser,
    organizationId: number,
  ) {
    this.logger.verbose(`With in ensureOrganizationMemberOrAdmin`);
    const isOrganizationMember = user.organizationId === organizationId;
    const hasAdminRole = isRole(user.role, Role.Admin);

    if (hasAdminRole) {
      return;
    }
    if (!isOrganizationMember) {
      this.logger.error(`Not a member of the organization.`);
      throw new ForbiddenException('Not a member of the organization.');
    }
  }
  @Delete('/user/:id')
  @UseGuards(
    AuthVerifiedGuard(['jwt', 'oauth2-client-password']),
    PermissionGuard,
  )
  @Permission('Delete')
  @ACLModules('ORGANIZATION_MANAGEMENT_CRUDL')
  @ApiOperation({
    summary: 'Delete User from Organization',
    description:
      'Removes a user from the organization based on the provided user ID.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SuccessResponseDTO,
    description:
      'Returns a success response indicating the user has been deleted from the organization.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description:
      'Not Found. The specified user does not exist in this organization.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description:
      'Forbidden. The user does not have permission to delete this user.',
  })
  async deleteUser(
    @UserDecorator() loggedUser: ILoggedInUser,
    @Param('id', new ParseIntPipe()) userid: number,
  ): Promise<SuccessResponseDTO> {
    const user = await this.userService.findById(userid);
    if (
      loggedUser.role === Role.ApiUser &&
      loggedUser.api_user_id != user.api_user_id
    ) {
      throw new NotFoundException('User does not exist in this organization');
    } else {
      if (!user && user.organization.id != loggedUser.organizationId) {
        throw new NotFoundException('User does not exist in this organization');
      }
    }

    //const manyotheruserinorg = await this.userService.getAnotherUserInOrganization(user.organization.id, user.id)

    if (user.role === loggedUser.role && user.status === 'Active') {
      throw new NotFoundException('Unauthorized');
    } else {
      await this.invitationService.remove(user.email, user.organization.id);
      await this.userService.remove(user.id);
    }
    return responseSuccess();
  }
}
