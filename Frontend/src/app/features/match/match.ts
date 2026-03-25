import { Component, inject } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { Swipe } from './swipe/swipe';
import { Filter } from './filter/filter';
import { FilterService } from '../../services/filter/filter-service';
import { Bottombar } from './bottombar/bottombar';
import { SidebarService } from '../../services/sidebar/sidebar-service';
import { Auth } from '../../shared/services/auth';
import { VacantesMenu } from "./vacantes-menu/vacantes-menu";
import { SwipeEmpresa } from './swipe-empresa/swipe-empresa';

@Component({
  selector: 'app-match',
  imports: [Sidebar, Swipe, Filter, Bottombar, VacantesMenu, SwipeEmpresa],
  templateUrl: './match.html',
  styleUrl: './match.css',
})
export class Match {
  filterService = inject(FilterService);
  sidebarService = inject(SidebarService);
  auth=inject(Auth)

  get userType(): boolean {
    return this.auth.getUserType();
  }
}
