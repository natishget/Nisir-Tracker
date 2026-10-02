import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  UseGuards,
  Param,
  Query,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateDirectorateDto, UpdateDirectorateDto } from './dto/directorate.dto';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Roles(SystemRole.ADMIN)
  @Get('stats')
  getAdminStats() {
    return this.organizationService.getAdminStats();
  }

  @Roles(SystemRole.CEO, SystemRole.ADMIN)
  @Get('ceo-stats')
  getCeoStats(@Query('directorateId') directorateId?: string) {
    return this.organizationService.getCeoStats(directorateId);
  }

  @Get('directorates')
  getDirectorates() {
    return this.organizationService.getDirectorates();
  }

  @Get('units')
  getUnits() {
    return this.organizationService.getUnits();
  }

  @Get('positions')
  getPositions() {
    return this.organizationService.getPositions();
  }

  @Get('users')
  getUsers() {
    return this.organizationService.getUsers();
  }

  @Roles(
    SystemRole.STAFF,
    SystemRole.MANAGER,
    SystemRole.DIRECTOR,
    SystemRole.CEO,
    SystemRole.ADMIN,
  )
  @Get('team')
  getMyTeam(@CurrentUser() user: any) {
    return this.organizationService.getTeamMembers(user.sub);
  }

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Get('directorate/:id/members')
  getDirectorateMembers(@Param('id') directorateId: string) {
    return this.organizationService.getDirectorateMembers(directorateId);
  }

  @Roles(SystemRole.ADMIN)
  @Post('users')
  createUser(@Body() data: CreateUserDto) {
    return this.organizationService.createUser(data);
  }

  @Roles(SystemRole.ADMIN)
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.organizationService.updateUser(id, data);
  }

  @Roles(SystemRole.ADMIN)
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.organizationService.deleteUser(id);
  }

  // --- Organizational Structure Management ---

  @Roles(SystemRole.ADMIN)
  @Post('directorates')
  createDirectorate(@Body() data: CreateDirectorateDto) {
    return this.organizationService.createDirectorate(data);
  }

  @Roles(SystemRole.ADMIN)
  @Put('directorates/:id')
  updateDirectorate(
    @Param('id') id: string,
    @Body() data: UpdateDirectorateDto,
  ) {
    return this.organizationService.updateDirectorate(id, data);
  }

  @Roles(SystemRole.ADMIN)
  @Delete('directorates/:id')
  deleteDirectorate(@Param('id') id: string) {
    return this.organizationService.deleteDirectorate(id);
  }

  @Roles(SystemRole.ADMIN)
  @Post('units')
  createUnit(@Body() data: CreateUnitDto) {
    return this.organizationService.createUnit(data);
  }

  @Roles(SystemRole.ADMIN)
  @Put('units/:id')
  updateUnit(@Param('id') id: string, @Body() data: UpdateUnitDto) {
    return this.organizationService.updateUnit(id, data);
  }

  @Roles(SystemRole.ADMIN)
  @Delete('units/:id')
  deleteUnit(@Param('id') id: string) {
    return this.organizationService.deleteUnit(id);
  }
}
