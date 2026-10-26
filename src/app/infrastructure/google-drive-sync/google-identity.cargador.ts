import { Injectable } from '@angular/core';
import { ErrorRedSincronizacion } from '../../domain/errores/errores-dominio';

export interface GoogleTokenResponse {
  access_token?: string;
  expires_in?: string | number;
  scope?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleIdentityApi {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback: (error: { type: string; message?: string }) => void;
        login_hint?: string;
      }): {
        requestAccessToken(options?: { prompt?: string }): void;
      };
      hasGrantedAllScopes(response: GoogleTokenResponse, ...scopes: string[]): boolean;
      revoke(token: string, callback?: () => void): void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityApi;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityCargador {
  private cargaEnCurso: Promise<GoogleIdentityApi> | null = null;

  cargar(): Promise<GoogleIdentityApi> {
    const apiExistente = window.google;
    if (apiExistente?.accounts?.oauth2) return Promise.resolve(apiExistente);
    if (this.cargaEnCurso) return this.cargaEnCurso;

    this.cargaEnCurso = new Promise<GoogleIdentityApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const api = window.google;
        if (!api?.accounts?.oauth2) {
          this.cargaEnCurso = null;
          reject(new ErrorRedSincronizacion('No se ha podido cargar la conexión con Google.'));
          return;
        }
        resolve(api);
      };
      script.onerror = () => {
        this.cargaEnCurso = null;
        reject(new ErrorRedSincronizacion('No se ha podido cargar la conexión con Google.'));
      };
      document.head.appendChild(script);
    });
    return this.cargaEnCurso;
  }
}
