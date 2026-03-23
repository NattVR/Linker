import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CertificadosService } from './certificados.service';
import { Certificado } from './entities/certificado.entity';
import { CreateCertificadoDto } from './dto/create-certificado.dto';

describe('CertificadosService', () => {
  let service: CertificadosService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };

  function buildCertificado(
    overrides: Partial<Certificado> = {},
  ): Certificado {
    return {
      id_certificado: 'cert-1',
      entidad_emisora: 'AWS',
      nombre_certificado: 'Solutions Architect Associate',
      detallesCertificados: [],
      ...overrides,
    };
  }

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
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

  it('should create and persist a certificado', () => {
    // Arrange
    const createCertificadoDto: CreateCertificadoDto = {
      entidad_emisora: 'AWS',
      nombre_certificado: 'Solutions Architect Associate',
    };
    const certificadoEntity = buildCertificado();
    repository.create.mockReturnValue(certificadoEntity);

    // Act
    const result = service.create(createCertificadoDto);

    // Assert
    expect(repository.create).toHaveBeenCalledWith(createCertificadoDto);
    expect(repository.save).toHaveBeenCalledWith(certificadoEntity);
    expect(result).toBe(certificadoEntity);
  });

  it('should return all certificados from the repository', async () => {
    // Arrange
    const certificados = [
      buildCertificado(),
      buildCertificado({
        id_certificado: 'cert-2',
        entidad_emisora: 'Microsoft',
        nombre_certificado: 'AZ-900',
      }),
    ];
    repository.find.mockResolvedValue(certificados);

    // Act
    const result = await service.findAll();

    // Assert
    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual(certificados);
  });

  it('should return an empty array when the repository has no certificados', async () => {
    // Arrange
    repository.find.mockResolvedValue([]);

    // Act
    const result = await service.findAll();

    // Assert
    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it('should bubble repository errors when findAll fails', async () => {
    // Arrange
    repository.find.mockRejectedValue(new Error('Database error'));

    // Act
    const result = service.findAll();

    // Assert
    await expect(result).rejects.toThrow('Database error');
    expect(repository.find).toHaveBeenCalledTimes(1);
  });
});
