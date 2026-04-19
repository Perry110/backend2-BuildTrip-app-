export type UserTripContextDto = {
  placeIds: string[];
  categories: string[];
};

export interface IUserTripContextPort {
  getContext(userId: string): Promise<UserTripContextDto>;
}
