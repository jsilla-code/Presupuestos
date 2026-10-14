# PresuFollow

Herramienta de seguimiento de presupuestos y gestión comercial de propuestas para autónomos y pequeñas empresas.

## Tecnologías

- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Vite**

## Características principales

- **Hoy (Seguimiento comercial)**:
  - Panel resumen de propuestas pendientes, contactos para hoy y presupuestos vencidos.
  - Generación de recordatorios periódicos (configurables: por defecto a los 3, 7 y 14 días).
  - Integración directa con WhatsApp Web (`wa.me`) con texto personalizado según estado y cliente.
  - Copia rápida de mensaje y registro de recordatorio enviado.
  - Alertas para presupuestos sin respuesta tras el último aviso y presupuestos vencidos.

- **Presupuestos**:
  - Filtros dinámicos por estado: Todos, Pendientes, Vencidos, Aceptados, Rechazados, Borradores.
  - Búsqueda en tiempo real por número de presupuesto, nombre de cliente o trabajo.
  - Indicadores visuales de estado y cálculo automático de totales.

- **Creador y Editor de Presupuestos**:
  - Formulario con autocompletado inteligente de clientes habituales.
  - Líneas de concepto con cantidad, precio unitario, descuento porcentual y selector de tipo de IVA (21%, 10%, 4%, 0%).
  - Cálculo en tiempo real de importe bruto, descuentos, base imponible, desglose por tipo de IVA y total.
  - Condiciones de pago y notas internas privadas.
  - Validaciones completas antes de guardar o enviar.

- **Ficha Detallada (Vista Documento)**:
  - Vista formal en papel con membrete del negocio, fechas de emisión y validez.
  - Flujo de resolución: aceptar con notas o rechazar con motivo (Precio, Plazo, Alternativa, etc.).
  - Historial de auditoría completo con fecha y hora de cada acción.

- **Estadísticas y Análisis Comercial**:
  - Filtro por periodo: Histórico total, Año actual o Mes actual.
  - Barra de distribución gráfica del importe presupuestado (Aceptado, Pendiente/vencido, Rechazado).
  - Métricas clave: tasa de conversión/aceptación, tiempo medio de respuesta en días, número de recordatorios enviados.
  - Desglose de motivos de rechazo.

- **Ajustes y Respaldo**:
  - Datos comerciales del emisor y tipo de IVA por defecto.
  - Configuración de días de intervalo para la secuencia de recordatorios.
  - Copia de seguridad en formato JSON y restauración con validación.
