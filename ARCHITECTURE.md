# 📐 Arquitectura del Proyecto: D&D 5e Character Builder & Sheet Manager

Este documento describe la arquitectura y los estándares de diseño aplicados en este proyecto. Para mantener el código mantenible, escalable y testable a largo plazo, seguimos una **Arquitectura en Capas (Clean Architecture)** tanto en el Backend (NestJS) como en el Frontend (Angular).

---

## 🎨 Principio de Diseño Fundamental: Regla de Dependencia

El principio rector es que **las dependencias de código solo pueden apuntar hacia adentro**. 
* Las capas más externas (detalles de frameworks, interfaces de usuario, base de datos) dependen de las capas internas (casos de uso, reglas de negocio).
* Las capas internas nunca dependen de ningún framework o biblioteca externa. Esto nos permite cambiar de base de datos o de framework de UI sin alterar la lógica central del juego D&D.

```text
       ┌────────────────────────────────────────────────────────┐
       │                 Capas de la Aplicación                 │
       │                                                        │
       │   [Presentación / UI]                                  │
       │           │                                            │
       │           ▼                                            │
       │   [Aplicación (Casos de Uso)]                          │
       │           │                                            │
       │           ▼                                            │
       │   [Dominio (Modelos & Reglas D&D)] ◄─── [Infraestr.]   │
       │                                                        │
       └────────────────────────────────────────────────────────┘
```

---

## 🖥️ Arquitectura del Backend (NestJS)

El código del servidor en `Backend/src/` está organizado en cuatro capas diferenciadas:

### 1. Dominio (`src/domain/`)
La capa más interna. Contiene las reglas puras del juego D&D y las entidades.
*   **`models/`**: Entidades del negocio (ej. `Character`, `Spell`, `Skill`). Son clases o tipos TypeScript puros.
*   **`repositories/`**: Interfaces que definen cómo se guardan y obtienen los datos (ej. `ICharacterRepository`). No implementan la lógica de base de datos, solo declaran la firma de los métodos.

### 2. Aplicación (`src/application/`)
Orquesta el flujo de datos desde y hacia el dominio.
*   **`services/`**: Casos de uso (ej. `CreateCharacterService`, `LevelUpService`). Aquí se implementa la lógica que coordina las reglas del juego.
*   **`dto/`**: Objetos de transferencia de datos (Data Transfer Objects) que validan la entrada del usuario usando `class-validator`.

### 3. Infraestructura (`src/infrastructure/`)
Contiene los detalles de implementación tecnológica y herramientas externas.
*   **`persistence/`**: Esquemas de Mongoose, conexiones a la base de datos y la implementación concreta de las interfaces definidas en la capa de dominio (ej. `MongoCharacterRepository`).
*   **`security/`**: Estrategias de Passport JWT, encriptación con bcrypt y guards de autorización.

### 4. Presentación (`src/presentation/`)
Punto de entrada de la aplicación.
*   **`controllers/`**: Manejadores de las rutas HTTP (ej. `CharacterController`). Validan las solicitudes, llaman a la capa de aplicación y retornan las respuestas HTTP.

---

## 🎨 Arquitectura del Frontend (Angular)

La aplicación Angular en `Frontend/src/app/` está estructurada en módulos altamente especializados para evitar el acoplamiento:

### 1. Core (`src/app/core/`)
Servicios globales de la aplicación que se inicializan una sola vez (Singletons).
*   Guards de rutas (ej. `auth.guard.ts`).
*   Interceptores HTTP (para inyectar tokens JWT en las cabeceras).
*   Servicios de estado global y sesión del usuario.

### 2. Data (`src/app/data/`)
La capa de comunicación externa.
*   Servicios API de Angular que consumen los endpoints REST del backend.
*   Modelos de datos específicos del cliente.

### 3. Features (`src/app/features/`)
Los componentes de página principales. Cada funcionalidad grande tiene su propia carpeta.
*   `character-creator/`: Formularios interactivos y flujo paso a paso.
*   `sheet-active/`: Panel de juego del jugador para rastrear PV, hechizos e inventario.
*   `dashboard/`: Pantalla de inicio con la lista de personajes del usuario.

### 4. Shared (`src/app/shared/`)
Componentes visuales y lógicos que no contienen lógica de negocio propia y son 100% reutilizables.
*   Botones con temática medieval/rolera, inputs de texto, barras de vida animadas.
*   Directivas y tuberías (pipes) comunes (ej. formateadores de texto o dados).

---

## 📝 Guía de Desarrollo para Nuevas Funcionalidades

Cuando agregues una nueva funcionalidad (ejemplo: *Gestión de Conjuros*):
1. **Define la Entidad en el Dominio**: Crea el archivo de modelo `spell.model.ts` en `domain/models/`.
2. **Crea el Repositorio (Interface)**: Define `ISpellRepository` en `domain/repositories/`.
3. **Escribe el Caso de Uso en Aplicación**: Crea el servicio de negocio correspondiente en `application/services/`.
4. **Implementa la Persistencia**: Crea el esquema de Mongoose en `infrastructure/persistence/` y escribe el repositorio concreto de Mongo.
5. **Crea el Controlador**: Expón los endpoints HTTP en `presentation/controllers/`.
6. **Conecta el Frontend**: Crea el servicio de consumo de API en `data/`, añade la UI en `features/` y usa componentes visuales de `shared/`.
