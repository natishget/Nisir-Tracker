import { IsNotEmpty, IsString } from 'class-validator';

export class AddCollaboratorDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
