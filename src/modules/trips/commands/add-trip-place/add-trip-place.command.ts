export class AddTripPlaceCommand {
  readonly userId: string;
  readonly tripId: string;
  readonly placeId: string;
  readonly visitOrder?: number | null;
  readonly visitTime?: string | null;

  constructor(props: AddTripPlaceCommand) {
    Object.assign(this, props);
  }
}
