import { Professional, Service, Appointment, ScheduleBlock } from '../types';

export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface SlotAvailability {
  time: string; // "09:00"
  available: boolean;
  reason?: string;
}

export function getAvailableSlots(
  dateStr: string, // "YYYY-MM-DD"
  professional: Professional,
  selectedServices: Service[],
  existingAppointments: Appointment[],
  scheduleBlocks: ScheduleBlock[]
): SlotAvailability[] {
  if (!dateStr || !professional) return [];

  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay(); // 0 = Sun ... 6 = Sat

  // Check off days
  if (professional.offDays?.includes(dateStr)) {
    return [{ time: "Folga", available: false, reason: "Profissional de folga nesta data" }];
  }

  // Check vacations
  if (professional.vacations) {
    for (const vac of professional.vacations) {
      if (dateStr >= vac.start && dateStr <= vac.end) {
        return [{ time: "Férias", available: false, reason: `Férias da profissional (${vac.reason || 'Período de descanso'})` }];
      }
    }
  }

  const workConfig = professional.workingHours?.[dayOfWeek];
  if (!workConfig || !workConfig.active) {
    return [{ time: "Fechado", available: false, reason: "A profissional não atende neste dia da semana" }];
  }

  // Calculate required total duration
  let serviceMinutes = 0;
  let maxBuffer = professional.slotBufferMinutes || 10;

  selectedServices.forEach(s => {
    serviceMinutes += s.durationMinutes;
    if (s.bufferAfterMinutes > maxBuffer) {
      maxBuffer = s.bufferAfterMinutes;
    }
  });

  if (serviceMinutes === 0) serviceMinutes = 30; // fallback default
  const totalOccupiedMinutes = serviceMinutes + maxBuffer;

  const dayStartMinutes = timeToMinutes(workConfig.startTime);
  const dayEndMinutes = timeToMinutes(workConfig.endTime);

  // Existing appointments for this professional on this date that aren't canceled
  const dayAppointments = existingAppointments.filter(apt => {
    return (
      apt.professionalId === professional.id &&
      apt.date === dateStr &&
      apt.status !== 'cancelado_cliente' &&
      apt.status !== 'cancelado_coworking'
    );
  });

  // Schedule blocks
  const dayBlocks = scheduleBlocks.filter(b => b.professionalId === professional.id && b.date === dateStr);

  const slots: SlotAvailability[] = [];

  // Generate slots every 30 minutes or 15 minutes step
  const step = 30;

  for (let current = dayStartMinutes; current + serviceMinutes <= dayEndMinutes; current += step) {
    const slotTimeStr = minutesToTime(current);
    const slotEndMinutes = current + totalOccupiedMinutes;

    let available = true;
    let reason = "";

    // 1. Check Existing Appointments
    if (available) {
      for (const apt of dayAppointments) {
        const aptStart = timeToMinutes(apt.startTime);
        const aptEnd = timeToMinutes(apt.endTime) + (professional.slotBufferMinutes || 10);

        // Overlap condition: (StartA < EndB) and (EndA > StartB)
        if (current < aptEnd && slotEndMinutes > aptStart) {
          available = false;
          reason = `Ocupado: ${apt.serviceNames.join(', ')}`;
          break;
        }
      }
    }

    // 2. Check Blocks
    if (available) {
      for (const blk of dayBlocks) {
        const blkStart = timeToMinutes(blk.startTime);
        const blkEnd = timeToMinutes(blk.endTime);
        if (current < blkEnd && slotEndMinutes > blkStart) {
          available = false;
          reason = `Bloqueado: ${blk.title}`;
          break;
        }
      }
    }

    slots.push({
      time: slotTimeStr,
      available,
      reason
    });
  }

  return slots;
}
