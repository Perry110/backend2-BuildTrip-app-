export class CreateTripCommand {
  readonly userId: string;
  readonly name: string;
  readonly destination?: string | null;
  readonly description?: string | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly isPublic?: boolean;

  constructor(props: CreateTripCommand) {
    Object.assign(this, props);
  }
}
