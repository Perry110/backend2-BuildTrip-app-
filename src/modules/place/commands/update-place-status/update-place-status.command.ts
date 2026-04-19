export class UpdatePlaceStatusCommand {
  readonly placeId: string;
  readonly status: string;

  constructor(props: UpdatePlaceStatusCommand) {
    Object.assign(this, props);
  }
}
