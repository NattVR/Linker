import { Test, TestingModule } from '@nestjs/testing';
import { PostulanteController } from './postulante.controller';
import { PostulanteService } from './postulante.service';
import { CreatePostulanteDto } from './dto/create-postulante.dto';

// Mock del servicio
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
    // Arrange - configuración del módulo
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

  // ── register ───────────────────────────────────────────────
  it('[C-001] register() -> delega en service.createPostulante() con dto correcto', async () => {
    // Arrange - Stub retorna postulante creado
    const dto: CreatePostulanteDto = { name: 'Juan', lastname: 'Perez', id_perfil: 'u-1' };
    const expected = { message: 'Postulante registrado con éxito', postulante: { id: 'p-1', ...dto } };
    mockPostulanteService.createPostulante.mockResolvedValue(expected);

    // Act
    const result = await controller.register(dto);

    // Assert
    expect(service.createPostulante).toHaveBeenCalledWith(dto);  // Mock
    expect(result).toEqual(expected);
  });

  it('[C-002] register() -> propaga NotFoundException cuando el usuario no existe', async () => {
    // Arrange - Stub simula usuario no encontrado
    const dto: CreatePostulanteDto = { name: 'Ana', lastname: 'Lopez', id_perfil: 'no-existe' };
    mockPostulanteService.createPostulante.mockRejectedValue(
      new Error('No se encontró el perfil de usuario asociado.')
    );

    // Act & Assert
    await expect(controller.register(dto))
      .rejects.toThrow('No se encontró el perfil de usuario asociado.');
  });

  // ── getPerfilCompleto ──────────────────────────────────────
  it('[C-003] getPerfilCompleto() -> delega en service con id correcto', async () => {
    // Arrange - Stub retorna perfil completo
    const id = 'post-uuid-1';
    const perfil = { id, name: 'Juan', postulanteEstudios: [], postulanteHabilidades: [] };
    mockPostulanteService.getPerfilCompleto.mockResolvedValue(perfil);

    // Act
    const result = await controller.getPerfilCompleto(id);

    // Assert
    expect(service.getPerfilCompleto).toHaveBeenCalledWith(id);  // Mock
    expect(result).toEqual(perfil);
  });

  it('[C-004] getPerfilCompleto() -> retorna null cuando no existe el perfil', async () => {
    // Arrange - Stub retorna null
    mockPostulanteService.getPerfilCompleto.mockResolvedValue(null);

    // Act
    const result = await controller.getPerfilCompleto('id-inexistente');

    // Assert
    expect(result).toBeNull();
  });

  // ── limpiarPerfil ──────────────────────────────────────────
  it('[C-005] limpiarPerfil() -> delega en service.limpiarPerfilPostulante() con id correcto', async () => {
    // Arrange - Stub retorna mensaje de éxito
    const id = 'post-uuid-1';
    const expected = { message: 'Perfil limpiado' };
    mockPostulanteService.limpiarPerfilPostulante.mockResolvedValue(expected);

    // Act
    const result = await controller.limpiarPerfil(id);

    // Assert
    expect(service.limpiarPerfilPostulante).toHaveBeenCalledWith(id);  // Mock
    expect(result).toEqual(expected);
  });

  it('[C-006] limpiarPerfil() -> retorna "Sin registros previos" cuando no hay datos', async () => {
    // Arrange
    mockPostulanteService.limpiarPerfilPostulante.mockResolvedValue(
      { message: 'Sin registros previos' }
    );

    // Act
    const result = await controller.limpiarPerfil('post-nuevo');

    // Assert
    expect(result).toEqual({ message: 'Sin registros previos' });
  });

  // ── getPostulantesForEmpresa ───────────────────────────────
  it('[C-007] getPostulantesForEmpresa() -> delega en service.getPostulantes() con vacanteId', async () => {
    // Arrange - Stub retorna lista de postulantes
    const vacanteId = 'v-uuid-1';
    const postulantes = [{ id: 'p-1', name: 'Juan' }, { id: 'p-2', name: 'Ana' }];
    mockPostulanteService.getPostulantes.mockResolvedValue(postulantes);

    // Act
    const result = await controller.getPostulantesForEmpresa(vacanteId);

    // Assert
    expect(service.getPostulantes).toHaveBeenCalledWith(vacanteId);  // Mock
    expect(result).toEqual(postulantes);
  });

  it('[C-008] getPostulantesForEmpresa() -> retorna [] cuando no hay postulantes disponibles', async () => {
    // Arrange
    mockPostulanteService.getPostulantes.mockResolvedValue([]);

    // Act
    const result = await controller.getPostulantesForEmpresa('v-sin-postulantes');

    // Assert
    expect(result).toEqual([]);
  });

  // ── getPostulante ──────────────────────────────────────────
  it('[C-009] getPostulante() -> delega en service.getPostulanteById() con id correcto', async () => {
    // Arrange - Stub retorna datos básicos
    const id = 'post-uuid-1';
    const expected = { name: 'Juan', lastname: 'Perez' };
    mockPostulanteService.getPostulanteById.mockResolvedValue(expected);

    // Act
    const result = await controller.getPostulante(id);

    // Assert
    expect(service.getPostulanteById).toHaveBeenCalledWith(id);  // Mock
    expect(result).toEqual(expected);
  });

  it('[C-010] getPostulante() -> propaga NotFoundException cuando no existe', async () => {
    // Arrange - Stub simula no encontrado
    mockPostulanteService.getPostulanteById.mockRejectedValue(
      new Error('Usuario no encontrado')
    );

    // Act & Assert
    await expect(controller.getPostulante('id-inexistente'))
      .rejects.toThrow('Usuario no encontrado');
  });

  // ── findAll ────────────────────────────────────────────────
  it('[C-011] findAll() -> delega en service.findAll() y retorna lista completa', async () => {
    // Arrange - Stub retorna todos los postulantes
    const postulantes = [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }];
    mockPostulanteService.findAll.mockResolvedValue(postulantes);

    // Act
    const result = await controller.findAll();

    // Assert
    expect(service.findAll).toHaveBeenCalledTimes(1);  // Mock
    expect(result).toEqual(postulantes);
  });

  it('[C-012] findAll() -> retorna [] cuando no hay postulantes registrados', async () => {
    // Arrange
    mockPostulanteService.findAll.mockResolvedValue([]);

    // Act
    const result = await controller.findAll();

    // Assert
    expect(result).toEqual([]);
  });

  // ── updatePostulante ───────────────────────────────────────
  it('[C-013] updatePostulante() -> delega en service con id y dto correctos', async () => {
    // Arrange - Stub retorna postulante actualizado
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
});