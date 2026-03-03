import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { DetallesCertificado } from './entities/detalles_certificado.entity';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';
import { NotFoundException } from '@nestjs/common';

describe('DetallesCertificadosService', () => {
  let service: DetallesCertificadosService;
  let repository: {
     findOne: jest.Mock;
      save: jest.Mock;
        create: jest.Mock;
        find: jest.Mock;
        remove: jest.Mock;
    
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
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

    service = module.get<DetallesCertificadosService>(DetallesCertificadosService);
  });

  it('create DetallesCertificado', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa1' } as any,
      certificado: { id_certificado: '1' } as any,
      fecha_emision: new Date('2026-01-01'),
      fecha_caducidad: new Date('2028-01-01'),
    };

    const entity = {
      id_detalles_certificados: 'det-1',
      ...dto,
    } as DetallesCertificado;

    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    const result = await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(result).toEqual(entity);
  });

  it('create .save error', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-2' } as any,
      certificado: { id_certificado: 'cert-2' } as any,
      fecha_emision: new Date('2026-02-01'),
      fecha_caducidad: new Date('2028-02-01'),
    };

    const entity = { ...dto } as DetallesCertificado;
    repository.create.mockReturnValue(entity);
    repository.save.mockRejectedValue(new Error('db error'));

    await expect(service.create(dto)).rejects.toThrow('db error');
    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
  });

  it('create .create error', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-3' } as any,
      certificado: { id_certificado: 'cert-3' } as any,
      fecha_emision: new Date('2026-03-01'),
      fecha_caducidad: new Date('2028-03-01'),
    };

    repository.create.mockImplementation(() => {
      throw new Error('create error');
    });

    await expect(service.create(dto)).rejects.toThrow('create error');
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('create retorna exactamente lo que devuelve save', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-4' } as any,
      certificado: { id_certificado: 'cert-4' } as any,
      fecha_emision: new Date('2026-04-01'),
      fecha_caducidad: new Date('2028-04-01'),
    };

    const createdEntity = { ...dto } as DetallesCertificado;
    const savedEntity = {
      id_detalles_certificados: 'det-4',
      ...dto,
      extra: 'from-save',
    } as any;

    repository.create.mockReturnValue(createdEntity);
    repository.save.mockResolvedValue(savedEntity);

    const result = await service.create(dto);

    expect(result).toBe(savedEntity);
  });

  it('create llama primero a repository.create y luego a repository.save', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-5' } as any,
      certificado: { id_certificado: 'cert-5' } as any,
      fecha_emision: new Date('2026-05-01'),
      fecha_caducidad: new Date('2028-05-01'),
    };
    const entity = { ...dto } as DetallesCertificado;

    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith(dto);
    expect(repository.save).toHaveBeenCalledWith(entity);
    expect(repository.create.mock.invocationCallOrder[0]).toBeLessThan(
      repository.save.mock.invocationCallOrder[0],
    );
  });

  it('create no muta el dto de entrada', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-6' } as any,
      certificado: { id_certificado: 'cert-6' } as any,
      fecha_emision: new Date('2026-06-01'),
      fecha_caducidad: new Date('2028-06-01'),
    };
    const snapshot = JSON.parse(JSON.stringify(dto));
    const entity = { ...dto } as DetallesCertificado;

    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await service.create(dto);

    expect(JSON.parse(JSON.stringify(dto))).toEqual(snapshot);
  });

  it('create con relaciones minimas por id las envia intactas a repository.create', async () => {
    const dto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-min' } as any,
      certificado: { id_certificado: 'cert-min' } as any,
      fecha_emision: new Date('2026-07-01'),
      fecha_caducidad: new Date('2028-07-01'),
    };
    const entity = { ...dto } as DetallesCertificado;

    repository.create.mockReturnValue(entity);
    repository.save.mockResolvedValue(entity);

    await service.create(dto);

    expect(repository.create).toHaveBeenCalledWith({
      empresa: { id: 'empresa-min' },
      certificado: { id_certificado: 'cert-min' },
      fecha_emision: new Date('2026-07-01'),
      fecha_caducidad: new Date('2028-07-01'),
    });
  });

  //TEPHO

   it('[CB1] Camino 1,2,3,4,F — findOne retorna null → throw NotFoundException', async () => {
          repository.findOne.mockResolvedValue(null);
  
          await expect(
              service.update('uuid-inexistente', { fecha_emision: '2024-01-01' } as any)
          ).rejects.toThrow(NotFoundException);
  
          await expect(
              service.update('uuid-inexistente', { fecha_emision: '2024-01-01' } as any)
          ).rejects.toThrow('Certificado con id uuid-inexistente no encontrado');
  
          expect(repository.save).not.toHaveBeenCalled();
      });

    it('[CB2] Camino 1,2,3,5,6,F — findOne retorna detalle → Object.assign + save() → retorna detalle actualizado', async () => {
        const detalleExistente = {
            id_detalles_certificados: 'uuid-existente',
            fecha_emision: '2023-01-01',
            fecha_caducidad: '2024-01-01',
            certificado: { id_certificado: 'cert-1', nombre: 'AWS' },
        } as any;

        const detalleActualizado = {
            ...detalleExistente,
            fecha_emision: '2024-06-01',
            fecha_caducidad: '2025-06-01',
        };

        repository.findOne.mockResolvedValue(detalleExistente);
        repository.save.mockResolvedValue(detalleActualizado);

        const dto = { fecha_emision: '2024-06-01', fecha_caducidad: '2025-06-01' } as any;
        const result = await service.update('uuid-existente', dto);

        expect(repository.findOne).toHaveBeenCalledWith({
            where: { id_detalles_certificados: 'uuid-existente' },
            relations: ['certificado'],
        });

        expect(detalleExistente.fecha_emision).toBe('2024-06-01');
        expect(detalleExistente.fecha_caducidad).toBe('2025-06-01');

        expect(repository.save).toHaveBeenCalledWith(detalleExistente);

        expect(result).toEqual(detalleActualizado);
    });

    it('update() — busca por id_detalles_certificados con la relación certificado', async () => {
        repository.findOne.mockResolvedValue(null);

        try { await service.update('any-id', {} as any); } catch (_) { /* expected */ }

        expect(repository.findOne).toHaveBeenCalledWith({
            where: { id_detalles_certificados: 'any-id' },
            relations: ['certificado'],
        });
    });

    it('update() — NotFoundException contiene el id en el mensaje', async () => {
        repository.findOne.mockResolvedValue(null);

        await expect(service.update('mi-id-especial', {} as any))
            .rejects.toThrow('Certificado con id mi-id-especial no encontrado');
    });

    it('update() — Object.assign solo sobreescribe las propiedades del DTO, preserva las demás', async () => {
        const detalleOriginal = {
            id_detalles_certificados: 'uuid-1',
            fecha_emision: '2020-01-01',
            fecha_caducidad: '2021-01-01',
            certificado: { id_certificado: 'cert-x' },
        } as any;

        repository.findOne.mockResolvedValue(detalleOriginal);
        repository.save.mockResolvedValue(detalleOriginal);

        await service.update('uuid-1', { fecha_emision: '2025-01-01' } as any);

        expect(detalleOriginal.fecha_emision).toBe('2025-01-01');
        expect(detalleOriginal.fecha_caducidad).toBe('2021-01-01');
        expect(detalleOriginal.certificado).toEqual({ id_certificado: 'cert-x' });
    });

    it('update() — retorna exactamente lo que devuelve save()', async () => {
        const detalle = { id_detalles_certificados: 'uuid-z' } as any;
        const savedResult = { ...detalle, fecha_emision: '2025-05-01' } as any;

        repository.findOne.mockResolvedValue(detalle);
        repository.save.mockResolvedValue(savedResult);

        const result = await service.update('uuid-z', { fecha_emision: '2025-05-01' } as any);

        expect(result).toBe(savedResult);
    });

    it('update() — no llama a save() cuando findOne retorna null', async () => {
        repository.findOne.mockResolvedValue(null);

        try { await service.update('no-existe', {} as any); } catch (_) { /* expected */ }

        expect(repository.save).not.toHaveBeenCalled();
    });
});
