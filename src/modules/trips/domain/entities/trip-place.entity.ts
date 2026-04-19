import { randomUUID } from 'crypto';

// ── Prop types ────────────────────────────────────────────────────────────────

export type TripPlaceProps = {
  id: string;
  tripId: string;
  placeId: string;
  visitOrder: number | null;
  visitTime: Date | null;
};

// ── Child entity ──────────────────────────────────────────────────────────────

/**
 * TripPlace — child entity của TripEntity (aggregate root).
 * Không tồn tại độc lập ngoài Trip aggregate boundary.
 */
export class TripPlaceEntity {
  private constructor(private props: TripPlaceProps) {}

  static create(input: Omit<TripPlaceProps, 'id'>): TripPlaceEntity {
    return new TripPlaceEntity({ id: randomUUID(), ...input });
  }

  static reconstitute(raw: TripPlaceProps): TripPlaceEntity {
    return new TripPlaceEntity({ ...raw });
  }

  getProps(): Readonly<TripPlaceProps> {
    return { ...this.props };
  }

  update(patch: { visitOrder?: number | null; visitTime?: Date | null }): void {
    if (patch.visitOrder !== undefined) this.props.visitOrder = patch.visitOrder;
    if (patch.visitTime !== undefined) this.props.visitTime = patch.visitTime;
  }
}
