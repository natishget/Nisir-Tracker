import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Put,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { CreateReportDto } from './dto/create-report.dto';
import { ReviewReportDto } from './dto/review-report.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(@CurrentUser() user: any, @Body() data: CreateReportDto) {
    return this.reportsService.createReport(user.sub, data);
  }

  @Get('me')
  getMyReports(@CurrentUser() user: any) {
    return this.reportsService.getMyReports(user.sub);
  }

  @Roles(
    SystemRole.MANAGER,
    SystemRole.DIRECTOR,
    SystemRole.CEO,
    SystemRole.ADMIN,
  )
  @Get('team')
  getTeamReports(@CurrentUser() user: any) {
    return this.reportsService.getTeamReports(user.sub);
  }

  @Roles(SystemRole.ADMIN)
  @Get('all')
  getAllReports() {
    return this.reportsService.getAllReports();
  }

  @Roles(
    SystemRole.MANAGER,
    SystemRole.DIRECTOR,
    SystemRole.CEO,
    SystemRole.ADMIN,
  )
  @Put(':id/review')
  reviewReport(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() data: ReviewReportDto,
  ) {
    return this.reportsService.updateReportStatus(
      id,
      user.sub,
      data.status,
      data.comments,
    );
  }
}
