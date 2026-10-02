import { Controller, Get, Post, Put, Body, Param, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Post()
  createProject(@CurrentUser() user: any, @Body() data: { name: string; description?: string; ownerId?: string }) {
    // If admin provides an ownerId, use it. Otherwise default to the requester.
    const creatorId = (user.systemRole === 'ADMIN' && data.ownerId) ? data.ownerId : user.sub;
    return this.projectsService.createProject(creatorId, data);
  }

  @Get()
  getMyProjects(@CurrentUser() user: any) {
    return this.projectsService.getMyProjects(user.sub, user.systemRole);
  }

  @Get(':id')
  getProjectById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.getProjectById(id, user.sub, user.systemRole);
  }

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body('userId') userId: string, @CurrentUser() user: any) {
    return this.projectsService.addMember(id, userId, user.sub);
  }

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Put(':id/complete')
  completeProject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.completeProject(id, user.sub);
  }
}
