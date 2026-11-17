Ya tienes los dos artefactos:

- `app-release-signed.apk`: para probarlo directamente en Android.
- `app-release-bundle.aab`: el archivo que se sube a Google Play.

Sigue este orden.

## 1. Prueba primero el APK

Instala el APK firmado en un móvil Android:

```text
app-release-signed.apk
```

Comprueba:

- Que aparece el icono **Ejercicios**.
- Que abre la pantalla **Hoy**.
- Que no aparece la barra de direcciones de Chrome.
- Que puedes navegar por **Buscar → ficha de ejercicio → Atrás**.
- Que puedes crear un ejercicio y cerrar/reabrir la aplicación.
- Que funcionan Google Drive, exportación e importación de copias si los utilizas.

## 2. Publica `assetlinks.json`

La aplicación solo funcionará como TWA sin barra del navegador cuando el archivo esté publicado en:

```text
https://rsolerv.github.io/.well-known/assetlinks.json
```

No debe publicarse únicamente dentro de `physical-exercises-app`. Debes copiar el contenido de `assetlinks.json` al repositorio de GitHub Pages raíz:

```text
rsolerv/rsolerv.github.io
```

La ruta dentro de ese repositorio debe ser:

```text
.well-known/assetlinks.json
```

Después verifica que responde con HTTP 200:

```powershell
curl.exe -I https://rsolerv.github.io/.well-known/assetlinks.json
```

El `package_name` debe ser exactamente:

```json
"io.github.rsolerv.physicalexercises"
```

El archivo necesita contener:

1. La huella del certificado local usado para firmar el APK.
2. La huella del certificado **Google Play App Signing**.

Actualmente todavía aparece este marcador:

```text
PENDIENTE_HUELLA_GOOGLE_PLAY
```

No publiques el archivo definitivo hasta sustituirlo por la huella real de Google Play.

## 3. Crea la aplicación en Google Play Console

Entra en:

[Google Play Console](https://play.google.com/console)

Crea una aplicación nueva con:

- **Nombre**: Gestión de Ejercicios Físicos
- **Idioma predeterminado**: Español
- **Aplicación**: Android
- **Gratuita o de pago**: según tu decisión
- **Identificador del paquete**: `io.github.rsolerv.physicalexercises`

El identificador debe coincidir exactamente con el de `twa-manifest.json`.

## 4. Completa la ficha de Play Store

Necesitarás preparar:

- Nombre de la aplicación.
- Descripción breve.
- Descripción completa.
- Icono de la aplicación de 512 × 512.
- Capturas de pantalla de móvil.
- Capturas de pantalla de tablet, si quieres distribuirla también en tablets.
- Categoría.
- Correo electrónico de contacto.
- URL de privacidad:

```text
https://rsolerv.github.io/physical-exercises-app/politica-privacidad.html
```

La aplicación no debe declararse como una aplicación que recopila datos del servidor si todo el almacenamiento es local, pero tendrás que completar igualmente el formulario de **Seguridad de los datos** describiendo el comportamiento real de Google Drive, GitHub y cualquier otro servicio que utilices.

## 5. Configura la firma de Google Play

Cuando subas el primer AAB, Google Play te ofrecerá activar **Google Play App Signing**.

Selecciona la opción recomendada:

```text
Google gestiona la clave de firma de la aplicación
```

Conserva siempre de forma segura:

- `android.keystore`.
- La contraseña del almacén.
- La contraseña de la clave.
- El alias `android`.

No subas el keystore a GitHub ni lo pierdas. El archivo está excluido mediante `.gitignore`.

## 6. Sube el AAB a una prueba interna

Antes de producción, utiliza:

```text
app-release-bundle.aab
```

En Play Console, crea una versión en el canal:

```text
Pruebas internas
```

Sube el AAB y añade tu cuenta como tester. Es preferible probar primero en este canal antes de solicitar una revisión pública.

No vuelvas a ejecutar `npm run twa:update` sin necesidad: en tu versión de Bubblewrap incrementa automáticamente el `versionCode`. El AAB actual ya tiene una versión válida.

## 7. Obtén la huella de Google Play

Después de subir el AAB, ve en Play Console a la sección de integridad de la aplicación o firma de aplicaciones. Busca:

```text
Certificado de clave de firma de la aplicación
SHA-256
```

Copia esa huella, no la confundas con:

```text
Certificado de clave de subida
```

Para TWA interesa la huella de **App Signing**, porque es la que tendrán las instalaciones descargadas desde Google Play.

Añádela en `assetlinks.json`, sustituyendo:

```text
PENDIENTE_HUELLA_GOOGLE_PLAY
```

Después vuelve a publicar ese archivo en:

```text
https://rsolerv.github.io/.well-known/assetlinks.json
```

## 8. Comprueba la aplicación instalada desde Play

Cuando la prueba interna esté disponible:

1. Instálala desde Google Play, no mediante el APK.
2. Ábrela desde el icono.
3. Comprueba que no aparece la barra de Chrome.
4. Crea un ejercicio.
5. Cierra y vuelve a abrir la aplicación.
6. Comprueba los enlaces externos y el botón Atrás.
7. Comprueba la exportación de una copia de seguridad.

## 9. Publica en producción

Cuando la prueba interna sea correcta:

1. Crea una versión en **Producción**.
2. Selecciona el mismo AAB probado.
3. Completa todas las declaraciones pendientes.
4. Envía la aplicación a revisión.
5. Espera la aprobación de Google Play.

El procedimiento completo está documentado en `README-PUBLICACION-PLAY.md` y `quickstart.md`.

### Orden resumido

```text
1. Probar app-release-signed.apk
2. Crear la aplicación en Play Console
3. Subir app-release-bundle.aab a pruebas internas
4. Obtener la huella SHA-256 de Google Play App Signing
5. Actualizar y publicar assetlinks.json
6. Probar la instalación desde Google Play
7. Completar ficha, privacidad y seguridad de datos
8. Enviar a producción
```