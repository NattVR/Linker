import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { DetallesCertificado } from './entities/detalles_certificado.entity';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';
import { UpdateDetallesCertificadoDto } from './dto/update-detalles_certificado.dto';

describe('DetallesCertificadosService', () => {
  let service: DetallesCertificadosService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };

  function buildCreateDto(): CreateDetallesCertificadoDto {
    return {
      empresa: { id: 'empresa-1' } as any,
      certificado: { id_certificado: 'cert-1' } as any,
      fecha_emision: new Date('2026-01-01'),
      fecha_caducidad: new Date('2028-01-01'),
    };
  }

  function buildDetalle(
    overrides: Partial<DetallesCertificado> = {},
  ): DetallesCertificado {
    return {
      id_detalles_certificados: 'detalle-1',
      empresa: { id: 'empresa-1' } as any,
      certificado: { id_certificado: 'cert-1' } as any,
      fecha_emision: new Date('2026-01-01') as any,
      fecha_caducidad: new Date('2028-01-01') as any,
      ...overrides,
    } as DetallesCertificado;
  }

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DetallesCertificadosService,
        {
          provide: getRepositoryToken(DetallesCertificado),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<DetallesCertificadosService>(
      DetallesCertificadosService,
    );
  });

  it('should create and persist a detalle certificado', async () => {
    // Arrange
    const dto = buildCreateDto();
    const entity = buildDetalle();
    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    // Act
    const result = await service.create(dto);

    // Assert
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toBe(entity);
  });

  it('should bubble repository save errors during create', async () => {
    // Arrange
    const dto = buildCreateDto();
    const entity = buildDetalle();
    repository.create.mockReturnValue(entity);
    repository.save.mockRejectedValue(new Error('db error'));

    // Act
    const result = service.create(dto);

    // Assert
    await expect(result).rejects.toThrow('db error');
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
  });

  it('should return all detalles with empresa and certificado relations', async () => {
    // Arrange
    const detalles = [buildDetalle(), buildDetalle({ id_detalles_certificados: 'detalle-2' })];
    repository.find.mockResolvedValue(detalles);

    // Act
    const result = await service.findAll();

    // Assert
    expect(repository.find).toHaveBeenCalledWith({
      relations: ['empresa', 'certificado'],
    });
    expect(result).toEqual(detalles);
  });

  it('should return detalles filtered by empresa id', async () => {
    // Arrange
    const detalles = [buildDetalle()];
    repository.find.mockResolvedValue(detalles);

    // Act
    const result = await service.findAllByEmpresa('empresa-1');

    // Assert
    expect(repository.find).toHaveBeenCalledWith({
      where: { empresa: { id: 'empresa-1' } },
      relations: ['certificado'],
    });
    expect(result).toEqual(detalles);
  });

  it('should update an existing detalle certificado', async () => {
    // Arrange
    const detalle = buildDetalle({
      fecha_emision: '2024-01-01' as any,
      fecha_caducidad: '2025-01-01' as any,
    });
    const updateDto: UpdateDetallesCertificadoDto = {
      fecha_emision: '2024-06-01' as any,
      fecha_caducidad: '2026-06-01' as any,
    };
    const savedDetalle = buildDetalle({
      ...detalle,
      ...updateDto,
    });
    repository.findOne.mockResolvedValue(detalle);
    repository.save.mockResolvedValue(savedDetalle);

    // Act
    const result = await service.update('detalle-1', updateDto);

    // Assert
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id_detalles_certificados: 'detalle-1' },
      relations: ['certificado'],
    });
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id_detalles_certificados: 'detalle-1',
        fecha_emision: '2024-06-01',
        fecha_caducidad: '2026-06-01',
      }),
    );
    expect(result).toBe(savedDetalle);
  });

  it('should throw NotFoundException when updating a missing detalle certificado', async () => {
    // Arrange
    repository.findOne.mockResolvedValue(null);

    // Act
    const result = service.update('missing-id', {
      fecha_emision: '2024-01-01' as any,
    });

    // Assert
    await expect(result).rejects.toThrow(NotFoundException);
    await expect(result).rejects.toThrow(
      'Certificado con id missing-id no encontrado',
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should remove an existing detalle certificado and return a success message', async () => {
    // Arrange
    const detalle = buildDetalle();
    repository.findOne.mockResolvedValue(detalle);
    repository.remove.mockResolvedValue(detalle);

    // Act
    const result = await service.remove('detalle-1');

    // Assert
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id_detalles_certificados: 'detalle-1' },
    });
    expect(repository.remove).toHaveBeenCalledWith(detalle);
    expect(result).toEqual({
      message: 'Certificado detalle-1 eliminado correctamente',
    });
  });

  it('should throw NotFoundException when removing a missing detalle certificado', async () => {
    // Arrange
    repository.findOne.mockResolvedValue(null);

    // Act
    const result = service.remove('missing-id');

    // Assert
    await expect(result).rejects.toThrow(NotFoundException);
    await expect(result).rejects.toThrow(
      'Certificado con id missing-id no encontrado',
    );
    expect(repository.remove).not.toHaveBeenCalled();
  });
});
