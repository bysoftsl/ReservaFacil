import { Inject, Injectable } from '@nestjs/common';
import type { StaffRole, StayTransition, StayTransitionResult } from '../../domain/stay-state-machine';
import { STAY_TRANSITION_PORT } from '../ports/out/stay-transition.port';
import type { StayTransitionPort } from '../ports/out/stay-transition.port';

@Injectable()
export class ChangeStayStateUseCase {
  constructor(@Inject(STAY_TRANSITION_PORT) private readonly stayTransition: StayTransitionPort) {}

  execute(role: StaffRole, transition: StayTransition): StayTransitionResult {
    return this.stayTransition.validateTransition(role, transition);
  }
}
