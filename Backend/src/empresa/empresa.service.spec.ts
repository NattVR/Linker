import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { User } from 'src/user/entities/user.entity';
import { EmpresaService } from './empresa.service';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

describe('EmpresaService', () => {
  let service: EmpresaService;
  let empresaRepository: {
    save: jest.Mock;
    merge: jest.Mock;
  };

  beforeEach(async () => {
    empresaRepository = {
      save: jest.fn(),
      merge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmpresaService,
        {
          provide: getRepositoryToken(Empresa),
          useValue: empresaRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EmpresaService>(EmpresaService);
  });

  it('update  throw NotFoundException cuando empresa no existe', async () => {
    const id = 'user-id-1';
    const dto: UpdateEmpresaDto = { name_empresa: 'Empresa Editada' };
    jest.spyOn(service, 'getEmpresaById').mockResolvedValue(null);

    await expect(service.update(id, dto)).rejects.toThrow(
      new NotFoundException('Empresa no encontrada')
    );
    expect(empresaRepository.merge).not.toHaveBeenCalled();
    expect(empresaRepository.save).not.toHaveBeenCalled();
  });

  it('update merge y save cuando empresa existe', async () => {
    const id = 'empresa-id-1';
    const dto: UpdateEmpresaDto = {
      name_empresa: 'Empresa Actualizada',
      sector: 'Tecnologia',
    };

    const existingEmpresa = {
      id: 'empresa-id-1',
      name_empresa: 'Empresa Inicial',
      sector: 'Software',
    } as Empresa;

    const mergedEmpresa = {
      ...existingEmpresa,
      ...dto,
    } as Empresa;

    jest.spyOn(service, 'getEmpresaById').mockResolvedValue(existingEmpresa);
    empresaRepository.merge.mockReturnValue(mergedEmpresa);
    empresaRepository.save.mockResolvedValue(mergedEmpresa);

    const result = await service.update(id, dto);

    expect(service.getEmpresaById).toHaveBeenCalledWith(id);
    expect(empresaRepository.merge).toHaveBeenCalledWith(existingEmpresa, dto);
    expect(empresaRepository.save).toHaveBeenCalledWith(mergedEmpresa);
    expect(result).toEqual(mergedEmpresa);
  });
});
