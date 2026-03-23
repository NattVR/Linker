import { Component, ElementRef, inject, QueryList, ViewChildren} from '@angular/core';
import { Match } from '../../../shared/services/match';
import { Auth } from '../../../shared/services/auth';
import { Alerts } from '../../../shared/services/alerts';

@Component({
  selector: 'app-swipe-empresa',
  imports: [],
  templateUrl: './swipe-empresa.html',
  styleUrl: './swipe-empresa.css'
})
export class SwipeEmpresa {
  private readonly match = inject(Match);
  private readonly auth = inject(Auth);
  private readonly alerts = inject(Alerts);
  readonly userType = this.auth.getUserType();

  list: Postulante[] =[
      /*{id: '1',
      name: 'María',
      lastname: 'García',
      anos_experiencia: 5,
      curriculum: '#',
      foto: 'https://i.pravatar.cc/300?img=47',
      ubicacion: 'Medellín, CO',
      habilidades: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      idiomas: ['Español', 'Inglés', 'Portugués']
    }*/];

  start = 0;
  current_position = 0;
  isDragging = false;
  private isProcessing    = false; 

  @ViewChildren('card') cardElement!: QueryList<ElementRef<HTMLDivElement>>;

  private get firstCard(): HTMLDivElement {
    return this.cardElement.first.nativeElement;
  }

  onPointerDown(event: PointerEvent):void {
    if (this.isProcessing) return;
    this.start = event.clientX;
    this.isDragging = true;
    this.firstCard.style.transition = 'none'; // evita delay al arrastrar
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent) : void{
    if (!this.isDragging || this.isProcessing) return;
    this.current_position = event.clientX - this.start;
    this.applyCardTransform(this.current_position);
  }

  onPointerUp(event:PointerEvent,postulante:Postulante){
    if (!this.isDragging || this.isProcessing) return;
    
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
    //console.log(card)
    if (Math.abs(this.current_position) < 110) {
      this.resetCard();

    } else if (this.current_position < 0) {
      this.isProcessing = true
      this.enviarInteraccion(postulante.id,'dislike')

    } else {
      this.isProcessing = true
      this.enviarInteraccion(postulante.id, 'like')
    }
  }

   private applyCardTransform(x: number): void {
    const opacity = Math.max(0.6, 1 - Math.abs(x) / 500);
    this.firstCard.style.transform = `translateX(${x}px) rotate(${x / 20}deg)`;
    this.firstCard.style.opacity   = `${opacity}`;
   }

  private resetCard(): void {
    this.firstCard.style.transition = 'transform 0.4s cubic-bezier(0.25, 1.25, 0.5, 1)';
    this.firstCard.style.transform  = 'translateX(0px) rotate(0deg)';
    this.firstCard.style.opacity    = '1';
    this.resetDragState();
  }

  private nextCard(): void {
    this.list.shift()
    this.resetDragState();
  }

  private resetDragState(): void {
    this.isDragging       = false;
    this.current_position = 0;
    this.isProcessing= false
  }

    private enviarInteraccion(postulanteId: string, accion: 'like' | 'dislike'): void {
    const vacanteId = sessionStorage.getItem('vacante'); // ← leer aquí, no del readonly
    const empresaId = sessionStorage.getItem('perfilId');
  
    console.log('vacanteId:', vacanteId);
    console.log('empresaId:', empresaId);
    console.log('postulanteId:', postulanteId);
    console.log('accion',accion)

    const interaccion: Interaccion = {
      accion_empresa:accion,
      vacante:vacanteId!,
      postulante:postulanteId,
      empresa:empresaId!,
    };

    console.log('interaccio', interaccion)
    this.match.onAction(interaccion).subscribe({
      next:(response:any)=>{
        this.alerts.info(response);
        this.nextCard()
      },
      error: () => {
        this.alerts.error(`Error al enviar ${accion}`);
        this.isProcessing =false;
      } 
    });
  }

  getCards() {
    let vacante = sessionStorage.getItem('vacante') // 3
    console.log('vacante en getCards:', sessionStorage.getItem('vacante'))
    if(vacante){
      this.match.getPostulantes(vacante).subscribe({ // 5
        next: (data: Postulante[]) => {
          this.list = data; 
        },
        error: () => {
          this.alerts.info('No hay mas postulantes para la vacante') // 10
        },
      });
    }
  }
}
