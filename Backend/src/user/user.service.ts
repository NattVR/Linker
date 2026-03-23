import { Injectable, BadRequestException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { UserDto } from './dto/create-user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usuarioRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(dto: UserDto) {
    const hash = this.hashPassword(dto.password);
    try {
      const userEntity = this.usuarioRepository.create({ ...dto, password: hash });
      await this.usuarioRepository.save(userEntity);
      return {
        success: true,
        message: 'Postulante registrado correctamente',
        user: { id: userEntity.id },
      };
    } catch (error) {
      console.error(error);
      throw new BadRequestException('No se pudo crear');
    }
  }

  async loginUser(dto: UserDto) {
    const user = await this.usuarioRepository.findOneBy({ email: dto.email });
    this.validateCredentials(user, dto.password);

    const token = this.jwtService.sign({ sub: user!.id, email: user!.email });
    return {
      success: true,
      message: 'Inicio de sesión exitoso',
      user: { id: user!.id },
      token,
    };
  }

  async getPerfilUser(userId: string) {
    const perfil = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['empresa', 'postulante'],
    });
    return this.resolverPerfil(perfil);
  }

  private hashPassword(password: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
  }

  private validateCredentials(user: User | null, password: string) {
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new BadRequestException('Credenciales inválidas');
    }
  }

  private resolverPerfil(perfil: User | null) {
    if (!perfil) return null;
    return perfil.postulante ?? perfil.empresa ?? null;
  }
}