
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
  const [imageCapture, setImageCapture] = useState<any>(null);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => {
        console.error("Error playing video:", e);
        setError("Error al iniciar la previsualización.");
      });

      // Intentar inicializar ImageCapture para fotos de alta resolución
      const track = stream.getVideoTracks()[0];
      if (track && 'ImageCapture' in window) {
        try {
          // @ts-ignore
          setImageCapture(new ImageCapture(track));
        } catch (e) {
          console.warn("ImageCapture no disponible en este dispositivo");
        }
      }
    }
  }, [stream]);

  const startCamera = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const constraints = {
        video: { 
          facingMode: { ideal: 'environment' },
          width: { min: 1280, ideal: 1920, max: 3840 },
          height: { min: 720, ideal: 1080, max: 2160 },
          // Intentar forzar el enfoque y la exposición para documentos
          advanced: [
            { focusMode: 'continuous' },
            { whiteBalanceMode: 'continuous' },
            { exposureMode: 'continuous' }
          ]
        } as any
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      setError("No se pudo acceder a la cámara con alta calidad. Revisa los permisos.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleTapToFocus = async (e: React.MouseEvent | React.TouchEvent) => {
    if (!stream || !videoRef.current || !containerRef.current) return;

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
    setTimeout(() => setFocusPoint(null), 1200);

    try {
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.focusMode) {
        // Forzamos un ciclo de enfoque
        await track.applyConstraints({
          advanced: [{ focusMode: 'continuous' }]
        } as any);
      }
    } catch (err) {
      console.warn("Tap to focus no soportado:", err);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setImageCapture(null);
    }
  }, [stream]);

  const capture = async () => {
    if (!videoRef.current) return;

    try {
      // Prioridad 1: Usar ImageCapture para nitidez máxima (Hardware)
      if (imageCapture) {
        const photoBlob = await imageCapture.takePhoto({
          fillLightMode: 'auto',
          imageWidth: 2000, // Forzar alta resolución si es posible
        });
        const reader = new FileReader();
        reader.onloadend = () => {
          onCapture(reader.result as string);
          stopCamera();
        };
        reader.readAsDataURL(photoBlob);
        return;
      }

      // Prioridad 2: Fallback a Canvas (pero con máxima calidad)
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        // Mejorar nitidez vía canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.98); 
        onCapture(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error("Error capturando:", err);
      // Fallback de emergencia si falla ImageCapture
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        onCapture(canvas.toDataURL('image/jpeg', 0.95));
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
    <div className="flex flex-col items-center space-y-4 w-full px-4">
      {!stream ? (
        <div className="flex flex-col items-center">
          <button
            onClick={startCamera}
            disabled={isStarting}
            className={`group bg-blue-600 hover:bg-blue-700 text-white font-black py-6 px-12 rounded-3xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] transition-all transform active:scale-95 flex items-center space-x-4 ${isStarting ? 'opacity-70' : ''}`}
          >
            {isStarting ? (
              <>
                <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                <span className="uppercase tracking-widest text-sm">Cargando lente...</span>
              </>
            ) : (
              <>
                <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <span className="text-xl uppercase tracking-tighter">ABRIR ESCÁNER</span>
              </>
            )}
          </button>
          <p className="text-gray-400 text-[10px] mt-6 uppercase tracking-[0.3em] font-black italic">Óptica SantiSystems calibrada</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="relative w-full max-w-lg bg-black rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[3/4] flex items-center justify-center cursor-crosshair touch-none border-4 border-white/10"
          onClick={handleTapToFocus}
          onTouchStart={handleTapToFocus}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />

          {/* Guía de Escaneo de Documento */}
          <div className="absolute inset-0 p-8 flex items-center justify-center pointer-events-none">
            <div className="w-full h-full border-2 border-white/30 rounded-2xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 -mb-1 -mr-1"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="bg-white/5 backdrop-blur-[1px] w-[90%] h-[90%] rounded-xl border border-white/10"></div>
              </div>
            </div>
          </div>

          {/* Cuadro de Enfoque Visual */}
          {focusPoint && (
            <div 
              className="absolute border-2 border-yellow-400 w-20 h-20 pointer-events-none z-20"
              style={{ 
                left: focusPoint.x - 40, 
                top: focusPoint.y - 40,
                borderRadius: '50%',
                animation: 'focus-ping 0.8s ease-out forwards'
              }}
            />
          )}

          <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-12 z-30">
            <button
              onClick={(e) => { e.stopPropagation(); stopCamera(); }}
              className="bg-white/10 backdrop-blur-xl text-white p-5 rounded-full shadow-2xl hover:bg-red-500 transition transform active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); capture(); }}
              className="bg-white text-blue-600 p-8 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.4)] border-[8px] border-blue-600/20 hover:scale-110 active:scale-95 transition transform relative"
            >
              <div className="absolute inset-2 border-2 border-blue-600 rounded-full animate-pulse"></div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <div className="absolute top-6 left-6 flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full text-[10px] text-white font-black uppercase tracking-widest z-10 shadow-lg border border-blue-400">
            <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
            <span>HD Scanning Mode</span>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes focus-ping {
              0% { transform: scale(0.5); opacity: 0; border-width: 8px; }
              50% { transform: scale(1.2); opacity: 1; border-width: 2px; }
              100% { transform: scale(1); opacity: 0; border-width: 1px; }
            }
          `}} />
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-2 border-red-100 text-red-700 px-6 py-4 rounded-2xl text-xs font-bold text-center max-w-md shadow-lg animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
