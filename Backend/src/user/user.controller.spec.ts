import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserDto } from './dto/create-user.dto';

const mockUserService = {
  createUser: jest.fn(),
  loginUser: jest.fn(),
  getPerfilUser: jest.fn(),
};

describe('UserController', () => {
  let controller: UserController;
  let service: typeof mockUserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get(UserService);
    jest.clearAllMocks();
  });

  it('[C-001] register() -> delega en userService.createUser() y retorna respuesta de éxito', async () => {
    const dto: UserDto = { email: 'test@mail.com', password: '123456' };
    const expected = { success: true, message: 'Postulante registrado correctamente', user: { id: 'u-1' } };
    mockUserService.createUser.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(service.createUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('[C-002] register() -> propaga error cuando el email ya existe', async () => {
    const dto: UserDto = { email: 'duplicado@mail.com', password: '123456' };
    mockUserService.createUser.mockRejectedValue(new Error('No se pudo crear'));

    await expect(controller.register(dto)).rejects.toThrow('No se pudo crear');
    expect(service.createUser).toHaveBeenCalledWith(dto);
  });

  it('[C-003] login() -> delega en userService.loginUser() y retorna token', async () => {
    const dto: UserDto = { email: 'm@gmail.com', password: '123456789' };
    const expected = {
      success: true,
      message: 'Inicio de sesión exitoso',
      user: { id: 'u-login' },
      token: 'jwt-token',
    };
    mockUserService.loginUser.mockResolvedValue(expected);

    const result = await controller.login(dto);

    expect(service.loginUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
    expect(result.token).toBeTruthy();
  });

  it('[C-004] login() -> propaga error cuando las credenciales son inválidas', async () => {
    const dto: UserDto = { email: 'bad@mail.com', password: 'wrong' };
    mockUserService.loginUser.mockRejectedValue(new Error('Credenciales inválidas'));

    await expect(controller.login(dto)).rejects.toThrow('Credenciales inválidas');
    expect(service.loginUser).toHaveBeenCalledWith(dto);
  });

  it('[C-005] login() -> no llama createUser cuando se hace login', async () => {
    const dto: UserDto = { email: 'a@b.com', password: 'pass' };
    mockUserService.loginUser.mockResolvedValue({ success: true, token: 'tok' });

    await controller.login(dto);

    expect(service.createUser).not.toHaveBeenCalled();
  });

  it('[C-006] getPerfil() -> delega en userService.getPerfilUser() con idUser correcto', async () => {
    const idUser = 'user-uuid-1';
    const perfil = { id: 'post-1', name: 'Juan' };
    mockUserService.getPerfilUser.mockResolvedValue(perfil);

    const result = await controller.getPerfil(idUser);

    expect(service.getPerfilUser).toHaveBeenCalledWith(idUser);
    expect(result).toEqual(perfil);
  });

  it('[C-007] getPerfil() -> retorna null cuando el usuario no tiene perfil asociado', async () => {
    mockUserService.getPerfilUser.mockResolvedValue(null);

    const result = await controller.getPerfil('user-sin-perfil');

    expect(result).toBeNull();
  });

  it('[C-008] getPerfil() -> retorna perfil empresa cuando el usuario es empresa', async () => {
    const idUser = 'user-empresa-1';
    const perfilEmpresa = { id: 'emp-1', nombre_empresa: 'Tech Corp' };
    mockUserService.getPerfilUser.mockResolvedValue(perfilEmpresa);

    const result = await controller.getPerfil(idUser);

    expect(service.getPerfilUser).toHaveBeenCalledWith(idUser);
    expect(result).toEqual(perfilEmpresa);
  });
});