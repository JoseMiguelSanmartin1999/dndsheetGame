import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../../core/api.config';

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
  private apiUrl = `${API_URL}/auth`;

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
        if (res.user && !res.user.id && (res.user as any)._id) {
          res.user.id = (res.user as any)._id;
        }
        localStorage.setItem('adventure_token', res.token);
        localStorage.setItem('adventure_user', JSON.stringify(res.user));
        this.userSignal.set(res.user);
      })
    );
  }

  getToken(): string | null {
    const token = localStorage.getItem('adventure_token');
    return token && !this.isExpired(token) ? token : null;
  }

  /** Lee la fecha de caducidad del JWT (sin verificar la firma: eso lo hace el servidor). */
  private isExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  logout(): void {
    localStorage.removeItem('adventure_token');
    localStorage.removeItem('adventure_user');
    this.userSignal.set(null);
  }

  private restoreSession(): void {
    const token = localStorage.getItem('adventure_token');
    const userStr = localStorage.getItem('adventure_user');

    if (token && userStr && !this.isExpired(token)) {
      try {
        const user = JSON.parse(userStr) as User;
        if (user && !user.id && (user as any)._id) {
          user.id = (user as any)._id;
        }
        this.userSignal.set(user);
      } catch (e) {
        this.logout();
      }
    } else if (token || userStr) {
      // Sesión antigua (token falso de la versión anterior) o caducada.
      this.logout();
    }
  }
}
