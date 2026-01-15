
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Props {
  onCapture: (base64: string) => void;
}

interface FocusPoint {
  x: number;
  y: number;
}

const CameraCapture: React.FC<Props> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | null>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => {
        console.error("Error playing video:", e);
        setError("Error al iniciar la previsualización del video.");
      });
    }
  }, [stream]);

  const startCamera = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 }, // Aumentamos a 1080p para mejor OCR
          height: { ideal: 1080 }
        }
      });
      
      // Intentar aplicar enfoque automático continuo si está disponible
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        } as any);
      }

      setStream(mediaStream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError') {
        setError("Permiso denegado. Por favor, permite el acceso a la cámara.");
      } else {
        setError("No se pudo acceder a la cámara. Revisa los permisos.");
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleTapToFocus = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!stream || !videoRef.current || !containerRef.current) return;

    // Obtener coordenadas del toque para el feedback visual
    const rect = containerRef.current.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    setFocusPoint({ x, y });
    setTimeout(() => setFocusPoint(null), 1000);

    // Intentar forzar el enfoque mediante la API de MediaStream
    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      // Muchos navegadores móviles permiten "patear" el autofoco aplicando las constraints de nuevo
      if (capabilities.focusMode) {
        // Primero pasamos a manual o simplemente re-aplicamos continuous para forzar el ajuste
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        } as any);
      }
    } catch (err) {
      console.warn("Tap to focus not supported by hardware/browser:", err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capture = () => {
    if (videoRef.current && videoRef.current.readyState >= 2) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95); // Calidad alta para OCR
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {!stream ? (
        <div className="flex flex-col items-center">
          <button
            onClick={startCamera}
            disabled={isStarting}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-10 rounded-full shadow-2xl transition-all transform active:scale-95 flex items-center space-x-3 ${isStarting ? 'opacity-70' : ''}`}
          >
            {isStarting ? (
              <>
                <div className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Iniciando Cámara...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <span className="text-lg">ABRIR CÁMARA</span>
              </>
            )}
          </button>
          <p className="text-gray-400 text-[10px] mt-4 uppercase tracking-widest font-bold">Toca la pantalla para enfocar los datos</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] flex items-center justify-center cursor-crosshair touch-none"
          onClick={handleTapToFocus}
          onTouchStart={handleTapToFocus}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Cuadro de Enfoque Visual */}
          {focusPoint && (
            <div 
              className="absolute border-2 border-yellow-400 w-16 h-16 pointer-events-none animate-ping z-20"
              style={{ 
                left: focusPoint.x - 32, 
                top: focusPoint.y - 32,
                borderRadius: '4px'
              }}
            />
          )}
          {focusPoint && (
            <div 
              className="absolute border border-yellow-400/50 w-16 h-16 pointer-events-none z-20"
              style={{ 
                left: focusPoint.x - 32, 
                top: focusPoint.y - 32,
                borderRadius: '4px'
              }}
            />
          )}

          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-8 z-30">
            <button
              onClick={(e) => { e.stopPropagation(); capture(); }}
              className="bg-white text-blue-600 p-6 rounded-full shadow-2xl border-[6px] border-blue-600 hover:scale-110 active:scale-90 transition transform"
              aria-label="Capturar foto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); stopCamera(); }}
              className="bg-red-500 text-white p-6 rounded-full shadow-2xl hover:bg-red-600 hover:scale-110 active:scale-90 transition transform"
              aria-label="Cerrar cámara"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white font-bold uppercase tracking-wider z-10 border border-white/20">
            Enfoque Inteligente Activo
          </div>
          <div className="absolute top-4 right-4 bg-red-600 h-3 w-3 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)] z-10"></div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center max-w-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
