// types.d.ts
declare module '@editorjs/image';
declare module '@editorjs/embed';
declare module '@editorjs/header';
declare module '@editorjs/list';

export interface Note {
  id: string;
  titulo: string;
  contenido: any;
  icono?: string;
  portada?: string;
  creado_en: string;
  actualizado_en: string;
}