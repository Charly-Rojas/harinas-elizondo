# Informe De Flujo Operativo Y Cumplimiento De Casos De Uso

## 1. Objetivo

Este documento describe:

- el flujo completo de la app desde la creacion de un usuario hasta la emision de certificados,
- como cada modulo participa en la operacion,
- como la implementacion actual cubre los casos de uso del caso de estudio,
- y que limites o pendientes siguen abiertos.

El analisis esta basado en la implementacion real del proyecto, no solo en los documentos fuente.

## 2. Resumen Ejecutivo

La app ya soporta el flujo principal del laboratorio:

1. un usuario se registra,
2. un administrador lo aprueba y le asigna rol,
3. se crean clientes, parametros, equipos y lotes,
4. se capturan inspecciones por lote con secuencia automatica `A-Z`,
5. se comparan resultados contra limites del cliente o internacionales,
6. se generan ajustes trazables sin sobrescribir la inspeccion original,
7. se emite un certificado con snapshot historico,
8. se genera PDF,
9. se intenta archivar en Supabase Storage,
10. se envia por correo a cliente y almacen,
11. el certificado queda consultable e imprimible.

La cobertura es fuerte para los casos de uso `CU-2.2.1` a `CU-2.2.10`.

El punto mas importante pendiente fuera de esos casos es el modulo formal de reportes estadisticos. La base de datos ya deja el historico listo, pero la interfaz de reportes aun no esta construida.

## 3. Arquitectura Funcional Actual

### 3.1 Stack

- Frontend y backend web: Next.js App Router
- UI: React + Radix Themes + Tailwind
- Autenticacion: Supabase Auth
- Datos: Supabase Postgres
- Autorizacion: perfiles y RLS
- PDF: `pdf-lib`
- Correo: Gmail SMTP via `nodemailer`

### 3.2 Tablas Principales

- `perfiles`
- `clientes`
- `direcciones`
- `param_ref_cliente`
- `productos`
- `equipos_laboratorio`
- `parametros_calidad`
- `equipos_parametros`
- `lotes_produccion`
- `inspecciones`
- `resultados_analisis`
- `certificados_calidad`
- `certificado_resultados`
- `auditoria_eventos`

### 3.3 Reglas Base Del Sistema

- Todo modulo privado exige sesion.
- Todo usuario nuevo entra como `operador` y `aprobado = false`, salvo el bootstrap inicial de `superadmin@harinas-elizondo.local`.
- Solo usuarios aprobados pueden operar datos productivos.
- Las tablas privadas estan protegidas con RLS y dependen de `usuario_actual_aprobado()` y `usuario_actual_es_admin()`.
- Los cambios criticos de certificados y ajustes dejan evento en `auditoria_eventos`.

## 4. Flujo Operativo Completo

## 4.1 Registro De Usuario

### Como ocurre

El usuario entra a `/login` y usa la pestaña de registro.

La accion `registrar_usuario`:

- valida nombre, correo y contrasena,
- llama a `supabase.auth.signUp(...)`,
- envia `nombre` en `user_metadata`,
- opcionalmente usa `SUPABASE_AUTH_REDIRECT_URL` para confirmacion,
- y devuelve mensaje de exito o error controlado.

### Que pasa en base de datos

Cuando Supabase crea el usuario en `auth.users`, el trigger `on_auth_user_created` ejecuta `crear_perfil_usuario()`.

Ese trigger crea un registro en `public.perfiles` con:

- `rol = operador`
- `aprobado = false`
- `correo` normalizado
- `nombre` desde metadata o desde el correo

### Resultado

El usuario existe en Auth y tambien existe ya en `perfiles`, pero aun no puede operar.

## 4.2 Inicio De Sesion

### Como ocurre

La accion `iniciar_sesion` usa `supabase.auth.signInWithPassword(...)`.

Si la autenticacion es correcta:

- invalida cache de layout,
- redirige a `/`.

### Que valida el sistema despues

El layout privado llama a `requiere_sesion()`.

Si no hay sesion:

- redirige a `/login`.

Si hay sesion pero `perfil.aprobado = false`:

- muestra pantalla de acceso pendiente,
- no deja entrar al panel.

## 4.3 Aprobacion Y Asignacion De Rol

### Como ocurre

Un `admin` o `superadmin` entra a `/settings`.

La pantalla:

- lista usuarios pendientes,
- permite aprobarlos,
- permite asignar o cambiar rol segun jerarquia.

Las acciones server:

- `aprobar_usuario`
- `actualizar_rol`

### Reglas de negocio aplicadas

- un admin no puede cambiar su propio rol,
- un admin no puede manipular a un superadmin,
- un superadmin si puede asignar cualquier rol,
- un admin solo puede asignar `admin` u `operador`.

### Resultado

Cuando un usuario queda aprobado, ya puede acceder al panel y operar modulos.

## 4.4 Ingreso Al Panel

La pantalla `/` funciona como tablero de acceso a modulos:

- Clientes
- Equipos
- Parametros
- Lotes
- Inspecciones
- Settings

El shell privado ya es responsive y soporta navegacion mobile/desktop.

## 4.5 Configuracion Maestra

Antes de capturar analisis reales, el flujo correcto es:

1. crear parametros,
2. crear equipos y asociarles parametros con limites internacionales,
3. crear clientes y, si aplica, sus especificaciones particulares,
4. crear lotes de produccion.

Con eso se habilita el flujo de inspeccion y certificacion.

## 4.6 Alta Y Mantenimiento De Parametros

Ruta: `/parametros`

### Que hace

- crea parametros de calidad con clave unica,
- define nombre, unidad y equipo origen,
- permite editar,
- permite activar o desactivar.

### Como lo hace

Usa la tabla `parametros_calidad`.

Las acciones:

- `crear_parametro`
- `editar_parametro`
- `cambiar_estado_parametro`

### Ejemplos de parametros ya previstos

- Alveografo: `P`, `L`, `W`, `S`, `P/L`
- Farinografo: absorcion, desarrollo, estabilidad, reblandecimiento, `FQN`

## 4.7 Alta Y Mantenimiento De Equipos

Ruta: `/equipos`

### Que hace

- registra equipos de laboratorio,
- soporta `alveografo`, `farinografo` y `otro`,
- asocia parametros a cada equipo,
- guarda limites internacionales y desviacion permitida por parametro,
- permite editar e inactivar.

### Como lo hace

Usa:

- `equipos_laboratorio`
- `equipos_parametros`

Las acciones:

- `crear_equipo`
- `editar_equipo`
- `cambiar_status_equipo`

### Logica importante

Al guardar un equipo:

- primero inserta el registro maestro,
- luego sincroniza todas sus asociaciones de parametros,
- evita parametros duplicados en un mismo equipo,
- valida que `lim_min <= lim_max`.

## 4.8 Alta Y Mantenimiento De Clientes

Ruta: `/clientes`

### Que hace

- registra clientes con ID SAP manual,
- guarda RFC, domicilios y contactos,
- marca si solicita certificado,
- marca si usa especificaciones del cliente,
- guarda especificaciones particulares por parametro,
- permite editar e inactivar.

### Como lo hace

Usa:

- `clientes`
- `direcciones`
- `param_ref_cliente`

Las acciones:

- `crear_cliente`
- `editar_cliente`
- `cambiar_status_cliente`

### Logica importante

Al guardar cliente:

- valida que el ID SAP tenga 6 digitos,
- valida RFC con regex,
- asegura unicidad de `id_cliente` y `rfc`,
- sincroniza la direccion de entrega en `direcciones`,
- sincroniza las especificaciones particulares en `param_ref_cliente`,
- obliga a registrar parametros si el cliente usa especificaciones propias.

## 4.9 Registro De Lotes

Ruta: `/lotes`

### Que hace

- registra lote de produccion,
- guarda numero de lote,
- permite ligar producto, variedad y fechas,
- sirve como base de trazabilidad para inspecciones y certificados.

### Como lo hace

Usa la tabla `lotes_produccion`.

Las acciones:

- `crear_lote`
- `editar_lote`

### Regla clave

`numero_lote` es unico. Toda inspeccion y todo certificado se anclan a este registro.

## 4.10 Captura De Inspecciones

Ruta: `/inspecciones`

### Que hace

- crea inspecciones por lote,
- captura resultados por parametro,
- compara contra limites,
- marca si el valor queda dentro o fuera de especificacion,
- genera secuencia automatica `A-Z`.

### Como lo hace

Usa:

- `inspecciones`
- `resultados_analisis`
- RPC `siguiente_secuencia_inspeccion(...)`

Las acciones:

- `crear_inspeccion`
- `editar_inspeccion`
- `crear_ajuste_inspeccion`

### Logica de calculo de limites

Por cada resultado capturado, el sistema busca:

1. si el cliente tiene limite particular en `param_ref_cliente`,
2. si no, usa el limite internacional del equipo en `equipos_parametros`,
3. si no existe ninguno, deja origen `interno` sin limite numerico aplicable.

Luego calcula:

- `lim_min_aplicado`
- `lim_max_aplicado`
- `origen_limites`
- `desviacion`
- `dentro_especificacion`

### Secuencia automatica

- primera inspeccion del lote: `A`
- siguientes: `B`, `C`, `D`...
- si llega a `Z`, ya no permite mas registros

### Restriccion importante

Solo una inspeccion en `borrador` puede editarse directamente.

Si ya no debe tocarse en forma directa, el sistema obliga a crear un ajuste trazable.

## 4.11 Ajustes Trazables

### Que hacen

Permiten corregir o reemplazar una inspeccion sin destruir la evidencia original.

### Como lo hace la app

`crear_ajuste_inspeccion`:

- recibe `id_inspeccion_base`,
- conserva el mismo lote,
- exige `motivo_ajuste`,
- crea una nueva inspeccion con `tipo_origen = ajuste`,
- marca `es_ajuste = true`,
- guarda `id_inspeccion_base`,
- asigna nueva secuencia,
- inserta nuevos resultados,
- registra un evento en `auditoria_eventos`.

### Resultado

La inspeccion original sigue intacta. El ajuste existe como otro registro auditable.

Esto elimina el patron peligroso de sobrescribir resultados o fabricar conformidades sin rastro.

## 4.12 Emision De Certificados

Ruta: `/certificados`

### Que hace

- permite emitir un certificado a partir de una inspeccion,
- captura datos comerciales y de embarque,
- congela snapshot de resultados,
- genera folio,
- genera PDF,
- intenta archivarlo en Storage,
- envia correo,
- deja el certificado consultable e imprimible.

### Como lo hace

Usa:

- `certificados_calidad`
- `certificado_resultados`
- `auditoria_eventos`

La accion principal es `crear_certificado`.

### Secuencia interna detallada

1. valida `id_inspeccion`.
2. carga la inspeccion con cliente, lote y resultados.
3. exige que la inspeccion tenga cliente asociado.
4. exige que existan resultados.
5. verifica que no exista ya otro certificado activo para esa inspeccion.
6. genera folio con formato `CC-AAAA-0001`.
7. inserta registro en `certificados_calidad`.
8. copia resultados a `certificado_resultados`.
9. actualiza la inspeccion a `status = aprobada`.
10. genera PDF con `pdf-lib`.
11. intenta subir el PDF a Supabase Storage.
12. registra auditoria de emision.
13. si SMTP esta configurado, envia correo a cliente y almacen.
14. actualiza `status_envio` a `enviado` o `fallido`.
15. redirige a la vista detalle del certificado.

### Snapshot historico

Este punto es clave: el certificado no depende solo de `resultados_analisis` en vivo.

Al emitirse, la app copia el estado del analisis a `certificado_resultados`. Eso hace que el certificado quede historico aunque luego existan nuevos ajustes o cambios en otras tablas.

## 4.13 Generacion Y Consulta De PDF

Rutas:

- `/certificados/[id]`
- `/certificados/[id]/pdf`

### Como funciona

La app genera un PDF formal con:

- cliente
- lote
- inspeccion
- orden de compra
- factura
- fechas
- cantidades
- tabla de resultados
- limites
- desviacion
- estado

### Fallback tecnico

Si el PDF ya esta en Storage y la `service role key` funciona, lo descarga desde Storage.

Si no, la ruta `/certificados/[id]/pdf` lo regenera al vuelo.

Eso evita que la consulta del certificado dependa por completo del bucket.

## 4.14 Envio De Correo

### Que hace

La app envia el certificado desde la cuenta Gmail configurada por SMTP.

### Como lo hace

`enviarCorreoCertificado`:

- normaliza destinatarios,
- arma asunto y resumen,
- genera version texto y HTML,
- adjunta el PDF si esta disponible,
- envia con `nodemailer`.

### Seguimiento

El sistema guarda:

- `status_envio = pendiente | enviado | fallido`
- auditoria cuando el envio falla

## 5. Cumplimiento De Casos De Uso

## 5.1 CU-2.2.1 Alta De Equipo De Laboratorio

### Estado

Cumplido.

### Como lo cumple

- pantalla `/equipos`
- formulario de alta
- registro en `equipos_laboratorio`
- asociaciones en `equipos_parametros`
- validacion de clave unica y limites

### Resultado funcional

El equipo queda listo para usarse como origen de parametros de analisis.

## 5.2 CU-2.2.2 Cambio De Datos De Equipo De Laboratorio

### Estado

Cumplido.

### Como lo cumple

- edicion desde `/equipos`
- actualizacion del maestro del equipo
- resincronizacion de asociaciones de parametros
- control de estado `activo/inactivo/baja`

### Observacion

El cambio se guarda sobre el maestro actual. No existe aun un historial dedicado de versiones de equipo, pero si queda fecha de actualizacion y usuario en columnas de auditoria basicas.

## 5.3 CU-2.2.3 Baja De Equipo De Laboratorio

### Estado

Cumplido de forma operativa.

### Como lo cumple

- no elimina fisicamente el equipo,
- cambia `status` a `inactivo` o `baja`,
- permite mantener integridad historica de inspecciones previas.

### Observacion

La baja es logica, que es la estrategia correcta para no romper trazabilidad.

## 5.4 CU-2.2.4 Alta De Cliente

### Estado

Cumplido.

### Como lo cumple

- pantalla `/clientes`
- alta con ID SAP manual
- validacion de RFC
- registro de contacto de certificado y correos
- registro de direccion de entrega
- registro de si solicita certificado
- registro de especificaciones particulares por parametro

## 5.5 CU-2.2.5 Cambio De Datos De Cliente

### Estado

Cumplido.

### Como lo cumple

- edicion desde `/clientes`
- actualiza datos generales
- vuelve a sincronizar direccion y parametros del cliente
- conserva el mismo ID SAP como identidad del cliente

## 5.6 CU-2.2.6 Baja De Clientes

### Estado

Cumplido de forma operativa.

### Como lo cumple

- cambio de `status` a `inactivo` o `baja`
- sin borrado fisico del cliente

### Observacion

Esto mantiene certificados e inspecciones historicas consistentes.

## 5.7 CU-2.2.7 Registro De Analisis Inicial

### Estado

Cumplido.

### Como lo cumple

- ruta `/inspecciones`
- seleccion de lote y cliente
- captura de resultados
- uso del RPC `siguiente_secuencia_inspeccion`
- para el primer analisis devuelve `A`

### Resultado

La inspeccion inicial queda como primer registro del lote y sus resultados se calculan contra limites aplicables.

## 5.8 CU-2.2.8 Registro De Analisis Subsecuentes

### Estado

Cumplido.

### Como lo cumple

- el mismo flujo de inspeccion reutiliza la misma logica,
- el RPC devuelve la siguiente letra disponible,
- los resultados se almacenan en una nueva inspeccion del mismo lote.

### Resultado

El lote mantiene linea historica `A-Z`.

## 5.9 CU-2.2.9 Edicion De Certificados De Calidad

### Estado

Cumplido con enfoque trazable.

### Como lo cumple

La app no reescribe certificados o inspecciones consolidadas como mecanismo principal. En lugar de eso:

- crea ajustes trazables sobre la inspeccion base,
- exige motivo del ajuste,
- registra nueva secuencia,
- conserva el original,
- y permite luego emitir el certificado desde la inspeccion correcta.

### Resultado

Se resuelve la necesidad de correccion sin caer en manipulacion opaca.

## 5.10 CU-2.2.10 Impresion De Certificados De Calidad

### Estado

Cumplido.

### Como lo cumple

- emision desde `/certificados`
- vista detalle del certificado
- ruta `/certificados/[id]/pdf`
- boton de impresion
- PDF descargable o embebido
- correo automatico con adjunto

### Resultado

El certificado queda emitido, consultable, imprimible y enviable.

## 6. Como La App Resuelve El Problema Del Proceso Actual

El proceso original tenia varios riesgos operativos. La implementacion actual los ataca de esta forma:

### Riesgo: usuarios operando sin control

Respuesta:

- aprobacion manual de cuentas,
- roles y permisos,
- RLS en base de datos.

### Riesgo: datos maestros inconsistentes

Respuesta:

- validaciones de RFC, claves unicas y estados,
- separacion clara entre clientes, equipos, parametros y lotes.

### Riesgo: sobrescribir inspecciones para simular conformidad

Respuesta:

- ajustes como nuevo registro,
- inspeccion base intacta,
- motivo obligatorio,
- evento de auditoria.

### Riesgo: certificado armado con datos cambiantes

Respuesta:

- snapshot en `certificado_resultados`,
- folio unico,
- estado de emision.

### Riesgo: dependencia de trabajo manual externo para PDF y envio

Respuesta:

- generacion automatica de PDF,
- ruta propia de consulta,
- envio SMTP desde la app.

## 7. Alcance Real Ya Implementado

Implementado hoy:

- autenticacion
- aprobacion de usuarios
- roles base
- clientes
- parametros
- equipos
- lotes
- inspecciones
- ajustes trazables
- certificados
- PDF
- correo
- auditoria basica
- shell responsive

No implementado aun o incompleto:

- modulo visual de reportes estadisticos
- integracion SAP
- lectura automatica de equipos
- flujo avanzado de cancelacion de certificados
- historial formal de cambios para catalogos maestros mas alla de columnas de auditoria y eventos criticos

## 8. Flujo Recomendado De Uso En Operacion

Para operar correctamente la app, el orden recomendado es:

1. Registrar usuarios.
2. Aprobar usuarios en `/settings`.
3. Cargar parametros base en `/parametros`.
4. Registrar equipos y asociar sus parametros en `/equipos`.
5. Registrar clientes y sus especificaciones en `/clientes`.
6. Registrar lotes en `/lotes`.
7. Capturar inspecciones en `/inspecciones`.
8. Si hay correcciones, crear ajuste trazable.
9. Emitir certificado desde `/certificados`.
10. Consultar, imprimir o reenviar el PDF del certificado.

## 9. Conclusion

La app ya cubre el nucleo operativo del laboratorio y resuelve los 10 casos de uso principales del caso de estudio mediante un flujo consistente:

- usuario controlado,
- datos maestros estructurados,
- analisis trazable por lote,
- ajustes auditables,
- certificado historico con PDF y correo.

La parte que todavia falta para cerrar completamente la vision documental es el modulo de reportes estadisticos y analitica historica. Todo lo demas necesario para la operacion diaria de alta de catalogos, captura de analisis y emision de certificados ya tiene soporte funcional en la implementacion actual.
