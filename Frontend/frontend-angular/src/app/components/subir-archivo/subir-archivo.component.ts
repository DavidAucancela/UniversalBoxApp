// src/app/components/file-upload/file-upload.component.ts
import { Component,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FileUploadService } from '../../services/subir-archivo.service';
import { FileSizePipe } from '../../pipes/tamaño-archivo.pipe';

@Component({
  selector: 'app-subir-archivo',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, FileSizePipe],
  templateUrl: './subir-archivo.component.html',
  styleUrls: ['./subir-archivo.component.css']
})
export class FileUploadComponent implements OnInit {
  selectedFile: File | null = null;
  uploadProgress: number | null = null;
  uploadMessage: string | null = null;
  filesList: any[] = [];

  constructor(private fileUploadService: FileUploadService) { }

  ngOnInit(): void {
    this.loadFiles();
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] as File;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.uploadProgress = 0;
    this.uploadMessage = null;

    this.fileUploadService.uploadFile(this.selectedFile).subscribe({
      next: (event: any) => {
        if (event.type === 1 && event.loaded && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.body) {
          this.uploadMessage = 'Archivo subido exitosamente!';
          this.uploadProgress = null;
          this.loadFiles();
        }
      },
      error: (err) => {
        this.uploadMessage = 'Error al subir el archivo: ' + err.message;
        this.uploadProgress = null;
      }
    });
  }

  loadFiles(): void {
    this.fileUploadService.getFiles().subscribe({
      next: (files) => {
        this.filesList = files;
      },
      error: (err) => {
        console.error('Error al cargar archivos:', err);
      }
    });
  }

  downloadFile(filename: string): void {
    this.fileUploadService.downloadFile(filename).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      },
      error: (err) => {
        console.error('Error al descargar el archivo:', err);
      }
    });
  }
}
