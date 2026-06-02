"use client";
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import dynamic from "next/dynamic";
import Auth from "./components/Auth";
import { Session } from "@supabase/supabase-js";

const EditorDinamico = dynamic(() => import("../app/components/Editor"), {
  ssr: false,
  loading: () => <p className="text-center mt-10 text-gray-500">Cargando tu espacio de trabajo...</p>,
});
export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

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
    <main className="min-h-screen p-8 bg-gray-50 dark:bg-black">
      <div className="max-w-3xl mx-auto flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Mi Clon de Notion</h1>
        <button 
          onClick={() => supabase.auth.signOut()}
          className="px-3 py-1.5 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
      
      <EditorDinamico />
    </main>
  );
}

