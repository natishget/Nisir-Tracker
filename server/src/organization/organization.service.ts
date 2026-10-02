import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SystemRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async getDirectorates() {
    return this.prisma.directorate.findMany({
      include: {
        units: true,
      },
    });
  }

  async getUnits() {
    return this.prisma.unit.findMany({
      include: {
        directorate: true,
      },
    });
  }

  async getPositions() {
    return this.prisma.position.findMany();
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        isActive: true,
        directorate: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        manager: { select: { id: true, firstName: true, lastName: true } },
      }
    });
  }

  async getTeamMembers(requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (!user) return [];

    let whereClause: any = { managerId: requesterId };
    
    if (user.systemRole === SystemRole.STAFF && user.unitId) {
      whereClause = { unitId: user.unitId };
    } else if (user.systemRole === SystemRole.DIRECTOR && user.directorateId) {
      whereClause = { directorateId: user.directorateId };
    } else if (user.systemRole === SystemRole.CEO) {
      // CEO sees all directors or everyone? Just everyone for simplicity.
      whereClause = {}; 
    } else if (user.systemRole === SystemRole.ADMIN) {
      whereClause = {};
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        position: { select: { name: true } },
      }
    });
  }

  async getDirectorateMembers(directorateId: string) {
    return this.prisma.user.findMany({
      where: { directorateId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        unit: { select: { name: true } },
        position: { select: { name: true } },
      }
    });
  }

  async createUser(data: any) {
    if (data.systemRole === SystemRole.DIRECTOR && data.directorateId) {
      const existing = await this.prisma.user.findFirst({
        where: { systemRole: SystemRole.DIRECTOR, directorateId: data.directorateId, isActive: true }
      });
      if (existing) throw new BadRequestException('A directorate can only have one active director.');
    }

    const passwordHash = await bcrypt.hash(data.password || 'Password123!', 10);
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        systemRole: data.systemRole,
        directorateId: data.directorateId || null,
        unitId: data.unitId || null,
        positionId: data.positionId || null,
      },
    });
  }

  async updateUser(id: string, data: any) {
    if (data.systemRole === SystemRole.DIRECTOR && data.directorateId && data.isActive !== false) {
      const existing = await this.prisma.user.findFirst({
        where: { 
          systemRole: SystemRole.DIRECTOR, 
          directorateId: data.directorateId, 
          isActive: true,
          id: { not: id } 
        }
      });
      if (existing) throw new BadRequestException('A directorate can only have one active director.');
    }

    let updateData: any = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      systemRole: data.systemRole,
      isActive: data.isActive,
      directorateId: data.directorateId || null,
      unitId: data.unitId || null,
      positionId: data.positionId || null,
    };

    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getAdminStats() {
    const [totalUsers, totalTasks, totalDirectorates, totalUnits] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.task.count(),
      this.prisma.directorate.count(),
      this.prisma.unit.count(),
    ]);

    return {
      totalUsers,
      totalTasks,
      totalDirectorates,
      totalUnits
    };
  }

  async getCeoStats(directorateId?: string) {
    const whereTasks = directorateId ? { directorateId } : {};
    const whereProjects = directorateId ? { creator: { directorateId } } : {};

    const [
      totalTasks,
      totalTasksUnderProjects,
      totalProjects,
      totalCompletedTasks,
      totalCompletedProjects,
      totalToDoTasks,
      totalOverdueTasks
    ] = await Promise.all([
      this.prisma.task.count({ where: whereTasks }),
      this.prisma.task.count({ where: { ...whereTasks, projectId: { not: null } } }),
      this.prisma.project.count({ where: whereProjects }),
      this.prisma.task.count({ where: { ...whereTasks, status: 'COMPLETED' } }),
      this.prisma.project.count({ where: { ...whereProjects, status: 'COMPLETED' } }),
      this.prisma.task.count({ where: { ...whereTasks, status: 'TO_DO' } }),
      this.prisma.task.count({ 
        where: { 
          ...whereTasks, 
          status: { not: 'COMPLETED' }, 
          dueDate: { lt: new Date(new Date().setHours(0,0,0,0)) } 
        } 
      })
    ]);

    return {
      totalTasks,
      totalTasksUnderProjects,
      totalProjects,
      totalCompletedTasks,
      totalCompletedProjects,
      totalToDoTasks,
      totalOverdueTasks
    };
  }

  // --- Organizational Structure Management ---

  async createDirectorate(data: any) {
    return this.prisma.directorate.create({
      data: {
        name: data.name,
        description: data.description,
      }
    });
  }

  async updateDirectorate(id: string, data: any) {
    return this.prisma.directorate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      }
    });
  }

  async deleteDirectorate(id: string) {
    return this.prisma.directorate.delete({
      where: { id },
    });
  }

  async createUnit(data: any) {
    return this.prisma.unit.create({
      data: {
        name: data.name,
        directorateId: data.directorateId,
      }
    });
  }

  async updateUnit(id: string, data: any) {
    return this.prisma.unit.update({
      where: { id },
      data: {
        name: data.name,
        directorateId: data.directorateId,
      }
    });
  }

  async deleteUnit(id: string) {
    return this.prisma.unit.delete({
      where: { id },
    });
  }
}
