<div align="center">
  <h1>📦 SILPP: Sistema de Inventario por Lotes de Productos Perecederos</h1>
  <p><i>Gestión inteligente, trazabilidad absoluta y control de mermas.</i></p>

  <!-- Badges del Stack Tecnológico -->
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/State-Redux_Toolkit-764ABC?style=for-the-badge&logo=redux&logoColor=white" alt="Redux Toolkit" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/Security-JWT-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white" alt="JWT" />
</div>

---

## 👁️ Visión del Proyecto

En la industria de alimentos y productos perecederos, el tiempo es el factor más crítico. **SILPP** nace con un objetivo claro: **erradicar las pérdidas por caducidad (mermas)** mediante un control logístico estricto basado en la metodología FEFO (*First Expires, First Out*).

El sistema garantiza que cada unidad que ingresa al almacén esté vinculada a un **Lote** específico con fecha de fabricación y caducidad. Esto permite una trazabilidad end-to-end, asegurando que los productos más próximos a vencer sean los primeros en salir a exhibición, protegiendo tanto la rentabilidad del negocio como la salud del consumidor final.

## 🏗️ Especificaciones Técnicas

### Arquitectura General
SILPP está diseñado bajo una arquitectura Cliente-Servidor acoplada mediante una API RESTful.
- **Frontend (SPA):** Desarrollado en React, ofrece una experiencia de usuario fluida, reactiva y orientada a operarios de almacén.
- **Backend (API):** Servidor Node.js con Express, encargado de la lógica transaccional atómica y el cálculo dinámico de existencias.

### Seguridad y Autenticación
- **JSON Web Tokens (JWT):** Las sesiones son gestionadas mediante tokens encriptados. Las rutas del backend están protegidas por middlewares que verifican la firma del token y los permisos de rol del usuario (Operativo, Táctico, Auditor), garantizando el principio de menor privilegio.

### Base de Datos Relacional
- Motor **MySQL/MariaDB** (Motor InnoDB para transacciones ACID).
- Diseño normalizado que separa el maestro de `Productos` de la entidad transaccional `Lote`.
- El stock no es un campo estático; se calcula de forma dinámica agregando los registros de la tabla `Historial_Movimiento`, lo que asegura auditorías perfectas y evita inconsistencias de datos.

> 📐 **Nota de Ingeniería:** El diseño del software fue respaldado por un riguroso modelado UML, incluyendo **Diagramas de Secuencia** para los flujos transaccionales críticos y **Diagramas de Clase** para la estructura de la base de datos, garantizando la escalabilidad y calidad del código.

---

## 📋 Checklist de Progreso

A continuación, el estado actual del desarrollo basado en nuestros Sprints ágiles:

### ✅ Implementado
- [x] **Arquitectura y Diseño:** Modelado de Diagramas de Clase y Secuencia terminados.
- [x] **Base de Datos:** Estructura SQL normalizada y poblada con datos semilla.
- [x] **Seguridad:** Autenticación de usuarios y middlewares de protección JWT.
- [x] **Catálogo Maestro:** CRUD de Productos (identificación por SKU y EAN).
- [x] **Core Lógico:** Motor transaccional para ingreso y trazabilidad de lotes.
- [x] **Frontend UI:** Interfaz Dark-Industrial responsiva y adaptada a dispositivos móviles.

### 🚀 Próximas Mejoras (To-Do)
- [ ] **Sistema de Alertas:** Cron-jobs para notificar automáticamente sobre caducidad próxima.
- [ ] **Reportes Gerenciales:** Generación y descarga de reportes de eficiencia en PDF.
- [ ] **Infraestructura:** Dockerización completa de los contenedores (Frontend, Backend, BD).
- [ ] **CI/CD & Despliegue:** Configuración de pipelines en GitHub Actions para paso a producción.

---

<div align="center">
  <i>Desarrollado con altos estándares de ingeniería de software.</i>
</div>
