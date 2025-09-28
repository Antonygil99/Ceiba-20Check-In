import { useEffect, useMemo, useState } from "react";
import { Search, Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Guest, parseCSV, toCSV } from "@/lib/csv";

export default function Index() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | null>(null);

  useEffect(() => {
    fetch("/guests.csv")
      .then((r) => r.text())
      .then((t) => {
        const rows = parseCSV(t);
        setGuests(rows);
        localStorage.setItem("guests", JSON.stringify(rows));
      })
      .catch(() => setGuests([]));
  }, []);

  useEffect(() => {
    localStorage.setItem("guests", JSON.stringify(guests));
  }, [guests]);

  const filtered = useMemo(() => {
    const normalize = (s: string) =>
      s
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const q = normalize(search.trim());
    if (!q) return guests;
    return guests.filter((g) => normalize(g.nombre).includes(q));
  }, [guests, search]);

  function onEdit(guest: Guest) {
    setEditing({ ...guest });
    setOpen(true);
  }

  function onAdd() {
    setEditing({ nombre: "", dia1: "", dia2: "", asistio: false });
    setOpen(true);
  }

  const title = (s: string) =>
    s
      .split(/\s+/)
      .map((w) =>
        w
          .split("-")
          .map((p) =>
            p
              ? p.charAt(0).toLocaleUpperCase("es") +
                p.slice(1).toLocaleLowerCase("es")
              : p,
          )
          .join("-"),
      )
      .join(" ");
  const clean = (v?: string) => {
    const t = (v ?? "").trim();
    if (!t || t === "-") return "";
    return title(t);
  };
  const upsertGuest = (g: Guest) => {
    const norm: Guest = {
      ...g,
      nombre: clean(g.nombre),
      dia1: clean(g.dia1),
      dia2: clean(g.dia2),
    };
    setGuests((prev) => {
      const idx = prev.findIndex(
        (x) => x.nombre.toLowerCase() === norm.nombre.toLowerCase(),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = norm;
        return next;
      }
      return [norm, ...prev];
    });
  };

  function saveEditing() {
    if (!editing) return;
    if (!editing.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    upsertGuest(editing);
    setOpen(false);
    toast.success("Guardado");
  }

  function registerEditing() {
    if (!editing) return;
    if (!editing.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const updated = { ...editing, asistio: true } as Guest;
    upsertGuest(updated);
    setEditing(updated);
    setOpen(false);
    toast.success("Registrado");
  }

  function unregisterEditing() {
    if (!editing) return;
    const updated = { ...editing, asistio: false } as Guest;
    upsertGuest(updated);
    setEditing(updated);
    setOpen(false);
    toast.success("Asistencia quitada");
  }

  function exportCSV() {
    const blob = new Blob([toCSV(guests)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invitados.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-card text-card-foreground shadow-md p-4 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar invitado por nombre"
              className="pl-10 h-12 rounded-xl bg-background/70"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              Exportar CSV
            </Button>
            <Button
              onClick={onAdd}
              className="bg-primary text-primary-foreground rounded-xl shadow-sm"
            >
              <Plus className="mr-2" />
              Añadir
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card text-card-foreground shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Estado</th>
              <th className="text-left font-medium px-4 py-3">Nombre</th>
              <th className="text-left font-medium px-4 py-3">Día 1</th>
              <th className="text-left font-medium px-4 py-3">Día 2</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.nombre} className="border-t hover:bg-accent/40">
                <td className="px-4 py-3">
                  {g.asistio ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-400 px-2.5 py-1 text-xs font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Asistió
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      <Circle className="h-4 w-4" />
                      No Asistió
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onEdit(g)}
                    className="text-primary font-medium hover:underline"
                  >
                    {g.nombre}
                  </button>
                </td>
                <td className="px-4 py-3">
                  {g.dia1 || <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3">
                  {g.dia2 || <span className="text-muted-foreground">—</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-16 text-center text-muted-foreground"
                >
                  No hay resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.nombre ? "Editar invitado" : "Nuevo invitado"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                autoFocus
                value={editing?.nombre ?? ""}
                onChange={(e) =>
                  setEditing((s) => (s ? { ...s, nombre: e.target.value } : s))
                }
                placeholder="Nombre completo"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Día 1</label>
                <Input
                  value={editing?.dia1 ?? ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, dia1: e.target.value } : s))
                  }
                  placeholder="Ej: jaguar, tapir, No asiste…"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Día 2</label>
                <Input
                  value={editing?.dia2 ?? ""}
                  onChange={(e) =>
                    setEditing((s) => (s ? { ...s, dia2: e.target.value } : s))
                  }
                  placeholder="Ej: jaguar, tapir, No asiste…"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            {editing?.asistio ? (
              <Button onClick={unregisterEditing} className="bg-red-600 hover:bg-red-600/90 text-white">Quitar asistencia</Button>
            ) : (
              <Button onClick={registerEditing} className="bg-emerald-600 hover:bg-emerald-600/90 text-white">Registrar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
