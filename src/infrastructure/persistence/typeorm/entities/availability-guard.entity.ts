import { Entity, PrimaryColumn } from 'typeorm';

// Single control row (id = 1) created by the initial migration. Availability writes lock it with
// SELECT ... FOR UPDATE; it is never created at request time.
@Entity({ name: 'availability_guard' })
export class AvailabilityGuard {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  id!: string;
}
