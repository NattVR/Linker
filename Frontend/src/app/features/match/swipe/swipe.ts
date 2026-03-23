import { Component, ElementRef, inject, QueryList, ViewChildren } from '@angular/core';
import { FilterService } from '../../../services/filter/filter-service';
import { Auth } from '../../../shared/services/auth';
import { Perfil } from '../../../shared/services/perfil';
import { Match } from '../../../shared/services/match';
import { Alerts } from '../../../shared/services/alerts';

@Component({
  selector: 'app-swipe',
  standalone: true,
  templateUrl: './swipe.html',
  styleUrls: ['./swipe.css'],
})
export class Swipe {
  filter = inject(FilterService);
  profile = inject(Perfil);
  match = inject(Match);
  auth = inject(Auth);
  alerts = inject(Alerts);

  userType = this.auth.getUserType();

  list: Vacante[] = [];
  start = 0;
  current_position = 0;
  isDragging = false;

  @ViewChildren('card') cardElement!: QueryList<ElementRef<HTMLDivElement>>;

  private get firstCard() {
    return this.cardElement.first.nativeElement;
  }

  private resetCard() {
    this.firstCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)';
    this.firstCard.style.transform = 'translateX(0px) rotate(0deg)';
    this.firstCard.classList.remove('grabbing');
    this.isDragging = false;
    this.current_position = 0;
  }

  private buildInteraccion(accion: 'like' | 'dislike', vacante: Vacante): Interaccion {
    return {
      accion_postulante: accion,
      vacante: vacante.id_vacante,
      postulante: sessionStorage.getItem('perfilId') || '',
      empresa: vacante.empresa.id_perfil,
    };
  }

  private sendAccion(accion: 'like' | 'dislike', vacante: Vacante) {
    const interaccion = this.buildInteraccion(accion, vacante);
    this.match.onAction(interaccion).subscribe({
      next: () => console.log(`${accion} enviado:`, interaccion),
      error: (err) => console.error(`Error al enviar ${accion}:`, err),
    });
  }

  onPointerDown(event: PointerEvent) {
    this.start = event.clientX;
    this.isDragging = true;
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDragging) return;
    this.current_position = event.clientX - this.start;
    this.firstCard.style.transform = `translateX(${this.current_position}px) rotate(${this.current_position / 20}deg)`;
  }

  onPointerUp(vacante: Vacante) {
    if (!this.isDragging) return;

    const isSmallMove = Math.abs(this.current_position) < 110;
    if (isSmallMove) {
      this.resetCard();
      return;
    }

    const accion = this.current_position < 0 ? 'dislike' : 'like';
    this.sendAccion(accion, vacante);
    this.list.shift();
    this.isDragging = false;
    this.current_position = 0;
  }

  getCards() {
    this.match.getVacantes().subscribe({
      next: (data: Vacante[]) => {
        this.list = data;
      },
      error: () => {
        this.alerts.info('No hay mas vacantes disponibles por el momento');
      },
    });
  }

  filterActivated() {
    this.filter.Switch();
  }
}