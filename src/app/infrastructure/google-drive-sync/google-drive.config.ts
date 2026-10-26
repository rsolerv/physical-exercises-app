import { InjectionToken } from '@angular/core';

export const GOOGLE_CLIENT_ID = '260006664858-999gms4k3nhu5gjiumgnjk65mh8h7tuv.apps.googleusercontent.com';
export const GOOGLE_DRIVE_APP_DATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

export const GOOGLE_CLIENT_ID_CONFIG = new InjectionToken<string>('GOOGLE_CLIENT_ID_CONFIG', {
  providedIn: 'root',
  factory: () => GOOGLE_CLIENT_ID,
});
