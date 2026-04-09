import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/decorators';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtUserPayload } from '../auth/services/jwt-token.service';
import { AccountUpdateDto } from './dto/account-update.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { PasswordUpdateDto, UserPasswordDto } from './dto/password.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UsersService } from './users.service';

/**
 * Gộp account + users admin vào cùng controller.
 * Global prefix `api`:
 * - `/api/account/*` cho self-service
 * - `/api/users/*` cho admin
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('account/profile')
  getProfile(@CurrentUser() user: JwtUserPayload) {
    return this.usersService.getAccountInfo(user.id);
  }

  @Put('account/update')
  updateAccount(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: AccountUpdateDto,
  ) {
    return this.usersService.updateAccountInfo(user.id, dto);
  }

  @Post('account/password')
  updatePassword(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: PasswordUpdateDto,
  ) {
    return this.usersService.updatePassword(user.id, dto);
  }

  @Get('users/public/by-username/:username')
  @Public()
  findPublicByUsername(@Param('username') username: string) {
    return this.usersService.findPublicUserByUsername(username);
  }

  @Get('users/public/:id')
  @Public()
  findPublicById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findPublicUserById(id);
  }

  @Get('users')
  @Roles('admin')
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAllUsers(query);
  }

  /** Tránh xung đột với `:id` UUID — đặt route cụ thể trước. */
  @Get('users/by-username/:username')
  @Roles('admin')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findUserByUsername(username);
  }

  @Get('users/:id')
  @Roles('admin')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findUserById(id);
  }

  @Post('users')
  @HttpCode(201)
  @Roles('admin')
  create(@Body() dto: AdminCreateUserDto) {
    return this.usersService.createUser(dto);
  }

  @Patch('users/:id')
  @Roles('admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @Post('users/:id/password')
  @Roles('admin')
  forcePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UserPasswordDto,
  ) {
    return this.usersService.forceUpdatePassword(id, dto);
  }

  @Delete('users/:id')
  @Roles('admin')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUserPayload,
  ) {
    return this.usersService.deleteUser(id, user.id);
  }
}
