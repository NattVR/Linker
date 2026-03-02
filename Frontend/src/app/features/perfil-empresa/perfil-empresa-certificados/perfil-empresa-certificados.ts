import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Perfil } from '../../../shared/services/perfil';
import { CommonModule } from '@angular/common';
import { Alerts } from '../../../shared/services/alerts';

@Component({
  selector: 'app-perfil-empresa-certificados',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil-empresa-certificados.html',
  styleUrl: './perfil-empresa-certificados.css',
})
export class PerfilEmpresaCertificados implements OnInit {
  fb = inject(FormBuilder);
  perfil = inject(Perfil);
  alert = inject(Alerts);

  activeTab: 'form' | 'list' = 'list';
  mostrarDropdown = false;
  modoEdicion = false;
  idEditando: string | null = null; 

  idEmpresa = sessionStorage.getItem('perfilId');
  certificados: Certificado[] = [];
  certificadoSeleccionado: Certificado | null = null;
  certificadosOfEmpresa: CertificadoEmpresa[] = [];

  certificadoForm: FormGroup = this.fb.group({
    fechaEmision: ['', Validators.required],
    fechaCaducidad: ['', Validators.required],
  });

  ngOnInit() {
    this.cargarCertificados();
    this.cargarCatalogoCertificados();
  }

  cargarCatalogoCertificados() {
    this.perfil.getCerticados().subscribe({
      next: (res: Certificado[]) => (this.certificados = res),
      error: () => this.alert.error('Error al cargar el catálogo de certificados'),
    });
  }

  cargarCertificados() {
    if (!this.idEmpresa) return;
    this.perfil.getCertificadosOfEmpresa(this.idEmpresa).subscribe({
      next: (data: CertificadoEmpresa[]) => (this.certificadosOfEmpresa = data),
      error: () => this.alert.error('Error al obtener los certificados'),
    });
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  seleccionarCertificado(cert: Certificado) {
    this.certificadoSeleccionado = cert;
    this.mostrarDropdown = false;
  }

  agregarCertificado() {
    if (!this.certificadoSeleccionado) {
      this.alert.error('Selecciona un certificado');
      return;
    }
    if (this.certificadoForm.invalid) {
      this.alert.error('Completa las fechas');
      return;
    }

    const data: CrearCertificadoEmpresa = {
      certificado: { id_certificado: this.certificadoSeleccionado.id_certificado },
      empresa: { id: this.idEmpresa! },
      fecha_emision: this.certificadoForm.value.fechaEmision,
      fecha_caducidad: this.certificadoForm.value.fechaCaducidad,
    };

    this.perfil.createCertificado(data).subscribe({
      next: () => {
        this.alert.success('Certificado agregado');
        this.resetForm();
        this.cargarCertificados();
        this.activeTab = 'list';
      },
      error: () => this.alert.error('Error al agregar certificado'),
    });
  }

  iniciarEdicion(cert: CertificadoEmpresa) {
    this.modoEdicion = true;
    this.idEditando = cert.id_detalles_certificados;
    this.certificadoSeleccionado = cert.certificado as Certificado;
    this.certificadoForm.patchValue({
      fechaEmision: cert.fecha_emision,
      fechaCaducidad: cert.fecha_caducidad,
    });
    this.activeTab = 'form';
  }

  guardarEdicion() {
    if (this.certificadoForm.invalid) { // 4
      this.alert.error('Completa las fechas'); // 5
      return; // 13
    }

    const datos = { // 6
      fecha_emision: this.certificadoForm.value.fechaEmision,
      fecha_caducidad: this.certificadoForm.value.fechaCaducidad,
    };

    this.perfil.updateCertificado(this.idEditando!, datos).subscribe({ // 7
      next: () => {
        this.alert.success('Certificado actualizado'); // 8
        this.resetForm(); // 9
        this.cargarCertificados(); // 10
        this.activeTab = 'list'; // 11
      },
      error: () => this.alert.error('Error al actualizar certificado'), // 12
    });
  }

  eliminarCertificado(id: string) { 
    if (!confirm('¿Estás seguro de que deseas eliminar este certificado?')) return;

    this.perfil.deleteCertificado(id).subscribe({
      next: () => {
        this.alert.success('Certificado eliminado');
        this.cargarCertificados();
      },
      error: () => this.alert.error('Error al eliminar certificado'),
    });
  }

  submitForm() {
    if (this.modoEdicion) {
      this.guardarEdicion();
    } else {
      this.agregarCertificado();
    }
  }

  resetForm() {
    this.certificadoForm.reset();
    this.certificadoSeleccionado = null;
    this.modoEdicion = false;
    this.idEditando = null;
  }

  cancelarEdicion() {
    this.resetForm();
    this.activeTab = 'list';
  }

  setActiveTab(tab: 'form' | 'list') {
    if (tab === 'form') this.resetForm();
    this.activeTab = tab;
  }
}