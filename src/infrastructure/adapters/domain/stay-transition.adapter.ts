import { Injectable } from '@nestjs/common';
import type { StayTransitionPort } from '../../../application/ports/out/stay-transition.port';
import { planStayTransition } from '../../../domain/stay-state-machine';
import type { StaffRole, StayTransition, StayTransitionResult } from '../../../domain/stay-state-machine';

@Injectable()
export class StayTransitionAdapter implements StayTransitionPort {
  validateTransition(role: StaffRole, transition: StayTransition): StayTransitionResult {
    return planStayTransition(role, transition);
  }
}
