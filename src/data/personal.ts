import defaults from "./journal-default.json";
export interface Place {
  name: string;
  coordinates: [number, number];
  residence?: "现居" | "曾居";
  visited: boolean;
  description: string;
}
interface Journal {
  personal: typeof defaults.personal;
  places: Place[];
}
const generated = import.meta.glob("./generated/journal.json", {
  eager: true,
  import: "default",
});
const journal = (generated["./generated/journal.json"] ?? defaults) as Journal;
export const personal = journal.personal;
export const places = journal.places;
