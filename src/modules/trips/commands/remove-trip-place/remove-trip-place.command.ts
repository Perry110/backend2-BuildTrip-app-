export class RemoveTripPlaceCommand {
  readonly userId: string;
  readonly tripId: string;
  readonly tripPlaceId: string;

  constructor(props: RemoveTripPlaceCommand) {
    Object.assign(this, props);
  }
}
