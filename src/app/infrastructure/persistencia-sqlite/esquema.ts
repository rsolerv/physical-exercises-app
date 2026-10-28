/**
 * Esquema de la base de datos SQLite WASM (ver data-model.md).
 * Se expone como constante TypeScript (en vez de un archivo .sql suelto) para
 * poder importarla directamente tanto desde el Worker de persistencia como
 * desde los tests, sin necesidad de un loader de assets adicional.
 *
 * Todas las claves foráneas hacia `ejercicio` usan ON DELETE CASCADE para que,
 * al eliminar un ejercicio, desaparezca automáticamente de categorías, enlaces,
 * imágenes, días de planificación y progreso diario (FR-028, CA13).
 */
export const ESQUEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categoria (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS ejercicio (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  observaciones TEXT
);

CREATE TABLE IF NOT EXISTS ejercicio_categoria (
  ejercicio_id TEXT NOT NULL REFERENCES ejercicio(id) ON DELETE CASCADE,
  categoria_id TEXT NOT NULL REFERENCES categoria(id),
  PRIMARY KEY (ejercicio_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS ejercicio_enlace (
  id TEXT PRIMARY KEY,
  ejercicio_id TEXT NOT NULL REFERENCES ejercicio(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('web', 'youtube')),
  url TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ejercicio_imagen (
  ejercicio_id TEXT NOT NULL REFERENCES ejercicio(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('url', 'archivo')),
  valor_url TEXT,
  contenido_base64 TEXT,
  tipo_mime TEXT,
  nombre_archivo TEXT,
  PRIMARY KEY (ejercicio_id, id)
);

CREATE TABLE IF NOT EXISTS planificacion (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha_inicio TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS dia_planificacion (
  id TEXT PRIMARY KEY,
  planificacion_id TEXT NOT NULL REFERENCES planificacion(id) ON DELETE CASCADE,
  dia_semana TEXT NOT NULL CHECK (
    dia_semana IN ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo')
  ),
  UNIQUE (planificacion_id, dia_semana)
);

CREATE TABLE IF NOT EXISTS dia_planificacion_ejercicio (
  dia_planificacion_id TEXT NOT NULL REFERENCES dia_planificacion(id) ON DELETE CASCADE,
  ejercicio_id TEXT NOT NULL REFERENCES ejercicio(id) ON DELETE CASCADE,
  PRIMARY KEY (dia_planificacion_id, ejercicio_id)
);

CREATE TABLE IF NOT EXISTS progreso_diario (
  fecha TEXT NOT NULL,
  ejercicio_id TEXT NOT NULL REFERENCES ejercicio(id) ON DELETE CASCADE,
  realizado INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (fecha, ejercicio_id)
);

CREATE TABLE IF NOT EXISTS ajustes_aplicacion (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  token_github TEXT,
  repositorio_github TEXT,
  ultimo_sha_sincronizado TEXT,
  ultima_sincronizacion_correcta TEXT,
  cambios_locales_pendientes INTEGER NOT NULL DEFAULT 0,
  catalogo_predefinido_cargado INTEGER NOT NULL DEFAULT 0,
  metodo_sincronizacion TEXT,
  cuenta_google TEXT,
  destino_ultima_sincronizacion TEXT
);

INSERT OR IGNORE INTO ajustes_aplicacion (id) VALUES (1);

CREATE TABLE IF NOT EXISTS sincronizacion_destino (
  destino TEXT PRIMARY KEY,
  ultima_version TEXT NOT NULL,
  cambios_locales_pendientes INTEGER NOT NULL DEFAULT 0,
  ultima_sincronizacion TEXT NOT NULL
);
`;
