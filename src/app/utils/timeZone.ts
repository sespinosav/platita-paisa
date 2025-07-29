import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export function getDateRangeUTC(period: string) {
  const timeZone = 'America/Bogota';
  
  // Obtener la fecha/hora actual en Colombia
  const nowInColombia = toZonedTime(new Date(), timeZone);
  const year = nowInColombia.getFullYear();
  const month = nowInColombia.getMonth();
  const date = nowInColombia.getDate();

  switch (period) {
    case 'today': {
      // Crear fechas en Colombia (medianoche a medianoche)
      const startColombia = new Date(year, month, date, 0, 0, 0);
      const endColombia = new Date(year, month, date + 1, 0, 0, 0);
      
      // Convertir a UTC para las queries de base de datos
      return {
        start: fromZonedTime(startColombia, timeZone).toISOString(),
        end: fromZonedTime(endColombia, timeZone).toISOString()
      };
    }
    case 'week': {
      // Primer día de la semana en Colombia (domingo)
      const dayOfWeek = nowInColombia.getDay();
      const startColombia = new Date(year, month, date - dayOfWeek, 0, 0, 0);
      const endColombia = new Date(year, month, date - dayOfWeek + 7, 0, 0, 0);
      
      return {
        start: fromZonedTime(startColombia, timeZone).toISOString(),
        end: fromZonedTime(endColombia, timeZone).toISOString()
      };
    }
    case 'month': {
      const startColombia = new Date(year, month, 1, 0, 0, 0);
      const endColombia = new Date(year, month + 1, 1, 0, 0, 0);
      
      return {
        start: fromZonedTime(startColombia, timeZone).toISOString(),
        end: fromZonedTime(endColombia, timeZone).toISOString()
      };
    }
    case 'year': {
      const startColombia = new Date(year, 0, 1, 0, 0, 0);
      const endColombia = new Date(year + 1, 0, 1, 0, 0, 0);
      
      return {
        start: fromZonedTime(startColombia, timeZone).toISOString(),
        end: fromZonedTime(endColombia, timeZone).toISOString()
      };
    }
    default:
      // Desde el 1 de enero de 2020 Colombia hasta mañana Colombia
      const defaultStartColombia = new Date(2020, 0, 1, 0, 0, 0);
      const tomorrowColombia = new Date(year, month, date + 1, 23, 59, 59);
      
      return {
        start: fromZonedTime(defaultStartColombia, timeZone).toISOString(),
        end: fromZonedTime(tomorrowColombia, timeZone).toISOString()
      };
  }
}
