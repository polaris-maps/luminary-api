import { mkdir, writeFile } from "node:fs/promises";
import { distanceMeters } from "../src/utils/distance";

const servers = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

const campus = "35.896,-79.063,35.920,-79.032";

const walkable = [
  "footway",
  "pedestrian",
  "path",
  "steps",
  "living_street",
  "service",
  "residential",
  "unclassified",
  "tertiary",
  "tertiary_link",
  "secondary",
  "secondary_link",
  "primary",
  "primary_link",
];

const overpassQuery = `[out:json][timeout:120];way["highway"~"^(${walkable.join("|")})$"](${campus});(._;>;);out body;`;

function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function download() {
  for (let attempt = 1; attempt <= 3; attempt++) {
    for (const server of servers) {
      try {
        const res = await fetch(server, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "luminary-api (App Team Carolina)",
          },
          body: "data=" + encodeURIComponent(overpassQuery),
        });
        const text = await res.text();
        if (res.ok && text.startsWith("{")) {
          const data = JSON.parse(text);
          if (!data.remark) return data;
        }
        console.log(`${server} is busy`);
      } catch {
        console.log(`${server} didn't answer`);
      }
    }
    await wait(15);
  }
  throw new Error("Couldn't download the map from OpenStreetMap. Try again in a few minutes.");
}

function canWalk(tags: any) {
  if (tags.access === "private" || tags.access === "no") return false;
  if (tags.foot === "private" || tags.foot === "no") return false;
  return true;
}

const data = await download();

const nodes: any = {};
const neighbors: any = {};
const seen: any = {};
const connections: any[] = [];

function connect(a: number, b: number) {
  if (!neighbors[a]) neighbors[a] = [];
  neighbors[a].push(b);
}

for (const element of data.elements) {
  if (element.type === "node") nodes[element.id] = element;
}

for (const way of data.elements) {
  if (way.type !== "way" || !canWalk(way.tags)) continue;

  for (let i = 1; i < way.nodes.length; i++) {
    const from = way.nodes[i - 1];
    const to = way.nodes[i];
    const key = Math.min(from, to) + "-" + Math.max(from, to);
    if (seen[key]) continue;
    seen[key] = true;

    const a = nodes[from];
    const b = nodes[to];
    const meters = distanceMeters(a.lat, a.lon, b.lat, b.lon);
    connections.push({ from, to, meters: Math.round(meters * 10) / 10, stairs: way.tags.highway === "steps" });
    connect(from, to);
    connect(to, from);
  }
}

function findPiece(start: number) {
  const piece: any = {};
  piece[start] = true;
  const stack = [start];
  while (stack.length > 0) {
    const id: any = stack.pop();
    for (const next of neighbors[id]) {
      if (!piece[next]) {
        piece[next] = true;
        stack.push(next);
      }
    }
  }
  return piece;
}

let biggest: any = {};
let biggestSize = 0;
let totalPoints = 0;
const checked: any = {};

for (const element of data.elements) {
  if (element.type !== "node" || !neighbors[element.id] || checked[element.id]) continue;
  const piece = findPiece(element.id);
  const size = Object.keys(piece).length;
  totalPoints += size;
  for (const id in piece) checked[id] = true;
  if (size > biggestSize) {
    biggest = piece;
    biggestSize = size;
  }
}

const points: any[] = [];
for (const element of data.elements) {
  if (element.type === "node" && biggest[element.id]) {
    points.push({ id: element.id, lat: element.lat, lng: element.lon });
  }
}
points.sort((a, b) => a.id - b.id);

const kept = connections.filter((c) => biggest[c.from]);
kept.sort((a, b) => {
  if (a.from !== b.from) return a.from - b.from;
  return a.to - b.to;
});

function toLines(items: any[]) {
  return items.map((item) => "  " + JSON.stringify(item)).join(",\n");
}

await mkdir("data", { recursive: true });
await writeFile(
  "data/graph.json",
  '{\n"points": [\n' + toLines(points) + '\n],\n"connections": [\n' + toLines(kept) + "\n]\n}\n",
);

const stairs = kept.filter((c) => c.stairs);
console.log(`points: ${points.length}`);
console.log(`connections: ${kept.length} (${stairs.length} are stairs)`);
console.log(`left out ${totalPoints - points.length} points that don't connect to the rest of campus`);
