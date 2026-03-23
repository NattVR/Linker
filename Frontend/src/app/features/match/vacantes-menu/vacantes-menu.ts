import { Component, inject } from '@angular/core';
import { Match } from '../../../shared/services/match';
import { Auth } from '../../../shared/services/auth';
import { LoggerService } from '../../../shared/services/logger';

@Component({
  selector: 'app-vacantes-menu',
  imports: [],
  templateUrl: './vacantes-menu.html',
  styleUrl: './vacantes-menu.css'
})
export class VacantesMenu {

  match = inject(Match)
  auth = inject(Auth)
  vacantes: Vacante[] = [];
  logger = inject(LoggerService);

  mostrarLista = false;
  vacanteSeleccionada: Vacante | null = null;

  getVacantes() {
    this.logger.log(sessionStorage.getItem('perfilId') || '')
    this.match.getVacantesForEmpresa().subscribe({
      next: (data: Vacante[]) => {
        this.logger.log(sessionStorage.getItem('perfilId') || '')
        this.vacantes = data
        this.logger.log(JSON.stringify(data))
      },
      error: err => {
        this.logger.log('no hay vacantes')
      }
    });
  }

  toggleLista() {
    this.mostrarLista = !this.mostrarLista;
    if (this.vacantes.length === 0) {
      this.getVacantes()
    }
  }

  seleccionarVacante(vacante: any) {
    this.vacanteSeleccionada = vacante;
    sessionStorage.setItem('vacante', this.vacanteSeleccionada?.id_vacante || '');

    this.mostrarLista = false;
    this.logger.log('Vacante seleccionada:' + JSON.stringify(vacante));
  }
}
