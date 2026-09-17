const LIMA_TIME_ZONE = 'America/Lima';

export function limaDateISO(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: LIMA_TIME_ZONE });
}

export function limaDayRange(dateISO: string) {
  return {
    from: `${dateISO}T00:00:00-05:00`,
    to: `${dateISO}T23:59:59.999-05:00`,
  };
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-PE', {
    timeZone: LIMA_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00-05:00`).toLocaleDateString('es-PE', {
    timeZone: LIMA_TIME_ZONE,
  });
}
