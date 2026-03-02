// =============================================================================
// HU — Editar Certificado | Backend
// Archivo: src/detalles-certificados/detalles-certificados.service.spec.ts
// =============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DetallesCertificadosService } from './detalles_certificados.service';
import { DetallesCertificado } from './entities/detalles_certificado.entity';

describe('Editar Certificado | DetallesCertificadosService.update()', () => {
    let service: DetallesCertificadosService;
    let repoMock: jest.Mocked<{
        findOne: jest.Mock;
        save: jest.Mock;
        create: jest.Mock;
        find: jest.Mock;
        remove: jest.Mock;
    }>;

    beforeEach(async () => {
        repoMock = {
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
                    useValue: repoMock,
                },
            ],
        }).compile();

        service = module.get<DetallesCertificadosService>(DetallesCertificadosService);
    });

    // ===========================================================================
    // CAMINOS DEL DIAGRAMA DE FLUJO
    // ===========================================================================

    // ---------------------------------------------------------------------------
    // [CB1] Camino 1,2,3,4,F
    // findOne() → null → throw NotFoundException
    // ---------------------------------------------------------------------------
    it('[CB1] Camino 1,2,3,4,F — findOne retorna null → throw NotFoundException', async () => {
        repoMock.findOne.mockResolvedValue(null);

        await expect(
            service.update('uuid-inexistente', { fecha_emision: '2024-01-01' } as any)
        ).rejects.toThrow(NotFoundException);

        await expect(
            service.update('uuid-inexistente', { fecha_emision: '2024-01-01' } as any)
        ).rejects.toThrow('Certificado con id uuid-inexistente no encontrado');

        expect(repoMock.save).not.toHaveBeenCalled();
    });

    // ---------------------------------------------------------------------------
    // [CB2] Camino 1,2,3,5,6,F
    // findOne() → detalle válido → Object.assign → save() → retorna detalle actualizado
    // ---------------------------------------------------------------------------
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

        repoMock.findOne.mockResolvedValue(detalleExistente);
        repoMock.save.mockResolvedValue(detalleActualizado);

        const dto = { fecha_emision: '2024-06-01', fecha_caducidad: '2025-06-01' } as any;
        const result = await service.update('uuid-existente', dto);

        expect(repoMock.findOne).toHaveBeenCalledWith({
            where: { id_detalles_certificados: 'uuid-existente' },
            relations: ['certificado'],
        });

        expect(detalleExistente.fecha_emision).toBe('2024-06-01');
        expect(detalleExistente.fecha_caducidad).toBe('2025-06-01');

        expect(repoMock.save).toHaveBeenCalledWith(detalleExistente);

        expect(result).toEqual(detalleActualizado);
    });

    it('update() — busca por id_detalles_certificados con la relación certificado', async () => {
        repoMock.findOne.mockResolvedValue(null);

        try { await service.update('any-id', {} as any); } catch (_) { /* expected */ }

        expect(repoMock.findOne).toHaveBeenCalledWith({
            where: { id_detalles_certificados: 'any-id' },
            relations: ['certificado'],
        });
    });

    it('update() — NotFoundException contiene el id en el mensaje', async () => {
        repoMock.findOne.mockResolvedValue(null);

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

        repoMock.findOne.mockResolvedValue(detalleOriginal);
        repoMock.save.mockResolvedValue(detalleOriginal);

        await service.update('uuid-1', { fecha_emision: '2025-01-01' } as any);

        expect(detalleOriginal.fecha_emision).toBe('2025-01-01');
        expect(detalleOriginal.fecha_caducidad).toBe('2021-01-01');
        expect(detalleOriginal.certificado).toEqual({ id_certificado: 'cert-x' });
    });

    it('update() — retorna exactamente lo que devuelve save()', async () => {
        const detalle = { id_detalles_certificados: 'uuid-z' } as any;
        const savedResult = { ...detalle, fecha_emision: '2025-05-01' } as any;

        repoMock.findOne.mockResolvedValue(detalle);
        repoMock.save.mockResolvedValue(savedResult);

        const result = await service.update('uuid-z', { fecha_emision: '2025-05-01' } as any);

        expect(result).toBe(savedResult);
    });

    it('update() — no llama a save() cuando findOne retorna null', async () => {
        repoMock.findOne.mockResolvedValue(null);

        try { await service.update('no-existe', {} as any); } catch (_) { /* expected */ }

        expect(repoMock.save).not.toHaveBeenCalled();
    });
});