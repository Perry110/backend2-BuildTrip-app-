export class AddPlaceCommentCommand {
  readonly placeId: string;
  readonly userId: string;
  readonly username: string;
  readonly rating: number;
  readonly content: string;

  constructor(props: AddPlaceCommentCommand) {
    Object.assign(this, props);
  }
}
