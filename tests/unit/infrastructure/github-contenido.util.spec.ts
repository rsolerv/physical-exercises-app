import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  aBase64,
  desdeBase64,
  cabecerasGitHub,
  leerContenidoGitHub,
} from '../../../src/app/infrastructure/github-sync/github-contenido.util';
import { ErrorValidacion } from '../../../src/app/domain/errores/errores-dominio';

describe('github-contenido.util', () => {
  describe('aBase64 / desdeBase64', () => {
    it('codifica y decodifica texto con caracteres no ASCII (acentos, eñes)', () => {
      const original = 'Flexión de rodillas, observación: "ñ" y emojis simples';
      expect(desdeBase64(aBase64(original))).toBe(original);
    });

    it('desdeBase64 ignora los saltos de línea del formato devuelto por la API de blobs', () => {
      const original = 'contenido de prueba';
      const base64ConSaltos = aBase64(original).replace(/(.{4})/g, '$1\n');
      expect(desdeBase64(base64ConSaltos)).toBe(original);
    });
  });

  describe('cabecerasGitHub', () => {
    it('construye la cabecera de autorización Bearer y Accept de la API de GitHub', () => {
      const cabeceras = cabecerasGitHub('token-secreto');
      expect(cabeceras.get('Authorization')).toBe('Bearer token-secreto');
      expect(cabeceras.get('Accept')).toBe('application/vnd.github+json');
    });
  });

  describe('leerContenidoGitHub', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
      });
      http = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('devuelve el contenido decodificado y el sha cuando la API de contenidos lo incluye', async () => {
      const promesa = leerContenidoGitHub(http, 'owner/repo', 'datos.json', 'token-secreto');

      httpMock
        .expectOne('https://api.github.com/repos/owner/repo/contents/datos.json')
        .flush({ content: aBase64('{"a":1}'), sha: 'sha-1' });

      await expect(promesa).resolves.toEqual({ texto: '{"a":1}', sha: 'sha-1' });
    });

    it('recurre a la API de blobs cuando la API de contenidos omite el contenido (ficheros de más de 1 MB)', async () => {
      const promesa = leerContenidoGitHub(http, 'owner/repo', 'datos.json', 'token-secreto');

      httpMock
        .expectOne('https://api.github.com/repos/owner/repo/contents/datos.json')
        .flush({ content: '', encoding: 'none', sha: 'sha-grande' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      httpMock
        .expectOne('https://api.github.com/repos/owner/repo/git/blobs/sha-grande')
        .flush({ content: aBase64('{"grande":true}'), encoding: 'base64', sha: 'sha-grande' });

      await expect(promesa).resolves.toEqual({ texto: '{"grande":true}', sha: 'sha-grande' });
    });

    it('lanza ErrorValidacion si ni la API de contenidos ni la de blobs devuelven contenido', async () => {
      const promesa = leerContenidoGitHub(http, 'owner/repo', 'datos.json', 'token-secreto');
      const esperacion = expect(promesa).rejects.toThrow(ErrorValidacion);

      httpMock
        .expectOne('https://api.github.com/repos/owner/repo/contents/datos.json')
        .flush({ content: '', encoding: 'none', sha: 'sha-grande' });
      await new Promise((resolve) => setTimeout(resolve, 0));
      httpMock.expectOne('https://api.github.com/repos/owner/repo/git/blobs/sha-grande').flush({ content: '', sha: 'sha-grande' });

      await esperacion;
    });
  });
});
