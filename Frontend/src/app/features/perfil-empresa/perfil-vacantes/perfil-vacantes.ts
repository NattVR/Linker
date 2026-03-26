import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { Perfil } from '../../../shared/services/perfil';
import { Match } from '../../../shared/services/match';
import { LoggerService } from '../../../shared/services/logger';

@Component({
  selector: 'app-perfil-vacantes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './perfil-vacantes.html',
  styleUrls: ['./perfil-vacantes.css'],
})
export class PerfilVacantes {
  fb = inject(FormBuilder);
  perfil = inject(Perfil);
  match = inject(Match)
  activeTab: 'form' | 'list' = 'form';
  logger = inject(LoggerService);


  tiposTrabajo = ['Full-time', 'Part-time', 'Contrato', 'Prácticas'];
  modalidades = ['Presencial', 'Remoto', 'Híbrido'];

  habilidadesDisponibles: Habilidad[] = [];
  idiomasDisponibles: Idioma[] = [];

  mostrarListaHabilidad: boolean[] = [];
  mostrarListaIdioma: boolean[] = [];

  vacantes: Vacante[] = [];

  modoEdicion = false;
  vacanteEditandoId: string | null = null;

  nuevaVacante: FormGroup = this.fb.group({
    titulo: [''],
    salario: [''],
    ubicacion: [''],
    modalidad: [''],
    tipo_trabajo: [''],
    vacanteHabilidades: this.fb.array([]),
    vacantesIdiomas: this.fb.array([]),
    empresa: [''],
  });

  // ========= GETTERS para FormArrays =========
  get habilidades(): FormArray {
    return this.nuevaVacante.get('vacanteHabilidades') as FormArray;
  }

  get idiomas(): FormArray {
    return this.nuevaVacante.get('vacantesIdiomas') as FormArray;
  }

  // ========= CAMBIAR TAB =========
  setActiveTab(tab: 'form' | 'list') {
    this.activeTab = tab;
  }

  // ========= HABILIDADES =========
  agregarSelectHabilidad() {
    this.habilidades.push(new FormControl(''));
    this.mostrarListaHabilidad.push(false);
  }

  eliminarSelectHabilidad(index: number) {
    this.habilidades.removeAt(index);
    this.mostrarListaHabilidad.splice(index, 1);
  }

  toggleListaHabilidad(index: number) {
    this.perfil.getHabilidades().subscribe({
      next: (res: Habilidad[]) => {
        this.habilidadesDisponibles = res;
      },
      error: () => this.logger.error('Error al cargar habilidades'),
    });
    this.logger.log(JSON.stringify(this.habilidadesDisponibles) + ' habilidades disponibles');

    this.mostrarListaHabilidad[index] = !this.mostrarListaHabilidad[index];
  }

  seleccionarHabilidad(index: number, habilidad: Habilidad) {
    this.habilidades.at(index).setValue(habilidad.id_habilidad);
    this.mostrarListaHabilidad[index] = false;
  }

  // ========= IDIOMAS =========
  agregarSelectIdioma() {
    this.idiomas.push(new FormControl(''));
    this.mostrarListaIdioma.push(false);
  }

  eliminarSelectIdioma(index: number) {
    this.idiomas.removeAt(index);
    this.mostrarListaIdioma.splice(index, 1);
  }

  toggleListaIdioma(index: number) {
    this.perfil.getIdiomas().subscribe({
      next: (res: Idioma[]) => {
        this.idiomasDisponibles = res;
      },
      error: () => this.logger.error('Error al cargar idiomas'),
    });
    this.logger.log(JSON.stringify(this.idiomasDisponibles) + 'idiomas')

    this.mostrarListaIdioma[index] = !this.mostrarListaIdioma[index];
  }

  seleccionarIdioma(index: number, idioma: Idioma) {
    this.idiomas.at(index).setValue(idioma.id_idioma);
    this.mostrarListaIdioma[index] = false;
  }

  // REFACTORIZADA

  public publicarVacante(): void {
    const idEmpresa = this.obtenerIdEmpresa(); //2
    if (!idEmpresa) { // 3
      return; // 4
    }

    const vacante = this.prepararVacante(idEmpresa); // 5
    let operacion$; // 6

    if (this.modoEdicion && this.vacanteEditandoId) { // 7
      operacion$ = this.perfil.updateVacante(this.vacanteEditandoId, vacante); // 8
    } else {
      operacion$ = this.perfil.createVacante(vacante); // 9
    }

    operacion$.subscribe({ //10
      next: res => {
        this.logger.log('Vacante procesada: ' + JSON.stringify(res)); // 11
        this.resetFormulario(); // 12
      },
      error: err => this.logger.error(err) // 13
    });
  }

  private obtenerIdEmpresa(): string | null {
    const id = sessionStorage.getItem('perfilId'); // 1
    if (!id) { // 2
      this.logger.error('No se pudo obtener el perfilId de sessionStorage.'); // 3
    }
    return id; // 4
  }

  private prepararVacante(idEmpresa: string): CrearVacante {
    this.nuevaVacante.get('empresa')?.setValue(idEmpresa); // 1
    const vacante: CrearVacante = this.nuevaVacante.value; // 2

    if (!vacante.vacanteHabilidades?.length) { // 3
      vacante.vacanteHabilidades = []; // 4
    }
    if (!vacante.vacantesIdiomas?.length) { // 5
      vacante.vacantesIdiomas = []; // 6
    }

    return vacante; // 7
  }

  // FIN REFACTORIZADA

  // ========= EDITAR VACANTE =========
  editarVacante(v: Vacante) {
    this.setActiveTab('form');

    this.modoEdicion = true;
    this.vacanteEditandoId = v.id_vacante;

    this.nuevaVacante.patchValue({
      titulo: v.titulo,
      salario: v.salario,
      ubicacion: v.ubicacion,
      modalidad: v.modalidad,
      tipo_trabajo: v.tipo_trabajo
    });

    this.habilidades.clear();
    this.idiomas.clear();

    this.perfil.getCatalogosPostulante().subscribe(({ habilidades, idiomas }) => {

      v.habilidades?.forEach((nombreHab: string) => {
        const encontrada = habilidades.find(
          (h: Habilidad) => h.nombre_habilidad === nombreHab
        );

        if (encontrada) {
          this.habilidades.push(new FormControl(encontrada.id_habilidad));
        }
      });

      v.idiomas?.forEach((nombreIdioma: string) => {
        const encontrado = idiomas.find(
          (i: Idioma) => i.nombre === nombreIdioma
        );

        if (encontrado) {
          this.idiomas.push(new FormControl(encontrado.id_idioma));
        }
      });

    });
  }

  resetFormulario() {
    this.nuevaVacante.reset();
    this.habilidades.clear();
    this.idiomas.clear();

    this.modoEdicion = false;
    this.vacanteEditandoId = null;

    this.setActiveTab('list');
    this.cargarVacantes();
  }

  // ========= ELIMINAR VACANTE =========
  eliminarVacante(id_vacante: string) {
    if (confirm('¿Seguro que deseas eliminar esta vacante?')) {
      this.vacantes = this.vacantes.filter(v => v.id_vacante !== id_vacante);
    }
  }

  cargarVacantes() {
    this.match.getVacantesForEmpresa().subscribe({
      next: (data: Vacante[]) => {
        this.vacantes = data;
      },
      error: err => {
        alert('Error al cargar vacantes');
        //this.logger.log('error al cargar vacantes' + JSON.stringify(err))
      }
    });
    //this.logger.log(JSON.stringify(this.vacantes))
  }
}
