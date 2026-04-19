import type { TripProps } from '../domain/trip.types';

export class TripResponseDto {
  id: string;
  userId: string;
  name: string;
  destination: string | null;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  isPublic: boolean;

  constructor(props: TripProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.destination = props.destination;
    this.description = props.description;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.isPublic = props.isPublic;
  }
}
