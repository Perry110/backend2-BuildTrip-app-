export class CreatePlaceCommand {
  readonly name: string;
  readonly address: string;
  readonly description: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly categoryId: string;
  readonly tagIds: string[];

  constructor(props: CreatePlaceCommand) {
    Object.assign(this, props);
  }
}
