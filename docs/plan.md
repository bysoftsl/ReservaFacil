# Plan de implementación del MVP — ReservaFácil

**Base:** [Especificación del MVP](./spec.md) y [máquina de estados existente](../src/domain/stay-state-machine.ts). El diseño propone un monolito modular con NestJS, TypeScript y MySQL InnoDB. Las rutas y el modelo de persistencia son propuestas de implementación; las decisiones abiertas de la especificación no se dan por resueltas.

## 1. Arquitectura hexagonal

```text
src/
  domain/
    stay-state-machine.ts       # Núcleo existente: estados, roles y transiciones
    reservation/               # Intervalos y asignación factible de habitaciones
    pricing/                   # Cobertura de tarifas e importes exactos
  application/
    use-cases/                 # Usuarios, inventario, reservas, estancias,
                               # lista de espera, tarifas, movimientos y auditoría
    ports/
      in/                      # Comandos, consultas y sus resultados
      out/                     # Repositorios, unidad de trabajo, reloj,
                               # hash de contraseñas, emisión de JWT y auditoría
  infrastructure/
    adapters/domain/           # Adaptador de la máquina de estados al puerto
    persistence/typeorm/       # Entidades, mapeadores, adaptadores y migraciones
    security/                  # Implementaciones de JWT y hash
    observability/             # Registros operativos y métricas
  interfaces/
    http/                      # Controladores, DTO, guards, filtros y OpenAPI
    jobs/                      # Adaptador de entrada para reevaluación y avisos
  app.module.ts                # Composición de puertos y adaptadores con Nest
  main.ts
test/
  integration/                 # API real + MySQL InnoDB
  e2e/                         # Contratos HTTP y flujos del personal
```

- **Dependencias hacia dentro.** El dominio no importa NestJS, TypeORM ni HTTP. La aplicación depende del dominio y es dueña de los puertos. Los adaptadores traducen DTO y filas de base de datos; no exponen entidades ORM ni implementan las transiciones de negocio. NestJS conecta las implementaciones en el punto de composición.
- **Integración del núcleo existente.** Los casos de uso invocan `planStayTransition` con el rol autenticado y los estados leídos de la habitación realmente asignada y de la reserva. Aplican sus cambios juntos o rechazan la operación. Adaptan `role_not_allowed` a `403`, `invalid_state_transition` a `409` e `invalid_initial_state` a `422` en HTTP. La aplicación verifica además fechas y horarios, asignación, disponibilidad y tarifas donde corresponda. No se exponen endpoints que escriban el estado de reserva directamente.
- **Base implementada de la Tarea 2.** [ChangeStayStateUseCase](../src/application/use-cases/change-stay-state.use-case.ts) recibe el rol y un `StayTransition`, delega en [StayTransitionPort](../src/application/ports/out/stay-transition.port.ts) y devuelve `StayTransitionResult` sin modificarlo. [StayTransitionAdapter](../src/infrastructure/adapters/domain/stay-transition.adapter.ts) invoca la función pura y `AppModule` lo conecta mediante el token `STAY_TRANSITION_PORT`. Este caso de uso solo valida y planifica: no escribe estados; la persistencia atómica y la traducción HTTP quedan para las tareas posteriores. `npm run test:unit` compila y ejecuta las pruebas Jest con un puerto simulado y una comprobación de la composición real de NestJS; `npm test` conserva también las pruebas existentes de dominio y salud HTTP.
- **Límites claros.** Recepción y Administración comparten las operaciones concedidas por la matriz. En espera y pendiente de aprobación son estados de solicitudes distintas, no de la reserva. Los avisos no cambian estados y no tienen API de escritura. El estado de mantenimiento existe en el dominio, pero sus transiciones están bloqueadas hasta PA-003.

## 2. Modelo de datos: TypeORM + MySQL InnoDB

Migraciones versionadas, `synchronize: false` y `utf8mb4`. Identificadores `BIGINT UNSIGNED` como cadenas en TypeScript y JSON para evitar pérdida de precisión. Fechas hoteleras en `DATE`, sin convertirlas a instantes. Instantes en `DATETIME(3)` tratados como UTC en la aplicación y el adaptador. Importes USD en `DECIMAL(13,2)`, mapeados a cadenas decimales y operados con aritmética decimal, nunca con `number`. Los estados de habitación y reserva se guardan con los valores de los enums existentes, restringidos en base y validados al mapear. Usar claves foráneas restrictivas para conservar el historial; desactivación y cancelación no son borrados.

| Tabla | Columnas, relaciones y restricciones principales |
| --- | --- |
| `staff_user` | `username VARCHAR(100) UNIQUE`, `password_hash VARCHAR(255)`, `role`, `active BOOLEAN`. Referenciada por solicitudes de cambio, movimientos y auditoría. |
| `room_type` | Nombre, descripción, capacidad máxima `SMALLINT UNSIGNED` positiva y estado activo. Un tipo tiene habitaciones y tarifas. |
| `room` | `number VARCHAR(32) UNIQUE`, `room_type_id` FK, capacidad positiva, ubicación, descripción/comodidades, `active BOOLEAN`, `operational_state`. Índice por tipo y vigencia. Desactivación, estado operativo y bloqueo son conceptos distintos. |
| `room_block` | `room_id` FK, `starts_on DATE`, `ends_on DATE NULL` (indefinido), `released_at DATETIME(3) NULL`. Validar `ends_on > starts_on` si existe; índice `(room_id, released_at, starts_on, ends_on)`. |
| `guest` | Nombre, documento como `VARCHAR` (conserva ceros iniciales), teléfono, correo y notas opcionales. Solo los campos necesarios se devuelven a personal autorizado; no copiar datos de identificación a auditoría. |
| `reservation` | `guest_id`, `room_type_id` y `room_id NULL` como FK; `arrival_on` y `departure_on` como `DATE`, cantidad de huéspedes, estado y `checked_in_at`/`checked_out_at` anulables. `CHECK (departure_on > arrival_on)`. Índices `(status, arrival_on, departure_on)` y `(room_id, status, arrival_on, departure_on)`. Preservar fechas previstas e instantes reales; finalizar o confirmar la ausencia libera las noches que corresponden sin borrar el historial. |
| `reservation_change_request` | FK a reserva, solicitante y administrador que resuelve (anulable); opción solicitada con fechas, tipo, habitación opcional y cantidad; estado de aprobación y marcas de tiempo. Índice `(reservation_id, status)`. La opción anterior permanece activa durante la revisión. |
| `waitlist_request` | FK a huésped, tipo y habitación solicitada opcional; fechas, cantidad, estado y FK opcional a la reserva original y a la confirmada. La relación hacia la reserva confirmada no puede duplicarse; la confirmación se valida y persiste atómicamente. |
| `notice` | Tipo (`disponibilidad`, `salida_tardia`, `posible_ausencia`), instante, clave de deduplicación única y FK a **una sola** entidad: solicitud en espera o reserva, según tipo. No incluye acciones de marcado por el usuario. |
| `room_rate` | `room_type_id` FK, `night DATE`, `amount_usd DECIMAL(13,2)`, `UNIQUE (room_type_id, night)`. Un rango de carga, si se incorpora, se descompone en noches y se escribe atómicamente. |
| `pricing_rule` | Configuración de impuesto o cargo, vigencia, modalidad fija o porcentual según lo acordado en PA-007; monto `DECIMAL(13,2)` o tasa `DECIMAL(9,6)` sin coma flotante. Solo Administración escribe. |
| `reservation_price` / `reservation_price_line` | Versión de cálculo por reserva (`UNIQUE (reservation_id, version)`), subtotal y total; líneas con la noche o concepto aplicado y el importe exacto. Guardar los valores usados, no solo referencias a una tarifa editable. |
| `payment_movement` | `reservation_id` y `recorded_by` como FK; tipo de movimiento (`anticipo`, `pago_parcial`, `pago_completo`, `reembolso`), `amount_usd DECIMAL(13,2)` positivo y fecha de registro. Registrar no equivale a ejecutar ni autorizar el pago o reembolso. |
| `audit_event` | Fecha, acción, resultado, `actor_id NULL`, tipo e ID del recurso cuando se conozcan, y `request_id CHAR(36) NULL`. Solo inserción desde el sistema y lectura administrativa. Índice `(occurred_at, id)` para el cursor. |
| `availability_guard` | Fila fija por hotel de este MVP, creada en migración y bloqueada por su clave primaria. Si falta, la escritura falla; nunca se omite el bloqueo ni se crea la fila durante una reserva. |

### Disponibilidad y compromisos

Los intervalos son `[entrada, salida)` en `America/Guayaquil`. El solapamiento se comprueba con `entrada_existente < salida_solicitada AND salida_existente > entrada_solicitada`. Modelar por separado compatibilidad (tipo y capacidad), compromisos para todas las noches de cada estancia y estado operativo para el check-in. Una consulta futura no excluye una habitación solo por estar limpiándose hoy.

Para RF-026, conservar las asignaciones fijas y resolver las reservas sin habitación junto con la nueva solicitud o cambio. Con 20 habitaciones, empezar con búsqueda exacta con retroceso: elegir primero la reserva con menos habitaciones candidatas, usar una sola habitación por estancia y descartar candidatos si sus noches chocan con bloqueos o asignaciones. Incluir los compromisos conectados por solapamiento y compatibilidad aunque caigan fuera del intervalo inicial. Un conteo libre por noche o una asignación voraz no prueba que la estancia completa sea factible. Usar la misma regla al simular cambios de inventario (RF-065).

### Tarifas y PA-007

- **Resuelto (RF-046 / RF-074):** exactamente una tarifa por noche y tipo. Si falta una o se detectan varias, devolver `409` con el tipo y las noches afectadas; no calcular un importe parcial, usar una tarifa de respaldo, cambiar una reserva existente ni crear una solicitud en espera por ese error. La unicidad impide nuevos solapamientos; probar también el rechazo a datos inconsistentes en el dominio y el rechazo de duplicados en la base.
- **Propuesta a validar en PA-007:** almacenar una versión inmutable para cada cálculo aceptado. Cambiar el catálogo no alteraría importes ya guardados; cuando se acuerde recalcular un cambio de reserva se generaría otra versión. Antes de exponer el cálculo fiscal definitivo, decidir qué cambios recalculan, qué tarifas se aplican entonces, si los conceptos son por noche o por estancia, la base de cálculo, el orden y el punto y modo de redondeo. No aceptar implícitamente impuesto cero ni fijar reglas fiscales por defecto.

## 3. Contrato de API para OpenAPI

Publicar el contrato OpenAPI desde el adaptador HTTP con `@nestjs/swagger`. Prefijo propuesto: `/api/v1`. Los estados normativos están en la [sección 7: contrato HTTP mínimo](./spec.md#contrato-http-mínimo); la [sección 8](./spec.md#8-criterios-de-aceptación) define los escenarios que deben verificarlos. Las rutas siguientes son el inventario mínimo propuesto, no un documento OpenAPI generado.

**Transversal:** todas las operaciones salvo el login usan JWT Bearer (`401` con `WWW-Authenticate: Bearer` para token ausente o inválido). `403` si falta permiso, `400` para estructura, formato o cursor inválidos y `500` genérico ante fallos inesperados. `404` si no existe el recurso individual solicitado; una lista vacía es `200`. La tabla muestra los éxitos y los demás errores específicos de cada flujo.

| Método y ruta (relativa al prefijo) | Roles | Éxito y errores específicos |
| --- | --- | --- |
| `POST /auth/login` | Público | `200` JWT; `400` para credenciales no aceptadas, con mensaje genérico según el contrato. |
| `POST /usuarios`; `GET /usuarios/{id}` | Administrador | `201` con `Location`; `200` detalle; `409` si ya existe el nombre al crear. No exponer hashes. |
| `PATCH /usuarios/{id}`; `POST /usuarios/{id}/desactivar` | Administrador | `200` al actualizar; `204` al desactivar. |
| `GET /tipos-habitacion`, `GET /tipos-habitacion/{id}`; `GET /habitaciones`, `GET /habitaciones/{id}` | Ambos | `200` lista o detalle. |
| `POST /tipos-habitacion`; `POST /habitaciones` | Administrador | `201` con `Location`; habitación: `409` si el número está duplicado, `422` si el estado inicial no se permite. |
| `PATCH /tipos-habitacion/{id}`; `PATCH /habitaciones/{id}`; `POST /tipos-habitacion/{id}/desactivar`; `POST /habitaciones/{id}/desactivar` | Administrador | `200`; `409` si compromete reservas (RF-065). El `PATCH` de datos no permite escribir el estado operativo. |
| `PATCH /habitaciones/{id}/estado-operativo` | Ambos | `200`; `409` por transición ilegal (RF-014-bis). |
| `POST /habitaciones/{id}/bloqueos`; `GET /bloqueos/{id}`; `DELETE /bloqueos/{id}` | Administrador | `201` con `Location`, `200` detalle o `204` al desbloquear sin cuerpo; `409` si compromete reservas; `422` por rango inválido. El desbloqueo conserva historial. |
| `GET /disponibilidad` | Ambos | `200` incluso sin resultados; `422` si el intervalo o la cantidad es inválido para la opción. |
| `POST /reservas` | Ambos | `201` con `Location` de la **reserva** o de la **solicitud en espera** (RF-030); `409` por tarifas inválidas (RF-074); `422` por fechas o capacidad inválidas. |
| `GET /reservas`; `GET /reservas/{id}` | Ambos | `200` lista o detalle dentro de los permisos; auditar las consultas de datos de huéspedes. |
| `PUT /reservas/{id}/habitacion`; `PATCH /reservas/{id}` | Ambos | Asignación: `200` o `409` por conflicto de disponibilidad o estado. Cambio: `200` si se aplicó, incluso si el Administrador cancela y pasa a espera conforme a RF-035; `201` con `Location` si Recepción crea una solicitud pendiente. `409` si el estado o las tarifas impiden la operación; `422` por fechas o capacidad inválidas. |
| `GET /solicitudes-de-cambio/{id}`; `POST /solicitudes-de-cambio/{id}/aprobar` | Detalle: Administrador o solicitante (propuesta); aprobación: Administrador | `200`; al aprobar, la respuesta distingue si se actualizó la reserva o si se canceló y se creó la solicitud en espera. `409` por estado incompatible o RF-074. El rechazo queda en PA-004. |
| `POST /reservas/{id}/cancelar` | Administrador | `200`; `409` si no está confirmada. No devuelve ni autoriza dinero. |
| `GET /solicitudes-en-espera`; `GET /solicitudes-en-espera/{id}`; `POST /solicitudes-en-espera/{id}/confirmar` | Ambos | `200` lista/detalle; `201` con `Location` de la nueva reserva; `409` si ya no hay disponibilidad, ya fue confirmada o falla la validación de tarifas. |
| `POST /reservas/{id}/check-in`; `POST /reservas/{id}/check-out`; `POST /reservas/{id}/confirmar-ausencia` | Ambos | `200`; `409` si el estado, la asignación, la fecha de operación o la transición no lo permiten. El check-out devuelve el estado de la reserva y de la habitación. |
| `GET /avisos` | Ambos | `200` lista paginada; sin escrituras por HTTP. |
| `POST /tarifas`; `GET /tarifas/{id}`; `PATCH /tarifas/{id}` | Administrador | `201` con `Location`; `200` detalle o actualización; `409` al duplicar una noche del mismo tipo; `422` por importe inválido. |
| `POST /impuestos-y-cargos`; `GET /impuestos-y-cargos/{id}`; `PATCH /impuestos-y-cargos/{id}` | Administrador | `201` con `Location`; `200` detalle o actualización; `422` por configuración inválida. Validaciones fiscales definitivas sujetas a PA-007. |
| `POST /reservas/{id}/movimientos`; `GET /reservas/{id}/movimientos`; `GET /reservas/{id}/movimientos/{movimientoId}` | Ambos; solo Administrador registra reembolsos | `201` con `Location`; `200` lista o detalle; `422` para importes inválidos. Aplicar las reglas pendientes de PA-008 antes de habilitar los flujos que dependan de ellas. |
| `GET /auditoria/eventos` | Administrador | `200` lista paginada; solo lectura, sin contraseñas, tokens ni datos personales innecesarios. |

**Componentes de OpenAPI que se deben implementar:**

- `ProblemDetails` (`application/problem+json`, RFC 9457): `type`, `title`, `status`, `detail` e `instance`. Usar tipos de problema estables; ampliar el error de tarifas con tipo de habitación, noches y motivo sin datos de huéspedes.
- `X-Request-Id`: UUID v4 generado por la API en toda respuesta, incluido `204`; mismo ID en registro operativo e `instance` (`urn:uuid:<id>`). `Location` obligatorio en `201`, nunca confundir una reserva con una solicitud. El `204` no tiene cuerpo.
- Listados con `limit` de `1` a `100` (predeterminado `25`), `cursor` opaco ligado a filtros y orden, y respuesta `{items, nextCursor}` (`null` al final). Cada página valida permisos; no se ofrece offset ni recuento total.
- DTO con `format: date` para entrada y salida previstas; `format: date-time` con zona y salida en UTC para las marcas de estancia. Importes decimales serializados como cadenas, con moneda USD.
- En `POST /reservas`, esquema `oneOf` con discriminador `resultado` (`reserva_confirmada` o `solicitud_en_espera`) para el `201`. Describir igualmente las alternativas de `PATCH /reservas/{id}` y la aprobación de cambios. Validar esquemas y ejemplos contra respuestas reales.

## 4. Hitos y tareas atómicas

| Hito | Tarea | Entregable verificable |
| --- | --- | --- |
| Base | **Tarea 1 — Scaffolding de NestJS y configuración base** | Crear el esqueleto sin sobrescribir `src/domain`; usar el `tsconfig` de Nest ajustado a modo estricto, scripts de compilación y pruebas y configuración de entorno validada sin secretos en Git. Verificar arranque y `npm run build`. Mantener compilación de los enums existentes, no ejecución por borrado de tipos. |
| Base | **Tarea 2 — Integrar el dominio existente** | Invocar `planStayTransition` desde los casos de uso correspondientes mediante puertos, con pruebas unitarias y dobles de repositorio. Conservar los enums y los casos ilegales existentes; comprobar que los cambios conjuntos viajan como un único resultado y que un rechazo no escribe. |
| Base | **Tarea 3 — Adaptador HTTP común** | DTO, filtro RFC 9457, correlación y base OpenAPI; comprobar validación, cabeceras y ausencia de cuerpo en `204`. |
| Persistencia y acceso | **Tarea 4 — Migraciones y unidad de trabajo** | Migrar una base MySQL vacía, incluir la fila de control, conectar repositorios transaccionales y verificar commit y rollback en MySQL. |
| Persistencia y acceso | **Tarea 5 — Autenticación y roles** | Usuarios, hash de contraseñas, JWT y denegación por defecto según la matriz. Aprobar las reglas pendientes de PA-010 antes de la habilitación final. |
| Inventario y precios | **Tarea 6 — Tipos, habitaciones y bloqueos** | Persistir inventario y estados válidos. Implementar las reglas de activación y bloqueo; probar RF-014-bis con MySQL. |
| Inventario y precios | **Tarea 7 — Tarifario nocturno y cálculo base** | Unicidad y suma por noche; CA-046, CA-090 y rechazo del duplicado por base de datos. |
| Reservas | **Tarea 8 — Disponibilidad y factibilidad** | Resolver asignaciones para la estancia completa y verificar CA-025, CA-026, CA-066 y CA-067. Completar simulación de cambios de inventario y verificar RF-065 antes de habilitar sus escrituras. |
| Reservas | **Tarea 9 — Alta de reserva y espera bajo concurrencia** | Endpoint de alta con ambos desenlaces `201`; ejecutar CA-027 y CA-027-bis en MySQL con solicitudes concretas, por tipo y mixtas. Coordinar con Tarea 13 el cálculo final antes de exponer confirmaciones completas. |
| Reservas | **Tarea 10 — Asignar, modificar y cancelar** | Cambios con disponibilidad, aprobación y paso a espera sin escrituras parciales, incluyendo rollback de CA-064 y CA-065. No publicar el rechazo de cambios hasta resolver PA-004. |
| Estancias y avisos | **Tarea 11 — Registrar estancias y ausencias** | Check-in/out atómicos, zona del hotel y liberación de noches, sin saltos de estado; verificar CA-041 a CA-043 y CA-076 a CA-083 donde corresponda. |
| Estancias y avisos | **Tarea 12 — Lista de espera y avisos** | Confirmación manual con nueva comprobación, consultas y trabajo interno deduplicado para disponibilidad, salida tardía (12:30) y posible ausencia (22:00). Resolver PA-005 antes de habilitar la política final de avisos de disponibilidad. |
| Finanzas y auditoría | **Tarea 13 — Impuestos, cargos y total** | Tras validar PA-007, calcular importes exactos y persistir el desglose con la reserva, incluyendo casos de redondeo y cambios de tarifas aprobados. |
| Finanzas y auditoría | **Tarea 14 — Movimientos manuales** | Registrar y consultar movimientos según roles; validar PA-008 antes de habilitar las reglas de reembolso y saldo que dependan de ella. |
| Finanzas y auditoría | **Tarea 15 — Auditoría funcional** | Instrumentar los eventos exigidos al añadir cada operación y cerrar la cobertura aquí; lectura exclusiva del Administrador y filtrado de datos sensibles. |
| Validación final | **Tarea 16 — Contratos y pruebas de extremo a extremo** | Comparar OpenAPI con respuestas reales; ejecutar Jest para dominio y aplicación y Playwright para flujos HTTP, sin simular MySQL en pruebas de integridad. |
| Validación final | **Tarea 17 — Operabilidad y aceptación** | Tras acordar PA-013, ejecutar CA-068 (10 usuarios; al menos 95 % de consultas en 5 s o menos) y CA-069 (restauración y pérdida de datos de hasta 1 h cada una). Validar TLS y registros correlacionados; no usar datos reales antes de las revisiones de PA-011 y PA-012. |

## 5. Decisiones técnicas (ADRs)

### ADR-001 — TypeORM sobre Prisma

**Decisión propuesta:** TypeORM con `mysql2` en el adaptador de persistencia. TypeORM permite expresar las lecturas pesimistas mediante QueryBuilder y ejecutar SQL parametrizado donde sea necesario. Su API de [transacciones](https://typeorm.io/docs/transactions/) permite fijar el aislamiento y pasar un `EntityManager` transaccional común a todos los repositorios del caso de uso. Las entidades decoradas y las migraciones permanecen fuera del dominio.

**Alternativa:** Prisma ofrece tipado generado y transacciones interactivas; también puede implementar el protocolo usando SQL parametrizado para los bloqueos. Se prefiere TypeORM por el acceso al bloqueo pesimista y la comprobación explícita de que todas las operaciones usan el mismo gestor. El coste es mantener mapeadores y revisar SQL de migraciones, índices y consultas; no se permite sincronización automática del esquema.

### ADR-002 — Transacción de inventario para evitar sobrerreservas

**Decisión:** usar `REPEATABLE READ` con bloqueos explícitos en InnoDB, como prescribe RNF-002. La unidad de trabajo ejecuta `DataSource.transaction('REPEATABLE READ', ...)`; dentro del callback, solo se usan repositorios del `EntityManager` recibido. Ningún repositorio global puede leer o escribir el inventario para tomar la decisión.

1. Adquirir primero la fila de `availability_guard` con `SELECT ... FOR UPDATE`, incluso si no existe ninguna reserva. Todas las escrituras de disponibilidad o compatibilidad siguen el mismo orden. No usar `SKIP LOCKED`.
2. Leer con bloqueo las reservas solapadas que comprometen noches, incluidos registros sin habitación asignada, los bloqueos y el inventario pertinentes. Extender el conjunto a compromisos conectados cuando haga falta. Recalcular sobre ese estado actual, no sobre una instantánea previa. Como propuesta inicial, usar también la fila de control para las escrituras del tarifario y reglas que intervienen en la misma confirmación, evitando lecturas mezcladas de esos datos.
3. Persistir el desenlace permitido, incluida la versión de precio que corresponda y la auditoría de toda mutación que la requiera; confirmar antes de responder. Un error de precio o bloqueo no se convierte en lista de espera. Ante un interbloqueo con rollback confirmado, reintentar de forma acotada la transacción completa; no reintentar a ciegas si se desconoce el resultado del commit.
4. Validar con CA-027-bis: dos altas reales con `Promise.all`; retener el bloqueo de la primera transacción hasta observar que la segunda lo espera en `performance_schema.data_lock_waits`. Después de ambas respuestas, verificar dos `201`, sus `Location` y exactamente una reserva confirmada y una solicitud en espera persistidas para los titulares respectivos. No se fija el ganador.

**Alternativas y coste:** un `SELECT` normal bajo `REPEATABLE READ` no protege la decisión. `SERIALIZABLE` añade contención sin sustituir el protocolo para los distintos tipos de escritura. Una unicidad por habitación/noche tampoco protege las reservas sin asignar. La fila única serializa escrituras no conflictivas entre sí, pero hace explícita la garantía del MVP de 20 habitaciones. Medir espera de bloqueo y latencia antes de plantear una granularidad menor.
