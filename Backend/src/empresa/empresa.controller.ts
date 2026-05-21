import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
} from '@nestjs/common';
import {
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { EmpresaService } from './empresa.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';

@ApiTags('Empresa')
@Controller('empresa')
export class EmpresaController {
  constructor(private readonly empresaService: EmpresaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  @ApiOkResponse({
    description: 'Empresas encontradas',
    schema: {
      example: [
        {
          id: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8',
          name_empresa: 'Linker S.A.S.',
          NIT: '900123456-7',
        },
      ],
    },
  })
  findAll() {
    return this.empresaService.findAll();
  }

  @Post('registro')
  @ApiOperation({ summary: 'Registrar empresa' })
  @ApiBody({ type: CreateEmpresaDto })
  @ApiOkResponse({
    description: 'Empresa registrada',
    schema: {
      example: {
        message: 'Empresa registrada con éxito',
        empresa: {
          id: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8',
          name_empresa: 'Linker S.A.S.',
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No se encontró el perfil de usuario asociado' })
  async register(@Body() createEmpresaDto: CreateEmpresaDto) {
    return this.empresaService.createEmpresa(createEmpresaDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar empresa por ID de usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario asociado' })
  @ApiOkResponse({
    description: 'Empresa encontrada o null',
    schema: {
      nullable: true,
      example: {
        id: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8',
        name_empresa: 'Linker S.A.S.',
        sector: 'Tecnologia',
      },
    },
  })
  async getEmpresa(@Param('id') id: string) {
    return this.empresaService.getEmpresaById(id);
  }

  @Get('isEmpresa/:id')
  @ApiOperation({ summary: 'Validar si el usuario es empresa' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiOkResponse({
    description: 'Resultado de validación',
    schema: { example: true },
  })
  async isEmpresa(@Param('id') id: string) {
    return this.empresaService.isEmpresa(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar empresa por ID de usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario asociado' })
  @ApiBody({ type: UpdateEmpresaDto })
  @ApiOkResponse({
    description: 'Empresa actualizada',
    schema: {
      example: {
        id: 'f4f9bdf3-80a8-4f04-9f9a-e6e5c99f43b8',
        name_empresa: 'Linker S.A.S.',
        ubicacion: 'Bogota',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Empresa no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() updateEmpresaDto: UpdateEmpresaDto){
    return this.empresaService.update(id, updateEmpresaDto);
  }
}
