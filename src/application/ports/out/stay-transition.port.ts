import type { StaffRole, StayTransition, StayTransitionResult } from '../../../domain/stay-state-machine';

export const STAY_TRANSITION_PORT = Symbol('STAY_TRANSITION_PORT');

export interface StayTransitionPort {
  validateTransition(role: StaffRole, transition: StayTransition): StayTransitionResult;
}
