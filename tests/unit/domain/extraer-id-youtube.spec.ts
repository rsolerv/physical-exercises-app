import { describe, it, expect } from 'vitest';
import { extraerIdYoutube } from '../../../src/app/domain/ejercicio/extraer-id-youtube';

describe('extraerIdYoutube', () => {
  it('extrae el id de una URL con formato youtube.com/watch?v=', () => {
    expect(extraerIdYoutube('https://www.youtube.com/watch?v=abc123XYZ')).toBe('abc123XYZ');
  });

  it('extrae el id de una URL con formato youtube.com/watch?v= con parámetros adicionales', () => {
    expect(extraerIdYoutube('https://youtube.com/watch?v=abc123&list=PL1234&index=2')).toBe('abc123');
  });

  it('extrae el id de una URL corta youtu.be/', () => {
    expect(extraerIdYoutube('https://youtu.be/abc123XYZ')).toBe('abc123XYZ');
  });

  it('extrae el id de una URL corta youtu.be/ con parámetros adicionales', () => {
    expect(extraerIdYoutube('https://youtu.be/abc123?t=30')).toBe('abc123');
  });

  it('extrae el id de una URL con formato youtube.com/embed/', () => {
    expect(extraerIdYoutube('https://www.youtube.com/embed/abc123XYZ')).toBe('abc123XYZ');
  });

  it('admite el subdominio m.youtube.com', () => {
    expect(extraerIdYoutube('https://m.youtube.com/watch?v=abc123')).toBe('abc123');
  });

  it('devuelve null para una URL que no es de YouTube', () => {
    expect(extraerIdYoutube('https://example.com/video')).toBeNull();
  });

  it('devuelve null para una URL con formato inválido', () => {
    expect(extraerIdYoutube('no-es-una-url')).toBeNull();
  });

  it('devuelve null para la raíz de youtube.com sin ruta de vídeo', () => {
    expect(extraerIdYoutube('https://www.youtube.com/')).toBeNull();
  });

  it('devuelve null para una URL youtu.be sin identificador de vídeo', () => {
    expect(extraerIdYoutube('https://youtu.be/')).toBeNull();
  });

  it('devuelve null para una URL youtube.com/watch sin parámetro v', () => {
    expect(extraerIdYoutube('https://www.youtube.com/watch?list=PL1234')).toBeNull();
  });
});
