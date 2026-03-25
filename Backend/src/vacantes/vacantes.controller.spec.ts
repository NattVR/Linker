import { Test, TestingModule } from '@nestjs/testing';
import { VacantesController } from './vacantes.controller';
import { VacantesService } from './vacantes.service';
import { CreateVacanteDto } from './dto/create-vacante.dto';
import { UpdateVacanteDto } from './dto/update-vacante.dto';

const mockVacantesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findAllVacantesofEmpresa: jest.fn(),
  getVacantes: jest.fn(),
  update: jest.fn(),
};

describe('VacantesController', () => {
  let controller: VacantesController;
  let service: typeof mockVacantesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VacantesController],
      providers: [
        { provide: VacantesService, useValue: mockVacantesService },
      ],
    }).compile();

    controller = module.get<VacantesController>(VacantesController);
    service = module.get(VacantesService);
    jest.clearAllMocks();
  });

  it('[C-001] create() -> delega en vacantesService.create() con el dto recibido', async () => {
    const dto: CreateVacanteDto = {
      titulo: 'Dev Angular',
      empresa: 'emp-uuid',
    } as any;
    const expected = { id_vacante: 'v-1', ...dto };
    mockVacantesService.create.mockResolvedValue(expected);

    const result = await controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('[C-002] findAll() -> delega en vacantesService.findAll() y retorna lista', async () => {
    const vacantes = [{ id_vacante: 'v-1' }, { id_vacante: 'v-2' }];
    mockVacantesService.findAll.mockResolvedValue(vacantes);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(vacantes);
  });

  it('[C-003] findAll() -> retorna array vacío cuando no hay vacantes', async () => {
    mockVacantesService.findAll.mockResolvedValue([]);

    const result = await controller.findAll();

    expect(result).toEqual([]);
  });

  it('[C-004] findVacantesOfEmpresa() -> delega en service con empresaId correcto', async () => {
    const empresaId = 'emp-uuid-1';
    const vacantes = [{ id_vacante: 'v-1', empresa: { id: empresaId } }];
    mockVacantesService.findAllVacantesofEmpresa.mockResolvedValue(vacantes);

    const result = await controller.findVacantesOfEmpresa(empresaId);

    expect(service.findAllVacantesofEmpresa).toHaveBeenCalledWith(empresaId);
    expect(result).toEqual(vacantes);
  });

  it('[C-005] findVacantesOfEmpresa() -> retorna [] cuando empresa no tiene vacantes', async () => {
    mockVacantesService.findAllVacantesofEmpresa.mockResolvedValue([]);

    const result = await controller.findVacantesOfEmpresa('emp-sin-vacantes');

    expect(result).toEqual([]);
  });

  it('[C-006] getVacantes() -> delega en service con postulanteId correcto', async () => {
    const postulanteId = 'post-uuid-1';
    const vacantes = [{ id_vacante: 'v-nueva' }];
    mockVacantesService.getVacantes.mockResolvedValue(vacantes);

    const result = await controller.getVacantes(postulanteId);

    expect(service.getVacantes).toHaveBeenCalledWith(postulanteId);
    expect(result).toEqual(vacantes);
  });

  it('[C-007] getVacantes() -> retorna [] cuando todas las vacantes están excluidas', async () => {
    mockVacantesService.getVacantes.mockResolvedValue([]);

    const result = await controller.getVacantes('post-uuid-2');

    expect(result).toEqual([]);
  });

  it('[C-008] update() -> delega en service con id y dto correctos', async () => {
    const id = 'v-uuid-1';
    const dto: UpdateVacanteDto = { titulo: 'Dev NestJS' } as any;
    const updated = { id_vacante: id, titulo: 'Dev NestJS' };
    mockVacantesService.update.mockResolvedValue(updated);

    const result = await controller.update(id, dto);

    expect(service.update).toHaveBeenCalledWith(id, dto);
    expect(result).toEqual(updated);
  });

  it('[C-009] update() -> propaga error cuando la vacante no existe', async () => {
    mockVacantesService.update.mockRejectedValue(new Error('Vacante no encontrada'));

    await expect(controller.update('id-inexistente', {} as any))
      .rejects.toThrow('Vacante no encontrada');
  });

  it('[C-010] controller se instancia correctamente', () => {
    expect(controller).toBeDefined();
  });

  it('[C-011] update() existe como método del controlador', () => {
    expect(typeof controller.update).toBe('function');
  });
});