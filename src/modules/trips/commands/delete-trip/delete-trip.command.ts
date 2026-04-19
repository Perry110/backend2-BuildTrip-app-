export class DeleteTripCommand {
  readonly userId: string;
  readonly tripId: string;

  constructor(props: DeleteTripCommand) {
    Object.assign(this, props);
  }
}
