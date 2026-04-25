import { useState, useRef } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';
import type { Usuario } from '../../../Paginas/Comunidad/tipos';

type TipoPublicacion = 'texto' | 'foto' | 'video' | 'encuesta' | 'gif';

export function useComunidadPublicar(usuario: Usuario | null, onPublicar?: () => void) {
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<TipoPublicacion>('texto');
  const [texto, setTexto] = useState('');
  const [titulo, setTitulo] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [publicandoMensaje, setPublicandoMensaje] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSeleccionado, setGifSeleccionado] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const gifPickerBtnRef = useRef<HTMLButtonElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'foto' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileType === 'foto') {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setVideoFile(file);
    }
  };

  const removeFile = (fileType: 'foto' | 'video') => {
    if (fileType === 'foto') { setFotoFile(null); setFotoPreview(null); }
    else { setVideoFile(null); }
  };

  const abrirModal = (tipoPublicacion: TipoPublicacion = 'texto') => {
    setTipo(tipoPublicacion);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setTipo('texto');
    setTexto('');
    setTitulo('');
    setFotoFile(null);
    setFotoPreview(null);
    setVideoFile(null);
    setGifSeleccionado(null);
    setShowGifPicker(false);
    setShowEmojiPicker(false);
    setPublicando(false);
    setPublicandoMensaje('');
  };

  const togglePicker = (pickerType: 'emoji' | 'gif') => {
    if (pickerType === 'emoji') {
      setShowEmojiPicker(v => !v);
      setShowGifPicker(false);
    } else {
      setShowGifPicker(v => !v);
      setShowEmojiPicker(false);
    }
  };

  const selectEmoji = (emoji: string) => {
    setTexto(t => t + emoji);
    setShowEmojiPicker(false);
  };

  const selectGif = (url: string) => {
    setGifSeleccionado(url);
    setShowGifPicker(false);
  };

  const subirArchivo = async (file: File, bucket: string): Promise<string> => {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  };

  const publicar = async () => {
    if (publicando) return;

    setPublicando(true);
    setPublicandoMensaje(
      tipo === 'foto' ? 'Subiendo imagen...' :
      tipo === 'video' ? 'Subiendo video...' : 'Publicando...'
    );

    try {
      let url_media: string | null = null;

      if (tipo === 'foto' && fotoFile) {
        url_media = await subirArchivo(fotoFile, 'imagenes');
      } else if (tipo === 'video' && videoFile) {
        url_media = await subirArchivo(videoFile, 'videos');
      } else if (gifSeleccionado) {
        url_media = gifSeleccionado;
      }

      const insertData: Record<string, unknown> = {
        usuario_id: usuario?.id,
        usuario_nombre: usuario?.nombre,
        usuario_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'Usuario')}&background=667eea&color=fff`,
        titulo,
        descripcion: texto,
        tipo,
        fecha_creacion: new Date().toISOString(),
      };

      if (tipo === 'foto' && url_media) insertData.url_imagen = url_media;
      else if (tipo === 'video' && url_media) insertData.url_video = url_media;
      else if (tipo === 'gif' && url_media) insertData.url_gif = url_media;

      const { error } = await supabase.from('comunidad_publicaciones').insert([insertData]);
      if (error) throw error;

      onPublicar?.();
      cerrarModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Error al publicar: ${msg}`);
    } finally {
      setPublicando(false);
      setPublicandoMensaje('');
    }
  };

  return {
    showModal, tipo, texto, titulo, publicando, publicandoMensaje,
    fotoFile, fotoPreview, videoFile, showGifPicker, gifSeleccionado,
    showEmojiPicker, emojiBtnRef, gifPickerBtnRef,
    setTexto, setTitulo, setTipo, setShowModal,
    handleFileChange, removeFile, abrirModal, cerrarModal,
    togglePicker, selectEmoji, selectGif, publicar,
  };
}
