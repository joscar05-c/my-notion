"use client";

import React from "react";
import { useState } from "react";
import { supabase } from "../lib/supabase";

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    //flujo 1: autenticacion con email y password
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            alert('Inicio de sesión exitoso');
        } catch (error) {
            // Manejamos el error nativo de JS
            if (error instanceof Error) {
                console.error("Error:", error.message);
                alert(error.message);
            }
            // Manejamos el objeto de error específico de Supabase
            else if (typeof error === 'object' && error !== null && 'message' in error) {
                console.error("Error de Supabase:", (error as any).message);
                alert((error as any).message);
            }
            // Para cualquier otra cosa
            else {
                console.error("Error desconocido:", error);
                alert("Ocurrió un error inesperado.");
            }
        };
    };
    //flujo 2: autenticacion con Google
    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin, //redireccionamos a la misma página después del login
                }
            });
            if (error) throw error;
        } catch (error) {
            // Manejamos el error nativo de JS
            if (error instanceof Error) {
                console.error("Error:", error.message);
                alert(error.message);
            }
            // Manejamos el objeto de error específico de Supabase
            else if (typeof error === 'object' && error !== null && 'message' in error) {
                console.error("Error de Supabase:", (error as any).message);
                alert((error as any).message);
            }
            // Para cualquier otra cosa
            else {
                console.error("Error desconocido:", error);
                alert("Ocurrió un error inesperado.");
            }
        };
    };
    return (
        <div className="max-w-md mx-auto mt-20 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-md border border-gray-200 dark:border-neutral-800">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Ingresar a mi Espacio</h2>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full mt-1 p-2 border rounded-lg bg-transparent text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-blue-400"
                >
                    {loading ? 'Cargando...' : 'Iniciar Sesión'}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-neutral-700"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-neutral-900 text-gray-500">O continúa con</span></div>
            </div>

            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.65-5.17 3.65-8.58z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z" />
                    <path fill="#FBBC05" d="M5.27 14.24A7.16 7.16 0 0 1 4.85 12c0-.79.13-1.57.38-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.06-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.06 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
                Google
            </button>
        </div>
    );
};

export default Auth;
