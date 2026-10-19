import journal from "./journal.json";
export interface Place {
  name: string;
  coordinates: [number, number];
  residence?: "现居" | "曾居";
  visited: boolean;
  description: string;
}
export const personal = journal.personal;
export const places = journal.places as Place[];
