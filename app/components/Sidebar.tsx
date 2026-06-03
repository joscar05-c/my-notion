"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Note } from "../types/types";

interface SidebarProps {
  onSelectNote: (note: Note | null) => void;
  activeNoteId: string | null;
  refreshTrigger: number;
}

const Sidebar = ({ onSelectNote, activeNoteId, refreshTrigger }: SidebarProps) => {
  const [notas, setNotas] = useState<Pick<Note, "id" | "titulo" | "icono">[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotas = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from("notas")
          .select("id, titulo, icono")
          .order("actualizado_en", { ascending: false });

        if (error) throw error;

        setNotas(data ?? []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else if (typeof err === "object" && err !== null && "message" in err) {
          setError((err as { message: string }).message);
        } else {
          setError("Error desconocido al cargar las notas");
        }
      } finally {
        setCargando(false);
      }
    };

    fetchNotas();
  }, [refreshTrigger]);

  return (
    <aside className="w-64 h-screen bg-gray-100 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 flex flex-col">
      <div className="p-4">
        <button
          onClick={() => onSelectNote(null)}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          + Nueva Nota
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {cargando && (
          <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            Cargando notas...
          </p>
        )}

        {error && (
          <p className="px-3 py-2 text-sm text-red-500">{error}</p>
        )}

        {!cargando && !error && notas.length === 0 && (
          <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            No hay notas todavía.
          </p>
        )}

        {!cargando && !error && notas.length > 0 && (
          <ul className="space-y-1">
            {notas.map((nota) => (
              <li key={nota.id}>
                <button
                  onClick={() => onSelectNote(nota as Note)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeNoteId === nota.id
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800"
                  }`}
                >
                  {nota.icono || '📄'} {nota.titulo}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
