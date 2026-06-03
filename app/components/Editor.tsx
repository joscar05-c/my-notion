"use client";

import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import ImageTool from "@editorjs/image";
import Embed from "@editorjs/embed";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Note } from "../types/types";

interface EditorProps {
  activeNote: Note | null;
  onNoteSaved: () => void;
  onNoteDeleted: () => void;
}

const Editor = ({ activeNote, onNoteSaved, onNoteDeleted }: EditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const isFirstMount = useRef(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [icono, setIcono] = useState("");
  const [portada, setPortada] = useState("");
  const [cargandoNota, setCargandoNota] = useState(false);

  useEffect(() => {
    if (!editorRef.current) {
      const editor = new EditorJS({
        holder: "editorjs",
        tools: {
          header: Header,
          list: List,
          image: ImageTool,
          embed: Embed,
        },
      });
      editorRef.current = editor;
    }
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current || !editorRef.current.isReady) return;

    editorRef.current.isReady.then(() => {
      if (!activeNote) {
        if (isFirstMount.current) {
          isFirstMount.current = false;
          return;
        }

        try {
          if (editorRef.current && editorRef.current.blocks.getBlocksCount() > 0) {
            editorRef.current.blocks.clear();
          }
        } catch (e) {
          // Silenciamos cualquier error interno de la librería al limpiar
        }
        setTitulo("");
        setIcono("");
        setPortada("");

      } else {
        isFirstMount.current = false;

        const cargarNota = async () => {
          try {
            setCargandoNota(true);
            const { data, error } = await supabase
              .from("notas")
              .select("contenido")
              .eq("id", activeNote.id)
              .single();

            if (error) throw error;

            setTitulo(activeNote.titulo);
            setIcono(activeNote.icono || "");
            setPortada(activeNote.portada || "");
            if (data?.contenido && editorRef.current) {
              await editorRef.current.render(data.contenido);
            }
          } catch (err) {
            if (err instanceof Error) {
              console.error("Error al cargar la nota:", err.message);
            } else if (typeof err === "object" && err !== null && "message" in err) {
              console.error("Error de Supabase:", (err as { message: string }).message);
            }
          } finally {
            setCargandoNota(false);
          }
        };

        cargarNota();
      }
    }).catch(console.error);
  }, [activeNote]);

  const handleSave = async () => {
    if (!editorRef.current || !editorRef.current.isReady) return;
    try {
      setGuardando(true);
      const dataDelEditor = await editorRef.current.isReady.then(() => {
        return editorRef.current!.save();
      });

      if (activeNote) {
        const { error } = await supabase
          .from("notas")
          .update({ titulo, contenido: dataDelEditor, icono, portada })
          .eq("id", activeNote.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notas")
          .insert([{ titulo, contenido: dataDelEditor, icono, portada }]);
        if (error) throw error;
      }

      onNoteSaved();
    } catch (error) {
      alert("Hubo un error al guardar la nota. Por favor, intenta de nuevo.");

      if (error instanceof Error) {
        console.error("Error nativo:", error.message);
      } else if (typeof error === "object" && error !== null && "message" in error) {
        console.error("Error de Supabase:", (error as { message: string }).message);
      } else {
        console.error("Error desconocido:", error);
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta nota?")) return;

    try {
      setEliminando(true);
      const { error } = await supabase
        .from("notas")
        .delete()
        .eq("id", activeNote.id);

      if (error) {
        console.error("Error al eliminar:", error);
        alert("No se pudo eliminar la nota. Revisa la consola.");
        return;
      }

      onNoteDeleted();
    } finally {
      setEliminando(false);
    }
  };

  const handleAddPortada = () => {
    const url = window.prompt("Ingresa la URL de la portada:");
    if (url !== null) {
      setPortada(url);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800">
      {portada && (
        <div className="relative mb-4">
          <img
            src={portada}
            alt="Portada"
            className="w-full h-[200px] object-cover rounded-lg"
          />
          <button
            onClick={() => setPortada("")}
            className="absolute top-2 right-2 px-2 py-1 text-xs bg-black/50 hover:bg-black/70 text-white rounded transition-colors"
          >
            Quitar
          </button>
        </div>
      )}

      {!portada && (
        <button
          onClick={handleAddPortada}
          className="mb-4 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors"
        >
          + Añadir Portada
        </button>
      )}

      <div className="mb-2">
        <input
          type="text"
          value={icono}
          onChange={(e) => setIcono(e.target.value)}
          maxLength={2}
          className="text-5xl w-16 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
          placeholder="📄"
        />
      </div>

      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full text-3xl font-bold mb-6 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
        placeholder="Título de la nota"
      />

      {cargandoNota && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Cargando nota...
        </p>
      )}

      <div
        id="editorjs"
        className="min-h-75 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none"
      ></div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={guardando || eliminando}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {guardando ? "Guardando..." : activeNote ? "Actualizar Nota" : "Guardar Nota"}
        </button>

        {activeNote && (
          <button
            onClick={handleDelete}
            disabled={guardando || eliminando}
            className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 font-medium rounded-lg transition-colors"
          >
            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Editor;
