import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [SequelizeModule.forFeature([Comment])],
  exports: [SequelizeModule],
})
export class CommentsModule {}
