import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter.html',
  styleUrl: './filter.css'
})
export class Filter {
  opciones: string[] = ["Tiempo Completo", "Medio Tiempo", "Freelance", "Prácticas", "Tecnología"];
  seleccionados: any = {};

  borrarFiltros(){
    this.seleccionados = {};
  }
}
