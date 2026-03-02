import { Injectable, BadRequestException, ParseFilePipe } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { UserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    // 1
    @InjectRepository(User)
    private usuarioRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async createUser(dto: UserDto) {
    // 2
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(dto.password, salt);

    try {
      const userEntity = this.usuarioRepository.create({ // 3
        ...dto,
        password: hash,
      });

      await this.usuarioRepository.save(userEntity); // 4

      return { // 6
        success: true,
        message: 'Postulante registrado correctamente',
        user: { id: userEntity.id },
      };
    } catch (error) {
      console.error(error); // 7
      throw new BadRequestException('No se pudo crear'); // 8
    }
  }

  async loginUser(dto: UserDto) {
    const user = await this.usuarioRepository.findOneBy({ email: dto.email });
    if (!user) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const isPasswordValid = bcrypt.compareSync(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Credenciales inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      user: { id: user.id },
      token,
    };
  }

  async getPerfilUser(userId: string) {
    const perfil = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['empresa', 'postulante']
    });

    console.log('Perfil encontrado:', perfil);
    console.log('Postulante:', perfil?.postulante);

    if (!perfil) return null;
    if (perfil.postulante) return perfil.postulante;
    if (perfil.empresa) return perfil.empresa;
    return null;
  }
}
