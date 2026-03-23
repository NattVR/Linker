import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../services/auth';
import { SidebarService } from '../../../services/sidebar/sidebar-service';
import { Perfil } from '../../services/perfil';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {
  router = inject(Router);
  private readonly authService = inject(Auth);
  isLogged = this.authService.isLogged;
  isMenuOpen = false;
  profile = inject(Perfil);

  sidebarService = inject(SidebarService);

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  onLogout() {
    this.authService.logout();
    this.router.navigateByUrl('');
    this.closeMenu();
  }

  getUserType(): boolean {
    const isEmpresa = sessionStorage.getItem('isEmpresa');

    return isEmpresa === 'true';
  }
}
