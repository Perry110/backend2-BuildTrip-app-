import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtUserPayload } from '../../auth/services/jwt-token.service';
import { ListNotificationsQueryDto } from '../dto/list-notifications.query.dto';
import { UpsertNotificationPreferenceDto } from '../dto/upsert-notification-preference.dto';
import { NOTIFICATION_PREFERENCE_TYPES } from '../notification.constants';
import { NotificationPreferenceType } from '../notification.types';
import { NotificationService } from '../services/notification.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Notifications loaded' })
  listMyNotifications(
    @CurrentUser() user: JwtUserPayload,
    @Query() query: ListNotificationsQueryDto,
  ) {
    return this.notificationService.listMyNotifications(user.id, query);
  }

  @Get('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List current user notification preferences' })
  @ApiOkResponse({ description: 'Notification preferences loaded' })
  listMyPreferences(@CurrentUser() user: JwtUserPayload) {
    return this.notificationService.listMyPreferences(user.id);
  }

  @Put('preferences/:type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update current user notification preference by type',
  })
  @ApiParam({
    name: 'type',
    enum: Object.values(NOTIFICATION_PREFERENCE_TYPES),
  })
  @ApiOkResponse({ description: 'Notification preference updated' })
  upsertMyPreference(
    @CurrentUser() user: JwtUserPayload,
    @Param('type') type: string,
    @Body() dto: UpsertNotificationPreferenceDto,
  ) {
    if (
      !Object.values(NOTIFICATION_PREFERENCE_TYPES).includes(
        type as NotificationPreferenceType,
      )
    ) {
      throw new BadRequestException('notification_preference_type_invalid');
    }
    return this.notificationService.upsertMyPreference(
      user.id,
      type as NotificationPreferenceType,
      dto,
    );
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark one notification as read' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Notification marked as read' })
  markAsRead(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ) {
    return this.notificationService.markAsRead(user.id, notificationId);
  }
}
