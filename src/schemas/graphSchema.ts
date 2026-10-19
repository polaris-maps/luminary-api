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

export type Graph = {
  points: Point[];
  connections: Connection[];
};

export type Neighbor = {
  to: number;
  meters: number;
  stairs: boolean;
};
