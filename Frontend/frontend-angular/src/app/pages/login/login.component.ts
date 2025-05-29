import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent {
  correo = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.authService.login(this.correo, this.password).subscribe({
      next: () => {
        // Redirige a la página principal o dashboard
        this.router.navigate(['/']);
      },
      error: (err) => {
        // Muestra error de login
        alert('Credenciales incorrectas');
      }
    });
  }
}