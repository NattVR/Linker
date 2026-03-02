import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CertificadosService } from './certificados.service';
import { Certificado } from './entities/certificado.entity';

describe('CertificadosService', () => {
  let service: CertificadosService;
  let repository: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificadosService,
        {
          provide: getRepositoryToken(Certificado),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CertificadosService>(CertificadosService);
  });

  it('findAll todos los certificados del repository', async () => {
    const certificados = [
      { id_certificado: '1', nombre_certificado: 'AWS SAA' },
      { id_certificado: '2', nombre_certificado: 'AZ-900' },
    ];
    repository.find.mockResolvedValue(certificados);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(certificados);
  });

  it('findAll return [] repository vacio', async () => {
    repository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('findAll throw error', async () => {
    repository.find.mockRejectedValue(new Error('Database error'));

    await expect(service.findAll()).rejects.toThrow('Database error');
    expect(repository.find).toHaveBeenCalledTimes(1);
  });
});
