import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
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
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('createUser should hash password, save user and return success payload', async () => {
    const dto: UserDto = {
      email: 'user@test.com',
      password: '123456',
    };

    const createdUser = {
      id: 'user-id-1',
      email: dto.email,
      password: 'hashed-value',
    } as User;

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
    const dto: UserDto = {
      email: 'user@test.com',
      password: '123456',
    };

    const createdUser = {
      id: 'user-id-2',
      email: dto.email,
      password: 'hashed-value',
    } as User;

    repository.create.mockReturnValue(createdUser);
    repository.save.mockRejectedValue(new Error('db error'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(service.createUser(dto)).rejects.toThrow(
      new BadRequestException('No se pudo crear')
    );
    expect(console.error).toHaveBeenCalled();
  });
});
