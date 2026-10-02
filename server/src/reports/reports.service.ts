import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemRole, ReportPeriod, ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createReport(userId: string, data: any) {
    // Basic implementation: In a real system, you'd calculate stats from Tasks for this period automatically
    const report = await this.prisma.report.create({
      data: {
        period: data.period || ReportPeriod.DAILY,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        completedTasks: data.completedTasks || 0,
        inProgressTasks: data.inProgressTasks || 0,
        blockedTasks: data.blockedTasks || 0,
        overdueTasks: data.overdueTasks || 0,
        notes: data.notes,
        challenges: data.challenges,
        nextPeriodPlan: data.nextPeriodPlan,
        authorId: userId,
        status: ReportStatus.SUBMITTED,
      },
    });
    
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.managerId) {
      await this.notificationsService.createNotification(
        user.managerId,
        'Report Submitted',
        `${user.firstName} ${user.lastName} has submitted a report for review.`,
        '/dashboard/reports'
      );
    } else if (user?.systemRole === SystemRole.DIRECTOR) {
      // Notify CEO
      const ceos = await this.prisma.user.findMany({ where: { systemRole: SystemRole.CEO } });
      for (const ceo of ceos) {
        await this.notificationsService.createNotification(
          ceo.id,
          'Report Submitted',
          `${user.firstName} ${user.lastName} has submitted a report for review.`,
          '/dashboard/reports'
        );
      }
    }

    return report;
  }

  async getMyReports(userId: string) {
    return this.prisma.report.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTeamReports(requesterId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: requesterId } });
    if (!user) return [];

    let whereClause: any = { managerId: requesterId };
    if (user.systemRole === SystemRole.DIRECTOR && user.directorateId) {
      whereClause = { directorateId: user.directorateId };
    } else if (user.systemRole === SystemRole.CEO) {
      whereClause = { systemRole: SystemRole.DIRECTOR };
    } else if (user.systemRole === SystemRole.ADMIN) {
      whereClause = {};
    }

    const subordinates = await this.prisma.user.findMany({
      where: whereClause,
      select: { id: true }
    });
    
    const subIds = subordinates.map((u: any) => u.id);

    return this.prisma.report.findMany({
      where: { authorId: { in: subIds } },
      include: {
        author: { 
          select: { 
            firstName: true, 
            lastName: true,
            directorate: { select: { name: true } },
            unit: { select: { name: true } },
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllReports() {
    return this.prisma.report.findMany({
      include: {
        author: { 
          select: { 
            firstName: true, 
            lastName: true,
            directorate: { select: { name: true } },
            unit: { select: { name: true } },
          } 
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReportStatus(reportId: string, managerId: string, status: ReportStatus, comments?: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId }, include: { author: true } });
    if (!report) throw new NotFoundException('Report not found');
    
    // Check if the user is the manager of the author
    if (report.author.managerId !== managerId) {
      const user = await this.prisma.user.findUnique({ where: { id: managerId } });
      // Admins and CEOs can also review reports
      if (user?.systemRole === SystemRole.DIRECTOR && report.author.directorateId === user.directorateId) {
        // authorized
      } else if (user?.systemRole !== SystemRole.ADMIN && user?.systemRole !== SystemRole.CEO) {
        throw new ForbiddenException('Not authorized to review this report');
      }
    }

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        ...(comments && { managerComments: comments })
      }
    });

    await this.notificationsService.createNotification(
      report.authorId,
      'Report Reviewed',
      `Your report status has been updated to ${status}.`,
      '/dashboard/reports'
    );

    return updatedReport;
  }
}
