import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { CreateProjectDto } from './dto/create-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Post()
  createProject(
    @CurrentUser() user: any,
    @Body() data: CreateProjectDto,
  ) {
    const creatorId =
      user.systemRole === 'ADMIN' && data.ownerId ? data.ownerId : user.sub;
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
  addMember(
    @Param('id') id: string,
    @Body() body: AddProjectMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.addMember(id, body.userId, user.sub);
  }

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Put(':id/complete')
  completeProject(@Param('id') id: string, @CurrentUser() user: any) {
    return this.projectsService.completeProject(id, user.sub);
  }
}
