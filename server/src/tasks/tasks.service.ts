import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemRole, TaskStatus, TaskPriority } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createTask(userId: string, data: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const assigneeId = data.assigneeId || userId;
    
    // Check if user is assigning to someone else
    if (assigneeId !== userId) {
      if (user?.systemRole === SystemRole.STAFF) {
         throw new ForbiddenException('Staff members cannot assign tasks to others');
      }
      
      const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
      if (!assignee) throw new NotFoundException('Assignee not found');

      if (user?.systemRole === SystemRole.MANAGER) {
         if (assignee.unitId !== user.unitId && assignee.managerId !== userId) {
            throw new ForbiddenException('Managers can only assign tasks to their subordinates');
         }
      } else if (user?.systemRole === SystemRole.DIRECTOR) {
         if (assignee.directorateId !== user.directorateId) {
            throw new ForbiddenException('Directors can only assign tasks to employees in their directorate');
         }
      }
    }

    let directorateId = data.directorateId || user?.directorateId;
    let unitId = data.unitId || user?.unitId;

    if (!directorateId && assigneeId !== userId) {
      const assignee = await this.prisma.user.findUnique({ where: { id: assigneeId } });
      directorateId = assignee?.directorateId;
      unitId = assignee?.unitId;
    }

    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TO_DO,
        priority: data.priority || TaskPriority.NORMAL,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        creatorId: userId,
        assigneeId,
        directorateId,
        unitId,
        projectId: data.projectId || null,
        collaborators: data.collaborators ? { connect: data.collaborators.map((id: string) => ({ id })) } : undefined,
      },
    });

    await this.prisma.taskActivity.create({
      data: {
        taskId: task.id,
        action: 'Task created',
        userId: userId,
      }
    });

    if (assigneeId && assigneeId !== userId) {
      await this.notificationsService.createNotification(
        assigneeId,
        'New Task Assigned',
        `You have been assigned a new task: ${task.title}`,
        '/dashboard/tasks'
      );
    }

    return task;
  }

  async getMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        directorate: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getTeamTasks(requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (!user) return [];

    let whereClause: any = { managerId: requesterId };
    if (user.systemRole === SystemRole.DIRECTOR && user.directorateId) {
      whereClause = { directorateId: user.directorateId };
    }

    const subordinates = await this.prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });
    
    const subIds = subordinates.map(u => u.id);

    return this.prisma.task.findMany({
      where: { assigneeId: { in: subIds } },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        directorate: { select: { name: true } },
        unit: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }
  
  async getDirectorateTasks(directorateId: string) {
    return this.prisma.task.findMany({
      where: { directorateId },
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        unit: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getAllTasks() {
    return this.prisma.task.findMany({
      include: {
        assignee: { select: { firstName: true, lastName: true } },
        directorate: { select: { name: true } },
        unit: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTaskProgress(taskId: string, userId: string, progress: number, status?: TaskStatus) {
    const task = await this.prisma.task.findUnique({ 
      where: { id: taskId },
      include: { collaborators: true }
    });
    if (!task) throw new NotFoundException('Task not found');
    
    // Check permission - simple ownership check for now
    const isCollaborator = task.collaborators.some((c: any) => c.id === userId);
    if (task.assigneeId !== userId && task.creatorId !== userId && !isCollaborator) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.systemRole === SystemRole.ADMIN || user?.systemRole === SystemRole.CEO) {
         // allowed
      } else if (user?.systemRole === SystemRole.DIRECTOR) {
         const creator = await this.prisma.user.findUnique({ where: { id: task.creatorId } });
         const assignee = task.assigneeId ? await this.prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
         if (creator?.directorateId !== user.directorateId && assignee?.directorateId !== user.directorateId) {
            throw new ForbiddenException('Directors can only update progress of tasks in their directorate');
         }
      } else if (user?.systemRole === SystemRole.MANAGER) {
         const creator = await this.prisma.user.findUnique({ where: { id: task.creatorId } });
         const assignee = task.assigneeId ? await this.prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
         if (creator?.unitId !== user.unitId && assignee?.unitId !== user.unitId) {
            throw new ForbiddenException('Managers can only update progress of tasks in their unit');
         }
      } else {
        throw new ForbiddenException('Cannot update someone else\'s task');
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        progress,
        ...(status && { status, statusUpdatedAt: new Date() }),
        ...(progress === 100 && { status: TaskStatus.COMPLETED, completedDate: new Date(), statusUpdatedAt: new Date() }),
      }
    });

    await this.prisma.taskActivity.create({
      data: {
        taskId,
        action: `Progress updated to ${progress}%`,
        userId,
      }
    });

    if (progress === 100 && task.status !== TaskStatus.COMPLETED) {
      if (task.creatorId !== userId) {
        await this.notificationsService.createNotification(
          task.creatorId,
          'Task Completed',
          `The task "${task.title}" has been completed.`,
          '/dashboard/tasks'
        );
      }
      if (task.assigneeId && task.assigneeId !== userId) {
        await this.notificationsService.createNotification(
          task.assigneeId,
          'Task Completed',
          `The task "${task.title}" has been completed.`,
          '/dashboard/tasks'
        );
      }
    }

    return updatedTask;
  }

  async updateTask(taskId: string, userId: string, data: any) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    
    // Check permission
    if (task.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.systemRole === SystemRole.ADMIN || user?.systemRole === SystemRole.CEO) {
         // allowed
      } else if (user?.systemRole === SystemRole.DIRECTOR) {
         const creator = await this.prisma.user.findUnique({ where: { id: task.creatorId } });
         const assignee = task.assigneeId ? await this.prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
         const isSubordinateTask = (creator?.directorateId === user.directorateId) || (assignee?.directorateId === user.directorateId);
         if (!isSubordinateTask) {
           throw new ForbiddenException('Directors can only update tasks belonging to their directorate');
         }
      } else if (user?.systemRole === SystemRole.MANAGER) {
         const creator = await this.prisma.user.findUnique({ where: { id: task.creatorId } });
         const assignee = task.assigneeId ? await this.prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
         const isSubordinateTask = (creator?.unitId === user.unitId) || (assignee?.unitId === user.unitId) || (creator?.managerId === userId) || (assignee?.managerId === userId);
         if (!isSubordinateTask) {
           throw new ForbiddenException('Managers can only update tasks belonging to their subordinates');
         }
      } else {
         throw new ForbiddenException('Only the creator or admin can update task details');
      }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        ...(data.status && data.status !== task.status && { statusUpdatedAt: new Date() }),
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId,
      }
    });

    await this.prisma.taskActivity.create({
      data: {
        taskId,
        action: `Task updated`,
        userId,
      }
    });

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    
    // Check permission
    if (task.creatorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.systemRole === SystemRole.STAFF) {
        throw new ForbiddenException('Only the creator or admin can delete tasks');
      }
      if (user?.systemRole === SystemRole.MANAGER) {
         const creator = await this.prisma.user.findUnique({ where: { id: task.creatorId } });
         const assignee = task.assigneeId ? await this.prisma.user.findUnique({ where: { id: task.assigneeId } }) : null;
         const isSubordinateTask = (creator?.managerId === userId) || (assignee?.managerId === userId);
         if (!isSubordinateTask) {
           throw new ForbiddenException('Managers can only delete tasks belonging to their subordinates');
         }
      }
    }

    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async addCollaborator(taskId: string, userIdToAdd: string, requesterId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { include: { members: true } } }
    });
    if (!task) throw new NotFoundException('Task not found');
    
    const requester = await this.prisma.user.findUnique({ where: { id: requesterId } });
    const userToAdd = await this.prisma.user.findUnique({ where: { id: userIdToAdd } });
    
    if (requester?.systemRole !== SystemRole.ADMIN) {
       // Only creator or assignee can add collaborators
       if (task.creatorId !== requesterId && task.assigneeId !== requesterId && requester?.systemRole !== SystemRole.DIRECTOR && requester?.systemRole !== SystemRole.CEO) {
         throw new ForbiddenException('Only task creator, assignee, or director can add collaborators');
       }
       
       if (task.projectId && task.project) {
          // Task belongs to a project, collaborator must be in the project
          const isProjectMember = task.project.members.some((m: any) => m.id === userIdToAdd) || task.project.creatorId === userIdToAdd;
          if (!isProjectMember) {
             throw new ForbiddenException('Collaborator must be a member of the project');
          }
       } else {
          // Normal task. Director can add from their team (directorate). Manager from unit.
          if (requester?.systemRole === SystemRole.DIRECTOR) {
             if (userToAdd?.directorateId !== requester.directorateId) {
                throw new ForbiddenException('Directors can only add collaborators from their directorate');
             }
          } else if (requester?.systemRole === SystemRole.MANAGER) {
             if (userToAdd?.unitId !== requester.unitId && userToAdd?.managerId !== requesterId) {
                throw new ForbiddenException('Managers can only add collaborators from their unit or direct subordinates');
             }
          }
       }
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        collaborators: { connect: { id: userIdToAdd } }
      }
    });

    await this.notificationsService.createNotification(
      userIdToAdd,
      'Added as Collaborator',
      `You have been added as a collaborator to the task: ${task.title}`,
      '/dashboard/tasks'
    );

    return updatedTask;
  }
}
