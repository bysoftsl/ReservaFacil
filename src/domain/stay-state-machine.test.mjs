import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planStayTransition, ReservationState, RoomState } from './stay-state-machine.ts';

const administrator = 'administrador';
const receptionist = 'recepcionista';
const invalidTransition = { ok: false, reason: 'invalid_state_transition' };
const forbidden = { ok: false, reason: 'role_not_allowed' };

test('check-in and check-out change the reservation and its assigned room together', () => {
  const checkIn = planStayTransition(receptionist, {
    action: 'check-in', reservation: ReservationState.Confirmed, assignedRoom: RoomState.Ready,
  });
  assert.deepEqual(checkIn, {
    ok: true, changes: { reservation: ReservationState.InStay, room: RoomState.Occupied },
  });

  for (const target of [RoomState.PendingCleaning, RoomState.Cleaning]) {
    assert.deepEqual(planStayTransition(receptionist, {
      action: 'check-out', reservation: checkIn.changes.reservation, assignedRoom: checkIn.changes.room, target,
    }), { ok: true, changes: { reservation: ReservationState.Finalized, room: target } });
  }
});

test('invalid check-in or check-out produces no state changes', () => {
  for (const assignedRoom of [null, RoomState.PendingCleaning, RoomState.Occupied]) {
    assert.deepEqual(planStayTransition(administrator, {
      action: 'check-in', reservation: ReservationState.Confirmed, assignedRoom,
    }), invalidTransition);
  }
  assert.deepEqual(planStayTransition(administrator, {
    action: 'check-in', reservation: ReservationState.InStay, assignedRoom: RoomState.Ready,
  }), invalidTransition);
  for (const target of [RoomState.Ready, RoomState.Occupied, RoomState.OutOfService]) {
    assert.deepEqual(planStayTransition(receptionist, {
      action: 'check-out', reservation: ReservationState.InStay, assignedRoom: RoomState.Occupied, target,
    }), invalidTransition);
  }
  assert.deepEqual(planStayTransition(administrator, {
    action: 'check-out', reservation: ReservationState.Confirmed, assignedRoom: RoomState.Occupied,
    target: RoomState.PendingCleaning,
  }), invalidTransition);
});

test('room updates cannot bypass check-in, check-out, cleaning or PA-003', () => {
  for (const role of [administrator, receptionist]) {
    for (const [room, target] of [
      [RoomState.Ready, RoomState.Occupied],
      [RoomState.Occupied, RoomState.PendingCleaning],
      [RoomState.PendingCleaning, RoomState.Ready],
      [RoomState.Ready, RoomState.OutOfService],
      [RoomState.OutOfService, RoomState.PendingCleaning],
    ]) {
      assert.deepEqual(planStayTransition(role, { action: 'change-room-state', room, target }), invalidTransition);
    }
  }
  assert.deepEqual(planStayTransition(receptionist, {
    action: 'change-room-state', room: RoomState.Cleaning, target: RoomState.Ready,
  }), { ok: true, changes: { room: RoomState.Ready } });

  assert.deepEqual(planStayTransition(administrator, {
    action: 'register-room', room: RoomState.Occupied, target: RoomState.Ready,
  }), invalidTransition);
  assert.deepEqual(planStayTransition(administrator, {
    action: 'register-room', room: null, target: RoomState.Occupied,
  }), { ok: false, reason: 'invalid_initial_state' });
});

test('only an administrator may cancel before check-in; a no-show must also precede check-in', () => {
  assert.deepEqual(planStayTransition(receptionist, {
    action: 'cancel', reservation: ReservationState.Confirmed,
  }), forbidden);
  assert.deepEqual(planStayTransition(administrator, {
    action: 'cancel', reservation: ReservationState.Confirmed,
  }), { ok: true, changes: { reservation: ReservationState.Cancelled } });
  assert.deepEqual(planStayTransition(receptionist, {
    action: 'confirm-no-show', reservation: ReservationState.Confirmed,
  }), { ok: true, changes: { reservation: ReservationState.NoShow } });
  for (const action of ['cancel', 'confirm-no-show']) {
    assert.deepEqual(planStayTransition(administrator, { action, reservation: ReservationState.InStay }), invalidTransition);
  }
});

test('terminal reservations cannot be reopened, even with an available room', () => {
  assert.deepEqual(planStayTransition(receptionist, { action: 'confirm-reservation', reservation: null }), {
    ok: true, changes: { reservation: ReservationState.Confirmed },
  });
  for (const reservation of [ReservationState.Finalized, ReservationState.NoShow, ReservationState.Cancelled]) {
    assert.deepEqual(planStayTransition(administrator, { action: 'confirm-reservation', reservation }), invalidTransition);
    assert.deepEqual(planStayTransition(administrator, {
      action: 'check-in', reservation, assignedRoom: RoomState.Ready,
    }), invalidTransition);
  }
});
