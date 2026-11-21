# Contenido de juego

El contenido (clases, subclases, especies, trasfondos, dotes, conjuros, invocaciones, metamagia y paquetes de equipo) ya no vive escrito dentro del código: se guarda en PostgreSQL y se podrá editar desde el panel de administración. Estos archivos son el punto de partida y la copia de respaldo.

## Carpetas

| Carpeta / archivo | Qué es |
| --- | --- |
| `legacy/` | El contenido tal como estaba en el frontend y en el seeder de Mongo, extraído sin cambios (`npm run content:extract`). Solo referencia histórica. |
| `srd-classification.json` | Qué está en el SRD 5.2.1 y qué no, con los **nombres nuevos** de lo que no está. Edítalo aquí si quieres otros nombres. |
| `data/` | Contenido normalizado que se carga en la BD (`npm run content:build`). `_build-report.json` lista avisos. |

## Flujo

```bash
npm run content:build     # legacy + clasificación → data/*.json
npm run db:migrate        # crea las tablas en PostgreSQL
npm run db:seed           # carga lo que falte (no pisa cambios hechos desde el admin)
npm run db:seed:sync      # además sobrescribe con lo que diga data/*.json
npm run db:migrate-mongo  # simula la copia de usuarios y personajes desde Mongo
npm run db:migrate-mongo -- --apply   # la ejecuta
```

## Origen del contenido

Cada fila lleva `source`:

- `SRD_5_2_1`: viene del SRD 5.2.1 (CC-BY-4.0). Se puede publicar con la frase de atribución.
- `HOMEBREW`: contenido propio. Lo que no está en el SRD se conserva así, con nombre nuevo y `needsRewrite = true`.

**Cambiar el nombre no es suficiente.** El derecho de autor protege el texto y la forma concreta de presentar las reglas, no las mecánicas en abstracto. Para que un elemento `HOMEBREW` deje de tener `needsRewrite`:

1. Su descripción y sus rasgos deben estar escritos con palabras propias, sin copiar ni parafrasear frase a frase el Manual del Jugador.
2. Su paquete de reglas no debe ser una copia exacta del libro: ajusta al menos algunos rasgos, niveles o números.
3. No debe usar nombres propios del libro (personajes, lugares, dioses) en sus textos.

Los conjuros, invocaciones y metamagia se cargan como SRD pero con `verified = false` hasta cotejarlos uno a uno con el SRD 5.2.1: la mayoría está, pero no todos.

## Renombres propuestos

### Subclases (36 renombradas; se mantienen las 12 del SRD)

| Clase | Nombre anterior | Nombre nuevo |
| --- | --- | --- |
| Hechicero | Hechicería aberrante | Hechicería del Vacío |
| Hechicero | Hechicería de magia salvaje | Hechicería del Caos |
| Hechicero | Hechicería mecánica | Hechicería del Orden |
| Bárbaro | Senda del Árbol del Mundo | Senda de la Raíz Eterna |
| Bárbaro | Senda del Corazón Salvaje | Senda del Espíritu Bestial |
| Bárbaro | Senda del Fanático | Senda del Fervor Sagrado |
| Bardo | Colegio de la Danza | Colegio del Paso Ligero |
| Bardo | Colegio del Glamour | Colegio de la Corte Encantada |
| Bardo | Colegio del Valor | Colegio de los Cantares de Gesta |
| Brujo | Patrón Celestial | Patrón del Alba |
| Brujo | Patrón Feérico | Patrón de los Bosques Velados |
| Brujo | Patrón Primigenio | Patrón del Abismo Estelar |
| Clérigo | Dominio de la Guerra | Dominio del Estandarte |
| Clérigo | Dominio de la Luz | Dominio del Sol Naciente |
| Clérigo | Dominio del Engaño | Dominio de las Máscaras |
| Druida | Círculo de la Luna | Círculo de las Mil Formas |
| Druida | Círculo de las Estrellas | Círculo del Firmamento |
| Druida | Círculo del Mar | Círculo de las Mareas |
| Explorador | Acechador en la penumbra | Rastreador de las Sombras |
| Explorador | Errante feérico | Peregrino del Crepúsculo |
| Explorador | Señor de las bestias | Vínculo Salvaje |
| Guerrero | Caballero Arcano | Guardián Arcano |
| Guerrero | Guerrero Psiónico | Guerrero de la Mente Férrea |
| Guerrero | Maestro del Combate | Táctico de Batalla |
| Mago | Abjurador | Custodio Arcano |
| Mago | Adivino | Vidente |
| Mago | Ilusionista | Tejedor de Espejismos |
| Paladín | Juramento de la gloria | Juramento del Laurel |
| Paladín | Juramento de los antiguos | Juramento del Bosque Primigenio |
| Paladín | Juramento de venganza | Juramento de la Justicia Implacable |
| Monje | Guerrero de la Misericordia | Camino de la Mano Sanadora |
| Monje | Guerrero de la Sombra | Camino del Velo Nocturno |
| Monje | Guerrero de los Elementos | Camino de los Cuatro Vientos |
| Pícaro | Asesino | Hoja Silenciosa |
| Pícaro | Embaucador arcano | Prestidigitador de Sombras |
| Pícaro | Rebanaalmas | Filo Psíquico |

### Trasfondos (12 renombrados; se mantienen Acólito, Criminal, Erudito y Soldado)

| Nombre anterior | Nombre nuevo |
| --- | --- |
| Animador | Juglar |
| Artesano | Aprendiz de Gremio |
| Campesino | Labriego |
| Charlatán | Embaucador de Feria |
| Comerciante | Mercader Ambulante |
| Ermitaño | Anacoreta |
| Escriba | Copista |
| Guardia | Centinela |
| Guía | Batidor |
| Marinero | Lobo de Mar |
| Noble | Heredero de Linaje |
| Vagabundo | Trotamundos |

### Dotes de origen (6 renombradas; se mantienen Alerta, Atacante Salvaje, Habilidoso e Iniciado en la Magia)

| Nombre anterior | Nombre nuevo |
| --- | --- |
| Afortunado | Buena Estrella |
| Duro | Piel Curtida |
| Fabricante | Manos de Artesano |
| Matón de Taberna | Pendenciero |
| Músico | Trovador |
| Sanador | Curandero de Campo |

### Especies (1 renombrada)

| Nombre anterior | Nombre nuevo |
| --- | --- |
| Aasimar | Celestino |
