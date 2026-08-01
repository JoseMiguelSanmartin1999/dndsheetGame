import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface User {
  id: string;
  email: string;
  username: string;
  dateOfBirth: string;
  role: string;
  hasPlayedBefore: boolean;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  dateOfBirth: string;
  password?: string;
  hasPlayedBefore: boolean;
}

export interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';

  // Señal reactiva privada para guardar el usuario
  private userSignal = signal<User | null>(null);

  // Señales públicas derivadas y reactivas
  currentUser = computed(() => this.userSignal());
  isAuthenticated = computed(() => !!this.userSignal());

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, data);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem('adventure_token', res.token);
        localStorage.setItem('adventure_user', JSON.stringify(res.user));
        this.userSignal.set(res.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('adventure_token');
    localStorage.removeItem('adventure_user');
    this.userSignal.set(null);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('adventure_token');
    const userStr = localStorage.getItem('adventure_user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.userSignal.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }
}
