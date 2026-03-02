import { Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Alerts } from '../../shared/services/alerts';
import { Perfil } from '../../shared/services/perfil';
import { PerfilVacantes } from './perfil-vacantes/perfil-vacantes';
import { PerfilEmpresaCertificados } from "./perfil-empresa-certificados/perfil-empresa-certificados";

@Component({
  selector: 'app-perfil-empresa',
  standalone: true,
  imports: [ReactiveFormsModule, PerfilVacantes, PerfilEmpresaCertificados],
  templateUrl: './perfil-empresa.html',
  styleUrl: './perfil-empresa.css',
})
export class PerfilEmpresa {
  alert = inject(Alerts);
  empresa = inject(Perfil);
  fb = inject(FormBuilder);
  router = inject(Router);
  name_empresa = '';
  sector = '';
  ubicacion = '';
  descripcion = '';

  perfilEmpresa: FormGroup= this.fb.group({
    name_empresa: ['', Validators.required],
    sector: ['', Validators.required],
    ubicacion: ['', Validators.required],
    descripcion: ['', Validators.required],

    //vacantes: this.fb.array([this.crearVacante()]),
  //certificados: this.fb.array([this.crearCertificado()]),
  });

  activeTab: 'vacantes' | 'certificados' | 'estadisticas' = 'vacantes';

  activeTabEmpresa: 'perfil' | 'editar_perfil' = 'perfil';

  setActiveTab(tab: 'vacantes' | 'certificados' | 'estadisticas') {
    this.activeTab = tab;
  }

  setActiveTabEmpresa(tab: 'perfil' | 'editar_perfil') {
    this.activeTabEmpresa = tab;
  }

  ngOnInit() {
    this.cargarDatosEmpresa();
  }

  cargarDatosEmpresa() {
    const id = sessionStorage.getItem('userId');

    if (id) {
      this.empresa.getEmpresa(id).subscribe({
        next: (data:Empresa ) => {
          this.name_empresa = data.name_empresa;
          this.sector = data.sector;
          this.ubicacion = data.ubicacion;
          this.descripcion = data.descripcion;
          console.log(data,'desde perfil empresa component');
          },
        error: (err) => console.error('Error al obtener empresa:', err),
      });
    }
  }

  updateEmpresa() {
    const id = sessionStorage.getItem('userId');
    if (!id) {
      this.alert.error('ID de usuario no encontrado');
    }
    const datos = this.perfilEmpresa.value;
    this.empresa.updatePerfilEmpresa(id!, datos).subscribe({
      next: (response) => {
        this.cargarDatosEmpresa();
        this.alert.success('Perfil actualizado con éxito');
        this.activeTabEmpresa = 'perfil';
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.alert.error('Error al actualizar perfil');
      },
    });
  }


  /*get vacantesForm(): FormArray {
    return this.empresaForm.get('vacantes') as FormArray;
  }

  get certificadosForm(): FormArray {
    return this.empresaForm.get('certificados') as FormArray;
  }

  /*crearVacante() {
    return this.fb.group({
      titulo: ['', Validators.required],
      descripcion: ['', Validators.required],
      salario: ['', Validators.required],
      modalidad: ['', Validators.required],
      tipo_trabajo: ['', Validators.required],
      ubicacion: ['', Validators.required],
      habilidad: ['', Validators.required],
      idioma: ['', Validators.required],
    });
  }

  crearCertificado() {
    return this.fb.group({
      nombre: ['', Validators.required],
      entidadEmisora: ['', Validators.required],
      fechaEmision: ['', Validators.required],
      fechaCaducidad: ['', Validators.required],
    });
  }

  agregarVacante() {
    if (this.vacantesForm.length < 5) {
      this.vacantesForm.push(this.crearVacante());
    }
  }

  eliminarVacante(index: number) {
    if (this.vacantesForm.length > 1) {
      this.vacantesForm.removeAt(index);
    }
  }

  agregarCertificado() {
    if (this.certificadosForm.length < 5) {
      this.certificadosForm.push(this.crearCertificado());
    }
  }

  eliminarCertificado(index: number) {
    if (this.certificadosForm.length > 1) {
      this.certificadosForm.removeAt(index);
    }
  }

  OnEmpresa() {
    if (this.empresaForm.invalid) {
      this.alert.error('Campos incorrectos');
      return;
    }
    // @ts-ignore
    const perfil = this.empresaForm.value as PerfilEmpresaModel;
    /*const response = this.empresa.guardarPerfil(perfil);

      if (!!response.success) {
        this.alert.success(response.message);
        this.router.navigate(['/match']);
      } else {
        this.alert.error(response.message);
      }
        */
  }

