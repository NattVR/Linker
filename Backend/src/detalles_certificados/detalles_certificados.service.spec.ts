import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { DetallesCertificado } from './entities/detalles_certificado.entity';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';

describe('DetallesCertificadosService', () => {
  let service: DetallesCertificadosService;
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
});
