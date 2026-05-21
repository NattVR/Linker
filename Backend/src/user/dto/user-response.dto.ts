import { ApiProperty } from '@nestjs/swagger';

export class UserIdResponseDto {
  @ApiProperty({
    example: '8fcf7d2b-2836-4f73-9d74-76630411768b',
    description: 'ID del usuario',
  })
  id: string;
}

export class RegisterUserResponseDto {
  @ApiProperty({ example: true, description: 'Resultado de la operación' })
  success: boolean;

  @ApiProperty({
    example: 'Postulante registrado correctamente',
    description: 'Mensaje de resultado',
  })
  message: string;

  @ApiProperty({ type: UserIdResponseDto, description: 'Usuario registrado' })
  user: UserIdResponseDto;
}

export class LoginUserResponseDto {
  @ApiProperty({ example: true, description: 'Resultado de autenticación' })
  success: boolean;

  @ApiProperty({
    example: 'Inicio de sesión exitoso',
    description: 'Mensaje de resultado',
  })
  message: string;

  @ApiProperty({ type: UserIdResponseDto, description: 'Usuario autenticado' })
  user: UserIdResponseDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT',
  })
  token: string;
}
