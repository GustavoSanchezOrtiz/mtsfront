import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Card, CardHeader, CardContent, Spinner } from '@heroui/react';
import { AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import apiClient from '../../lib/axios';
import { useAuth } from '../../store/useAuth';
import logoMts from '../../assets/logo.svg';

/**
 * Icono de Google oficial en Negro Completo (#000000)
 */
const GoogleBlackIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 268.152 273.883"
    className={className}
    fill="#000000"
    aria-hidden="true"
  >
    <path
      transform="matrix(.95792 0 0 .98525 -90.174 -78.856)"
      d="M371.378 193.24H237.083v53.438h77.167c-1.241 7.563-4.026 15.003-8.105 21.786-4.674 7.773-10.451 13.69-16.373 18.196-17.74 13.498-38.42 16.258-52.783 16.258-36.283 0-67.283-23.286-79.285-54.928-.484-1.149-.805-2.335-1.197-3.507a81.115 81.115 0 0 1-4.101-25.448c0-9.226 1.569-18.057 4.43-26.398 11.285-32.897 42.985-57.467 80.179-57.467 7.481 0 14.685.884 21.517 2.648a77.668 77.668 0 0 1 33.425 18.25l40.834-39.712c-24.839-22.616-57.219-36.32-95.844-36.32-30.878 0-59.386 9.553-82.748 25.7-18.945 13.093-34.483 30.625-44.97 50.985-9.753 18.879-15.094 39.8-15.094 62.294 0 22.495 5.35 43.633 15.103 62.337v.126c10.302 19.857 25.368 36.954 43.678 49.988 15.997 11.386 44.68 26.551 84.031 26.551 22.63 0 42.687-4.051 60.375-11.644 12.76-5.478 24.065-12.622 34.301-21.804 13.525-12.132 24.117-27.139 31.347-44.404 7.23-17.265 11.097-36.79 11.097-57.957 0-9.858-.998-19.87-2.689-28.968Z"
    />
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [codigoInvitacion, setCodigoInvitacion] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);

        const payload = {
          id_token: tokenResponse.access_token,
        };

        if (codigoInvitacion.trim()) {
          payload.codigo_invitacion = codigoInvitacion.trim();
        }

        const response = await apiClient.post('/auth/google', payload);
        const { access_token, refresh_token, usuario } = response.data;

        login(access_token, refresh_token, usuario);
        navigate('/');
      } catch (err) {
        console.error('Error durante la autenticación:', err);
        const status = err.response?.status;
        const detail = err.response?.data?.detail;

        if (status === 401) {
          setError(
            detail || 'Tu sesión de Google no pudo validarse o ha expirado. Por favor, intenta de nuevo.'
          );
        } else if (status === 403 || status === 409) {
          setError(detail || 'Acceso restringido. Código de invitación inválido o ya utilizado.');
        } else if (status === 429) {
          setError(
            detail || 'Demasiados intentos de autenticación. Espera un minuto antes de volver a intentar.'
          );
        } else if (status === 400) {
          setError(detail || 'Información de acceso incompleta. Intenta nuevamente.');
        } else {
          setError('No fue posible conectar con el servidor central. Comprueba tu conexión.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError('No se pudo inicializar el servicio de acceso con Google. Intenta de nuevo.');
    },
  });

  return (
    <div className="min-h-screen w-full bg-zinc-950 flex flex-col justify-center items-center px-4 py-8 sm:px-6 select-none font-sans antialiased relative overflow-hidden">
      {/* Contenedor adaptativo: móvil y web */}
      <div className="w-full max-w-[420px] sm:max-w-[450px] mx-auto">
        <Card className="bg-zinc-900/95 border border-zinc-800/90 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden">
          {/* Encabezado: Logo MTS maximizado ocupando el espacio libre */}
          <CardHeader className="flex flex-col items-center justify-center p-0 pb-3 sm:pb-4">
            <div className="w-full flex items-center justify-center px-1 sm:px-2 py-1">
              <img
                src={logoMts}
                alt="MTS Logo"
                className="w-full h-auto max-h-36 sm:max-h-44 object-contain drop-shadow-md select-none pointer-events-none"
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5 sm:space-y-6 px-1 pb-1 pt-1">
            {/* Mensaje de Error Humano */}
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-start gap-2.5 text-xs text-red-200 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-tight">
                  <span className="font-semibold text-red-400 block">No se pudo iniciar sesión</span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Input para Código de Invitación */}
            <div className="space-y-1.5 sm:space-y-2">
              <label
                htmlFor="invitation-input"
                className="text-[11px] sm:text-xs font-semibold text-zinc-300 block"
              >
                Código de invitación
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="invitation-input"
                  type="text"
                  maxLength={64}
                  autoComplete="off"
                  value={codigoInvitacion}
                  onChange={(e) => setCodigoInvitacion(e.target.value)}
                  placeholder="Ej. MTS-ADMIN-INIT-2026"
                  disabled={isLoading}
                  className="w-full h-11 sm:h-12 pl-10 pr-4 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Botón en Gris Claro con Letras Negras e Icono SVG Negro */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleGoogleLogin()}
                disabled={isLoading}
                className="w-full h-11 sm:h-12 bg-zinc-200 hover:bg-zinc-100 active:bg-zinc-300 active:scale-[0.99] rounded-xl text-zinc-950 font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-150 shadow-sm border border-zinc-300/80 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" color="default" className="scale-90" />
                    <span className="text-zinc-950 font-medium">Autenticando credenciales...</span>
                  </>
                ) : (
                  <>
                    <GoogleBlackIcon className="w-5 h-5 shrink-0" />
                    <span className="tracking-tight text-zinc-950 font-semibold">
                      Iniciar sesión con Google
                    </span>
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Pie de página discreto */}
        <div className="text-center text-[11px] text-zinc-500 mt-6 sm:mt-8 font-mono flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
          <span>MTS Systems &bull; Conexión Segura TLS 1.3</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
