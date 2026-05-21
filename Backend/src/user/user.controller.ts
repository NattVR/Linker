import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserDto } from './dto/create-user.dto';
import {
  LoginUserResponseDto,
  RegisterUserResponseDto,
} from './dto/user-response.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registrar usuario' })
  @ApiBody({ type: UserDto })
  @ApiOkResponse({
    description: 'Usuario registrado correctamente',
    type: RegisterUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'No se pudo crear el usuario' })
  async register(@Body() dto: UserDto) {
    return this.userService.createUser(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión de usuario' })
  @ApiBody({ type: UserDto })
  @ApiOkResponse({
    description: 'Inicio de sesión exitoso',
    type: LoginUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Credenciales inválidas' })
  async login(@Body() dto: UserDto) {
    return this.userService.loginUser(dto);
  }

  @Get('perfil/:idUser')
  @ApiOperation({ summary: 'Consultar perfil asociado al usuario' })
  @ApiParam({ name: 'idUser', description: 'ID del usuario' })
  @ApiOkResponse({
    description: 'Perfil encontrado (empresa o postulante)',
    schema: {
      nullable: true,
      example: {
        id: '8fcf7d2b-2836-4f73-9d74-76630411768b',
        name: 'Camila',
        lastname: 'Gomez',
      },
    },
  })
  async getPerfil(@Param('idUser') idUser:string){
    return await this.userService.getPerfilUser(idUser)
  }
}
