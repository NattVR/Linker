import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EmpresaController } from './empresa.controller';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

describe('EmpresaController', () => {
  let controller: EmpresaController;
  let empresaService: {
    findAll: jest.Mock;
    createEmpresa: jest.Mock;
    getEmpresaById: jest.Mock;
    isEmpresa: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    empresaService = {
      findAll: jest.fn(),
      createEmpresa: jest.fn(),
      getEmpresaById: jest.fn(),
      isEmpresa: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmpresaController],
      providers: [
        {
          provide: EmpresaService,
          useValue: empresaService,
        },
      ],
    }).compile();

    controller = module.get<EmpresaController>(EmpresaController);
  });

  it('should be defined', () => {
    // Arrange

    // Act

    // Assert
    expect(controller).toBeDefined();
  });

  it('should delegate findAll to the service and return the empresas', () => {
    // Arrange
    const empresas = [
      { id: 'emp-1', name_empresa: 'Empresa Uno' },
      { id: 'emp-2', name_empresa: 'Empresa Dos' },
    ];
    empresaService.findAll.mockReturnValue(empresas);

    // Act
    const result = controller.findAll();

    // Assert
    expect(empresaService.findAll).toHaveBeenCalledTimes(1);
    expect(empresaService.findAll).toHaveBeenCalledWith();
    expect(result).toBe(empresas);
  });

  it('should delegate register to the service and return the created empresa', async () => {
    // Arrange
    const createEmpresaDto: CreateEmpresaDto = {
      id_perfil: 'user-1',
      name_empresa: 'Empresa Nueva',
      descripcion: 'Descripcion',
      ubicacion: 'Bogota',
      sector: 'Tecnologia',
      foto: 'empresa.png',
      NIT: '900123456',
    };
    const respuesta = {
      message: 'Empresa registrada con éxito',
      empresa: {
        id: 'emp-1',
        ...createEmpresaDto,
      },
    };
    empresaService.createEmpresa.mockResolvedValue(respuesta);

    // Act
    const result = await controller.register(createEmpresaDto);

    // Assert
    expect(empresaService.createEmpresa).toHaveBeenCalledTimes(1);
    expect(empresaService.createEmpresa).toHaveBeenCalledWith(createEmpresaDto);
    expect(result).toBe(respuesta);
  });

  it('should delegate getEmpresa to the service with the provided id', async () => {
    // Arrange
    const empresaId = 'user-1';
    const empresa = {
      id: 'emp-1',
      name_empresa: 'Empresa Demo',
      user: { id: empresaId },
    };
    empresaService.getEmpresaById.mockResolvedValue(empresa);

    // Act
    const result = await controller.getEmpresa(empresaId);

    // Assert
    expect(empresaService.getEmpresaById).toHaveBeenCalledTimes(1);
    expect(empresaService.getEmpresaById).toHaveBeenCalledWith(empresaId);
    expect(result).toBe(empresa);
  });

  it('should delegate isEmpresa to the service with the provided id', async () => {
    // Arrange
    const empresaId = 'user-1';
    empresaService.isEmpresa.mockResolvedValue(true);

    // Act
    const result = await controller.isEmpresa(empresaId);

    // Assert
    expect(empresaService.isEmpresa).toHaveBeenCalledTimes(1);
    expect(empresaService.isEmpresa).toHaveBeenCalledWith(empresaId);
    expect(result).toBe(true);
  });

  it('should delegate update to the service and return the updated empresa', async () => {
    // Arrange
    const empresaId = 'user-1';
    const updateEmpresaDto: UpdateEmpresaDto = {
      name_empresa: 'Empresa Actualizada',
      ubicacion: 'Medellin',
    };
    const empresaActualizada = {
      id: 'emp-1',
      ...updateEmpresaDto,
    };
    empresaService.update.mockResolvedValue(empresaActualizada);

    // Act
    const result = await controller.update(empresaId, updateEmpresaDto);

    // Assert
    expect(empresaService.update).toHaveBeenCalledTimes(1);
    expect(empresaService.update).toHaveBeenCalledWith(
      empresaId,
      updateEmpresaDto,
    );
    expect(result).toBe(empresaActualizada);
  });

  it('should propagate the service error when update fails', async () => {
    // Arrange
    const empresaId = 'user-inexistente';
    const updateEmpresaDto: UpdateEmpresaDto = {
      name_empresa: 'Empresa Inexistente',
    };
    const error = new NotFoundException('Empresa no encontrada');
    empresaService.update.mockRejectedValue(error);

    // Act
    const result = controller.update(empresaId, updateEmpresaDto);

    // Assert
    await expect(result).rejects.toThrow(NotFoundException);
    expect(empresaService.update).toHaveBeenCalledWith(
      empresaId,
      updateEmpresaDto,
    );
  });
});
