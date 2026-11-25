# ReservaFácil — especificación del MVP

## 1. Resumen ejecutivo

ReservaFácil será una API REST para el personal de un hotel boutique de 20 habitaciones en Guayaquil, Ecuador.
Gestionará inventario, reservas, lista de espera, estancias y registro manual de pagos.
El prototipo utilizará NestJS, TypeScript y MySQL y está destinado a una futura operación real.
Los objetivos operativos y las obligaciones legales deben validarse antes de utilizarlo en el hotel.

## 2. Objetivos de negocio

- **OB-001.** Registrar y consultar el 100 % del inventario inicial de 20 habitaciones.
- **OB-002.** Evitar que se confirme cualquier reserva que haga imposible asignar una habitación compatible a cada reserva confirmada, incluso ante operaciones concurrentes.
- **OB-003.** Registrar en lista de espera el 100 % de las nuevas solicitudes válidas que no tengan disponibilidad para la opción solicitada.
- **OB-004.** Con 10 usuarios simultáneos, responder al menos el 95 % de las consultas de disponibilidad en un máximo de 5 segundos.
- **OB-005.** Para la futura operación real, recuperar el servicio en un máximo de 1 hora y limitar la pérdida de datos a un máximo de 1 hora de cambios.

## 3. Alcance del MVP

- Autenticación del personal y autorización para administradores y recepcionistas.
- Gestión y consulta de tipos de habitación, habitaciones, estados operativos y bloqueos.
- Consulta de disponibilidad y gestión de reservas de una habitación, con asignación inmediata o posterior.
- Registro de huéspedes titulares, check-in y check-out.
- Lista de espera, avisos consultables en la API y confirmación manual.
- Tarifas por tipo y fecha, impuestos y cargos configurables, e importes en USD.
- Registro manual de anticipos, pagos parciales, pagos completos y reembolsos.
- Auditoría de las operaciones y consultas indicadas en los requisitos funcionales.

## 4. Out of Scope

| Exclusión | Justificación |
| --- | --- |
| Integración con Booking.com u otras plataformas externas de reservas | El MVP operará con solicitudes gestionadas por el personal, sin sincronización con terceros. |
| Cobro o devolución de dinero en línea | Solo se registrarán movimientos realizados fuera de la API; no se integrará una pasarela de pago. |
| Acceso directo de huéspedes | Los usuarios previstos del MVP son exclusivamente empleados del hotel. |
| Interfaz gráfica para empleados o huéspedes | El entregable acordado es la API; sus consumidores quedan fuera de esta especificación. |
| Notificaciones por correo, SMS u otros canales externos | Se acordaron avisos consultables mediante la API. |
| Emisión de comprobantes o facturación electrónica | No se acordó su implementación; registrar un pago no equivale a emitir un comprobante fiscal. |

## 5. Actores y casos de uso principales

### Actores

- **Administrador:** gestiona usuarios, habitaciones y tipos, bloqueos y tarifas; cancela reservas y aprueba los cambios que puedan llevar a una cancelación.
- **Recepcionista:** consulta inventario y disponibilidad, gestiona reservas dentro de sus permisos, registra estancias y consulta avisos. Solicita aprobación cuando un cambio sin disponibilidad implique cancelar una reserva.
- **Personal autorizado:** administrador o recepcionista con permiso para la operación correspondiente. Los permisos no especificados quedan pendientes en la sección 11.

### Casos de uso

| ID | Caso de uso | Actor | Requisitos relacionados |
| --- | --- | --- | --- |
| CU-001 | Iniciar sesión y acceder según el rol | Personal | RF-001–RF-003 |
| CU-002 | Administrar usuarios, tipos, habitaciones y bloqueos | Administrador | RF-004–RF-017 |
| CU-003 | Consultar disponibilidad y crear o asignar una reserva | Personal autorizado | RF-018–RF-027, RF-030–RF-031 |
| CU-004 | Consultar, modificar o cancelar una reserva | Personal autorizado; administrador para cancelación y aprobación | RF-028–RF-029, RF-032–RF-036 |
| CU-005 | Consultar avisos y confirmar una solicitud en espera | Personal autorizado | RF-037–RF-040 |
| CU-006 | Registrar entrada y salida | Personal autorizado | RF-041–RF-043, RF-063 |
| CU-007 | Administrar tarifas, calcular importes y registrar movimientos | Administrador para tarifas; personal autorizado para las demás operaciones | RF-044–RF-054 |
| CU-008 | Registrar eventos de auditoría | Sistema, a partir de acciones del personal | RF-055–RF-062 |

## 6. Requisitos funcionales

Cada identificador describe una capacidad o regla verificable. Los roles y
exclusiones indicados en otras secciones también se aplican.

### Acceso y usuarios

- **RF-001.** La API autenticará al personal mediante usuario y contraseña y emitirá un JWT para solicitudes posteriores.
- **RF-002.** La API rechazará una solicitud a una operación protegida si no está autenticada.
- **RF-003.** La API aplicará los permisos de administrador y recepcionista; la gestión de usuarios, habitaciones, tipos, bloqueos y tarifas, así como la cancelación de reservas, estarán reservadas al administrador.
- **RF-004.** El administrador podrá crear cuentas de personal.
- **RF-005.** El administrador podrá modificar cuentas de personal, incluido su rol.
- **RF-006.** El administrador podrá desactivar cuentas de personal.

### Inventario

- **RF-007.** El administrador podrá crear tipos de habitación.
- **RF-008.** El administrador podrá modificar tipos de habitación.
- **RF-009.** El administrador podrá desactivar tipos de habitación.
- **RF-010.** El administrador podrá registrar habitaciones con número o identificador, tipo, capacidad de huéspedes, piso o ubicación, descripción o comodidades y estado operativo.
- **RF-011.** El administrador podrá modificar los datos de una habitación.
- **RF-012.** El administrador podrá desactivar una habitación.
- **RF-013.** El personal autorizado podrá consultar el inventario de habitaciones y sus datos.
- **RF-014.** El personal autorizado podrá actualizar el estado operativo de una habitación entre: lista para ocupar, ocupada, pendiente de limpieza, en limpieza y fuera de servicio o mantenimiento, sin eludir las restricciones sobre bloqueos.
- **RF-015.** El administrador podrá bloquear una habitación por un intervalo de fechas.
- **RF-016.** El administrador podrá bloquear una habitación de forma indefinida hasta que sea habilitada.
- **RF-017.** El administrador podrá desbloquear una habitación.

### Disponibilidad y reservas

- **RF-018.** El personal autorizado podrá consultar disponibilidad por fechas, tipo de habitación y cantidad de huéspedes.
- **RF-019.** El personal autorizado podrá crear una reserva para una habitación concreta disponible.
- **RF-020.** El personal autorizado podrá crear una reserva por tipo sin asignar inmediatamente una habitación concreta.
- **RF-021.** El personal autorizado podrá asignar posteriormente una habitación compatible a una reserva sin asignación.
- **RF-022.** Al crear una reserva o solicitud en espera se exigirán el nombre completo y el documento de identidad del huésped titular.
- **RF-023.** La API permitirá registrar opcionalmente teléfono, correo electrónico y notas del huésped titular.
- **RF-024.** La API rechazará una solicitud que exceda la capacidad de la habitación o del tipo solicitado.
- **RF-025.** Una reserva podrá empezar el mismo día en que termina otra reserva de la misma habitación: la fecha de entrada se incluye y la fecha de salida se excluye de la estancia.
- **RF-026.** Al confirmar o asignar una reserva se tendrán en cuenta los bloqueos y las reservas confirmadas, incluidas las no asignadas, de modo que siga siendo posible asignar a cada reserva una habitación compatible durante toda su estancia.
- **RF-027.** Las operaciones concurrentes de creación, modificación o asignación no podrán causar sobrerreservas.
- **RF-028.** El personal autorizado podrá consultar las reservas registradas.
- **RF-029.** El personal autorizado podrá modificar una reserva cuando la opción solicitada tenga disponibilidad.
- **RF-030.** Una nueva solicitud válida sin disponibilidad para la opción solicitada se registrará en la lista de espera, sin confirmarse como reserva.
- **RF-031.** Una solicitud en espera conservará los datos del huésped, las fechas, el tipo o habitación solicitada y la cantidad de huéspedes.
- **RF-032.** Si un recepcionista solicita modificar una reserva a una opción sin disponibilidad, el cambio quedará pendiente de aprobación del administrador y la reserva original permanecerá activa durante la revisión.
- **RF-033.** Al aprobar un cambio pendiente, si la opción solicitada tiene disponibilidad tras una nueva comprobación, se actualizará directamente la reserva original.
- **RF-034.** Al aprobar un cambio pendiente, si la opción solicitada sigue sin disponibilidad, se cancelará la reserva original y se creará una solicitud en espera mediante una operación consistente.
- **RF-035.** Si el administrador realiza directamente un cambio sin disponibilidad, se cancelará la reserva original y se creará una solicitud en espera mediante una operación consistente.
- **RF-036.** El administrador podrá cancelar una reserva.

### Lista de espera y estancia

- **RF-037.** Cuando aparezca disponibilidad compatible con una solicitud en espera, el sistema generará un aviso para el personal.
- **RF-038.** El personal autorizado podrá consultar los avisos de disponibilidad mediante la API.
- **RF-039.** El personal autorizado podrá confirmar manualmente una solicitud en espera.
- **RF-040.** La API comprobará nuevamente la disponibilidad al confirmar una solicitud en espera; si ya no está disponible, no confirmará la reserva.
- **RF-041.** La API rechazará un check-in si la reserva no tiene una habitación asignada.
- **RF-042.** La API rechazará un check-in si la habitación asignada no está lista para ocupar.
- **RF-043.** Al registrar el check-out, el personal autorizado seleccionará el estado operativo que tendrá la habitación.

### Tarifas, importes y movimientos

- **RF-044.** El administrador podrá definir tarifas por tipo de habitación y fecha.
- **RF-045.** El administrador podrá modificar tarifas por tipo de habitación y fecha.
- **RF-046.** La API calculará el importe base de una estancia utilizando las tarifas aplicables a sus fechas.
- **RF-047.** La API permitirá configurar impuestos y cargos adicionales; el permiso específico para configurarlos queda pendiente de definición.
- **RF-048.** La API calculará el total de la estancia agregando al importe base los impuestos y cargos aplicables configurados.
- **RF-049.** La API expresará tarifas, importes y movimientos en dólares estadounidenses (USD).
- **RF-050.** El personal autorizado podrá registrar manualmente un anticipo vinculado a una reserva.
- **RF-051.** El personal autorizado podrá registrar manualmente un pago parcial vinculado a una reserva.
- **RF-052.** El personal autorizado podrá registrar manualmente un pago completo vinculado a una reserva.
- **RF-053.** El personal autorizado podrá registrar manualmente un reembolso vinculado a una reserva.
- **RF-054.** El personal autorizado podrá consultar los movimientos de una reserva.

### Auditoría

- **RF-055.** El sistema auditará la creación, modificación y cancelación de reservas.
- **RF-056.** El sistema auditará el registro de check-in y check-out.
- **RF-057.** El sistema auditará el registro de pagos y reembolsos.
- **RF-058.** El sistema auditará los cambios en habitaciones y bloqueos.
- **RF-059.** El sistema auditará los cambios en usuarios y permisos.
- **RF-060.** El sistema auditará los accesos exitosos y fallidos.
- **RF-061.** El sistema auditará las consultas de datos de huéspedes.
- **RF-062.** Cada evento de auditoría incluirá acción, fecha y hora y resultado, y, cuando sea posible, cuenta y recurso afectados.

### Registro de entrada

- **RF-063.** El personal autorizado podrá registrar el check-in de una reserva con una habitación asignada y lista para ocupar.

## 7. Requisitos no funcionales

- **RNF-001 — Tecnología.** La API REST se desarrollará con NestJS y TypeScript y persistirá sus datos en MySQL.
- **RNF-002 — Integridad.** Las operaciones que afecten a la disponibilidad deberán ser consistentes ante concurrencia, incluyendo reservas sin asignar y bloqueos. Una comprobación seguida de una escritura sin protección transaccional no satisface este requisito.
- **RNF-003 — Rendimiento.** Con 10 usuarios simultáneos, al menos el 95 % de las consultas de disponibilidad deberá responder en 5 segundos o menos. La prueba documentará entorno, datos, carga, muestra y resultados; el procedimiento concreto queda pendiente.
- **RNF-004 — Seguridad de comunicaciones.** Las comunicaciones de la API utilizadas para el acceso al sistema deberán estar protegidas mediante TLS.
- **RNF-005 — Seguridad de credenciales.** Las contraseñas se almacenarán mediante un hash resistente a ataques de fuerza bruta; no se almacenarán en texto plano.
- **RNF-006 — Seguridad de sesiones.** La API validará los JWT recibidos. Su duración, renovación y revocación, así como la recuperación de cuentas, quedan pendientes de definición.
- **RNF-007 — Datos personales.** El acceso se limitará según los permisos y se minimizará la exposición de datos de huéspedes en respuestas, registros operativos y auditoría.
- **RNF-008 — Observabilidad.** La API registrará errores y eventos operativos suficientes para diagnosticar fallos. Los registros operativos y de auditoría no incluirán contraseñas ni tokens. Se podrán identificar la fecha, la operación y el resultado; la herramienta y el destino de los registros quedan pendientes.
- **RNF-009 — Métricas.** Se podrán medir la cantidad de solicitudes, errores y tiempos de respuesta de las consultas de disponibilidad. Los umbrales de alerta y su canal quedan pendientes.
- **RNF-010 — Disponibilidad.** Se medirá la disponibilidad del servicio como porcentaje de tiempo operativo durante un período definido. El objetivo porcentual, la ventana de medición, las exclusiones y la frecuencia de comprobación quedan pendientes; no se afirma un SLA.
- **RNF-011 — Recuperación.** Para la futura operación real, el objetivo de punto de recuperación es de hasta 1 hora de cambios perdidos y el objetivo de tiempo de recuperación es de hasta 1 hora desde la interrupción. Ambos se verificarán mediante una prueba de restauración en un entorno representativo.
- **RNF-012 — Despliegue.** Para la futura operación del hotel se prefieren servicios administrados en la nube. El proveedor, los costes y la configuración aún no se han elegido; esta preferencia no garantiza por sí sola RNF-010 ni RNF-011.
- **RNF-013 — Errores.** Las solicitudes inválidas, los accesos no autorizados y los conflictos deberán producir respuestas explícitas, sin presentarse como operaciones exitosas. El contrato HTTP detallado queda pendiente.
- **RNF-014 — Conservación.** Los plazos de conservación, eliminación y atención de derechos de los titulares se definirán por tipo de dato tras una revisión legal y operativa antes del uso real.

## 8. Criterios de aceptación

Cada escenario tiene un ID `CA` y una etiqueta `RF` o `RNF` para su trazabilidad.
Los escenarios describen el comportamiento acordado; las reglas no resueltas
se identifican en la sección 11.

### Acceso y usuarios

```gherkin
# language: es
Característica: Acceso y usuarios

  @CA-001 @RF-001
  Escenario: Autenticación con credenciales válidas
    Dado una cuenta de personal activa con credenciales válidas
    Cuando el personal inicia sesión con su usuario y contraseña
    Entonces la API entrega un JWT para autenticar solicitudes posteriores

  @CA-002 @RF-002
  Escenario: Acceso no autenticado
    Dado una operación protegida
    Cuando se solicita sin autenticación válida
    Entonces la API rechaza el acceso

  @CA-003 @RF-003
  Esquema del escenario: Operaciones reservadas al administrador
    Dado un recepcionista autenticado
    Cuando intenta <operacion>
    Entonces la API rechaza la operación sin modificar los datos

    Ejemplos:
      | operacion                         |
      | gestionar una cuenta              |
      | modificar una habitación          |
      | modificar un tipo de habitación   |
      | bloquear una habitación           |
      | modificar una tarifa              |
      | cancelar directamente una reserva |

  @CA-004 @RF-004
  Escenario: Creación de una cuenta
    Dado un administrador autenticado
    Cuando crea una cuenta de recepcionista con los datos requeridos
    Entonces la cuenta queda registrada con el rol de recepcionista

  @CA-005 @RF-005
  Escenario: Modificación de una cuenta
    Dado una cuenta de personal y un administrador autenticado
    Cuando el administrador cambia el rol de la cuenta
    Entonces el nuevo rol queda registrado

  @CA-006 @RF-006
  Escenario: Desactivación de una cuenta
    Dado una cuenta de personal activa y un administrador autenticado
    Cuando el administrador desactiva la cuenta
    Entonces la cuenta queda desactivada
```

### Inventario

```gherkin
# language: es
Característica: Inventario de habitaciones

  @CA-007 @RF-007
  Escenario: Creación de un tipo
    Dado un administrador autenticado
    Cuando crea un tipo de habitación con sus datos requeridos
    Entonces el tipo queda registrado

  @CA-008 @RF-008
  Escenario: Modificación de un tipo
    Dado un tipo de habitación existente y un administrador autenticado
    Cuando modifica sus datos
    Entonces los datos modificados quedan registrados

  @CA-009 @RF-009
  Escenario: Desactivación de un tipo
    Dado un tipo de habitación activo y un administrador autenticado
    Cuando desactiva el tipo
    Entonces el tipo queda desactivado

  @CA-010 @RF-010
  Escenario: Registro de una habitación
    Dado un administrador autenticado y un tipo de habitación existente
    Cuando registra una habitación con identificador, tipo, capacidad, ubicación, descripción y estado
    Entonces la habitación queda registrada con esos datos

  @CA-011 @RF-011
  Escenario: Modificación de una habitación
    Dado una habitación existente y un administrador autenticado
    Cuando modifica su descripción
    Entonces la descripción modificada queda registrada

  @CA-012 @RF-012
  Escenario: Desactivación de una habitación
    Dado una habitación activa y un administrador autenticado
    Cuando desactiva la habitación
    Entonces la habitación queda desactivada

  @CA-013 @RF-013
  Escenario: Consulta del inventario
    Dado una habitación registrada y un usuario autorizado
    Cuando el usuario consulta el inventario
    Entonces la API devuelve la habitación y sus datos registrados

  @CA-014 @RF-014
  Escenario: Actualización del estado operativo
    Dado una habitación pendiente de limpieza y un usuario autorizado
    Cuando el usuario cambia su estado a en limpieza
    Entonces la habitación queda en estado en limpieza

  @CA-015 @RF-015
  Escenario: Bloqueo con fechas
    Dado una habitación sin reservas afectadas durante un intervalo y un administrador autenticado
    Cuando el administrador la bloquea para ese intervalo
    Entonces la habitación queda bloqueada durante dicho intervalo

  @CA-016 @RF-016
  Escenario: Bloqueo indefinido
    Dado una habitación sin reservas afectadas y un administrador autenticado
    Cuando el administrador la bloquea de forma indefinida
    Entonces el bloqueo permanece vigente hasta que se habilite la habitación

  @CA-017 @RF-017
  Escenario: Desbloqueo
    Dado una habitación bloqueada y un administrador autenticado
    Cuando el administrador la desbloquea
    Entonces el bloqueo deja de impedir su disponibilidad
```

### Disponibilidad y reservas

```gherkin
# language: es
Característica: Disponibilidad y reservas

  @CA-018 @RF-018
  Escenario: Consulta de disponibilidad
    Dado una habitación disponible y compatible con el número de huéspedes
    Cuando un usuario autorizado consulta sus fechas y tipo
    Entonces la API incluye esa habitación en la disponibilidad

  @CA-019 @RF-019
  Escenario: Reserva de una habitación concreta
    Dado una habitación disponible y compatible durante la estancia
    Cuando un usuario autorizado crea una reserva para esa habitación
    Entonces la reserva queda confirmada y asignada a esa habitación

  @CA-020 @RF-020
  Escenario: Reserva por tipo sin asignación inmediata
    Dado disponibilidad compatible para un tipo durante toda la estancia
    Cuando un usuario autorizado crea una reserva por ese tipo sin elegir habitación
    Entonces la reserva queda confirmada sin habitación asignada

  @CA-021 @RF-021
  Escenario: Asignación posterior
    Dado una reserva confirmada sin habitación asignada y una habitación compatible
    Cuando un usuario autorizado asigna esa habitación sin comprometer otras reservas
    Entonces la habitación queda asignada a la reserva

  @CA-022 @RF-022
  Escenario: Datos obligatorios del titular
    Dado una solicitud de reserva sin nombre completo o sin documento de identidad
    Cuando un usuario autorizado intenta registrarla
    Entonces la API rechaza la solicitud por datos obligatorios ausentes

  @CA-023 @RF-023
  Escenario: Datos opcionales del titular
    Dado una solicitud válida con nombre completo y documento de identidad
    Cuando se registra sin teléfono, correo electrónico ni notas
    Entonces la ausencia de esos datos no impide su registro

  @CA-024 @RF-024
  Escenario: Capacidad excedida
    Dado una habitación o tipo con capacidad para dos huéspedes
    Cuando se solicita una reserva para tres huéspedes
    Entonces la API rechaza la solicitud por exceder la capacidad

  @CA-025 @RF-025
  Escenario: Reservas consecutivas
    Dado una habitación reservada con salida el día 10
    Cuando se solicita esa habitación con entrada el día 10 y salida posterior
    Entonces las fechas no se consideran solapadas

  @CA-026 @RF-026
  Escenario: Capacidad comprometida por reserva sin asignación
    Dado que la única habitación compatible está comprometida por una reserva confirmada sin asignar
    Cuando se intenta confirmar otra reserva incompatible con esa disponibilidad
    Entonces la nueva reserva no se confirma

  @CA-027 @RF-027
  Escenario: Solicitudes simultáneas por la última habitación
    Dado una única habitación compatible disponible
    Cuando dos solicitudes válidas para las mismas fechas se procesan simultáneamente
    Entonces una queda confirmada y la otra queda en espera, sin sobrerreserva

  @CA-028 @RF-028
  Escenario: Consulta de una reserva
    Dado una reserva registrada y un usuario autorizado
    Cuando el usuario consulta la reserva
    Entonces la API devuelve los datos registrados de la reserva

  @CA-029 @RF-029
  Escenario: Cambio con disponibilidad
    Dado una reserva confirmada y disponibilidad para las nuevas fechas solicitadas
    Cuando un usuario autorizado modifica la reserva
    Entonces la reserva queda actualizada con las nuevas fechas

  @CA-030 @RF-030
  Escenario: Nueva solicitud sin disponibilidad
    Dado una solicitud válida para una opción sin disponibilidad
    Cuando el personal solicita su registro
    Entonces se crea una solicitud en espera y no una reserva confirmada

  @CA-031 @RF-031
  Escenario: Datos conservados en espera
    Dado una solicitud válida con huésped, fechas, tipo o habitación y cantidad de huéspedes
    Cuando se registra en la lista de espera
    Entonces se conservan esos datos en la solicitud

  @CA-032 @RF-032
  Escenario: Cambio solicitado por recepción sin disponibilidad
    Dado una reserva activa y un recepcionista que solicita cambiarla a una opción sin disponibilidad
    Cuando se registra la solicitud de cambio
    Entonces el cambio queda pendiente de aprobación y la reserva original permanece activa

  @CA-033 @RF-033
  Escenario: Aprobación de cambio con disponibilidad recuperada
    Dado un cambio pendiente y disponibilidad actual para la opción solicitada
    Cuando el administrador aprueba el cambio tras comprobar la disponibilidad
    Entonces se actualiza directamente la reserva original

  @CA-034 @RF-034
  Escenario: Aprobación de cambio aún sin disponibilidad
    Dado un cambio pendiente cuya opción solicitada sigue sin disponibilidad
    Cuando el administrador aprueba el cambio
    Entonces se cancela la reserva original y se crea la solicitud en espera

  @CA-035 @RF-035
  Escenario: Cambio directo del administrador sin disponibilidad
    Dado una reserva activa y una opción solicitada sin disponibilidad
    Cuando el administrador realiza directamente el cambio
    Entonces se cancela la reserva original y se crea la solicitud en espera

  @CA-036 @RF-036
  Escenario: Cancelación por el administrador
    Dado una reserva cancelable y un administrador autenticado
    Cuando el administrador cancela la reserva
    Entonces la reserva queda cancelada

  @CA-064 @RF-034
  Escenario: Error al aprobar un cambio sin disponibilidad
    Dado un cambio pendiente cuya opción sigue sin disponibilidad
    Cuando falla la creación de la solicitud en espera durante la aprobación
    Entonces se informa el error y la reserva original permanece activa sin solicitud en espera

  @CA-065 @RF-035
  Escenario: Error en un cambio directo sin disponibilidad
    Dado una reserva activa y una opción solicitada sin disponibilidad
    Cuando falla la creación de la solicitud en espera durante el cambio directo
    Entonces se informa el error y la reserva original permanece activa sin solicitud en espera

  @CA-066 @RF-026
  Escenario: Habitación bloqueada durante la estancia
    Dado una habitación bloqueada para parte de las fechas solicitadas
    Cuando se intenta confirmar una reserva para esa habitación
    Entonces la reserva no se confirma para esa habitación

  @CA-067 @RF-026
  Escenario: Falta de una habitación para toda la estancia
    Dado que hay habitaciones compatibles libres en cada noche pero ninguna durante toda la estancia
    Cuando se intenta confirmar una reserva por tipo para esas fechas
    Entonces la reserva no se confirma
```

### Lista de espera y estancia

```gherkin
# language: es
Característica: Lista de espera y estancia

  @CA-037 @RF-037
  Escenario: Aviso por disponibilidad recuperada
    Dado una solicitud en espera para una opción sin disponibilidad
    Cuando aparece disponibilidad compatible
    Entonces el sistema genera un aviso para el personal

  @CA-038 @RF-038
  Escenario: Consulta de avisos
    Dado un aviso de disponibilidad generado y un usuario autorizado
    Cuando el usuario consulta los avisos mediante la API
    Entonces la API devuelve el aviso

  @CA-039 @RF-039
  Escenario: Confirmación manual desde espera
    Dado una solicitud en espera con disponibilidad compatible
    Cuando un usuario autorizado confirma manualmente la solicitud
    Entonces se confirma una reserva para la opción solicitada

  @CA-040 @RF-040
  Escenario: Disponibilidad agotada antes de confirmar
    Dado un aviso de disponibilidad cuya opción ya dejó de estar disponible
    Cuando un usuario autorizado intenta confirmar la solicitud en espera
    Entonces la API no confirma la reserva

  @CA-041 @RF-041
  Escenario: Check-in sin habitación asignada
    Dado una reserva confirmada sin habitación asignada
    Cuando se intenta registrar el check-in
    Entonces la API rechaza el check-in

  @CA-042 @RF-042
  Escenario: Check-in de una habitación no lista
    Dado una reserva con habitación asignada en estado pendiente de limpieza
    Cuando se intenta registrar el check-in
    Entonces la API rechaza el check-in

  @CA-043 @RF-043
  Escenario: Check-out con estado elegido
    Dado una estancia para la que corresponde registrar el check-out
    Cuando un usuario autorizado registra el check-out y selecciona pendiente de limpieza
    Entonces se registra la salida y la habitación queda pendiente de limpieza

  @CA-063 @RF-063
  Escenario: Check-in de una habitación lista
    Dado una reserva con habitación asignada y lista para ocupar
    Cuando un usuario autorizado registra el check-in
    Entonces queda registrado el check-in de la reserva
```

### Tarifas, importes y movimientos

```gherkin
# language: es
Característica: Tarifas, importes y movimientos

  @CA-044 @RF-044
  Escenario: Definición de una tarifa
    Dado un tipo de habitación y un administrador autenticado
    Cuando el administrador define una tarifa para una fecha
    Entonces la tarifa queda registrada para ese tipo y fecha

  @CA-045 @RF-045
  Escenario: Modificación de una tarifa
    Dado una tarifa existente y un administrador autenticado
    Cuando modifica el importe de la tarifa
    Entonces el nuevo importe queda registrado

  @CA-046 @RF-046
  Escenario: Importe base con tarifas variables
    Dado una estancia de dos noches con tarifas aplicables de 100 y 120 USD
    Cuando se calcula el importe base
    Entonces el importe base es 220 USD

  @CA-047 @RF-047
  Escenario: Configuración de impuestos y cargos
    Dado un usuario autorizado para configurar impuestos y cargos
    Cuando registra una configuración válida de impuesto o cargo
    Entonces la configuración queda disponible para el cálculo

  @CA-048 @RF-048
  Escenario: Total con impuestos y cargos
    Dado un importe base de 100 USD, un impuesto aplicable de 10 USD y un cargo aplicable de 5 USD
    Cuando se calcula el total
    Entonces el total es 115 USD

  @CA-049 @RF-049
  Escenario: Moneda de los importes
    Dado una reserva con un importe calculado
    Cuando la API devuelve el importe
    Entonces la moneda indicada es USD

  @CA-050 @RF-050
  Escenario: Registro de un anticipo
    Dado una reserva y un usuario autorizado
    Cuando el usuario registra manualmente un anticipo
    Entonces el anticipo queda vinculado a la reserva

  @CA-051 @RF-051
  Escenario: Registro de un pago parcial
    Dado una reserva y un usuario autorizado
    Cuando el usuario registra manualmente un pago parcial
    Entonces el pago parcial queda vinculado a la reserva

  @CA-052 @RF-052
  Escenario: Registro de un pago completo
    Dado una reserva y un usuario autorizado
    Cuando el usuario registra manualmente un pago completo
    Entonces el pago completo queda vinculado a la reserva

  @CA-053 @RF-053
  Escenario: Registro de un reembolso
    Dado una reserva y un usuario autorizado
    Cuando el usuario registra manualmente un reembolso
    Entonces el reembolso queda vinculado a la reserva

  @CA-054 @RF-054
  Escenario: Consulta de movimientos
    Dado una reserva con movimientos registrados y un usuario autorizado
    Cuando el usuario consulta los movimientos de la reserva
    Entonces la API devuelve dichos movimientos
```

### Auditoría

```gherkin
# language: es
Característica: Auditoría

  @CA-055 @RF-055
  Esquema del escenario: Auditoría de reservas
    Dado un usuario autorizado y una reserva cuando corresponda
    Cuando el usuario realiza la acción de <accion>
    Entonces se registra un evento de auditoría para la acción

    Ejemplos:
      | accion                 |
      | crear una reserva      |
      | modificar una reserva  |
      | cancelar una reserva   |

  @CA-056 @RF-056
  Esquema del escenario: Auditoría de estancias
    Dado una estancia y un usuario autorizado
    Cuando el usuario registra el <movimiento>
    Entonces se registra un evento de auditoría para el movimiento

    Ejemplos:
      | movimiento |
      | check-in   |
      | check-out  |

  @CA-057 @RF-057
  Esquema del escenario: Auditoría de movimientos
    Dado una reserva y un usuario autorizado
    Cuando el usuario registra un <movimiento>
    Entonces se registra un evento de auditoría para el movimiento

    Ejemplos:
      | movimiento |
      | pago       |
      | reembolso  |

  @CA-058 @RF-058
  Esquema del escenario: Auditoría de inventario
    Dado un administrador autenticado
    Cuando realiza un <cambio>
    Entonces se registra un evento de auditoría para el cambio

    Ejemplos:
      | cambio                    |
      | cambio en una habitación  |
      | bloqueo de una habitación |

  @CA-059 @RF-059
  Esquema del escenario: Auditoría de usuarios y permisos
    Dado un administrador autenticado
    Cuando realiza un <cambio>
    Entonces se registra un evento de auditoría para el cambio

    Ejemplos:
      | cambio                 |
      | cambio en un usuario   |
      | cambio en sus permisos |

  @CA-060 @RF-060
  Esquema del escenario: Auditoría de accesos
    Dado un intento de inicio de sesión
    Cuando el intento tiene resultado <resultado>
    Entonces se registra un evento de auditoría con ese resultado

    Ejemplos:
      | resultado  |
      | exitoso    |
      | fallido    |

  @CA-061 @RF-061
  Escenario: Auditoría de consulta de huéspedes
    Dado un usuario autorizado y datos registrados de un huésped
    Cuando el usuario consulta los datos del huésped
    Entonces se registra un evento de auditoría de la consulta

  @CA-062 @RF-062
  Escenario: Datos de un evento de auditoría
    Dado una acción auditable de una cuenta sobre un recurso
    Cuando se registra el evento de auditoría
    Entonces el evento contiene la acción, fecha y hora, resultado, cuenta y recurso
```

### Requisitos no funcionales críticos

```gherkin
# language: es
Característica: Rendimiento, recuperación y observabilidad

  @CA-068 @RNF-003
  Escenario: Rendimiento de consultas de disponibilidad
    Dado una prueba documentada con 10 usuarios simultáneos y 100 consultas de disponibilidad
    Cuando se ejecutan y miden las 100 consultas
    Entonces al menos 95 respuestas tardan 5 segundos o menos

  @CA-069 @RNF-011
  Escenario: Recuperación tras una interrupción
    Dado una interrupción simulada en un entorno representativo de producción
    Cuando se ejecuta la restauración del servicio y sus datos
    Entonces el servicio se restablece en un máximo de 1 hora y se pierden como máximo 1 hora de cambios

  @CA-070 @RNF-008
  Escenario: Diagnóstico de un error
    Dado una operación de la API que falla
    Cuando se registra el evento operativo
    Entonces el registro identifica fecha, operación y resultado sin incluir contraseñas ni tokens

  @CA-071 @RNF-010
  Escenario: Medición de disponibilidad
    Dado un período y un procedimiento de medición definidos
    Cuando se consulta la disponibilidad medida del servicio
    Entonces se obtiene el porcentaje de tiempo operativo durante ese período
```

## 9. Modelo de datos preliminar

El modelo es conceptual: los identificadores, claves, restricciones y estados
definitivos se concretarán en el diseño. Las relaciones históricas deben
conservarse conforme a la política de retención que se defina.

| Entidad | Datos principales | Relaciones |
| --- | --- | --- |
| Usuario | Identificador, credenciales protegidas, rol y estado de cuenta | Un usuario puede originar solicitudes de cambio, movimientos y eventos de auditoría. |
| Tipo de habitación | Identificador, datos descriptivos y estado | Un tipo agrupa varias habitaciones y tiene varias tarifas. |
| Habitación | Identificador o número, tipo, capacidad, ubicación, descripción y estado operativo | Pertenece a un tipo; puede tener bloqueos y reservas asignadas. |
| Bloqueo | Habitación, inicio y fin opcional | Pertenece a una habitación; un fin no definido representa un bloqueo indefinido. |
| Huésped | Nombre completo, documento de identidad y, opcionalmente, teléfono, correo y notas | Puede ser titular de reservas y solicitudes en espera. |
| Reserva | Huésped titular, fechas, cantidad de huéspedes, tipo, habitación asignada opcional y estado | Corresponde a una habitación como máximo; puede tener movimientos y solicitudes de cambio. |
| Solicitud de cambio | Reserva original, opción solicitada y estado de aprobación | Puede originar una solicitud en espera; registra la intervención del administrador cuando corresponda. |
| Solicitud en espera | Huésped, fechas, cantidad de huéspedes, tipo o habitación solicitada y estado | Puede provenir de una solicitud nueva o de una reserva cancelada; puede generar avisos. |
| Aviso | Solicitud en espera y datos de disponibilidad detectada | Pertenece a una solicitud en espera; no constituye una reserva confirmada. |
| Tarifa | Tipo de habitación, fechas aplicables e importe en USD | Pertenece a un tipo de habitación. |
| Impuesto o cargo | Configuración necesaria para calcular el concepto | Se aplica al cálculo de una estancia según reglas por definir. |
| Movimiento | Tipo, importe en USD y datos de registro | Pertenece a una reserva; representa un anticipo, pago parcial, pago completo o reembolso manual. |
| Evento de auditoría | Acción, fecha y hora, resultado y, cuando corresponda, usuario y recurso | Puede referirse a las entidades afectadas por una acción auditable. |

## 10. Supuestos y dependencias

- Las fechas de negocio se interpretan en la zona horaria del hotel, `America/Guayaquil`. Las estancias se representan como intervalos con entrada incluida y salida excluida.
- El hotel tiene 20 habitaciones inicialmente; no se ha acordado un límite permanente de 20.
- La disponibilidad por fechas es distinta del estado operativo: una habitación no lista no admite check-in, aunque pueda consultarse su disponibilidad para una estancia futura.
- Un aviso de la lista de espera no garantiza disponibilidad hasta la confirmación y su nueva comprobación.
- La selección de un proveedor de nube y la configuración de respaldos y restauración son dependencias para verificar los objetivos de recuperación en operación real.
- La validación legal es una dependencia antes del uso de datos reales. El [SRI indica siete años para comprobantes electrónicos](https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/e9383f68-a515-47a4-ad64-919190ca8c82/BOLET%C3%8DN%20018%20-%20%20AVISO%20SOBRE%20CONSERVACI%C3%93N%20DE%20COMPROBANTES%20ELECTR%C3%93NICOS%20Y%20ACCESO%20A%20SERVICIOS%20DEL%20SRI.pdf); no se presupone que todo registro de pago sea un comprobante ni que esta API los emita. También deberá revisarse la [Ley Orgánica de Protección de Datos Personales](https://www.gob.ec/sites/default/files/regulations/2025-01/01%20Ley%20Org%C3%A1nica%20de%20Protecci%C3%B3n%20de%20Datos%20Personales.pdf).

## 11. Preguntas abiertas

- **PA-001.** ¿Se permiten estancias de cero noches? Como supuesto para reservas nocturnas, la salida sería posterior a la entrada.
- **PA-002.** ¿Cómo se resuelven los bloqueos, desactivaciones o cambios de capacidad que afecten reservas previamente confirmadas? No se deben cancelar ni trasladar reservas silenciosamente.
- **PA-003.** ¿Cómo se relaciona el estado fuera de servicio o mantenimiento con los bloqueos y quién puede cambiarlo sin eludir los permisos de administrador?
- **PA-004.** ¿Qué sucede si se rechaza una solicitud de cambio y cómo se tratan los cambios que dejan de necesitar aprobación?
- **PA-005.** ¿Qué prioridad tiene la lista de espera, cuánto dura un aviso y cómo se gestionan varios interesados en la misma disponibilidad?
- **PA-006.** ¿Cuáles son las transiciones de estado y las reglas de check-in y check-out fuera de las fechas previstas, incluidas las ausencias?
- **PA-007.** ¿Qué reglas se aplican ante tarifas ausentes o solapadas, cambios posteriores a la reserva, redondeo e impuestos o cargos aplicables?
- **PA-008.** ¿Cuáles son las políticas de cancelación, reembolso, autorización de reembolsos, sobrepagos y tratamiento del saldo?
- **PA-009.** ¿Qué permisos detallados tienen los roles para los movimientos, impuestos y cargos, avisos y consulta de auditoría?
- **PA-010.** ¿Cuáles serán la política de contraseñas, la duración y revocación de JWT y el procedimiento de recuperación de cuentas?
- **PA-011.** ¿Cuáles son los plazos de conservación y eliminación y los procedimientos para ejercer derechos, por tipo de dato y obligación legal?
- **PA-012.** ¿Qué proveedor, presupuesto, objetivo de disponibilidad, configuración de respaldos, umbrales y canales de alerta se utilizarán en producción?
- **PA-013.** ¿Cuáles serán el contrato HTTP, las validaciones detalladas, la paginación y los procedimientos y entornos para probar rendimiento y recuperación?
