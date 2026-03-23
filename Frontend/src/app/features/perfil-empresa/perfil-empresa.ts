import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
export class PerfilEmpresa implements OnInit {
  private readonly alert = inject(Alerts);
  private readonly empresa = inject(Perfil);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly id= sessionStorage.getItem('userId');
  datosEmpresa: Empresa | null = null
  activeTab: 'vacantes' | 'certificados' | 'estadisticas' = 'vacantes';
  activeTabEmpresa: 'perfil' | 'editar_perfil' = 'perfil';

  perfilEmpresa: FormGroup= this.fb.group({
    name_empresa: ['', Validators.required],
    sector: ['', Validators.required],
    ubicacion: ['', Validators.required],
    descripcion: ['', Validators.required],
  });

  ngOnInit():void {
    this.cargarDatosEmpresa();
  }
  
  setActiveTab(tab: 'vacantes' | 'certificados' | 'estadisticas') {
    this.activeTab = tab;
  }

  setActiveTabEmpresa(tab: 'perfil' | 'editar_perfil') {
    this.activeTabEmpresa = tab;
    if (this.datosEmpresa) {
      this.perfilEmpresa.patchValue(this.datosEmpresa); 
    }
    else{
      this.alert.error('No hay datos de la empresa')
    }
  }

  cargarDatosEmpresa() {
    if (this.id) {
      this.empresa.getEmpresa(this.id).subscribe({
        next: (data:Empresa ) => {
          this.datosEmpresa = data;
        },
        error: (err) => console.error('Error al obtener empresa:', err),
      });
    }
    else{
      this.alert.error('Id de usuario no encontrado')
    }
  }

  updateEmpresa() {
    if (this.id) {
    const datos = this.perfilEmpresa.value;
    this.empresa.updatePerfilEmpresa(this.id, datos).subscribe({
      next: (response) => {
        this.cargarDatosEmpresa();
        this.alert.success('Perfil actualizado con éxito');
        this.activeTabEmpresa = 'perfil';
      },
      error: (err) => {
        this.alert.error('Error al actualizar perfil');
      },
    });
    }
    else{
      this.alert.error('ID de usuario no encontrado');
    }
  }

  }

