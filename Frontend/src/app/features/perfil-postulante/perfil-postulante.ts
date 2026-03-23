import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Alerts } from '../../shared/services/alerts';
import { Perfil } from '../../shared/services/perfil';

interface SeccionConfig {
  key: string;
  dataKey: string;
  campos: Record<string, any>;
  mapearDato: (item: any) => Record<string, any>;
}

@Component({
  selector: 'app-perfil-postulante',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './perfil-postulante.html',
  styleUrls: ['./perfil-postulante.css'],
})
export class PerfilPostulante implements OnInit {
  alert = inject(Alerts);
  postulante = inject(Perfil);
  fb = inject(FormBuilder);
  router = inject(Router);
  perfil = inject(Perfil);

  postulanteForm!: FormGroup;
  name = '';
  idPostulante = '';
  isLoading = true;

  catalogoEstudios: any[] = [];
  catalogoHabilidades: any[] = [];
  catalogoIdiomas: any[] = [];

  cvFile: File | null = null;
  certificadosEstudios: Map<number, File> = new Map();
  certificadosHabilidades: Map<number, File> = new Map();
  certificadosIdiomas: Map<number, File> = new Map();

  private readonly secciones: SeccionConfig[] = [
    {
      key: 'estudios',
      dataKey: 'postulanteEstudios',
      campos: { titulo: ['', Validators.required], nivel: ['', Validators.required], certificado: '' },
      mapearDato: (de) => ({
        titulo: de.estudio?.titulo || '',
        nivel: de.estudio?.nivel || '',
        certificado: de.certificado || ''
      })
    },
    {
      key: 'habilidades',
      dataKey: 'postulanteHabilidades',
      campos: { nombre: ['', Validators.required], certificado: '' },
      mapearDato: (ph) => ({
        nombre: ph.habilidades?.id_habilidad || '',
        certificado: ph.certificado || ''
      })
    },
    {
      key: 'idiomas',
      dataKey: 'postulanteIdiomas',
      campos: { nombre: ['', Validators.required], certificado: '' },
      mapearDato: (pi) => ({
        nombre: pi.idioma?.id_idioma || '',
        certificado: pi.certificado || ''
      })
    }
  ];

  ngOnInit() {
    this.idPostulante = sessionStorage.getItem('perfilId') || '';
    this.inicializarFormulario();
    this.cargarCatalogos();
  }

  inicializarFormulario() {
    this.postulanteForm = this.fb.group({
      experiencia: ['', Validators.required],
      cv: [''],
      estudios: this.fb.array([this.crearGrupo('estudios')]),
      habilidades: this.fb.array([this.crearGrupo('habilidades')]),
      idiomas: this.fb.array([this.crearGrupo('idiomas')])
    });
  }

  private crearGrupo(key: string): FormGroup {
    const seccion = this.secciones.find(s => s.key === key)!;
    return this.fb.group(seccion.campos);
  }

  cargarCatalogos() {
    this.postulante.getCatalogosPostulante().subscribe({
      next: (data: any) => {
        this.catalogoEstudios = data.niveles || [];
        this.catalogoHabilidades = data.habilidades || [];
        this.catalogoIdiomas = data.idiomas || [];
        this.isLoading = false;
        if (this.idPostulante) {
          this.cargarNombreUsuario();
          this.cargarPerfilCompleto();
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  private cargarNombreUsuario() {
    this.perfil.getUserNamePostulante(this.idPostulante).subscribe({
      next: (data: any) => { this.name = `${data.name} ${data.lastname}`; },
      error: (err) => console.error('Error al obtener nombre:', err)
    });
  }

  private cargarPerfilCompleto() {
    this.perfil.getPerfilCompleto(this.idPostulante).subscribe({
      next: (data: any) => {
        if (!data) return;
        this.postulanteForm.patchValue({
          experiencia: data.años_experiencia || '',
          cv: data.curriculum || ''
        });
        this.secciones.forEach(seccion => this.cargarSeccion(seccion, data));
      },
      error: (err) => console.error('Error al cargar perfil:', err)
    });
  }

  private cargarSeccion(seccion: SeccionConfig, data: any) {
    const items = data[seccion.dataKey];
    if (!items?.length) return;

    const formArray = this.getFormArray(seccion.key);
    formArray.clear();

    items.forEach((item: any) => {
      const valores = seccion.mapearDato(item);
      const grupoDef: Record<string, any> = {};

      Object.keys(seccion.campos).forEach(key => {
        const campoOriginal = seccion.campos[key];
        const valor = valores[key] ?? '';
        grupoDef[key] = Array.isArray(campoOriginal) ? [valor, campoOriginal[1]] : valor;
      });

      formArray.push(this.fb.group(grupoDef));
    });
  }

  get estudiosForm(): FormArray { return this.getFormArray('estudios'); }
  get habilidadesForm(): FormArray { return this.getFormArray('habilidades'); }
  get idiomasForm(): FormArray { return this.getFormArray('idiomas'); }

  private getFormArray(key: string): FormArray {
    return this.postulanteForm.get(key) as FormArray;
  }

  agregarItem(key: string) {
    const arr = this.getFormArray(key);
    if (arr.length < 5) arr.push(this.crearGrupo(key));
  }

  eliminarItem(key: string, index: number) {
    const arr = this.getFormArray(key);
    if (arr.length > 1) arr.removeAt(index);
  }

  agregarEstudio() { this.agregarItem('estudios'); }
  agregarHabilidad() { this.agregarItem('habilidades'); }
  agregarIdioma() { this.agregarItem('idiomas'); }
  eliminarEstudio(i: number) { this.eliminarItem('estudios', i); }
  eliminarHabilidad(i: number) { this.eliminarItem('habilidades', i); }
  eliminarIdioma(i: number) { this.eliminarItem('idiomas', i); }

  onCvChange(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.cvFile = file;
    this.postulanteForm.patchValue({ cv: file.name });
  }

  private onCertificadoChange(event: any, index: number, mapa: Map<number, File>, formArray: FormArray) {
    const file = event.target.files[0];
    if (!file) return;
    mapa.set(index, file);
    formArray.at(index).get('certificado')?.setValue(file.name);
  }

  onCertificadoEstudioChange(event: any, index: number) {
    this.onCertificadoChange(event, index, this.certificadosEstudios, this.estudiosForm);
  }
  onCertificadoHabilidadChange(event: any, index: number) {
    this.onCertificadoChange(event, index, this.certificadosHabilidades, this.habilidadesForm);
  }
  onCertificadoIdiomaChange(event: any, index: number) {
    this.onCertificadoChange(event, index, this.certificadosIdiomas, this.idiomasForm);
  }

  OnPostulante() {
    if (this.postulanteForm.invalid) {
      this.alert.error('Campos incorrectos');
      return;
    }

    const cvNombre = this.cvFile?.name ?? this.postulanteForm.get('cv')?.value;
    if (!cvNombre) {
      this.alert.error('Debe cargar su currículum');
      return;
    }

    const val = this.postulanteForm.value;

    const datosFormulario = {
      experiencia: val.experiencia,
      cv: cvNombre,
      estudios: val.estudios.map((e: any, i: number) => ({
        titulo: e.titulo,
        nivel: e.nivel,
        certificado: this.certificadosEstudios.get(i)?.name ?? e.certificado ?? null
      })),
      habilidades: val.habilidades.map((h: any, i: number) => ({
        id: h.nombre,
        certificado: this.certificadosHabilidades.get(i)?.name ?? h.certificado ?? null
      })),
      idiomas: val.idiomas.map((id: any, i: number) => ({
        id: id.nombre,
        certificado: this.certificadosIdiomas.get(i)?.name ?? id.certificado ?? null
      }))
    };

    this.postulante.guardarPerfilPostulante(this.idPostulante, datosFormulario).subscribe({
      next: () => {
        this.alert.success('Perfil guardado exitosamente');
        this.router.navigate(['/match']);
      },
      error: () => this.alert.error('Error al guardar el perfil')
    });
  }
}