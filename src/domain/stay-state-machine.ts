export enum RoomState {
  Ready = 'lista_para_ocupar',
  Occupied = 'ocupada',
  PendingCleaning = 'pendiente_de_limpieza',
  Cleaning = 'en_limpieza',
  OutOfService = 'fuera_de_servicio_o_mantenimiento',
}

export enum ReservationState {
  Confirmed = 'confirmada',
  InStay = 'en_estancia',
  Finalized = 'finalizada',
  NoShow = 'no_se_presento',
  Cancelled = 'cancelada',
}

export type StaffRole = 'administrador' | 'recepcionista';

export type StayTransition =
  | { action: 'register-room'; room: RoomState | null; target: RoomState }
  | { action: 'change-room-state'; room: RoomState; target: RoomState }
  | { action: 'confirm-reservation'; reservation: ReservationState | null }
  | { action: 'check-in'; reservation: ReservationState; assignedRoom: RoomState | null }
  | { action: 'check-out'; reservation: ReservationState; assignedRoom: RoomState | null; target: RoomState }
  | { action: 'confirm-no-show' | 'cancel'; reservation: ReservationState };

type StateChanges =
  | { room: RoomState; reservation?: never }
  | { reservation: ReservationState; room?: never }
  | { reservation: ReservationState; room: RoomState };

export type StayTransitionResult =
  | { ok: true; changes: StateChanges }
  | { ok: false; reason: 'role_not_allowed' | 'invalid_state_transition' | 'invalid_initial_state' };

const housekeepingTransitions: Readonly<Record<RoomState, readonly RoomState[]>> = {
  [RoomState.Ready]: [RoomState.PendingCleaning],
  [RoomState.Occupied]: [],
  [RoomState.PendingCleaning]: [RoomState.Cleaning],
  [RoomState.Cleaning]: [RoomState.Ready, RoomState.PendingCleaning],
  [RoomState.OutOfService]: [],
};

const cleaningStates: readonly RoomState[] = [RoomState.PendingCleaning, RoomState.Cleaning];

export function planStayTransition(role: StaffRole, transition: StayTransition): StayTransitionResult {
  if ((transition.action === 'register-room' || transition.action === 'cancel') && role !== 'administrador') {
    return { ok: false, reason: 'role_not_allowed' };
  }

  switch (transition.action) {
    case 'register-room':
      if (transition.room !== null) {
        break;
      }
      if (transition.target === RoomState.Ready || cleaningStates.includes(transition.target)) {
        return { ok: true, changes: { room: transition.target } };
      }
      return { ok: false, reason: 'invalid_initial_state' };

    case 'change-room-state':
      if (housekeepingTransitions[transition.room].includes(transition.target)) {
        return { ok: true, changes: { room: transition.target } };
      }
      break;

    case 'confirm-reservation':
      if (transition.reservation === null) {
        return { ok: true, changes: { reservation: ReservationState.Confirmed } };
      }
      break;

    case 'check-in':
      if (transition.reservation === ReservationState.Confirmed && transition.assignedRoom === RoomState.Ready) {
        return { ok: true, changes: { reservation: ReservationState.InStay, room: RoomState.Occupied } };
      }
      break;

    case 'check-out':
      if (
        transition.reservation === ReservationState.InStay &&
        transition.assignedRoom === RoomState.Occupied &&
        cleaningStates.includes(transition.target)
      ) {
        return { ok: true, changes: { reservation: ReservationState.Finalized, room: transition.target } };
      }
      break;

    case 'confirm-no-show':
      if (transition.reservation === ReservationState.Confirmed) {
        return { ok: true, changes: { reservation: ReservationState.NoShow } };
      }
      break;

    case 'cancel':
      if (transition.reservation === ReservationState.Confirmed) {
        return { ok: true, changes: { reservation: ReservationState.Cancelled } };
      }
      break;
  }

  return { ok: false, reason: 'invalid_state_transition' };
}
