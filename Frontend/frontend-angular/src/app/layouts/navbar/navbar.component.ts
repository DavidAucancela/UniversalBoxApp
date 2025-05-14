import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';



@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})

export class NavbarComponent {
  userRole: string = '';
  isAuthenticated: boolean = false;

  constructor(private authService: AuthService) {
    this.userRole = this.authService.getRole();
    this.isAuthenticated = this.authService.isLoggedIn();
  }

  logout() {
    this.authService.logout();
  }
}
