import { describe, it, expect } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MapearCategoriaImportadaDialogComponent } from '../../../src/app/presentation/importar-ejercicios/mapear-categoria-importada-dialog.component';
import type { DatosMapearCategoriaImportadaDialog } from '../../../src/app/presentation/importar-ejercicios/mapear-categoria-importada-dialog.component';

describe('MapearCategoriaImportadaDialogComponent', () => {
  function configurar(datos: DatosMapearCategoriaImportadaDialog) {
    const cerrar = { close: (resultado: unknown) => cierres.push(resultado) };
    const cierres: unknown[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: cerrar },
        { provide: MAT_DIALOG_DATA, useValue: datos },
      ],
    });
    const fixture = TestBed.createComponent(MapearCategoriaImportadaDialogComponent);
    fixture.detectChanges();
    return { fixture, cierres };
  }

  const datosBase: DatosMapearCategoriaImportadaDialog = {
    pendientes: [
      { id: 'cat-comun-cadera', nombre: 'Cadera' },
      { id: 'cat-comun-hombro', nombre: 'Hombro' },
    ],
    categoriasLocales: [
      { id: 'cat-local-piernas', nombre: 'Piernas' },
      { id: 'cat-local-brazos', nombre: 'Brazos' },
    ],
  };

  it('muestra una fila por cada categoría común no reconocida (no por ejercicio)', () => {
    const { fixture } = configurar(datosBase);
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Cadera');
    expect(texto).toContain('Hombro');
  });

  it('Continuar está deshabilitado hasta resolver todas las filas', () => {
    const { fixture } = configurar(datosBase);
    const componente = fixture.componentInstance;

    expect(componente.todasResueltas()).toBe(false);

    componente.elegir('cat-comun-cadera', 'cat-local-piernas');
    expect(componente.todasResueltas()).toBe(false);

    componente.elegir('cat-comun-hombro', 'cat-local-brazos');
    expect(componente.todasResueltas()).toBe(true);
  });

  it('Continuar cierra el diálogo con el mapeo completo', () => {
    const { fixture, cierres } = configurar(datosBase);
    const componente = fixture.componentInstance;
    componente.elegir('cat-comun-cadera', 'cat-local-piernas');
    componente.elegir('cat-comun-hombro', 'cat-local-brazos');

    componente.continuar();

    expect(cierres).toEqual([
      new Map([
        ['cat-comun-cadera', 'cat-local-piernas'],
        ['cat-comun-hombro', 'cat-local-brazos'],
      ]),
    ]);
  });

  it('Cancelar cierra el diálogo sin aplicar ningún mapeo', () => {
    const { fixture, cierres } = configurar(datosBase);
    fixture.componentInstance.elegir('cat-comun-cadera', 'cat-local-piernas');

    fixture.componentInstance.cancelar();

    expect(cierres).toEqual([null]);
  });
});
