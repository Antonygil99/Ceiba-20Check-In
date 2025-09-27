import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Save } from "lucide-react";
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
    const cached = localStorage.getItem("guests");
    if (cached) {
      try {
        setGuests(JSON.parse(cached));
        return;
      } catch {}
    }
    fetch("/guests.csv")
      .then((r) => r.text())
      .then((t) => setGuests(parseCSV(t)))
      .catch(() => setGuests([]));
  }, []);

  useEffect(() => {
    localStorage.setItem("guests", JSON.stringify(guests));
  }, [guests]);

  const filtered = useMemo(() => {
    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const q = normalize(search.trim());
    if (!q) return guests;
    return guests.filter((g) => normalize(g.nombre).includes(q));
  }, [guests, search]);

  function onEdit(guest: Guest) {
    setEditing({ ...guest });
    setOpen(true);
  }

  function onAdd() {
    setEditing({ nombre: "", dia1: "", dia2: "" });
    setOpen(true);
  }

  function saveEditing() {
    if (!editing) return;
    if (!editing.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setGuests((prev) => {
      const idx = prev.findIndex((g) => g.nombre.toLowerCase() === editing.nombre.toLowerCase());
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = editing;
        return next;
      }
      return [editing, ...prev];
    });
    setOpen(false);
    toast.success("Guardado");
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

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((t) => {
      const rows = parseCSV(t);
      if (!rows.length) {
        toast.error("CSV vacío o inválido");
        return;
      }
      setGuests(rows);
      setSearch("");
      toast.success("CSV importado");
    });
    e.target.value = "";
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
            <input id="csv" type="file" accept=".csv" onChange={handleFile} className="hidden" />
            <Button variant="outline" onClick={exportCSV}>Exportar CSV</Button>
            <label htmlFor="csv">
              <Button asChild>
                <span className="inline-flex items-center"><Plus className="mr-2" />Importar CSV</span>
              </Button>
            </label>
            <Button onClick={onAdd} className="bg-primary text-primary-foreground rounded-xl shadow-sm">
              <Plus className="mr-2" />Añadir
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card text-card-foreground shadow-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="text-left font-medium px-4 py-3">Nombre</th>
              <th className="text-left font-medium px-4 py-3">Día 1</th>
              <th className="text-left font-medium px-4 py-3">Día 2</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.nombre} className="border-t hover:bg-accent/40">
                <td className="px-4 py-3">
                  <button onClick={() => onEdit(g)} className="text-primary font-medium hover:underline">
                    {g.nombre}
                  </button>
                </td>
                <td className="px-4 py-3">{g.dia1 || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-3">{g.dia2 || <span className="text-muted-foreground">—</span>}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-16 text-center text-muted-foreground">No hay resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.nombre ? "Editar invitado" : "Nuevo invitado"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                autoFocus
                value={editing?.nombre ?? ""}
                onChange={(e) => setEditing((s) => (s ? { ...s, nombre: e.target.value } : s))}
                placeholder="Nombre completo"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Día 1</label>
                <Input
                  value={editing?.dia1 ?? ""}
                  onChange={(e) => setEditing((s) => (s ? { ...s, dia1: e.target.value } : s))}
                  placeholder="Ej: jaguar, tapir, No asiste…"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Día 2</label>
                <Input
                  value={editing?.dia2 ?? ""}
                  onChange={(e) => setEditing((s) => (s ? { ...s, dia2: e.target.value } : s))}
                  placeholder="Ej: jaguar, tapir, No asiste…"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={saveEditing}><Save className="mr-2" />Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
