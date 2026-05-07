import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../../common/mail/mail.module';
import { User } from '../users/entities/user.entity';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';
import { NotificationEntity } from './entities/notification.entity';
import { NOTIFICATION_QUEUE_NAME } from './notification.constants';
import { NotificationProcessor } from './queue/notification.processor';
import { NotificationQueueService } from './queue/notification.queue.service';
import { NotificationEmailService } from './services/notification-email.service';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [
    MailModule,
    TypeOrmModule.forFeature([
      NotificationDeliveryEntity,
      NotificationEntity,
      NotificationPreferenceEntity,
      User,
    ]),
    BullModule.registerQueue({
      name: NOTIFICATION_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationEmailService,
    NotificationProcessor,
    NotificationQueueService,
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
