"use client";

import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import ImageTool from "@editorjs/image";
import Embed from "@editorjs/embed";
import CodeTool from "@editorjs/code";
import Checklist from "@editorjs/checklist";
import Table from "@editorjs/table";
import EmojiPicker from "emoji-picker-react";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Note } from "../types/types";

interface EditorProps {
  activeNote: Note | null;
  onNoteSaved: (nota: Note) => void;
  onNoteDeleted: () => void;
}

const Editor = ({ activeNote, onNoteSaved, onNoteDeleted }: EditorProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const isFirstMount = useRef(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [icono, setIcono] = useState("");
  const [portada, setPortada] = useState("");
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<string[]>([]);
  const [textoEtiqueta, setTextoEtiqueta] = useState("");
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
          code: CodeTool,
          checklist: Checklist,
          table: Table,
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

  const cargarEtiquetasGlobales = async () => {
    const { data } = await supabase.from("notas").select("etiquetas");
    if (data) {
      const todas = data
        .map((nota) => nota.etiquetas ?? [])
        .flat();
      setEtiquetasDisponibles([...new Set(todas)]);
    }
  };

  useEffect(() => {
    cargarEtiquetasGlobales();
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
        setEtiquetas([]);

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
            setEtiquetas(activeNote.etiquetas || []);
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
        const { data, error } = await supabase
          .from("notas")
          .update({ titulo, contenido: dataDelEditor, icono, portada, etiquetas })
          .eq("id", activeNote.id)
          .select()
          .single();
        if (error) throw error;
        onNoteSaved(data);
      } else {
        const { data, error } = await supabase
          .from("notas")
          .insert([{ titulo, contenido: dataDelEditor, icono, portada, etiquetas }])
          .select()
          .single();
        if (error) throw error;
        onNoteSaved(data);
      }
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

  const handleKeyDownEtiqueta = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nuevaEtiqueta = textoEtiqueta.trim();
      if (nuevaEtiqueta && !etiquetas.includes(nuevaEtiqueta)) {
        setEtiquetas([...etiquetas, nuevaEtiqueta]);
      }
      setTextoEtiqueta("");
      cargarEtiquetasGlobales();
    }
  };

  const sugerenciasFiltradas = textoEtiqueta
    ? etiquetasDisponibles.filter(
        (tag) =>
          tag.toLowerCase().includes(textoEtiqueta.toLowerCase()) &&
          !etiquetas.includes(tag)
      )
    : [];

  const removerEtiqueta = (tagToRemove: string) => {
    setEtiquetas(etiquetas.filter((tag) => tag !== tagToRemove));
  };

  const handleSubirPortada = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSubiendoPortada(true);
      const fileExt = file.name.split(".").pop();
      const fileName = Math.random() + "." + fileExt;
      const filePath = "portadas/" + fileName;

      const { error } = await supabase.storage
        .from("portadas")
        .upload(filePath, file);

      if (error) {
        console.error("Error al subir portada:", error);
        alert("No se pudo subir la portada.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("portadas")
        .getPublicUrl(filePath);

      setPortada(publicUrl);
    } finally {
      setSubiendoPortada(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          <div className="absolute top-2 right-2 flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleSubirPortada}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={subiendoPortada}
              className="px-2 py-1 text-xs bg-black/50 hover:bg-black/70 text-white rounded transition-colors disabled:opacity-50"
            >
              {subiendoPortada ? "Subiendo..." : "Cambiar"}
            </button>
            <button
              onClick={() => setPortada("")}
              className="px-2 py-1 text-xs bg-black/50 hover:bg-black/70 text-white rounded transition-colors"
            >
              Quitar
            </button>
          </div>
        </div>
      )}

      {!portada && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleSubirPortada}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoPortada}
            className="mb-4 px-3 py-1.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded transition-colors disabled:opacity-50"
          >
            {subiendoPortada ? "Subiendo..." : "+ Añadir Portada"}
          </button>
        </>
      )}

      <div className="relative mb-2">
        <button
          onClick={() => setMostrarEmojis(!mostrarEmojis)}
          className="text-5xl w-16 h-16 flex items-center justify-center bg-transparent hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          {icono || "📄"}
        </button>
        {mostrarEmojis && (
          <div className="absolute z-10 mt-2">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setIcono(emojiData.emoji);
                setMostrarEmojis(false);
              }}
            />
          </div>
        )}
      </div>

      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full text-3xl font-bold mb-6 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
        placeholder="Título de la nota"
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {etiquetas.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 text-xs bg-gray-200 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
          >
            {tag}
            <button
              onClick={() => removerEtiqueta(tag)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white ml-0.5"
            >
              &times;
            </button>
          </span>
        ))}
        <div className="relative">
          <input
            type="text"
            value={textoEtiqueta}
            onChange={(e) => setTextoEtiqueta(e.target.value)}
            onKeyDown={handleKeyDownEtiqueta}
            placeholder="Añadir etiqueta..."
            className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 min-w-[100px]"
          />
          {textoEtiqueta.length > 0 && sugerenciasFiltradas.length > 0 && (
            <ul className="absolute z-20 top-full left-0 mt-1 w-48 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md shadow-lg max-h-40 overflow-y-auto">
              {sugerenciasFiltradas.map((tag) => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => {
                      setEtiquetas([...etiquetas, tag]);
                      setTextoEtiqueta("");
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer"
                  >
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

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
