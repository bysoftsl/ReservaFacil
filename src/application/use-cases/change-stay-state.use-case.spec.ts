import { describe, expect, it, jest } from '@jest/globals';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ReservationState, RoomState } from '../../domain/stay-state-machine';
import type { StayTransition, StayTransitionResult } from '../../domain/stay-state-machine';
import { StayTransitionAdapter } from '../../infrastructure/adapters/domain/stay-transition.adapter';
import { STAY_TRANSITION_PORT } from '../ports/out/stay-transition.port';
import type { StayTransitionPort } from '../ports/out/stay-transition.port';
import { ChangeStayStateUseCase } from './change-stay-state.use-case';

@Module({
  providers: [ChangeStayStateUseCase, { provide: STAY_TRANSITION_PORT, useClass: StayTransitionAdapter }],
})
class StayTransitionTestModule {}

describe('ChangeStayStateUseCase', () => {
  it('returns the joint state changes from the port for a valid check-in', () => {
    const transition: StayTransition = {
      action: 'check-in',
      reservation: ReservationState.Confirmed,
      assignedRoom: RoomState.Ready,
    };
    const result: StayTransitionResult = {
      ok: true,
      changes: { reservation: ReservationState.InStay, room: RoomState.Occupied },
    };
    const validateTransition = jest.fn<StayTransitionPort['validateTransition']>().mockReturnValue(result);
    const useCase = new ChangeStayStateUseCase({ validateTransition });

    expect(useCase.execute('recepcionista', transition)).toBe(result);
    expect(validateTransition).toHaveBeenCalledTimes(1);
    expect(validateTransition).toHaveBeenCalledWith('recepcionista', transition);
  });

  it('returns the rejection without state changes for an invalid check-in', () => {
    const transition: StayTransition = {
      action: 'check-in',
      reservation: ReservationState.Confirmed,
      assignedRoom: RoomState.PendingCleaning,
    };
    const result: StayTransitionResult = { ok: false, reason: 'invalid_state_transition' };
    const validateTransition = jest.fn<StayTransitionPort['validateTransition']>().mockReturnValue(result);
    const useCase = new ChangeStayStateUseCase({ validateTransition });

    const actual = useCase.execute('recepcionista', transition);

    expect(actual).toBe(result);
    expect(actual).not.toHaveProperty('changes');
    expect(validateTransition).toHaveBeenCalledTimes(1);
    expect(validateTransition).toHaveBeenCalledWith('recepcionista', transition);
  });

  it('resolves the real adapter through NestJS and preserves domain decisions', async () => {
    const app = await NestFactory.createApplicationContext(StayTransitionTestModule, { logger: false });

    try {
      const useCase = app.get(ChangeStayStateUseCase);

      expect(
        useCase.execute('recepcionista', {
          action: 'check-out',
          reservation: ReservationState.InStay,
          assignedRoom: RoomState.Occupied,
          target: RoomState.PendingCleaning,
        }),
      ).toEqual({
        ok: true,
        changes: { reservation: ReservationState.Finalized, room: RoomState.PendingCleaning },
      });
      expect(
        useCase.execute('recepcionista', {
          action: 'cancel',
          reservation: ReservationState.Confirmed,
        }),
      ).toEqual({ ok: false, reason: 'role_not_allowed' });
    } finally {
      await app.close();
    }
  });
});
