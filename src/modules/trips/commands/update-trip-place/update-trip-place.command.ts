export class UpdateTripPlaceCommand {
  readonly userId: string;
  readonly tripId: string;
  readonly tripPlaceId: string;
  readonly visitOrder?: number | null;
  readonly visitTime?: string | null;

  constructor(props: UpdateTripPlaceCommand) {
    Object.assign(this, props);
  }
}
