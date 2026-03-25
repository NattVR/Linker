import { Test, TestingModule } from '@nestjs/testing';
import { CertificadosController } from './certificados.controller';
import { CertificadosService } from './certificados.service';
import { CreateCertificadoDto } from './dto/create-certificado.dto';

describe('CertificadosController', () => {
  let controller: CertificadosController;
  let certificadosService: {
    create: jest.Mock;
    findAll: jest.Mock;
  };

  beforeEach(async () => {
    certificadosService = {
      create: jest.fn(),
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CertificadosController],
      providers: [
        {
          provide: CertificadosService,
          useValue: certificadosService,
        },
      ],
    }).compile();

    controller = module.get<CertificadosController>(CertificadosController);
  });

  it('should be defined', () => {
    // Arrange

    // Act

    // Assert
    expect(controller).toBeDefined();
  });

  it('should delegate create to the service and return the created certificado', () => {
    // Arrange
    const createCertificadoDto: CreateCertificadoDto = {
      entidad_emisora: 'Coursera',
      nombre_certificado: 'Angular Avanzado',
    };
    const certificadoCreado = {
      id_certificado: 'cert-1',
      ...createCertificadoDto,
    };
    certificadosService.create.mockReturnValue(certificadoCreado);

    // Act
    const result = controller.create(createCertificadoDto);

    // Assert
    expect(certificadosService.create).toHaveBeenCalledTimes(1);
    expect(certificadosService.create).toHaveBeenCalledWith(createCertificadoDto);
    expect(result).toBe(certificadoCreado);
  });

  it('should propagate service errors during create', () => {
    // Arrange
    const createCertificadoDto: CreateCertificadoDto = {
      entidad_emisora: 'Coursera',
      nombre_certificado: 'Angular Avanzado',
    };
    const error = new Error('create failed');
    certificadosService.create.mockImplementation(() => {
      throw error;
    });

    // Act
    const create = () => controller.create(createCertificadoDto);

    // Assert
    expect(create).toThrow(error);
    expect(certificadosService.create).toHaveBeenCalledWith(createCertificadoDto);
  });

  it('should delegate findAll to the service and return the available certificados', () => {
    // Arrange
    const certificados = [
      {
        id_certificado: 'cert-1',
        entidad_emisora: 'Coursera',
        nombre_certificado: 'Angular Avanzado',
      },
      {
        id_certificado: 'cert-2',
        entidad_emisora: 'Platzi',
        nombre_certificado: 'NestJS Profesional',
      },
    ];
    certificadosService.findAll.mockReturnValue(certificados);

    // Act
    const result = controller.findAll();

    // Assert
    expect(certificadosService.findAll).toHaveBeenCalledTimes(1);
    expect(certificadosService.findAll).toHaveBeenCalledWith();
    expect(result).toBe(certificados);
  });

  it('should propagate service errors during findAll', () => {
    // Arrange
    const error = new Error('find failed');
    certificadosService.findAll.mockImplementation(() => {
      throw error;
    });

    // Act
    const findAll = () => controller.findAll();

    // Assert
    expect(findAll).toThrow(error);
    expect(certificadosService.findAll).toHaveBeenCalledWith();
  });

  it('should load the controller metadata when injected types are not constructors', () => {
    // Arrange
    let isolatedController: typeof CertificadosController | undefined;

    // Act
    jest.isolateModules(() => {
      jest.doMock('./certificados.service', () => ({
        CertificadosService: {},
      }));
      jest.doMock('./dto/create-certificado.dto', () => ({
        CreateCertificadoDto: {},
      }));

      ({
        CertificadosController: isolatedController,
      } = require('./certificados.controller'));

      jest.dontMock('./certificados.service');
      jest.dontMock('./dto/create-certificado.dto');
    });

    // Assert
    expect(isolatedController).toBeDefined();
  });
});
