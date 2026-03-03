import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { Alerts } from '../../shared/services/alerts';
import { Perfil } from '../../shared/services/perfil';

@Component({
  selector: 'app-perfil-postulante',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule],
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
  name: string = '';
  idPostulante: string = '';
  isLoading: boolean = true;

  catalogoEstudios: any[] = [];
  catalogoHabilidades: any[] = [];
  catalogoIdiomas: any[] = [];

  cvFile: File | null = null;
  certificadosEstudios: Map<number, File> = new Map();
  certificadosHabilidades: Map<number, File> = new Map();
  certificadosIdiomas: Map<number, File> = new Map();

  ngOnInit() {
    this.idPostulante = sessionStorage.getItem('perfilId') || '';
    this.inicializarFormulario();
    this.cargarCatalogos();

    if (this.idPostulante) {
      this.perfil.getUserNamePostulante(this.idPostulante).subscribe({
        next: (data: any) => {
          this.name = `${data.name} ${data.lastname}`;
        },
        error: (err: any) => console.error('Error al obtener nombre:', err),
      });

      this.perfil.getPerfilCompleto(this.idPostulante).subscribe({
        next: (data: any) => {
          console.log('DATA PERFIL:', JSON.stringify(data, null, 2));
          if (!data) return;

          this.postulanteForm.patchValue({
            experiencia: data.años_experiencia || '',
            cv: data.curriculum || ''
          });

          if (data.curriculum) {
            this.postulanteForm.patchValue({ cv: data.curriculum });
          }

          if (data.postulanteEstudios?.length) {
            this.estudiosForm.clear();
            data.postulanteEstudios.forEach((de: any) => {
              this.estudiosForm.push(this.fb.group({
                titulo: [de.estudio?.titulo || '', Validators.required],
                nivel: [de.estudio?.nivel || '', Validators.required],
                certificado: [de.certificado || '']
              }));
            });
          }

          if (data.postulanteHabilidades?.length) {
            this.habilidadesForm.clear();
            data.postulanteHabilidades.forEach((ph: any) => {
              this.habilidadesForm.push(this.fb.group({
                nombre: [ph.habilidades?.id_habilidad || '', Validators.required],
                certificado: [ph.certificado || '']
              }));
            });
          }

          if (data.postulanteIdiomas?.length) {
            this.idiomasForm.clear();
            data.postulanteIdiomas.forEach((pi: any) => {
              this.idiomasForm.push(this.fb.group({
                nombre: [pi.idioma?.id_idioma || '', Validators.required],
                certificado: [pi.certificado || '']
              }));
            });
          }
        },
        error: (err: any) => console.error('Error al cargar perfil:', err)
      });
    }
  }

  inicializarFormulario() {
    this.postulanteForm = this.fb.group({
      experiencia: ['', Validators.required],
      cv: [''],
      estudios: this.fb.array([this.crearEstudio()]),
      habilidades: this.fb.array([this.crearHabilidad()]),
      idiomas: this.fb.array([this.crearIdioma()])
    });
  }

  cargarCatalogos() {
    this.postulante.getCatalogosPostulante().subscribe({
      next: (data: any) => {
        console.log('Catálogos cargados:', data);
        this.catalogoEstudios = data.niveles || [];
        this.catalogoHabilidades = data.habilidades || [];
        this.catalogoIdiomas = data.idiomas || [];
        console.log('Habilidades disponibles:', this.catalogoHabilidades);
        console.log('Idiomas disponibles:', this.catalogoIdiomas);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar catálogos:', err);
        this.isLoading = false;
      },
    });
  }

  get estudiosForm(): FormArray {
    return this.postulanteForm.get('estudios') as FormArray;
  }
  get habilidadesForm(): FormArray {
    return this.postulanteForm.get('habilidades') as FormArray;
  }
  get idiomasForm(): FormArray {
    return this.postulanteForm.get('idiomas') as FormArray;
  }

  crearEstudio() {
    return this.fb.group({
      titulo: ['', Validators.required],
      nivel: ['', Validators.required],
      certificado: '',
    });
  }

  crearHabilidad() {
    return this.fb.group({
      nombre: ['', Validators.required],
      certificado: '',
    });
  }

  crearIdioma() {
    return this.fb.group({
      nombre: ['', Validators.required],
      certificado: '',
    });
  }

  agregarEstudio() {
    if (this.estudiosForm.length < 5) {
      this.estudiosForm.push(this.crearEstudio());
    }
  }

  agregarHabilidad() {
    if (this.habilidadesForm.length < 5) {
      this.habilidadesForm.push(this.crearHabilidad());
    }
  }

  agregarIdioma() {
    if (this.idiomasForm.length < 5) {
      this.idiomasForm.push(this.crearIdioma());
    }
  }

  eliminarEstudio(index: number) {
    if (this.estudiosForm.length > 1) {
      this.estudiosForm.removeAt(index);
    }
  }

  eliminarHabilidad(index: number) {
    if (this.habilidadesForm.length > 1) {
      this.habilidadesForm.removeAt(index);
    }
  }

  eliminarIdioma(index: number) {
    if (this.idiomasForm.length > 1) {
      this.idiomasForm.removeAt(index);
    }
  }

  onCvChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.cvFile = file;
      this.postulanteForm.patchValue({ cv: file.name });
    }
  }

  onCertificadoEstudioChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.certificadosEstudios.set(index, file);
      const control = this.estudiosForm.at(index).get('certificado');
      if (control) {
        control.setValue(file.name);
      }
    }
  }

  onCertificadoHabilidadChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.certificadosHabilidades.set(index, file);
      const control = this.habilidadesForm.at(index).get('certificado');
      if (control) {
        control.setValue(file.name);
      }
    }
  }

  onCertificadoIdiomaChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.certificadosIdiomas.set(index, file);
      const control = this.idiomasForm.at(index).get('certificado');
      if (control) {
        control.setValue(file.name);
      }
    }
  }

  OnPostulante() {
    if (this.postulanteForm.invalid) {
      this.alert.error('Campos incorrectos');
      return;
    }

    // Permite CV ya guardado anteriormente
    const cvNombre = this.cvFile ? this.cvFile.name : this.postulanteForm.get('cv')?.value;
    if (!cvNombre) {
      this.alert.error('Debe cargar su currículum');
      return;
    }

    const datosFormulario = {
      experiencia: this.postulanteForm.value.experiencia,
      cv: cvNombre,
      estudios: this.postulanteForm.value.estudios.map((estudio: any, index: number) => {
        const certificadoFile = this.certificadosEstudios.get(index);
        return {
          titulo: estudio.titulo,
          nivel: estudio.nivel,
          certificado: certificadoFile ? certificadoFile.name : estudio.certificado || null
        };
      }),
      habilidades: this.postulanteForm.value.habilidades.map((habilidad: any, index: number) => {
        const certificadoFile = this.certificadosHabilidades.get(index);
        return {
          id: habilidad.nombre,
          certificado: certificadoFile ? certificadoFile.name : habilidad.certificado || null
        };
      }),
      idiomas: this.postulanteForm.value.idiomas.map((idioma: any, index: number) => {
        const certificadoFile = this.certificadosIdiomas.get(index);
        return {
          id: idioma.nombre,
          certificado: certificadoFile ? certificadoFile.name : idioma.certificado || null
        };
      })
    };

    this.postulante.guardarPerfilPostulante(this.idPostulante, datosFormulario).subscribe({
      next: (response) => {
        this.alert.success('Perfil guardado exitosamente');
        this.router.navigate(['/match']);
      },
      error: (error) => {
        this.alert.error('Error al guardar el perfil');
      }
    });
  }

  /*const response = this.postulante.guardarPerfil(perfil);

  if (!!response.success) {
    this.alert.success(response.message);
    this.router.navigate(['/match']);
  } else {
    this.alert.error(response.message);
  }*/

}
