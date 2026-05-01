# 🖥️ Frontend SILPP (React)

Este directorio contiene la aplicación cliente (SPA) del Sistema de Inventario por Lotes de Productos Perecederos, diseñada para ser rápida, responsiva y altamente intuitiva para los operarios de almacén.

## 📂 Estructura de Carpetas

La arquitectura del proyecto sigue un patrón modular para separar responsabilidades y facilitar la escalabilidad:

```plaintext
src/
├── api/          # Configuración de Axios e interceptores para el token JWT.
├── components/   # Componentes UI reutilizables (Botones, Navbars, Cards).
├── layouts/      # Plantillas principales (MainLayout con navegación persistente).
├── pages/        # Vistas de la aplicación (Login, Lotes, Operaciones, Home).
├── store/        # Configuración del estado global.
├── App.jsx       # Enrutador principal (React Router DOM).
└── index.css     # Estilos globales y configuración de Tailwind CSS.
```

## 🧠 Gestión de Estado Global

Para manejar la complejidad del inventario, la sesión de usuario y la configuración dinámica de la interfaz, el sistema hace uso intensivo del estado global:

- **Manejo de Sesión (Auth):** Almacenamos de forma segura el perfil del usuario activo y sus roles (Operativo, Táctico, Auditor) para renderizar menús condicionales de inmediato.
- **Datos Temporales y Filtros:** Mantenemos las preferencias de búsqueda de lotes o accesos rápidos de la página de inicio sin tener que volver a consultar la base de datos en cada navegación.

*(Nota técnica: Aunque el requerimiento original establecía Redux Toolkit, la arquitectura modular actual permite utilizar librerías modernas de estado atómico o flux según la optimización requerida por los componentes).*

## ⚙️ Instalación y Ejecución

Sigue estos pasos para levantar el entorno de desarrollo local:

1. **Instalar dependencias:**
   Asegúrate de tener Node.js instalado. En la terminal, dentro del directorio `/front`, ejecuta:
   ```bash
   npm install
   ```

2. **Configurar Variables de Entorno:**
   Crea un archivo `.env` en la raíz de `/front` (o utiliza el `.env.example` si está disponible) y define la URL del backend:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

3. **Ejecutar el Servidor de Desarrollo:**
   Inicia Vite con HMR (Hot Module Replacement):
   ```bash
   npm run dev
   ```
   El frontend estará disponible generalmente en `http://localhost:5173`.
