# Porra Mundial 2026

Este proyecto es una aplicación web para gestionar una "porra" (quiniela/apuestas) del Mundial de fútbol de 2026. Permite a los participantes introducir sus predicciones en archivos Excel, y la aplicación se encarga de procesarlos, calcular puntuaciones y mostrar clasificaciones y resultados.

## Características

-   **Gestión de Participantes:** Carga las predicciones de los participantes desde archivos Excel.
-   **Visualización de Partidos:** Muestra información detallada de los partidos.
-   **Clasificaciones Dinámicas:** Genera y muestra la clasificación de los participantes.
-   **Cuadros Eliminatorios:** Representación visual de las fases eliminatorias del torneo.
-   **Integración con API de Fútbol:** Obtiene datos actualizados de partidos y equipos.
-   **Despliegue Sencillo:** Configurado para ser desplegado fácilmente en plataformas como Netlify.

## Tecnologías Utilizadas

-   **Frontend:**
    -   Vue.js 3 (con Composition API y `<script setup>`)
    -   Vite (como herramienta de desarrollo y bundling)
    -   TypeScript
    -   Pinia (para la gestión del estado)
    -   Vue Router (para la navegación)
    -   SCSS (para estilos)
-   **Backend (Funciones Netlify):**
    -   JavaScript/Node.js
    -   Integración con una API de datos de fútbol (v4 de `api.football-data.org`).
-   **Procesamiento de Datos:**
    -   Lectura y parseo de archivos Excel (`.xlsx`)
    -   Módulos virtuales de Vite para gestión dinámica de manifiestos.

## Configuración del Proyecto

### Requisitos

-   Node.js (versión 18 o superior recomendada)
-   npm o Yarn

### Instalación

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/porra-mundial.git
    cd porra-mundial
    ```
2.  Instala las dependencias:
    ```bash
    npm install
    # o yarn install
    ```

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con tus claves de API de fútbol. Puedes obtener estas claves registrándote en `api.football-data.org`.

```
FOOTBALL_API_KEY=tu_primera_clave_api
FOOTBALL_API_KEY_2=tu_segunda_clave_api # Opcional: para rotación en caso de límite de peticiones
```

### Archivos de Predicciones Excel

Coloca los archivos Excel de predicciones de los participantes en la carpeta `public/data/excel/`. Los nombres de los archivos deben seguir el formato `Excel-Mundial-2026_NombreParticipante.xlsx`. La aplicación leerá automáticamente los nombres de los participantes de estos archivos.

## Ejecución del Proyecto

### Modo Desarrollo

Para iniciar el servidor de desarrollo local:

```bash
npm run dev
# o yarn dev
```

Esto iniciará la aplicación en `http://localhost:5173` (o un puerto similar).

### Construcción para Producción

Para construir la aplicación para producción:

```bash
npm run build
# o yarn build
```

Los archivos de salida se generarán en la carpeta `dist/`.

## Despliegue

Este proyecto está configurado para un despliegue sencillo, especialmente en Netlify, gracias a la configuración de funciones serverless y el proxy integrado en Vite.

1.  **Netlify Functions:** Las funciones serverless se encuentran en `netlify/functions/`.
2.  **Configuración de Netlify:** El archivo `netlify.toml` ya está configurado para el despliegue.

---

¡Disfruta gestionando tu Porra del Mundial!
