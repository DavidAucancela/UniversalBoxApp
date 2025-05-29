import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule], // Opción recomendada

  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems = [
    { name: 'Opción 1', icon: 'settings' },
    { name: 'Opción 2', icon: 'person' },
    { name: 'Opción 3', icon: 'dashboard' }
  ];
}
