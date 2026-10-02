import { Controller, Get, Post, Body, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  createTask(@Body() data: any, @CurrentUser() user: any) {
    return this.tasksService.createTask(user.sub, data);
  }

  @Post(':id/collaborators')
  addCollaborator(@Param('id') id: string, @Body('userId') userId: string, @CurrentUser() user: any) {
    return this.tasksService.addCollaborator(id, userId, user.sub);
  }

  @Get('me')
  getMyTasks(@CurrentUser() user: any) {
    return this.tasksService.getMyTasks(user.sub);
  }

  @Roles(SystemRole.MANAGER, SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Get('team')
  getTeamTasks(@CurrentUser() user: any) {
    return this.tasksService.getTeamTasks(user.sub);
  }

  @Roles(SystemRole.DIRECTOR, SystemRole.CEO, SystemRole.ADMIN)
  @Get('directorate/:directorateId')
  getDirectorateTasks(@Param('directorateId') directorateId: string) {
    return this.tasksService.getDirectorateTasks(directorateId);
  }

  @Roles(SystemRole.ADMIN)
  @Get('all')
  getAllTasks() {
    return this.tasksService.getAllTasks();
  }

  @Put(':id/progress')
  updateProgress(
    @Param('id') id: string, 
    @CurrentUser() user: any, 
    @Body() data: { progress: number, status?: any }
  ) {
    return this.tasksService.updateTaskProgress(id, user.sub, data.progress, data.status);
  }

  @Put(':id')
  updateTask(
    @Param('id') id: string, 
    @CurrentUser() user: any, 
    @Body() data: any
  ) {
    return this.tasksService.updateTask(id, user.sub, data);
  }

  @Delete(':id')
  deleteTask(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tasksService.deleteTask(id, user.sub);
  }
}
