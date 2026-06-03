"use client";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import dynamic from "next/dynamic";
import Auth from "./components/Auth";
import Sidebar from "./components/Sidebar";
import { Session } from "@supabase/supabase-js";
import { Note } from "./types/types";

const EditorDinamico = dynamic(() => import("../app/components/Editor"), {
  ssr: false,
  loading: () => <p className="text-center mt-10 text-gray-500">Cargando tu espacio de trabajo...</p>,
});
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNoteSaved = (notaActualizada: Note) => {
    setActiveNote(notaActualizada);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNoteDeleted = () => {
    setActiveNote(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    //verificamos si el usuario ya tiene una sesión activa al cargar la página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargando(false);
    });
    //escuchamos los cambios en la sesión para actualizar el estado en tiempo real
    const { data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    //limpiamos la suscripción al desmontar el componente para evitar fugas de memoria
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  if (cargando) {
    return <p className="text-center mt-20 text-gray-500">Verificando credenciales...</p>;
  }

  // Si no hay sesión, forzar login
  if (!session) {
    return <Auth />;
  }
  return (
    <main className="flex h-screen overflow-hidden bg-gray-50 dark:bg-black">
      <Sidebar onSelectNote={setActiveNote} activeNoteId={activeNote?.id ?? null} refreshTrigger={refreshTrigger} />

      <div className="flex-1 overflow-y-auto">
        <div className="flex justify-end p-4">
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-3 py-1.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="px-8 pb-8">
          <EditorDinamico
            activeNote={activeNote}
            onNoteSaved={handleNoteSaved}
            onNoteDeleted={handleNoteDeleted}
          />
        </div>
      </div>
    </main>
  );
}

