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
  private readonly fb = inject(FormBuilder);
  private readonly perfil = inject(Perfil);
  private readonly alert = inject(Alerts);

  activeTab: 'form' | 'list' = 'list';
  mostrarDropdown = false;
  modoEdicion = false;
  private idEditando: string | null = null; 

  private readonly idEmpresa = sessionStorage.getItem('perfilId');
  certificados: Certificado[] = [];
  certificadoSeleccionado: Certificado | null = null;
  certificadosOfEmpresa: CertificadoEmpresa[] = [];

  readonly certificadoForm: FormGroup = this.fb.group({
    fechaEmision: ['', Validators.required],
    fechaCaducidad: ['', Validators.required],
  });

  ngOnInit() {
    this.cargarCertificados();
    this.cargarCatalogoCertificados();
  }

  private cargarCatalogoCertificados() {
    this.perfil.getCerticados().subscribe({
      next: (res: Certificado[]) => (this.certificados = res),
      error: () => this.alert.error('Error al cargar el catálogo de certificados'),
    });
  }

  private cargarCertificados() {
    if (!this.idEmpresa) return;
    this.perfil.getCertificadosOfEmpresa(this.idEmpresa).subscribe({
      next: (data: CertificadoEmpresa[]) => (this.certificadosOfEmpresa = data),
      error: () => this.alert.error('Error al obtener los certificados'),
    });
  }

  toggleDropdown() {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  seleccionarCertificado(cert: Certificado): void {
    this.certificadoSeleccionado = cert;
    this.mostrarDropdown = false;
  }

  setActiveTab(tab: 'form' | 'list') {
    if (tab === 'form') this.resetForm();
    this.activeTab = tab;
  }

  submitForm(): void {
    if (this.modoEdicion) {
      this.guardarEdicion();
    } else {
      this.agregarCertificado();
    }
  }

  private resetForm() {
    this.certificadoForm.reset();
    this.certificadoSeleccionado = null;
    this.modoEdicion = false;
    this.idEditando = null;
  }

  cancelarEdicion() {
    this.resetForm();
    this.activeTab = 'list';
  }

  private formIsValid():boolean{
    if (!this.certificadoSeleccionado) {
      this.alert.error('Selecciona un certificado');
      return false;
    }
    if (this.certificadoForm.invalid) {
      this.certificadoForm.markAllAsTouched();
      this.alert.error('Completa las fechas');
      return false;
    }
    const { fechaEmision, fechaCaducidad } = this.certificadoForm.getRawValue();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
   
    if (new Date(fechaEmision) > hoy){
      this.alert.error('La fecha de emisión no es valida')
      return false;
    }
    if(new Date(fechaCaducidad)<= new Date(fechaEmision)){
      this.alert.error('La caducidad debe ser posterior a la fecha de emisión');
      return false;
    }
    return true;
  }

  private agregarCertificado() {
    if(this.formIsValid()){
      const data: CrearCertificadoEmpresa = {
      certificado: { id_certificado: this.certificadoSeleccionado!.id_certificado },
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
    else{
      return   
    }
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
    if (this.formIsValid()){
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
    else{
      return
    }
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
}