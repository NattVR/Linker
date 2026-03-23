import {
  Controller,
  Get,
  Post,
  Body,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/create-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('registro')
  async register(@Body() dto: UserDto) {
    return this.userService.createUser(dto);
  }

  @Post('login')
  async login(@Body() dto: UserDto) {
    return this.userService.loginUser(dto);
  }

  @Get('perfil/:idUser')
  async getPerfil(@Param('idUser') idUser:string){
    return await this.userService.getPerfilUser(idUser)
  }
}
