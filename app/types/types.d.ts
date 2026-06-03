// types.d.ts
declare module '@editorjs/image';
declare module '@editorjs/embed';
declare module '@editorjs/header';
declare module '@editorjs/list';
declare module '@editorjs/code';
declare module '@editorjs/checklist';
declare module '@editorjs/table';

export interface Note {
  id: string;
  titulo: string;
  contenido: any;
  icono?: string;
  portada?: string;
  etiquetas?: string[];
  creado_en: string;
  actualizado_en: string;
}