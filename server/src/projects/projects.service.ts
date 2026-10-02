import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createProject(creatorId: string, data: { name: string; description?: string }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        creatorId,
        members: {
          connect: { id: creatorId } // Creator is also a member
        }
      }
    });
  }

  async getMyProjects(userId: string, role: string) {
    if (role === 'ADMIN' || role === 'CEO') {
      return this.prisma.project.findMany({
        include: { creator: { select: { firstName: true, lastName: true, directorate: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.project.findMany({
      where: {
        members: { some: { id: userId } }
      },
      include: {
        creator: { select: { firstName: true, lastName: true, directorate: { select: { name: true } } } },
        members: { select: { id: true, firstName: true, lastName: true, systemRole: true } },
        _count: { select: { tasks: true } }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProjectById(projectId: string, userId: string, role: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, directorateId: true } },
        members: { select: { id: true, firstName: true, lastName: true, systemRole: true } },
        tasks: {
          include: {
            assignee: { select: { firstName: true, lastName: true } },
            collaborators: { select: { id: true, firstName: true, lastName: true } }
          }
        }
      }
    });

    if (!project) throw new NotFoundException('Project not found');

    if (role !== 'ADMIN') {
      const isMember = project.members.some(m => m.id === userId);
      if (!isMember) throw new UnauthorizedException('You do not have access to this project');
    }

    return project;
  }

  async addMember(projectId: string, userIdToAdd: string, requesterId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    
    // Only creator can add members (or admin)
    if (project.creatorId !== requesterId) {
      // Allow if admin, else throw
      const requester = await this.prisma.user.findUnique({ where: { id: requesterId }});
      if (requester?.systemRole !== 'ADMIN' && requester?.systemRole !== 'CEO') {
        throw new UnauthorizedException('Only the project creator can add members');
      }
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        members: { connect: { id: userIdToAdd } }
      }
    });

    await this.notificationsService.createNotification(
      userIdToAdd,
      'Added to Project',
      `You have been added to the project: ${project.name}`,
      `/dashboard/projects/${projectId}`
    );

    return updatedProject;
  }

  async completeProject(projectId: string, requesterId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { tasks: true }
    });

    if (!project) throw new NotFoundException('Project not found');

    if (project.creatorId !== requesterId) {
      const requester = await this.prisma.user.findUnique({ where: { id: requesterId }});
      if (requester?.systemRole !== 'ADMIN' && requester?.systemRole !== 'CEO') {
        throw new UnauthorizedException('Only the project creator can complete the project');
      }
    }

    // Check if all tasks are completed
    const uncompletedTasks = project.tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
    if (uncompletedTasks.length > 0) {
      throw new BadRequestException('All tasks must be completed or cancelled before completing the project');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: { status: 'COMPLETED' }
    });
  }
}
