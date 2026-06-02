"use client";

import React, { useEffect, useRef } from "react";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import ImageTool from "@editorjs/image";
import Embed from "@editorjs/embed";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const Editor = () => {
  //usamos ref para mantener la instancia del editor y evitar que se vuelva a crear en cada renderizado
  const editorRef = useRef<EditorJS | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [titulo, setTitulo] = useState("Mi nota de prueba");

  useEffect(() => {
    //solo creamos la instancia del editor si no existe, esto asegura que el editor se inicialice solo una vez
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
    //limpiamos la instancia del editor al desmontar el componente para evitar fugas de memoria
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  //funcion para capturar los datos
  const handleSave = async () => {
    if (!editorRef.current) return;
    try {
      setGuardando(true);
      //1. obtenemos los datos del editor
      const dataDelEditor = await editorRef.current.save();

      //2. guardamos los datos en la base de datos usando Supabase
      const { data, error } = await supabase
        .from("notas")
        .insert([
          {
            titulo: titulo,
            contenido: dataDelEditor,
          },
        ])
        .select();
      if (error) throw error;

      alert("Nota guardada con éxito!");
      console.log("Datos guardados en Supabase:", data);
    } catch (error) {
        // Mostramos la alerta siempre que haya un error, sea del tipo que sea
        alert("Hubo un error al guardar la nota. Por favor, intenta de nuevo.");

        // Manejamos el error nativo de JS
        if (error instanceof Error) {
            console.error("Error nativo:", error.message);
        } 
        // Manejamos el objeto de error específico de Supabase
        else if (typeof error === 'object' && error !== null && 'message' in error) {
            console.error("Error de Supabase:", (error as any).message);
        } 
        // Para cualquier otra cosa extraña que se pueda lanzar
        else {
            console.error("Error desconocido:", error);
        }
    } finally {
        setGuardando(false);
    }
  };
  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800">
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        className="w-full text-3xl font-bold mb-6 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-300"
        placeholder="Título de la nota"
      />

      <div
        id="editorjs"
        className="min-h-75 text-gray-800 dark:text-gray-200 prose dark:prose-invert max-w-none"
      ></div>

      <button
        onClick={handleSave}
        disabled={guardando}
        className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
      >
        {guardando ? "Guardando..." : "Guardar en Supabase"}
      </button>
    </div>
  );
};

export default Editor;
