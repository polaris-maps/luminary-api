export type Point = {
  id: number;
  lat: number;
  lng: number;
};

export type Connection = {
  from: number;
  to: number;
  meters: number;
  stairs: boolean;
};
