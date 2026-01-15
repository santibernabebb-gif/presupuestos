
import React, { useRef, useState, useCallback, useEffect } from 'react';

interface Props {
  onCapture: (base64: string) => void;
}

const CameraCapture: React.FC<Props> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Effect to attach the stream to the video element once it becomes available in the DOM
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
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
    } catch (err: any) {
      console.error("Camera access error:", err);
      if (err.name === 'NotAllowedError') {
        setError("Permiso denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.");
      } else if (err.name === 'NotFoundError') {
        setError("No se encontró ninguna cámara en este dispositivo.");
      } else {
        setError("No se pudo acceder a la cámara. Revisa los permisos e inténtalo de nuevo.");
      }
    } finally {
      setIsStarting(false);
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
      // Capture at actual video resolution for better OCR
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  // Clean up on unmount
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
            className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all transform active:scale-95 flex items-center space-x-2 ${isStarting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isStarting ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Iniciando...</span>
              </>
            ) : (
              <>
                <span>📸 Abrir Cámara</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-md bg-black rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6 z-10">
            <button
              onClick={capture}
              className="bg-white text-blue-600 p-5 rounded-full shadow-2xl border-4 border-blue-600 hover:scale-110 active:scale-90 transition transform"
              aria-label="Capturar foto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={stopCamera}
              className="bg-red-500 text-white p-5 rounded-full shadow-2xl hover:bg-red-600 hover:scale-110 active:scale-90 transition transform"
              aria-label="Cerrar cámara"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Overlay to show user it's active */}
          <div className="absolute top-4 right-4 bg-red-600 h-3 w-3 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center max-w-md animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
