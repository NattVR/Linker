import { CommonModule } from '@angular/common';
import { Component, inject, ɵinternalProvideZoneChangeDetection } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule
} from '@angular/forms';
import { Perfil } from '../../../shared/services/perfil';
import { Match } from '../../../shared/services/match';

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
      error: () => console.error('Error al cargar habilidades'),
    });
    console.log(this.habilidadesDisponibles, 'habilidades')

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
      error: () => console.error('Error al cargar idiomas'),
    });
    console.log(this.idiomasDisponibles,'idiomas')

    this.mostrarListaIdioma[index] = !this.mostrarListaIdioma[index];
  }

  seleccionarIdioma(index: number, idioma: Idioma) {
    this.idiomas.at(index).setValue(idioma.id_idioma);
    this.mostrarListaIdioma[index] = false;
  }

  // ========= GUARDAR VACANTE =========
  publicarVacante() {
  //const vacante: Vacante = this.nuevaVacante.value;

   let idEmpresa: string | null = sessionStorage.getItem('perfilId'); //  2

    // 1. Manejar el caso de null (previniendo el error de TypeScript ts(2322))
    if (!idEmpresa) { //  3
        console.error("No se pudo obtener el perfilId de sessionStorage."); //  4
        // Podrías mostrar un mensaje al usuario o retornar
        return; //  5
    }
    this.nuevaVacante.get('empresa')?.setValue(idEmpresa); // 6
    const vacante: CrearVacante= this.nuevaVacante.value; //  7

    if (!vacante.vacanteHabilidades?.length) vacante.vacanteHabilidades = []; //  8 y 9
    if (!vacante.vacantesIdiomas?.length) vacante.vacantesIdiomas = []; //  10 y 11


    if (this.modoEdicion && this.vacanteEditandoId) { //  12

      this.perfil.updateVacante(this.vacanteEditandoId, vacante).subscribe({ //  13
        next: (res) => { 
          console.log('Vacante actualizada:', res); //  14
          this.resetFormulario(); //  15
        },
        error: (err) => console.error(err) //  16
      });

    } else {

      this.perfil.createVacante(vacante).subscribe({ // 17
        next: (res) => {
          console.log('Vacante guardada correctamente:', res); //18
          this.resetFormulario();// 19
        },
        error: (err) => console.error(err) // 20
      });

    }
  }

  // ========= EDITAR VACANTE =========
  editarVacante(v: any) {
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
          (h: any) => h.nombre_habilidad === nombreHab
        );

        if (encontrada) {
          this.habilidades.push(new FormControl(encontrada.id_habilidad));
        }
      });

      v.idiomas?.forEach((nombreIdioma: string) => {
        const encontrado = idiomas.find(
          (i: any) => i.nombre === nombreIdioma
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
      this.vacantes = this.vacantes.filter((v) => v.id_vacante !== id_vacante);
    }
  }

  cargarVacantes(){
    this.match.getVacantesForEmpresa().subscribe({
      next: (data:Vacante[])=>{
        this.vacantes=data;
      },
      error: (err)=>{
        alert('Error al cargar vacantes');
        console.log('error al cargar vacantes',err)
      }
    });
    console.log(this.vacantes)
  }
}
