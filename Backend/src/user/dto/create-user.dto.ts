import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    example: 'test@linker.com',
    description: 'Correo electrónico del usuario',
  })
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'Contraseña del usuario',
  })
  password: string;

  @ApiPropertyOptional({
    example: 'pendiente',
    description: 'Estado de verificación del correo',
  })
  estado_verificacion?: string;
}
