export type Guest = { nombre: string; dia1: string; dia2: string; asistio?: boolean };

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .map((w) =>
      w
        .split("-")
        .map((p) => (p ? p.charAt(0).toLocaleUpperCase("es") + p.slice(1).toLocaleLowerCase("es") : p))
        .join("-")
    )
    .join(" ");
}

export function parseCSV(text: string): Guest[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  // Normalize header names
  const header = splitCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const idxNombre = header.findIndex((h) => h.includes("nombre"));
  const idxDia1 = header.findIndex((h) => h.includes("día 1") || h.includes("dia 1"));
  const idxDia2 = header.findIndex((h) => h.includes("día 2") || h.includes("dia 2"));
  const idxEstado = header.findIndex((h) => h.includes("estado") || h.includes("asist"));

  const normalizeCell = (v: string) => {
    const t = (v ?? "").trim();
    return t === "-" ? "" : t;
  };

  const guests: Guest[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCSVLine(lines[i]);
    if (cells.length === 0) continue;
    const nombre = normalizeCell(cells[idxNombre] ?? "");
    if (!nombre) continue;
    const estadoRaw = (cells[idxEstado] ?? "").trim().toLowerCase();
    const nNombre = titleCase(nombre);
    const nDia1 = normalizeCell(cells[idxDia1] ?? "");
    const nDia2 = normalizeCell(cells[idxDia2] ?? "");
    guests.push({
      nombre: nNombre,
      dia1: nDia1 ? titleCase(nDia1) : "",
      dia2: nDia2 ? titleCase(nDia2) : "",
      asistio: estadoRaw ? estadoRaw.includes("asist") && !estadoRaw.includes("no ") : false,
    });
  }
  return guests;
}

export function toCSV(rows: Guest[]): string {
  const header = ["Nombre", "Día 1", "Día 2", "Estado"];
  const body = rows.map((r) => [r.nombre, r.dia1, r.dia2, r.asistio ? "Asistió" : "No Asistió"].map(escapeCell).join(","));
  return [header.join(","), ...body].join("\n");
}

function escapeCell(s: string) {
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === ',') {
        result.push(current);
        current = "";
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
