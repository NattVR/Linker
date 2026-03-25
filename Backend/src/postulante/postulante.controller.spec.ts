import { Test, TestingModule } from '@nestjs/testing';
import { PostulanteController } from './postulante.controller';
import { PostulanteService } from './postulante.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';

const mockPostulanteService = {
  createPostulante: jest.fn(),
  getPerfilCompleto: jest.fn(),
  limpiarPerfilPostulante: jest.fn(),
  getPostulantes: jest.fn(),
  getPostulanteById: jest.fn(),
  findAll: jest.fn(),
  updatePostulante: jest.fn(),
};

describe('PostulanteController', () => {
  let controller: PostulanteController;
  let service: typeof mockPostulanteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostulanteController],
      providers: [
        { provide: PostulanteService, useValue: mockPostulanteService },
      ],
    }).compile();

    controller = module.get<PostulanteController>(PostulanteController);
    service = module.get(PostulanteService);
    jest.clearAllMocks();
  });

  it('[C-001] register() -> delega en service.createPostulante() con dto correcto', async () => {
    const dto: CreatePostulanteDto = { name: 'Juan', lastname: 'Perez', id_perfil: 'u-1' };
    const expected = { message: 'Postulante registrado con éxito', postulante: { id: 'p-1', ...dto } };
    mockPostulanteService.createPostulante.mockResolvedValue(expected);

    const result = await controller.register(dto);

    expect(service.createPostulante).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('[C-002] register() -> propaga NotFoundException cuando el usuario no existe', async () => {
    const dto: CreatePostulanteDto = { name: 'Ana', lastname: 'Lopez', id_perfil: 'no-existe' };
    mockPostulanteService.createPostulante.mockRejectedValue(
      new Error('No se encontró el perfil de usuario asociado.')
    );

    await expect(controller.register(dto))
      .rejects.toThrow('No se encontró el perfil de usuario asociado.');
  });

  it('[C-003] getPerfilCompleto() -> delega en service con id correcto', async () => {
    const id = 'post-uuid-1';
    const perfil = { id, name: 'Juan', postulanteEstudios: [], postulanteHabilidades: [] };
    mockPostulanteService.getPerfilCompleto.mockResolvedValue(perfil);

    const result = await controller.getPerfilCompleto(id);

    expect(service.getPerfilCompleto).toHaveBeenCalledWith(id);
    expect(result).toEqual(perfil);
  });

  it('[C-004] getPerfilCompleto() -> retorna null cuando no existe el perfil', async () => {
    mockPostulanteService.getPerfilCompleto.mockResolvedValue(null);

    const result = await controller.getPerfilCompleto('id-inexistente');

    expect(result).toBeNull();
  });

  it('[C-005] limpiarPerfil() -> delega en service.limpiarPerfilPostulante() con id correcto', async () => {
    const id = 'post-uuid-1';
    const expected = { message: 'Perfil limpiado' };
    mockPostulanteService.limpiarPerfilPostulante.mockResolvedValue(expected);

    const result = await controller.limpiarPerfil(id);

    expect(service.limpiarPerfilPostulante).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('[C-006] limpiarPerfil() -> retorna "Sin registros previos" cuando no hay datos', async () => {
    mockPostulanteService.limpiarPerfilPostulante.mockResolvedValue(
      { message: 'Sin registros previos' }
    );

    const result = await controller.limpiarPerfil('post-nuevo');

    expect(result).toEqual({ message: 'Sin registros previos' });
  });

  it('[C-007] getPostulantesForEmpresa() -> delega en service.getPostulantes() con vacanteId', async () => {
    const vacanteId = 'v-uuid-1';
    const postulantes = [{ id: 'p-1', name: 'Juan' }, { id: 'p-2', name: 'Ana' }];
    mockPostulanteService.getPostulantes.mockResolvedValue(postulantes);

    const result = await controller.getPostulantesForEmpresa(vacanteId);

    expect(service.getPostulantes).toHaveBeenCalledWith(vacanteId);
    expect(result).toEqual(postulantes);
  });

  it('[C-008] getPostulantesForEmpresa() -> retorna [] cuando no hay postulantes disponibles', async () => {
    mockPostulanteService.getPostulantes.mockResolvedValue([]);

    const result = await controller.getPostulantesForEmpresa('v-sin-postulantes');

    expect(result).toEqual([]);
  });

  it('[C-009] getPostulante() -> delega en service.getPostulanteById() con id correcto', async () => {
    const id = 'post-uuid-1';
    const expected = { name: 'Juan', lastname: 'Perez' };
    mockPostulanteService.getPostulanteById.mockResolvedValue(expected);

    const result = await controller.getPostulante(id);

    expect(service.getPostulanteById).toHaveBeenCalledWith(id);
    expect(result).toEqual(expected);
  });

  it('[C-010] getPostulante() -> propaga NotFoundException cuando no existe', async () => {
    mockPostulanteService.getPostulanteById.mockRejectedValue(
      new Error('Usuario no encontrado')
    );

    await expect(controller.getPostulante('id-inexistente'))
      .rejects.toThrow('Usuario no encontrado');
  });

  it('[C-011] findAll() -> delega en service.findAll() y retorna lista completa', async () => {
    const postulantes = [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }];
    mockPostulanteService.findAll.mockResolvedValue(postulantes);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(postulantes);
  });

  it('[C-012] findAll() -> retorna [] cuando no hay postulantes registrados', async () => {
    mockPostulanteService.findAll.mockResolvedValue([]);

    const result = await controller.findAll();

    expect(result).toEqual([]);
  });

  it('[C-013] updatePostulante() -> delega en service con id y dto correctos', async () => {
    const id = 'post-uuid-1';
    const dto: CreatePostulanteDto = { name: 'Juan', lastname: 'Perez', id_perfil: 'u-1' };
    const updated = { id, años_experiencia: 3, curriculum: 'cv.pdf' };
    mockPostulanteService.updatePostulante.mockResolvedValue(updated);

    const result = await controller.updatePostulante(id, dto);

    expect(service.updatePostulante).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updated);
  });

  it('[C-014] updatePostulante() -> propaga NotFoundException cuando postulante no existe', async () => {
    const dto: CreatePostulanteDto = { name: 'X', lastname: 'Y', id_perfil: 'u-x' };
    mockPostulanteService.updatePostulante.mockRejectedValue(
      new Error('Postulante no encontrado')
    );

    await expect(controller.updatePostulante('id-inexistente', dto))
      .rejects.toThrow('Postulante no encontrado');
    expect(service.updatePostulante).toHaveBeenCalled();
  });

  it('[C-015] controller se instancia correctamente', () => {
    expect(controller).toBeDefined();
  });

  it('[C-016] updatePostulante() existe como método del controlador', () => {
    expect(typeof controller.updatePostulante).toBe('function');
  });

  it('[C-017] register() existe como método del controlador', () => {
    expect(typeof controller.register).toBe('function');
  });
});