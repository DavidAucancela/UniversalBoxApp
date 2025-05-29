import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

interface LoginResponse {
  access: string;
  refresh: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:8000/users/token/'; // Ajusta la URL si es necesario
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, { username: email, password }).pipe(
      tap((res: LoginResponse) => {
        this.setItem('access_token', res.access);
        this.setItem('refresh_token', res.refresh);
        this.loggedIn.next(true);
      })
    );
  }

  logout(): void {
    this.removeItem('access_token');
    this.removeItem('refresh_token');
    this.loggedIn.next(false);
  }

  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser) {
      localStorage.setItem(key, value);
    }
  }

  private getItem(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private removeItem(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  public getToken(): string | null {
    return this.getItem('access_token');
  }

  guardarToken(token: string) {
    this.setItem('access_token', token);
    this.loggedIn.next(true);
  }

  obtenerToken() {
    return this.getToken();
  }
}
