import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../../auth/decorators';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../../auth/services/jwt-token.service';
import { ApprovePlaceUseCase } from '../../application/use-cases/approve-place.use-case';
import { CreatePlaceDto } from '../dto/placemn-create.dto';
import { DeletePlaceDto } from '../dto/placemn-delete.dto';
import { GetAdminPendingPlacesUseCase } from '../../application/use-cases/get-admin-pending-places.use-case';
import { GetAdminPlaceUseCase } from '../../application/use-cases/get-admin-place.use-case';
import { GetAdminPlacesUseCase } from '../../application/use-cases/get-admin-places.use-case';
import { GetMyPlaceByIdUseCase } from '../../application/use-cases/get-my-place-by-id.use-case';
import { GetMyPlacesUseCase } from '../../application/use-cases/get-my-places.use-case';
import { RejectPlaceUseCase } from '../../application/use-cases/reject-place.use-case';
import { RestoreOwnPlaceUseCase } from '../../application/use-cases/restore-own-place.use-case';
import { RestorePlaceByAdminUseCase } from '../../application/use-cases/restore-place-by-admin.use-case';
import { SubmitPlaceUseCase } from '../../application/use-cases/submit-place.use-case';
import { UpdatePlaceDto } from '../dto/placemn-update.dto';
import { CreatePlaceUseCase } from '../../application/use-cases/create-place.use-case';
import { DeleteOwnPlaceUseCase } from '../../application/use-cases/delete-own-place.use-case';
import { DeletePlaceByAdminUseCase } from '../../application/use-cases/delete-place-by-admin.use-case';
import { ApprovePlaceDto } from '../dto/placemn-approve.dto';
import { RejectPlaceDto } from '../dto/placemn-reject.dto';
import { UpdatePlaceUseCase } from '../../application/use-cases/update-place.use-case';

@Controller('admin/places')
@UseGuards(JwtAuthGuard)
export class AdminPlaceController {
  constructor(
    private readonly approvePlaceUseCase: ApprovePlaceUseCase,
    private readonly rejectPlaceUseCase: RejectPlaceUseCase,
    private readonly deletePlaceByAdminUseCase: DeletePlaceByAdminUseCase,
    private readonly restorePlaceByAdminUseCase: RestorePlaceByAdminUseCase,
    private readonly updatePlaceUseCase: UpdatePlaceUseCase,
    private readonly getAdminPlaceUseCase: GetAdminPlaceUseCase,
    private readonly getAdminPlacesUseCase: GetAdminPlacesUseCase,
    private readonly getAdminPendingPlacesUseCase: GetAdminPendingPlacesUseCase,
  ) {}

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() _dto: ApprovePlaceDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensureAdmin(currentUser);
    await this.approvePlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  @Patch(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: RejectPlaceDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensureAdmin(currentUser);
    await this.rejectPlaceUseCase.execute({
      placeId,
      reason: dto.reason,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdatePlaceDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<{ success: boolean }> {
    this.ensureAdmin(currentUser);
    await this.updatePlaceUseCase.execute({
      id,
      ...body,
    });
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @Body() dto: DeletePlaceDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensureAdmin(currentUser);
    await this.deletePlaceByAdminUseCase.execute({
      placeId,
      reason: dto.reason,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensureAdmin(currentUser);
    await this.restorePlaceByAdminUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(
    @Query('status') status: string | undefined,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    this.ensureAdmin(currentUser);
    return this.getAdminPlacesUseCase.execute(status);
  }

  @Get('requests/pending')
  @HttpCode(HttpStatus.OK)
  async getPendingRequests(
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    this.ensureAdmin(currentUser);
    return this.getAdminPendingPlacesUseCase.execute();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    this.ensureAdmin(currentUser);
    return this.getAdminPlaceUseCase.execute(id);
  }

  private ensureAdmin(currentUser: JwtUserPayload): void {
    if (currentUser.role !== 'admin') {
      throw new ForbiddenException('admin_only');
    }
  }
}

@Controller('partner/places')
@UseGuards(JwtAuthGuard)
export class PartnerPlaceController {
  constructor(
    private readonly createPlaceUseCase: CreatePlaceUseCase,
    private readonly updatePlaceUseCase: UpdatePlaceUseCase,
    private readonly submitPlaceUseCase: SubmitPlaceUseCase,
    private readonly deleteOwnPlaceUseCase: DeleteOwnPlaceUseCase,
    private readonly restoreOwnPlaceUseCase: RestoreOwnPlaceUseCase,
    private readonly getMyPlaceByIdUseCase: GetMyPlaceByIdUseCase,
    private readonly getMyPlacesUseCase: GetMyPlacesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreatePlaceDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<{ success: boolean }> {
    this.ensurePlaceRequester(currentUser);
    await this.createPlaceUseCase.execute({
      ...body,
      ownerId: currentUser.id,
    });
    return { success: true };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdatePlaceDto,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<{ success: boolean }> {
    this.ensurePlaceRequester(currentUser);
    await this.updatePlaceUseCase.execute({
      id,
      actor: {
        userId: currentUser.id,
      },
      ...body,
    });
    return { success: true };
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensurePlaceRequester(currentUser);
    await this.submitPlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyPlaces(
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    this.ensurePlaceRequester(currentUser);
    return this.getMyPlacesUseCase.execute(currentUser.id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ) {
    this.ensurePlaceRequester(currentUser);
    return this.getMyPlaceByIdUseCase.execute(id, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensurePlaceRequester(currentUser);
    await this.deleteOwnPlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('id', new ParseUUIDPipe()) placeId: string,
    @CurrentUser() currentUser: JwtUserPayload,
  ): Promise<void> {
    this.ensurePlaceRequester(currentUser);
    await this.restoreOwnPlaceUseCase.execute({
      placeId,
      actor: {
        userId: currentUser.id,
      },
    });
  }

  private ensurePlaceRequester(currentUser: JwtUserPayload): void {
    if (currentUser.role === 'admin') {
      throw new ForbiddenException('place_requester_only');
    }
  }
}
