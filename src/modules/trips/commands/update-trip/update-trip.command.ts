export class UpdateTripCommand {
  readonly userId: string;
  readonly tripId: string;
  readonly name?: string;
  readonly destination?: string | null;
  readonly description?: string | null;
  readonly startDate?: string | null;
  readonly endDate?: string | null;
  readonly isPublic?: boolean;

  constructor(props: UpdateTripCommand) {
    Object.assign(this, props);
  }
}
