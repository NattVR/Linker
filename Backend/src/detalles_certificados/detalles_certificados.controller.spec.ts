import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DetallesCertificadosController } from './detalles_certificados.controller';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { CreateDetallesCertificadoDto } from './dto/create-detalles_certificado.dto';
import { UpdateDetallesCertificadoDto } from './dto/update-detalles_certificado.dto';

describe('DetallesCertificadosController', () => {
  let controller: DetallesCertificadosController;
  let detallesCertificadosService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findAllByEmpresa: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    detallesCertificadosService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findAllByEmpresa: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DetallesCertificadosController],
      providers: [
        {
          provide: DetallesCertificadosService,
          useValue: detallesCertificadosService,
        },
      ],
    }).compile();

    controller = module.get<DetallesCertificadosController>(
      DetallesCertificadosController,
    );
  });

  it('should be defined', () => {
    // Arrange

    // Act

    // Assert
    expect(controller).toBeDefined();
  });

  it('should delegate create to the service and return the created detail', async () => {
    // Arrange
    const createDetallesCertificadoDto: CreateDetallesCertificadoDto = {
      empresa: { id: 'empresa-1' } as any,
      certificado: { id_certificado: 'cert-1' } as any,
      fecha_emision: new Date('2026-01-10'),
      fecha_caducidad: new Date('2027-01-10'),
    };
    const detalleCreado = {
      id_detalles_certificados: 'detalle-1',
      ...createDetallesCertificadoDto,
    };
    detallesCertificadosService.create.mockResolvedValue(detalleCreado);

    // Act
    const result = await controller.create(createDetallesCertificadoDto);

    // Assert
    expect(detallesCertificadosService.create).toHaveBeenCalledTimes(1);
    expect(detallesCertificadosService.create).toHaveBeenCalledWith(
      createDetallesCertificadoDto,
    );
    expect(result).toBe(detalleCreado);
  });

  it('should delegate findAll to the service and return all details', () => {
    // Arrange
    const detalles = [
      {
        id_detalles_certificados: 'detalle-1',
        empresa: { id: 'empresa-1' },
        certificado: { id_certificado: 'cert-1' },
      },
      {
        id_detalles_certificados: 'detalle-2',
        empresa: { id: 'empresa-2' },
        certificado: { id_certificado: 'cert-2' },
      },
    ];
    detallesCertificadosService.findAll.mockReturnValue(detalles);

    // Act
    const result = controller.findAll();

    // Assert
    expect(detallesCertificadosService.findAll).toHaveBeenCalledTimes(1);
    expect(detallesCertificadosService.findAll).toHaveBeenCalledWith();
    expect(result).toBe(detalles);
  });

  it('should delegate findCertificadosForEmpresa to the service with the provided id', async () => {
    // Arrange
    const empresaId = 'empresa-1';
    const detalles = [
      {
        id_detalles_certificados: 'detalle-1',
        certificado: { id_certificado: 'cert-1' },
      },
    ];
    detallesCertificadosService.findAllByEmpresa.mockResolvedValue(detalles);

    // Act
    const result = await controller.findCertificadosForEmpresa(empresaId);

    // Assert
    expect(detallesCertificadosService.findAllByEmpresa).toHaveBeenCalledTimes(1);
    expect(detallesCertificadosService.findAllByEmpresa).toHaveBeenCalledWith(
      empresaId,
    );
    expect(result).toBe(detalles);
  });

  it('should delegate update to the service and return the updated detail', async () => {
    // Arrange
    const detalleId = 'detalle-1';
    const updateDetallesCertificadoDto: UpdateDetallesCertificadoDto = {
      fecha_caducidad: new Date('2028-01-10'),
    };
    const detalleActualizado = {
      id_detalles_certificados: detalleId,
      ...updateDetallesCertificadoDto,
    };
    detallesCertificadosService.update.mockResolvedValue(detalleActualizado);

    // Act
    const result = await controller.update(
      detalleId,
      updateDetallesCertificadoDto,
    );

    // Assert
    expect(detallesCertificadosService.update).toHaveBeenCalledTimes(1);
    expect(detallesCertificadosService.update).toHaveBeenCalledWith(
      detalleId,
      updateDetallesCertificadoDto,
    );
    expect(result).toBe(detalleActualizado);
  });

  it('should propagate the service error when update fails', async () => {
    // Arrange
    const detalleId = 'detalle-inexistente';
    const updateDetallesCertificadoDto: UpdateDetallesCertificadoDto = {
      fecha_caducidad: new Date('2028-01-10'),
    };
    const error = new NotFoundException(
      `Certificado con id ${detalleId} no encontrado`,
    );
    detallesCertificadosService.update.mockRejectedValue(error);

    // Act
    const result = controller.update(detalleId, updateDetallesCertificadoDto);

    // Assert
    await expect(result).rejects.toThrow(NotFoundException);
    expect(detallesCertificadosService.update).toHaveBeenCalledWith(
      detalleId,
      updateDetallesCertificadoDto,
    );
  });

  it('should delegate remove to the service and return the deletion result', async () => {
    // Arrange
    const detalleId = 'detalle-1';
    const respuesta = {
      message: `Certificado ${detalleId} eliminado correctamente`,
    };
    detallesCertificadosService.remove.mockResolvedValue(respuesta);

    // Act
    const result = await controller.remove(detalleId);

    // Assert
    expect(detallesCertificadosService.remove).toHaveBeenCalledTimes(1);
    expect(detallesCertificadosService.remove).toHaveBeenCalledWith(detalleId);
    expect(result).toBe(respuesta);
  });

  it('should load the controller metadata when injected types are not constructors', () => {
    // Arrange
    let isolatedController: typeof DetallesCertificadosController | undefined;

    // Act
    jest.isolateModules(() => {
      jest.doMock('./detalles_certificados.service', () => ({
        DetallesCertificadosService: {},
      }));
      jest.doMock('./dto/create-detalles_certificado.dto', () => ({
        CreateDetallesCertificadoDto: {},
      }));
      jest.doMock('./dto/update-detalles_certificado.dto', () => ({
        UpdateDetallesCertificadoDto: {},
      }));

      ({
        DetallesCertificadosController: isolatedController,
      } = require('./detalles_certificados.controller'));

      jest.dontMock('./detalles_certificados.service');
      jest.dontMock('./dto/create-detalles_certificado.dto');
      jest.dontMock('./dto/update-detalles_certificado.dto');
    });

    // Assert
    expect(isolatedController).toBeDefined();
  });
});
