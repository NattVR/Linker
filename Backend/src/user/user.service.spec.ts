import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { UserDto } from './dto/create-user.dto';

describe('UserService', () => {
  let service: UserService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('createUser should hash password, save user and return success payload', async () => {
    const dto: UserDto = { email: 'user@test.com', password: '123456' };
    const createdUser = { id: 'user-id-1', email: dto.email, password: 'hashed-value' } as User;

    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValue(createdUser);

    const result = await service.createUser(dto);

    expect(repository.create).toHaveBeenCalled();
    const createArg = repository.create.mock.calls[0][0] as UserDto;
    expect(createArg.email).toBe(dto.email);
    expect(createArg.password).not.toBe(dto.password);
    expect(bcrypt.compareSync(dto.password, createArg.password)).toBe(true);
    expect(repository.save).toHaveBeenCalledWith(createdUser);
    expect(result).toEqual({
      success: true,
      message: 'Postulante registrado correctamente',
      user: { id: 'user-id-1' },
    });
  });

  it('createUser should throw BadRequestException when repository.save fails', async () => {
    const dto: UserDto = { email: 'user@test.com', password: '123456' };
    const createdUser = { id: 'user-id-2', email: dto.email, password: 'hashed-value' } as User;

    repository.create.mockReturnValue(createdUser);
    repository.save.mockRejectedValue(new Error('db error'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(service.createUser(dto)).rejects.toThrow(
      new BadRequestException('No se pudo crear')
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('[C1] Camino 1,2,3,4,5,6,F — email único → save() exitoso → retorna success:true con id', async () => {
    const createdUser = { id: 'uuid-c1', email: 'usuario1@mail.com', password: 'hashed' } as User;
    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValue(createdUser);

    const result = await service.createUser({ email: 'usuario1@mail.com', password: 'abc123' });

    expect(result.success).toBe(true);
    expect(result.message).toBe('Postulante registrado correctamente');
    expect(result.user).toBeDefined();
    expect(result.user.id).toBeTruthy();
  });

  it('[C2] Camino 1,2,3,4,5,7,8,F — email duplicado → save() falla → throw BadRequestException', async () => {
    const createdUser = { id: 'uuid-c2', email: 'duplicado@mail.com', password: 'hashed' } as User;
    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValueOnce(createdUser);
    repository.save.mockRejectedValue(new Error('duplicate key'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await service.createUser({ email: 'duplicado@mail.com', password: 'abc123' });

    await expect(
      service.createUser({ email: 'duplicado@mail.com', password: 'otraClave' })
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.createUser({ email: 'duplicado@mail.com', password: 'otraClave' })
    ).rejects.toThrow('No se pudo crear');
  });

  it('createUser() — dos usuarios con emails distintos reciben ids distintos', async () => {
    const user1 = { id: 'uuid-a', email: 'user_a@mail.com', password: 'hashed' } as User;
    const user2 = { id: 'uuid-b', email: 'user_b@mail.com', password: 'hashed' } as User;

    repository.create
      .mockReturnValueOnce(user1)
      .mockReturnValueOnce(user2);
    repository.save
      .mockResolvedValueOnce(user1)
      .mockResolvedValueOnce(user2);

    const r1 = await service.createUser({ email: 'user_a@mail.com', password: '123456' });
    const r2 = await service.createUser({ email: 'user_b@mail.com', password: '654321' });

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(r1.user.id).not.toBe(r2.user.id);
  });

  it('createUser() — el id retornado es un string UUID no vacío', async () => {
    const createdUser = { id: 'uuid-idcheck', email: 'idcheck@mail.com', password: 'hashed' } as User;
    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValue(createdUser);

    const result = await service.createUser({ email: 'idcheck@mail.com', password: 'pass1234' });

    expect(typeof result.user.id).toBe('string');
    expect(result.user.id.length).toBeGreaterThan(0);
  });

  it('createUser() — success:true y user.id válido para cualquier password', async () => {
    const createdUser = { id: 'uuid-hashtest', email: 'hashtest@mail.com', password: 'hashed' } as User;
    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValue(createdUser);

    const result = await service.createUser({ email: 'hashtest@mail.com', password: 'abc123' });

    expect(result.success).toBe(true);
    expect(result.user.id).toBeTruthy();
  });
});


describe('UserService — loginUser()', () => {
  let service: UserService;
  let repository: { findOneBy: jest.Mock };
  let jwtService: { sign: jest.Mock };

  const VALID_HASH = bcrypt.hashSync('123456789', 10);
  const VALID_USER = {
    id: 'user-id-login',
    email: 'm@gmail.com',
    password: VALID_HASH,
  } as User;

  beforeEach(async () => {
    repository = { findOneBy: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('mocked-jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('[C-001] Camino 1,2,3,4,F — email no registrado → BadRequestException("Credenciales inválidas")', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(
      service.loginUser({ email: 'prueba@gmail.com', password: 'cualquiera' } as any)
    ).rejects.toThrow(new BadRequestException('Credenciales inválidas'));

    expect(repository.findOneBy).toHaveBeenCalledWith({ email: 'prueba@gmail.com' });
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('[C-002] Camino 1,2,3,5,6,7,F — password incorrecta → BadRequestException("Credenciales inválidas")', async () => {
    repository.findOneBy.mockResolvedValue(VALID_USER);

    await expect(
      service.loginUser({ email: 'm@gmail.com', password: '12345' } as any)
    ).rejects.toThrow(new BadRequestException('Credenciales inválidas'));

    expect(repository.findOneBy).toHaveBeenCalledWith({ email: 'm@gmail.com' });
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('[C-003] Camino 1,2,3,5,6,8,9,F — credenciales correctas → retorna success:true + token', async () => {
    repository.findOneBy.mockResolvedValue(VALID_USER);

    const result = await service.loginUser({ email: 'm@gmail.com', password: '123456789' } as any);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Inicio de sesión exitoso');
    expect(result.user.id).toBeTruthy();
    expect(result.token).toBeTruthy();
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-id-login', email: 'm@gmail.com' });
  });
});