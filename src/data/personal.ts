import defaults from "./journal-default.json";
export interface Place {
  name: string;
  coordinates: [number, number];
  residence?: "现居" | "曾居";
  visited: boolean;
  description: string;
}
export interface Photo {
  src: string;
  alt: string;
  title: string;
  category: "人像" | "猫犬" | "风光";
  location?: string;
  date?: string;
  camera?: string;
  story?: string;
  width?: number;
  height?: number;
}
export interface Music {
  id: string;
  artist: string;
  kind: string;
  title?: string;
  cover?: string;
  thought?: string;
  spotify?: string;
  qq?: string;
}
export interface Note {
  id: string;
  body: string;
  pubDatetime: string;
  island?: boolean;
}
export interface Game {
  id: string;
  title: string;
  platform: string;
  status: string;
  score?: number;
  thought?: string;
}
interface Journal {
  personal: typeof defaults.personal;
  places: Place[];
  photos: Photo[];
  music: Music[];
  notes: Note[];
  games: Game[];
}
const generated = import.meta.glob("./generated/journal.json", {
  eager: true,
  import: "default",
});
const journal = (generated["./generated/journal.json"] ?? defaults) as Journal;
export const { personal, places, photos, music, notes, games } = journal;
