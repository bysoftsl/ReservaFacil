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
- Registro de huéspedes titulares, check-in, check-out y gestión manual de ausencias.
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
| Registro o seguimiento de incidencias de averías en la API | Las averías urgentes que afecten reservas confirmadas se gestionarán manualmente mediante el procedimiento del hotel. |
| Emisión de comprobantes o facturación electrónica | No se acordó su implementación; registrar un pago no equivale a emitir un comprobante fiscal. |

## 5. Actores y casos de uso principales

### Actores

- **Administrador:** gestiona usuarios, habitaciones y tipos, bloqueos, tarifas, impuestos y cargos; cancela reservas y aprueba los cambios que puedan llevar a una cancelación. Registra reembolsos ya realizados y consulta auditoría en modo de solo lectura.
- **Recepcionista:** consulta inventario y disponibilidad, gestiona reservas dentro de sus permisos, registra estancias y consulta avisos. Solicita aprobación cuando un cambio sin disponibilidad implique cancelar una reserva.
- **Personal autorizado:** administrador o recepcionista con permiso para la operación correspondiente. Los permisos no especificados quedan pendientes en la sección 11.

### Casos de uso

| ID | Caso de uso | Actor | Requisitos relacionados |
| --- | --- | --- | --- |
| CU-001 | Iniciar sesión y acceder según el rol | Personal | RF-001–RF-003 |
| CU-002 | Administrar usuarios, tipos, habitaciones y bloqueos | Administrador; ambos roles para consulta de inventario y actualización de estados operativos ordinarios | RF-004–RF-017, RF-014-bis, RF-065 |
| CU-003 | Consultar disponibilidad y crear o asignar una reserva | Personal autorizado | RF-018–RF-027, RF-030–RF-031, RF-064 |
| CU-004 | Consultar, modificar o cancelar una reserva | Personal autorizado; administrador para cancelación y aprobación | RF-028–RF-029, RF-032–RF-036, RF-063-bis, RF-064 |
| CU-005 | Consultar avisos y confirmar una solicitud en espera | Administrador y Recepcionista; el sistema genera los avisos | RF-037–RF-040 |
| CU-006 | Registrar entrada y salida, consultar avisos de estancia y confirmar ausencias | Personal autorizado | RF-014-bis, RF-038, RF-041–RF-043, RF-063, RF-063-bis, RF-066–RF-072 |
| CU-007 | Configurar tarifas, impuestos y cargos; calcular importes y gestionar movimientos | Administrador para configuración y registro de reembolsos; ambos roles para los demás registros y consultas de movimientos; el sistema realiza los cálculos | RF-044–RF-054, RF-074 |
| CU-008 | Registrar eventos de auditoría | Sistema, a partir de acciones del personal | RF-055–RF-062 |
| CU-009 | Consultar eventos de auditoría | Administrador | RF-073 |

## 6. Requisitos funcionales

Cada identificador describe una capacidad o regla verificable. Los roles y
exclusiones indicados en otras secciones también se aplican.

### Acceso y usuarios

- **RF-001.** La API autenticará al personal mediante usuario y contraseña y emitirá un JWT para solicitudes posteriores.
- **RF-002.** La API rechazará una solicitud a una operación protegida si no está autenticada.
- **RF-003.** La API aplicará los permisos de la matriz de esta sección y las restricciones explícitas de cada requisito. La gestión de usuarios, tipos, datos de habitaciones, bloqueos, tarifas, impuestos y cargos, así como la cancelación de reservas, están reservadas al Administrador.
- **RF-004.** El administrador podrá crear cuentas de personal.
- **RF-005.** El administrador podrá modificar cuentas de personal, incluido su rol.
- **RF-006.** El administrador podrá desactivar cuentas de personal.

### Inventario

- **RF-007.** El administrador podrá crear tipos de habitación.
- **RF-008.** El administrador podrá modificar tipos de habitación.
- **RF-009.** El administrador podrá desactivar tipos de habitación.
- **RF-010.** El administrador podrá registrar habitaciones con número o identificador, tipo, capacidad de huéspedes, piso o ubicación, descripción o comodidades y un estado operativo inicial permitido por RF-014-bis.
- **RF-011.** El administrador podrá modificar los datos de una habitación sin eludir las restricciones de RF-014-bis para el estado operativo.
- **RF-012.** El administrador podrá desactivar una habitación.
- **RF-013.** El personal autorizado podrá consultar el inventario de habitaciones y sus datos.
- **RF-014.** Los estados operativos de una habitación son «Lista para ocupar», «Ocupada», «Pendiente de limpieza», «En limpieza» y «Fuera de servicio o mantenimiento». El personal autorizado podrá actualizarlos únicamente mediante las transiciones de RF-014-bis, sin eludir las restricciones sobre bloqueos.
- **RF-014-bis.** La API permitirá solo las transiciones de habitación de la tabla de esta sección. Una habitación solo podrá pasar a «Ocupada» al registrar el check-in y dejar ese estado al registrar el check-out; se prohíbe pasar directamente de «Ocupada» o «Pendiente de limpieza» a «Lista para ocupar». Hasta resolver PA-003, ningún rol podrá establecer «Fuera de servicio o mantenimiento» al registrar una habitación ni transitar hacia o desde ese estado. Las transiciones prohibidas se rechazarán sin cambiar la habitación.
- **RF-015.** El administrador podrá bloquear una habitación por un intervalo de fechas.
- **RF-016.** El administrador podrá bloquear una habitación de forma indefinida hasta que sea habilitada.
- **RF-017.** El administrador podrá desbloquear una habitación.
- **RF-065.** La API rechazará un bloqueo, una desactivación de habitación o tipo, o una reducción de capacidad si una habitación asignada a una reserva confirmada deja de estar disponible o de ser compatible durante las fechas reservadas, o si el cambio impide asignar una habitación compatible a cada reserva confirmada sin asignación durante toda su estancia. El rechazo dejará intactos el inventario y las reservas. Si el cambio se debe a una avería urgente, el personal gestionará la incidencia mediante el procedimiento del hotel; la API no cancelará ni trasladará reservas automáticamente.

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
- **RF-034.** Al aprobar un cambio pendiente, si la opción solicitada sigue sin disponibilidad, la API solo cancelará la reserva original y creará una solicitud en espera si la reserva sigue «Confirmada». El cambio será consistente; en otro estado se rechazará sin cancelar ni crear la solicitud.
- **RF-035.** Si el administrador realiza directamente un cambio sin disponibilidad, la API solo cancelará la reserva original y creará una solicitud en espera si la reserva está «Confirmada». El cambio será consistente; en otro estado se rechazará sin cancelar ni crear la solicitud.
- **RF-036.** El administrador podrá cancelar una reserva en estado «Confirmada», según RF-063-bis.
- **RF-064.** Al crear o modificar una reserva, la fecha de salida deberá ser posterior a la de entrada. Una solicitud con fechas iguales o invertidas se rechazará como inválida, sin modificar una reserva existente ni crear una solicitud en espera.

### Lista de espera y estancia

- **RF-037.** Cuando aparezca disponibilidad compatible con una solicitud en espera, el sistema generará un aviso para el personal.
- **RF-038.** El Administrador y el Recepcionista podrán consultar mediante la API los avisos de disponibilidad, de salida tardía y de posible ausencia. Ningún rol podrá crear, modificar, eliminar ni marcar avisos; el sistema los generará en los casos previstos.
- **RF-039.** El personal autorizado podrá confirmar manualmente una solicitud en espera.
- **RF-040.** La API comprobará nuevamente la disponibilidad al confirmar una solicitud en espera; si ya no está disponible, no confirmará la reserva.
- **RF-041.** La API rechazará un check-in si la reserva no tiene una habitación asignada.
- **RF-042.** La API rechazará un check-in si la habitación asignada no está lista para ocupar.
- **RF-043.** Al registrar el check-out de una reserva «En estancia» con su habitación asignada «Ocupada», la reserva pasará a «Finalizada» y la habitación pasará, en la misma operación, a «Pendiente de limpieza» o «En limpieza», según seleccione el personal autorizado.
- **RF-063.** El personal autorizado podrá registrar el check-in de una reserva confirmada con una habitación asignada y lista para ocupar. Al registrarlo, la reserva pasará a «En estancia» y la habitación a «Ocupada» en la misma operación.
- **RF-063-bis.** La API permitirá solo las transiciones de reserva de la tabla de esta sección. Se prohíbe registrar la salida sin una entrada, repetir la entrada, marcar como ausente a un huésped que ya hizo check-in, cancelar después del check-in o reabrir una reserva finalizada, cancelada o marcada «No se presentó». La API rechazará el intento sin cambiar la reserva ni su habitación.
- **RF-066.** El check-in normal comienza a las 15:00 de la fecha de entrada. Antes de las 15:00 de ese mismo día, el personal autorizado podrá autorizar y registrar un check-in anticipado si la habitación asignada está lista para ocupar.
- **RF-067.** Para registrar un check-in en un día distinto del previsto, el personal autorizado deberá modificar primero las fechas de la reserva y verificar la disponibilidad para las nuevas fechas antes de confirmar el cambio.
- **RF-068.** El check-out normal es hasta las 12:00 de la fecha de salida. Si a las 12:30 de ese día la reserva sigue «En estancia» y no se ha registrado el check-out, el sistema generará un aviso de salida tardía para el personal. El aviso no cambiará el estado de la reserva, no ampliará la estancia ni la cancelará.
- **RF-069.** Si el personal registra un check-out antes de la fecha de salida prevista, se liberarán en esa misma operación las noches restantes que el huésped no utilizará.
- **RF-070.** Para confirmar que el huésped puede quedarse una o más noches adicionales, el personal autorizado deberá comprobar la disponibilidad y ampliar primero la reserva. Registrar un check-out tardío no autoriza ni sustituye una ampliación.
- **RF-071.** Si a las 22:00 de la fecha de entrada la reserva sigue confirmada y no tiene un check-in registrado, el sistema generará un aviso de posible ausencia para el personal. El aviso no cambiará el estado de la reserva, no liberará noches ni la cancelará.
- **RF-072.** Cuando el personal autorizado confirme que un huésped no se presentó, la reserva confirmada sin check-in pasará a «No se presentó» y se liberarán las noches restantes en la misma operación. Esta transición es manual y distinta de la cancelación.

### Tarifas, importes y movimientos

- **RF-044.** El administrador podrá definir tarifas por tipo de habitación y fecha.
- **RF-045.** El administrador podrá modificar tarifas por tipo de habitación y fecha.
- **RF-046.** La API calculará el importe base sumando una única tarifa aplicable al tipo de habitación por cada noche, desde la fecha de entrada incluida hasta la fecha de salida excluida. Si falta una tarifa o hay más de una para alguna noche, se aplicará RF-074.
- **RF-047.** Solo el Administrador podrá crear o modificar la configuración de impuestos y cargos adicionales. La API rechazará los intentos del Recepcionista sin modificar la configuración.
- **RF-048.** La API calculará el total de la estancia agregando al importe base los impuestos y cargos aplicables configurados.
- **RF-049.** La API expresará tarifas, importes y movimientos en dólares estadounidenses (USD).
- **RF-050.** El Administrador y el Recepcionista podrán registrar manualmente un anticipo vinculado a una reserva.
- **RF-051.** El Administrador y el Recepcionista podrán registrar manualmente un pago parcial vinculado a una reserva.
- **RF-052.** El Administrador y el Recepcionista podrán registrar manualmente un pago completo vinculado a una reserva.
- **RF-053.** Solo el Administrador podrá registrar manualmente un reembolso ya realizado y vincularlo a una reserva. El registro no equivale a autorizar ni ejecutar el reembolso.
- **RF-054.** El Administrador y el Recepcionista podrán consultar los movimientos de una reserva a la que tengan acceso.
- **RF-074.** Si para una o más noches falta una tarifa aplicable o se solapan varias tarifas del mismo tipo de habitación, la API rechazará la operación que requiera el cálculo e identificará el tipo, las noches afectadas y si el problema es ausencia o solapamiento. No devolverá un importe base parcial ni un total, no aplicará una tarifa por defecto ni reutilizará la del último día conocido, y no elegirá entre tarifas solapadas aunque tengan el mismo importe. El error impedirá confirmar una reserva, incluida la confirmación desde la lista de espera, o guardar un cambio que requiera recalcular el importe. El error no modificará ni cancelará reservas existentes y no creará ni alterará solicitudes en espera: un problema de tarifas no equivale a falta de habitaciones.

### Auditoría

- **RF-055.** El sistema auditará la creación, modificación y cancelación de reservas.
- **RF-056.** El sistema auditará el registro de check-in y check-out.
- **RF-057.** El sistema auditará el registro de pagos y reembolsos.
- **RF-058.** El sistema auditará los cambios en habitaciones y bloqueos.
- **RF-059.** El sistema auditará los cambios en usuarios y permisos.
- **RF-060.** El sistema auditará los accesos exitosos y fallidos.
- **RF-061.** El sistema auditará las consultas de datos de huéspedes.
- **RF-062.** Cada evento de auditoría incluirá acción, fecha y hora y resultado, y, cuando sea posible, cuenta y recurso afectados.
- **RF-073.** Solo el Administrador podrá consultar, en modo de solo lectura, los eventos de auditoría mediante la API. La API rechazará la consulta por un Recepcionista y no permitirá que ningún rol modifique ni elimine eventos. La respuesta minimizará los datos de huéspedes y no incluirá contraseñas ni tokens.

### Matriz de permisos por rol (RF-001 a RF-062)

✅ El rol puede realizar la acción indicada si se cumplen sus precondiciones. ❌ El requisito no concede al rol una acción directa. En una regla automática, ❌ para ambos significa que la ejecuta la API y que se aplica a ambos roles cuando corresponda.

| RF | Administrador | Recepcionista |
| --- | :---: | :---: |
| RF-001 — Iniciar sesión | ✅ | ✅ |
| RF-002 — Rechazar acceso no autenticado | ❌ | ❌ |
| RF-003 — Aplicar permisos de rol | ❌ | ❌ |
| RF-004 — Crear cuentas | ✅ | ❌ |
| RF-005 — Modificar cuentas y roles | ✅ | ❌ |
| RF-006 — Desactivar cuentas | ✅ | ❌ |
| RF-007 — Crear tipos de habitación | ✅ | ❌ |
| RF-008 — Modificar tipos de habitación | ✅ | ❌ |
| RF-009 — Desactivar tipos de habitación | ✅ | ❌ |
| RF-010 — Registrar habitaciones | ✅ | ❌ |
| RF-011 — Modificar datos de habitaciones | ✅ | ❌ |
| RF-012 — Desactivar habitaciones | ✅ | ❌ |
| RF-013 — Consultar inventario | ✅ | ✅ |
| RF-014 — Actualizar estado operativo ordinario | ✅ | ✅ |
| RF-015 — Bloquear por fechas | ✅ | ❌ |
| RF-016 — Bloquear indefinidamente | ✅ | ❌ |
| RF-017 — Desbloquear habitaciones | ✅ | ❌ |
| RF-018 — Consultar disponibilidad | ✅ | ✅ |
| RF-019 — Crear reserva de habitación concreta | ✅ | ✅ |
| RF-020 — Crear reserva por tipo | ✅ | ✅ |
| RF-021 — Asignar habitación | ✅ | ✅ |
| RF-022 — Registrar datos obligatorios del titular | ✅ | ✅ |
| RF-023 — Registrar datos opcionales del titular | ✅ | ✅ |
| RF-024 — Rechazar exceso de capacidad | ❌ | ❌ |
| RF-025 — Aplicar intervalo de estancia | ❌ | ❌ |
| RF-026 — Comprobar disponibilidad comprometida | ❌ | ❌ |
| RF-027 — Evitar sobrerreservas concurrentes | ❌ | ❌ |
| RF-028 — Consultar reservas | ✅ | ✅ |
| RF-029 — Modificar con disponibilidad | ✅ | ✅ |
| RF-030 — Registrar nueva solicitud sin disponibilidad en espera | ❌ | ❌ |
| RF-031 — Conservar datos de la solicitud en espera | ❌ | ❌ |
| RF-032 — Solicitar cambio sin disponibilidad para aprobación | ❌ | ✅ |
| RF-033 — Aprobar cambio con disponibilidad recuperada | ✅ | ❌ |
| RF-034 — Aprobar cambio que implica cancelar y pasar a espera | ✅ | ❌ |
| RF-035 — Realizar cambio directo que implica cancelar y pasar a espera | ✅ | ❌ |
| RF-036 — Cancelar reserva | ✅ | ❌ |
| RF-037 — Generar aviso de disponibilidad | ❌ | ❌ |
| RF-038 — Consultar avisos | ✅ | ✅ |
| RF-039 — Confirmar solicitud en espera | ✅ | ✅ |
| RF-040 — Volver a comprobar disponibilidad al confirmar | ❌ | ❌ |
| RF-041 — Rechazar check-in sin habitación asignada | ❌ | ❌ |
| RF-042 — Rechazar check-in si la habitación no está lista | ❌ | ❌ |
| RF-043 — Registrar check-out y seleccionar estado | ✅ | ✅ |
| RF-044 — Definir tarifas | ✅ | ❌ |
| RF-045 — Modificar tarifas | ✅ | ❌ |
| RF-046 — Calcular importe base | ❌ | ❌ |
| RF-047 — Configurar impuestos y cargos | ✅ | ❌ |
| RF-048 — Calcular total con impuestos y cargos | ❌ | ❌ |
| RF-049 — Expresar importes en USD | ❌ | ❌ |
| RF-050 — Registrar anticipo | ✅ | ✅ |
| RF-051 — Registrar pago parcial | ✅ | ✅ |
| RF-052 — Registrar pago completo | ✅ | ✅ |
| RF-053 — Registrar reembolso ya realizado | ✅ | ❌ |
| RF-054 — Consultar movimientos de una reserva | ✅ | ✅ |
| RF-055 — Auditar reservas | ❌ | ❌ |
| RF-056 — Auditar entradas y salidas | ❌ | ❌ |
| RF-057 — Auditar pagos y reembolsos | ❌ | ❌ |
| RF-058 — Auditar cambios de inventario y bloqueos | ❌ | ❌ |
| RF-059 — Auditar cambios de usuarios y permisos | ❌ | ❌ |
| RF-060 — Auditar accesos exitosos y fallidos | ❌ | ❌ |
| RF-061 — Auditar consultas de datos de huéspedes | ❌ | ❌ |
| RF-062 — Incluir campos mínimos de auditoría | ❌ | ❌ |

**Justificaciones y límites:**

- **Acceso (RF-001 a RF-003).** Ambos roles pueden iniciar sesión antes de autenticarse. Los controles de autenticación y autorización los aplica la API; ningún rol puede omitirlos.
- **Inventario y estancias (RF-007 a RF-017, RF-041 a RF-043).** El Administrador cambia el inventario y los bloqueos. Ambos roles pueden consultar el inventario y actualizar estados operativos ordinarios, incluso al registrar un check-out, sin eludir los permisos de bloqueo. PA-003 sigue abierta para mantenimiento y fuera de servicio. Los rechazos de check-in son validaciones, no permisos.
- **Solicitudes y cancelaciones (RF-022, RF-023, RF-030 a RF-036).** Ambos roles pueden aportar datos del titular y presentar solicitudes dentro de los flujos autorizados. La API decide si una solicitud pasa a espera y conserva sus datos. El Recepcionista solicita un cambio sin disponibilidad; solo el Administrador aprueba esos cambios o cancela una reserva. Si el Administrador inicia ese cambio, usa el flujo directo.
- **Avisos (RF-037 a RF-039, RF-068, RF-071 y RF-072).** Solo el sistema genera avisos. Ambos roles pueden consultarlos y atenderlos mediante las acciones autorizadas sobre la solicitud o reserva, como confirmar una solicitud en espera o confirmar una ausencia. Consultar un aviso no concede permiso para modificarlo ni para cancelar una reserva.
- **Importes y movimientos (RF-044 a RF-054).** Cambiar tarifas, impuestos o cargos afecta los importes, por lo que se reserva al Administrador. La API calcula los importes; ambos roles pueden recibirlos en sus operaciones autorizadas, registrar pagos y consultar movimientos. Solo el Administrador registra reembolsos ya realizados por su impacto financiero; su autorización sigue en PA-008.
- **Auditoría (RF-055 a RF-062 y RF-073).** Generar eventos y determinar sus campos es tarea del sistema. La consulta se especifica aparte en RF-073 y es exclusiva del Administrador por la sensibilidad de los datos. Ningún rol puede editar o eliminar eventos.

### Máquinas de estados de habitación y reserva

Las tablas enumeran todas las transiciones permitidas. Un intento de transición que el estado actual no permite devuelve `409`; un estado inicial no permitido devuelve `422`. Si el rol no tiene permiso para la operación, devuelve `403`. Una operación rechazada no cambia los estados. Los [enums y el validador de estados](../src/domain/stay-state-machine.ts) no sustituyen las comprobaciones de disponibilidad, fechas, asignación, tarifas ni las demás reglas de negocio.

**Habitación (RF-014-bis)**

| Origen | Destino | Operación | Rol autorizado |
| --- | --- | --- | --- |
| Sin registrar | Lista para ocupar, Pendiente de limpieza o En limpieza | Registrar habitación (RF-010) | Administrador |
| Lista para ocupar | Pendiente de limpieza | Solicitar limpieza | Administrador o Recepcionista |
| Pendiente de limpieza | En limpieza | Iniciar limpieza | Administrador o Recepcionista |
| En limpieza | Pendiente de limpieza | Interrumpir limpieza | Administrador o Recepcionista |
| En limpieza | Lista para ocupar | Completar limpieza | Administrador o Recepcionista |
| Lista para ocupar | Ocupada | Registrar check-in de la reserva asignada | Administrador o Recepcionista |
| Ocupada | Pendiente de limpieza o En limpieza | Registrar check-out de la reserva asignada | Administrador o Recepcionista |

**Reserva (RF-063-bis)**

| Origen | Destino | Operación | Rol autorizado |
| --- | --- | --- | --- |
| Sin reserva creada | Confirmada | Confirmar una nueva reserva, incluso a partir de una solicitud en espera (RF-019, RF-020, RF-039) | Administrador o Recepcionista |
| Confirmada | En estancia | Registrar check-in con la habitación asignada lista (RF-041, RF-042, RF-063, RF-066, RF-067) | Administrador o Recepcionista |
| En estancia | Finalizada | Registrar check-out con la habitación asignada ocupada (RF-043) | Administrador o Recepcionista |
| Confirmada | No se presentó | Confirmar manualmente la ausencia sin check-in (RF-072) | Administrador o Recepcionista |
| Confirmada | Cancelada | Cancelar o aplicar un cambio sin disponibilidad que implique cancelar (RF-034 a RF-036) | Administrador |

El check-in y el check-out actualizan el estado de la reserva y de su habitación asignada en una sola transacción. Confirmar una ausencia o cancelar una reserva no cambia el estado operativo de la habitación. «Finalizada», «No se presentó» y «Cancelada» no tienen transiciones de salida. «En espera» y «Pendiente de aprobación» son estados de otras entidades, no de la reserva; emitir avisos, asignar una habitación o editar una reserva sin cancelarla no cambia su estado.

## 7. Requisitos no funcionales

- **RNF-001 — Tecnología.** La API REST se desarrollará con NestJS y TypeScript y persistirá sus datos en MySQL.
- **RNF-002 — Integridad.** Las operaciones que afecten a la disponibilidad deberán ser consistentes ante concurrencia, incluyendo reservas sin asignar y bloqueos. Una comprobación seguida de una escritura sin protección transaccional no satisface este requisito. El mínimo de aislamiento y el protocolo de bloqueo se definen a continuación y se verifican en CA-027-bis.
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
- **RNF-013 — Errores.** Las solicitudes inválidas, los accesos no autorizados y los conflictos deberán producir respuestas explícitas, sin presentarse como operaciones exitosas. Se aplicará el contrato de RNF-013-bis.
- **RNF-013-bis — Contrato HTTP mínimo.** La API aplicará los estados HTTP, el formato de errores, la paginación, los formatos de fecha y la cabecera de correlación definidos a continuación.
- **RNF-014 — Conservación.** Los plazos de conservación, eliminación y atención de derechos de los titulares se definirán por tipo de dato tras una revisión legal y operativa antes del uso real.

### Concurrencia de reservas (RF-027 y RNF-002)

**Aislamiento mínimo del MVP:** `REPEATABLE READ` en MySQL InnoDB, con transacción explícita y lecturas de bloqueo. `REPEATABLE READ` con un `SELECT` normal solo ofrece una instantánea y no impide que dos transacciones tomen la misma decisión. No se requiere `SERIALIZABLE`: el protocolo siguiente serializa las escrituras que afectan a la disponibilidad, sin imponer el aislamiento más estricto a las consultas de solo lectura. Véanse los [niveles de aislamiento](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-transaction-isolation-levels.html) y las [lecturas con bloqueo](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/innodb-locking-reads.html) de InnoDB.

**Mecanismo recomendado:** `SELECT ... FOR UPDATE`, no una restricción de exclusión de intervalos.

1. Antes de comprobar disponibilidad o adquirir otros bloqueos de la operación, bloquear por clave primaria una fila de control del inventario del hotel, creada de antemano. Todas las escrituras que cambien la disponibilidad o compatibilidad deben adquirir ese mismo bloqueo: confirmaciones, asignaciones, cambios, cancelaciones, liberaciones de noches y cambios de inventario y bloqueos. La fila existe aunque no haya reservas; la segunda transacción espera en lugar de interpretar un bloqueo como falta de habitaciones. No usar `SKIP LOCKED` para decidir disponibilidad.
2. Con la fila de control bloqueada, usar lecturas actuales con `FOR UPDATE` para los datos de disponibilidad. Para `Reservation`, el predicado de solapamiento es `entrada < salida_solicitada AND salida > entrada_solicitada`, con índice que apoye el filtro por estado y fechas. Incluir las reservas que aún comprometen noches, asignadas y sin asignar, y consultar también los bloqueos y el inventario pertinente. No limitar el cálculo al identificador de la habitación solicitada ni únicamente al intervalo inicial si hay otras reservas conectadas por solapamiento y compatibilidad: la comprobación de RF-026 debe considerar la estancia completa y los compromisos que compiten por las mismas habitaciones.
3. Recalcular con los datos actuales y guardar el resultado en la misma transacción: reserva confirmada si hay capacidad, o solicitud en espera si corresponde a RF-030. Confirmar antes de responder. Si InnoDB revierte una transacción por interbloqueo, reintentar de forma acotada la transacción completa, incluida la comprobación. Un fallo de bloqueo no equivale a falta de habitaciones.

El bloqueo compartido por todo el inventario simplifica el MVP a cambio de serializar también escrituras que no compiten por la misma habitación. No se depende solo de un rango vacío de `Reservation`: los bloqueos de rango dependen del índice y del predicado, y no cubren por sí solos todos los cambios de inventario ni las reservas sin asignar. MySQL no ofrece una restricción de exclusión nativa para intervalos. Una tabla de ocupación con `UNIQUE (habitacion_id, noche)` podría proteger noches ya asignadas, pero no garantiza por sí sola la capacidad de las reservas sin habitación asignada.

La consulta inicial de solapamiento se ejecuta después de adquirir el bloqueo de inventario. Ejemplo con nombres de tabla y columnas ilustrativos; los parámetros se enlazan en el orden salida, entrada:

```sql
SELECT id, habitacion_id, tipo_habitacion_id, entrada, salida
FROM Reservation
WHERE estado IN ('confirmada', 'en_estancia')
  AND entrada < ?
  AND salida > ?
FOR UPDATE;
```

**Prueba de integración (CA-027-bis):** levantar la API y una base MySQL InnoDB aislada, con el aislamiento de la aplicación, al menos dos conexiones de base de datos y sin dobles del repositorio ni del cliente HTTP. Cargar una única habitación compatible, tarifas válidas para todas las noches y ninguna reserva ni bloqueo en el intervalo. Enviar dos altas válidas con titulares distintos para las mismas fechas. Repetir con datos limpios: ambas solicitudes para la habitación concreta, ambas por tipo sin asignación inmediata, y una de cada modalidad.

```typescript
const respuestas = await Promise.all([
  clienteHttp.crearSolicitudDeReserva(solicitudA),
  clienteHttp.crearSolicitudDeReserva(solicitudB),
]);
```

El nombre del método es ilustrativo: debe enviar las dos solicitudes al servidor HTTP real, sin reintentos del cliente. Una barrera exclusiva del entorno de prueba pausa a la primera transacción que adquiere el bloqueo de inventario. Desde una conexión de observación independiente, consultar [`performance_schema.data_lock_waits`](https://docs.oracle.com/cd/E17952_01/mysql-8.4-en/performance-schema-data-lock-waits-table.html) y verificar que la otra transacción espera ese mismo bloqueo antes de liberar la barrera. Si no se observa la espera dentro del plazo de la prueba, la prueba falla. Liberar la barrera incluso si falla una aserción; no usar pausas fijas para simular simultaneidad.

Comprobar ambos `201` y sus `Location`, sin depender del orden de las respuestas. Después de ambas respuestas, consultar la base desde una conexión independiente: debe haber exactamente una reserva confirmada que compite por la habitación en ese intervalo y una solicitud en espera para el otro titular, sin duplicados ni escrituras parciales. Cada `Location` debe identificar el registro persistido para el titular de esa solicitud.

### Contrato HTTP mínimo

#### Estados por operación

| Estado | Operación o condición |
| --- | --- |
| `200 OK` | Inicio de sesión exitoso (devuelve el JWT); consulta de un recurso, disponibilidad o listas, incluso si no hay resultados; actualización o acción sobre un recurso existente con respuesta, como asignar habitación, autorizar un cambio, cancelar una reserva o registrar check-in, check-out o ausencia. La respuesta describe el resultado efectivo de los cambios de reserva, incluida la transición a espera cuando corresponda. |
| `201 Created` | Alta de un recurso, como una cuenta, habitación, bloqueo, tarifa, movimiento, nueva reserva o solicitud de cambio pendiente; también al confirmar una solicitud en espera que da lugar a una nueva reserva. Si una nueva solicitud válida queda en espera por falta de habitaciones (RF-030), se devuelve `201` para la **solicitud en espera**, no para una reserva. La cabecera `Location` identifica el recurso principal creado. |
| `204 No Content` | Operación exitosa que no devuelve representación, como desactivar una cuenta o desbloquear una habitación. No lleva cuerpo. |
| `400 Bad Request` | JSON mal formado, parámetros o campos obligatorios ausentes, tipos o formatos inválidos, o paginación inválida. Si la solicitud para obtener un JWT presenta credenciales que no se aceptan, se devuelve un error genérico sin distinguir entre cuenta inexistente, inactiva o contraseña incorrecta. |
| `401 Unauthorized` | Una operación protegida no recibe un JWT válido o el token expiró. Se incluye `WWW-Authenticate: Bearer`. |
| `403 Forbidden` | El JWT es válido, pero el rol no tiene permiso para la operación solicitada. |
| `404 Not Found` | Un recurso individual solicitado por identificador no existe. Una consulta de colección sin resultados devuelve `200`, no `404`. |
| `409 Conflict` | La operación no puede completarse por el estado actual: por ejemplo, se agotó la disponibilidad al intentar confirmar desde la lista de espera, la habitación no está lista para el check-in o faltan tarifas aplicables o hay tarifas solapadas (RF-074). No sustituye los flujos acordados que registran una solicitud en espera. |
| `422 Unprocessable Content` | La solicitud tiene una estructura y formatos válidos, pero infringe una regla de negocio, como indicar una salida anterior o igual a la entrada o solicitar más huéspedes que la capacidad máxima del tipo elegido. |
| `500 Internal Server Error` | Fallo inesperado del servidor. La respuesta es genérica y se registra el incidente con el identificador de correlación. |

Las respuestas exitosas con representación usan `application/json`.

#### Errores

Las respuestas de error de la API usan `Content-Type: application/problem+json` conforme a [RFC 9457](https://www.rfc-editor.org/info/rfc9457), que sustituye a RFC 7807. El objeto incluye `type` (URI estable de la categoría del error), `title` (resumen), `status` (mismo valor que el estado HTTP), `detail` (detalle seguro para el cliente) e `instance` (URI que identifica la ocurrencia; usa el `X-Request-Id` como `urn:uuid:<id>`). Los clientes tomarán decisiones a partir de `status` y `type`, no del texto. El detalle no expondrá trazas, credenciales, tokens ni datos personales.

```json
{
  "type": "https://api.reservafacil.example/problemas/fechas-estancia",
  "title": "Fechas de estancia inválidas",
  "status": 422,
  "detail": "La fecha de salida debe ser posterior a la de entrada.",
  "instance": "urn:uuid:4d885f74-ed84-4d57-9e63-dee1ecd35dee"
}
```

#### Paginación

Los listados usan **cursor**, no `offset`: evita que las inserciones o eliminaciones anteriores a la posición desplacen el punto de continuación, a cambio de no permitir saltos por número de página. El cursor no garantiza una instantánea de la colección.

- `limit`: entero entre `1` y `100`, con valor predeterminado `25`. Fuera del intervalo se devuelve `400`, sin ajustar el valor.
- `cursor`: se omite en la primera página. La API devuelve un cursor opaco asociado a la colección, a sus filtros y a un orden determinista con un identificador único como desempate. La siguiente solicitud usa ese cursor con los mismos filtros. Un cursor inválido o que no corresponda a la consulta produce `400`. Cada página vuelve a comprobar los permisos.
- Respuesta `200`: objeto `{"items": [...], "nextCursor": "..."}`. `nextCursor` es `null` al final; una colección vacía devuelve `{"items": [], "nextCursor": null}`. No se requiere un recuento total.

#### Formatos de fechas y horas

- Las fechas previstas de entrada y salida usan ISO 8601 `date` (`YYYY-MM-DD`, por ejemplo `2026-11-26`), sin hora ni zona. Son fechas del hotel en `America/Guayaquil`: entrada incluida y salida excluida.
- Las marcas de tiempo de check-in y check-out usan ISO 8601 `date-time` con el perfil de [RFC 3339](https://www.rfc-editor.org/info/rfc3339). Cuando la API acepte una marca de tiempo de entrada, deberá incluir `Z` o un desplazamiento numérico, por ejemplo `2026-11-26T15:00:00-05:00`. La API devuelve los instantes en UTC con `Z` (`2026-11-26T20:00:00Z` en el ejemplo) y aplica las reglas de horario en la zona local del hotel.

#### Correlación de solicitudes

La API genera un UUID v4 por solicitud; no reutiliza el `X-Request-Id` enviado por el cliente. Devuelve el identificador en `X-Request-Id` en toda respuesta emitida por la API, incluidos `204` y los errores. Utiliza ese mismo valor en los registros operativos de la solicitud y, cuando hay un error, en `instance`.

## 8. Criterios de aceptación

Cada escenario tiene un ID `CA` y una o más etiquetas `RF` o `RNF` para su trazabilidad.
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

  @CA-091 @RF-014-bis
  Esquema del escenario: Cambio manual prohibido del estado de habitación
    Dado una habitación en estado «<origen>» y un <rol> autenticado
    Cuando intenta cambiar directamente su estado a «<destino>»
    Entonces la API devuelve 409 y la habitación conserva el estado «<origen>»

    Ejemplos:
      | origen                             | destino                            | rol           |
      | Lista para ocupar                  | Ocupada                            | Recepcionista |
      | Ocupada                            | Pendiente de limpieza              | Administrador |
      | Pendiente de limpieza              | Lista para ocupar                  | Recepcionista |
      | Lista para ocupar                  | Fuera de servicio o mantenimiento | Administrador |
      | Fuera de servicio o mantenimiento  | Pendiente de limpieza              | Administrador |

  @CA-095 @RF-014-bis
  Escenario: Alta de una habitación ocupada sin check-in
    Dado un Administrador autenticado
    Cuando intenta registrar una habitación con estado inicial «Ocupada»
    Entonces la API devuelve 422 y no registra la habitación

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

  @CA-072 @RF-065
  Esquema del escenario: Cambio que compromete una reserva asignada
    Dado una reserva confirmada para dos huéspedes con una habitación asignada y un administrador autenticado
    Cuando el administrador intenta <cambio>
    Entonces la API rechaza el cambio sin modificar el inventario ni la reserva

    Ejemplos:
      | cambio                                               |
      | bloquear la habitación durante las fechas reservadas |
      | bloquear indefinidamente la habitación               |
      | desactivar la habitación                             |
      | desactivar el tipo de habitación                     |
      | reducir la capacidad de la habitación a un huésped    |

  @CA-073 @RF-065
  Escenario: Cambio que compromete una reserva sin asignación
    Dado una reserva confirmada sin asignación y una única habitación compatible durante toda la estancia
    Cuando el administrador intenta bloquear esa habitación durante una noche de la estancia
    Entonces la API rechaza el bloqueo y conserva la reserva confirmada sin asignación

  @CA-074 @RF-065
  Escenario: Cambio que conserva la disponibilidad comprometida
    Dado una reserva confirmada sin asignación y dos habitaciones compatibles durante toda la estancia
    Cuando el administrador bloquea una de esas habitaciones
    Entonces se registra el bloqueo y la reserva permanece confirmada sin asignación
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

  @CA-027-bis @RF-027 @RNF-002
  Esquema del escenario: Contención real por la última habitación
    Dado una API conectada a MySQL InnoDB con REPEATABLE READ, una única habitación compatible, tarifas válidas y ninguna reserva ni bloqueo para esas fechas
    Cuando se envían dos solicitudes de titulares distintos para las mismas fechas con Promise.all, la primera <solicitudA> y la segunda <solicitudB>
    Y la prueba verifica que una transacción espera el bloqueo de inventario retenido por la otra
    Entonces ambas respuestas son 201 y sus cabeceras Location identifican una reserva confirmada y una solicitud en espera, sin importar el orden
    Y una lectura independiente después de ambas respuestas encuentra exactamente una reserva confirmada que compite por esa habitación en el intervalo y una solicitud en espera para el otro titular
    Y cada Location coincide con el registro persistido para el titular de la solicitud, sin duplicados ni escrituras parciales

    Ejemplos:
      | solicitudA               | solicitudB               |
      | para la habitación       | para la habitación       |
      | por tipo sin asignación  | por tipo sin asignación  |
      | para la habitación       | por tipo sin asignación  |

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
    Dado una reserva «Confirmada» con un cambio pendiente cuya opción solicitada sigue sin disponibilidad
    Cuando el administrador aprueba el cambio
    Entonces se cancela la reserva original y se crea la solicitud en espera

  @CA-035 @RF-035
  Escenario: Cambio directo del administrador sin disponibilidad
    Dado una reserva «Confirmada» y una opción solicitada sin disponibilidad
    Cuando el administrador realiza directamente el cambio
    Entonces se cancela la reserva original y se crea la solicitud en espera

  @CA-036 @RF-036
  Escenario: Cancelación por el administrador
    Dado una reserva cancelable y un administrador autenticado
    Cuando el administrador cancela la reserva
    Entonces la reserva queda cancelada

  @CA-064 @RF-034
  Escenario: Error al aprobar un cambio sin disponibilidad
    Dado una reserva «Confirmada» con un cambio pendiente cuya opción sigue sin disponibilidad
    Cuando falla la creación de la solicitud en espera durante la aprobación
    Entonces se informa el error y la reserva original permanece activa sin solicitud en espera

  @CA-065 @RF-035
  Escenario: Error en un cambio directo sin disponibilidad
    Dado una reserva «Confirmada» y una opción solicitada sin disponibilidad
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

  @CA-075 @RF-064
  Esquema del escenario: Fechas sin una noche de estancia
    Dado un usuario autorizado y una fecha de entrada el día 10
    Cuando intenta <operacion> con fecha de salida el día <salida>
    Entonces la API rechaza las fechas sin crear una reserva o solicitud en espera ni modificar una reserva existente

    Ejemplos:
      | operacion           | salida |
      | crear una reserva   | 10     |
      | cambiar una reserva | 10     |
      | crear una reserva   | 9      |
      | cambiar una reserva | 9      |
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
  Esquema del escenario: Consulta de avisos
    Dado un aviso de <tipo> generado y un <rol> autenticado
    Cuando el personal consulta los avisos mediante la API
    Entonces la API devuelve el aviso

    Ejemplos:
      | tipo             | rol           |
      | disponibilidad   | Administrador |
      | salida tardía    | Administrador |
      | posible ausencia | Administrador |
      | disponibilidad   | Recepcionista |
      | salida tardía    | Recepcionista |
      | posible ausencia | Recepcionista |

  @CA-089 @RF-038
  Esquema del escenario: Avisos sin acciones directas de escritura
    Dado un <rol> autenticado
    Cuando solicita <operacion> un aviso mediante la API
    Entonces la operación no está permitida y los avisos permanecen intactos

    Ejemplos:
      | rol           | operacion |
      | Administrador | crear     |
      | Administrador | modificar |
      | Administrador | eliminar  |
      | Administrador | marcar    |
      | Recepcionista | crear     |
      | Recepcionista | modificar |
      | Recepcionista | eliminar  |
      | Recepcionista | marcar    |

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
    Dado una reserva «En estancia» con su habitación asignada «Ocupada»
    Cuando un usuario autorizado registra el check-out a las 12:00 del día de salida y selecciona pendiente de limpieza
    Entonces la reserva queda «Finalizada» y la habitación queda pendiente de limpieza

  @CA-063 @RF-063
  Escenario: Check-in de una habitación lista
    Dado una reserva confirmada con habitación asignada y lista para ocupar
    Cuando un usuario autorizado registra el check-in a las 15:00 del día de entrada
    Entonces se registra la entrada, la reserva pasa a «En estancia» y su habitación pasa a «Ocupada»

  @CA-076 @RF-066
  Escenario: Check-in anticipado el mismo día
    Dado una reserva confirmada con habitación asignada y lista para ocupar el día de entrada
    Cuando el personal autorizado aprueba y registra el check-in a las 14:00 de ese día
    Entonces la reserva pasa a «En estancia» sin cambiar sus fechas

  @CA-077 @RF-067
  Esquema del escenario: Check-in en otro día sin actualizar las fechas
    Dado una reserva confirmada con habitación asignada y lista para ocupar
    Cuando el personal intenta registrar el check-in un día <momento> de la fecha de entrada sin modificarla
    Entonces la API rechaza el check-in y conserva la reserva confirmada

    Ejemplos:
      | momento |
      | antes   |
      | después |

  @CA-078 @RF-067
  Escenario: Check-in en la nueva fecha confirmada
    Dado una reserva confirmada y una nueva fecha de entrada con disponibilidad
    Cuando el personal autorizado verifica la disponibilidad, cambia las fechas y registra el check-in a las 15:00 del nuevo día con la habitación asignada y lista
    Entonces la reserva pasa a «En estancia» con las nuevas fechas

  @CA-079 @RF-068
  Escenario: Aviso de salida tardía después de la tolerancia
    Dado una reserva «En estancia» sin check-out a las 12:29 del día de salida
    Y que no se ha generado un aviso de salida tardía
    Cuando son las 12:30 y sigue sin registrarse el check-out
    Entonces se genera un aviso de salida tardía y la reserva sigue «En estancia» con las mismas fechas

  @CA-080 @RF-069
  Escenario: Liberación de noches tras salida anticipada
    Dado una reserva «En estancia» desde el día 9 con salida prevista el día 12
    Cuando el personal autorizado registra el check-out el día 10
    Entonces la reserva queda «Finalizada» y deja de comprometer las noches del 10 y del 11

  @CA-081 @RF-070
  Esquema del escenario: Solicitud de una noche adicional
    Dado una reserva «En estancia» cuyo huésped solicita una noche más
    Y que <disponibilidad> para esa noche
    Cuando el personal autorizado comprueba la disponibilidad para ampliar la reserva
    Entonces <resultado>

    Ejemplos:
      | disponibilidad        | resultado                                                   |
      | hay disponibilidad    | se amplía la reserva antes de confirmar la noche al huésped |
      | no hay disponibilidad | no se confirma la noche adicional                           |

  @CA-082 @RF-071
  Escenario: Aviso de posible ausencia sin liberar noches
    Dado una reserva confirmada sin check-in a las 21:59 del día de entrada
    Y que no se ha generado un aviso de posible ausencia
    Cuando son las 22:00 y sigue sin registrarse el check-in
    Entonces se genera un aviso de posible ausencia
    Y la reserva permanece confirmada sin liberar noches

  @CA-083 @RF-072
  Escenario: Confirmación manual de una ausencia
    Dado una reserva confirmada sin check-in con un aviso de posible ausencia
    Cuando el personal autorizado confirma que el huésped no se presentó
    Entonces la reserva pasa a «No se presentó» y deja de comprometer las noches restantes

  @CA-092 @RF-063-bis
  Esquema del escenario: Operación incompatible con el estado de una reserva
    Dado un Administrador autenticado y una reserva en estado «<origen>»
    Cuando intenta <operacion> para esa reserva
    Entonces la API devuelve 409 y la reserva y su habitación asignada, si existe, conservan sus estados

    Ejemplos:
      | origen         | operacion                  |
      | Confirmada     | registrar el check-out     |
      | En estancia    | registrar otro check-in    |
      | En estancia    | confirmar una ausencia     |
      | En estancia    | cancelar la reserva        |
      | Finalizada     | registrar el check-in      |
      | No se presentó | registrar el check-in      |
      | Cancelada      | registrar el check-in      |

  @CA-093 @RF-014-bis @RF-063-bis
  Esquema del escenario: Check-out con un estado de habitación prohibido
    Dado una reserva «En estancia» con su habitación asignada «Ocupada» y un Recepcionista autenticado
    Cuando registra el check-out y elige «<destino>» para la habitación
    Entonces la API devuelve 409, no registra la salida y conserva la reserva «En estancia» y la habitación «Ocupada»

    Ejemplos:
      | destino                            |
      | Lista para ocupar                  |
      | Ocupada                            |
      | Fuera de servicio o mantenimiento |

  @CA-094 @RF-063-bis
  Escenario: Cancelación solicitada por un rol no autorizado
    Dado una reserva «Confirmada» y un Recepcionista autenticado
    Cuando el Recepcionista intenta cancelar directamente la reserva
    Entonces la API devuelve 403 y la reserva permanece «Confirmada»
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
    Dado una estancia con entrada el día 10 y salida el día 12 del mismo mes
    Y tarifas aplicables de 100 USD la noche del 10 y de 120 USD la noche del 11, sin tarifa para el día de salida
    Cuando se calcula el importe base
    Entonces el importe base es 220 USD

  @CA-090 @RF-074
  Esquema del escenario: Cálculo rechazado por tarifas ausentes o solapadas
    Dado un usuario autorizado y una estancia con entrada el día 10 y salida el día <salida> del mismo mes
    Y disponibilidad para todas las noches y estas tarifas aplicables en USD para el tipo solicitado: <tarifas>
    Cuando el usuario intenta <operacion>
    Entonces la API rechaza la operación e informa «<motivo>» para el tipo solicitado y la noche del día <noche>
    Y no devuelve un importe base ni un total
    Y no confirma una reserva, no modifica ni cancela reservas existentes y no crea ni altera solicitudes en espera

    Ejemplos:
      | salida | tarifas                                   | operacion                                              | motivo             | noche |
      | 11     | 10: ninguna                               | confirmar una reserva nueva                            | tarifa ausente     | 10    |
      | 13     | 10: 100; 11: ninguna; 12: 120              | confirmar una reserva nueva                            | tarifa ausente     | 11    |
      | 12     | 10: 100 y 110; 11: 120                     | confirmar una reserva nueva                            | tarifas solapadas  | 10    |
      | 12     | 10: 100; 11: ninguna                       | confirmar una solicitud existente en lista de espera   | tarifa ausente     | 11    |
      | 11     | 10: dos tarifas de 100                    | guardar un cambio de fechas que recalcula el importe   | tarifas solapadas  | 10    |

  @CA-047 @RF-047
  Esquema del escenario: Configuración de impuestos y cargos por el Administrador
    Dado un Administrador autenticado y datos válidos para la configuración
    Cuando el Administrador intenta <operacion>
    Entonces la configuración queda disponible para el cálculo

    Ejemplos:
      | operacion             |
      | crear un impuesto     |
      | modificar un impuesto |
      | crear un cargo        |
      | modificar un cargo    |

  @CA-084 @RF-047
  Esquema del escenario: Configuración de impuestos y cargos denegada al Recepcionista
    Dado un Recepcionista autenticado y datos válidos para la configuración
    Cuando el Recepcionista intenta <operacion>
    Entonces la API rechaza la operación y la configuración no cambia

    Ejemplos:
      | operacion             |
      | crear un impuesto     |
      | modificar un impuesto |
      | crear un cargo        |
      | modificar un cargo    |

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
    Dado una reserva, un reembolso ya realizado y un Administrador autenticado
    Cuando el Administrador registra manualmente el reembolso
    Entonces el reembolso queda vinculado a la reserva sin ejecutar otra devolución

  @CA-085 @RF-053
  Escenario: Registro de reembolso denegado al Recepcionista
    Dado una reserva, un reembolso ya realizado y un Recepcionista autenticado
    Cuando el Recepcionista intenta registrar el reembolso
    Entonces la API rechaza la operación sin registrar un movimiento

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

  @CA-086 @RF-073
  Escenario: Consulta de auditoría por el Administrador
    Dado eventos de auditoría registrados y un Administrador autenticado
    Cuando el Administrador consulta los eventos mediante la API
    Entonces la API devuelve los eventos sin contraseñas, tokens ni datos de huéspedes innecesarios

  @CA-087 @RF-073
  Escenario: Consulta de auditoría denegada al Recepcionista
    Dado eventos de auditoría registrados y un Recepcionista autenticado
    Cuando el Recepcionista intenta consultar los eventos mediante la API
    Entonces la API rechaza la consulta sin devolver eventos

  @CA-088 @RF-073
  Esquema del escenario: Auditoría sin permisos de modificación
    Dado un evento de auditoría registrado y un <rol> autenticado
    Cuando el usuario solicita <operacion> el evento mediante la API
    Entonces la operación no está permitida y el evento permanece intacto

    Ejemplos:
      | rol           | operacion |
      | Administrador | modificar |
      | Administrador | eliminar  |
      | Recepcionista | modificar |
      | Recepcionista | eliminar  |
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
| Reserva | Huésped titular, fechas previstas, fecha y hora de check-in y check-out cuando se registren, cantidad de huéspedes, tipo, habitación asignada opcional y estado | Corresponde a una habitación como máximo; puede tener avisos de estancia, movimientos y solicitudes de cambio. |
| Solicitud de cambio | Reserva original, opción solicitada y estado de aprobación | Puede originar una solicitud en espera; registra la intervención del administrador cuando corresponda. |
| Solicitud en espera | Huésped, fechas, cantidad de huéspedes, tipo o habitación solicitada y estado | Puede provenir de una solicitud nueva o de una reserva cancelada; puede generar avisos. |
| Aviso | Tipo de aviso y datos de la disponibilidad detectada, la salida tardía o la posible ausencia | Se asocia a una solicitud en espera o a una reserva, según el tipo; por sí solo no confirma, modifica ni cancela reservas. |
| Tarifa | Tipo de habitación, fechas aplicables e importe en USD | Pertenece a un tipo de habitación. |
| Impuesto o cargo | Configuración necesaria para calcular el concepto | Se aplica al cálculo de una estancia según reglas por definir. |
| Movimiento | Tipo, importe en USD y datos de registro | Pertenece a una reserva; representa un anticipo, pago parcial, pago completo o reembolso manual. |
| Evento de auditoría | Acción, fecha y hora, resultado y, cuando corresponda, usuario y recurso | Puede referirse a las entidades afectadas por una acción auditable. |

## 10. Supuestos y dependencias

- Las fechas de negocio y los horarios de estancia se interpretan en la zona horaria del hotel, `America/Guayaquil`. Las estancias se representan como intervalos con entrada incluida y salida excluida.
- El hotel tiene 20 habitaciones inicialmente; no se ha acordado un límite permanente de 20.
- La disponibilidad por fechas es distinta del estado operativo: una habitación no lista no admite check-in, aunque pueda consultarse su disponibilidad para una estancia futura.
- Un aviso de la lista de espera no garantiza disponibilidad hasta la confirmación y su nueva comprobación.
- La selección de un proveedor de nube y la configuración de respaldos y restauración son dependencias para verificar los objetivos de recuperación en operación real.
- La validación legal es una dependencia antes del uso de datos reales. El [SRI indica siete años para comprobantes electrónicos](https://www.sri.gob.ec/o/sri-portlet-biblioteca-alfresco-internet/descargar/e9383f68-a515-47a4-ad64-919190ca8c82/BOLET%C3%8DN%20018%20-%20%20AVISO%20SOBRE%20CONSERVACI%C3%93N%20DE%20COMPROBANTES%20ELECTR%C3%93NICOS%20Y%20ACCESO%20A%20SERVICIOS%20DEL%20SRI.pdf); no se presupone que todo registro de pago sea un comprobante ni que esta API los emita. También deberá revisarse la [Ley Orgánica de Protección de Datos Personales](https://www.gob.ec/sites/default/files/regulations/2025-01/01%20Ley%20Org%C3%A1nica%20de%20Protecci%C3%B3n%20de%20Datos%20Personales.pdf).

## 11. Preguntas abiertas

- **PA-003.** ¿Cómo se relaciona el estado fuera de servicio o mantenimiento con los bloqueos y quién puede cambiarlo sin eludir los permisos de administrador?
- **PA-004.** ¿Qué sucede si se rechaza una solicitud de cambio y cómo se tratan los cambios que dejan de necesitar aprobación?
- **PA-005.** ¿Qué prioridad tiene la lista de espera, cuánto dura un aviso y cómo se gestionan varios interesados en la misma disponibilidad?
- **PA-007.** ¿Qué reglas se aplican a los precios tras cambios posteriores a la reserva o a sus tarifas, al redondeo y a los impuestos o cargos aplicables?
- **PA-008.** ¿Cuáles son las políticas de cancelación, reembolso, autorización de reembolsos, sobrepagos y tratamiento del saldo?
- **PA-010.** ¿Cuáles serán la política de contraseñas, la duración y revocación de JWT y el procedimiento de recuperación de cuentas?
- **PA-011.** ¿Cuáles son los plazos de conservación y eliminación y los procedimientos para ejercer derechos, por tipo de dato y obligación legal?
- **PA-012.** ¿Qué proveedor, presupuesto, objetivo de disponibilidad, configuración de respaldos, umbrales y canales de alerta se utilizarán en producción?
- **PA-013.** Quedan pendientes las validaciones y esquemas detallados por operación y los procedimientos y entornos para probar rendimiento y recuperación.

### Decisiones resueltas

- **PA-013-resuelta.** El contrato HTTP mínimo queda definido por RNF-013-bis: estados por operación, Problem Details, paginación por cursor, formatos de fechas y correlación con `X-Request-Id`.
