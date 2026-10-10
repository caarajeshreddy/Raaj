import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Check,
  RotateCcw,
  AlertCircle,
  Zap,
  FileText,
  ShieldCheck,
  Smartphone,
  ChevronDown,
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, autoProcess?: boolean) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isFlashing, setIsFlashing] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  // Stop current stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Start camera with fallbacks
  const startCamera = async (targetDeviceId?: string, mode?: 'environment' | 'user') => {
    setIsLoading(true);
    setErrorMessage(null);
    stopStream();

    const activeMode = mode || facingMode;

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API is not supported by your browser environment.');
      }

      // Enumerate devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(inputs);
        if (inputs.length > 0 && !targetDeviceId && !selectedDeviceId) {
          setSelectedDeviceId(inputs[0].deviceId);
        }
      } catch (e) {
        console.warn('Failed to enumerate video devices:', e);
      }

      // Progressive constraint strategy to avoid black screen / overconstrained errors
      const constraintCandidates: MediaStreamConstraints[] = [];

      if (targetDeviceId) {
        constraintCandidates.push({
          video: { deviceId: { exact: targetDeviceId } },
          audio: false,
        });
      }

      constraintCandidates.push(
        {
          video: {
            facingMode: { ideal: activeMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: { facingMode: activeMode },
          audio: false,
        },
        {
          video: true,
          audio: false,
        }
      );

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      for (const constraints of constraintCandidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (!stream) {
        throw lastErr || new Error('Unable to start video feed.');
      }

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.muted = true;

        video.onloadedmetadata = async () => {
          try {
            await video.play();
            setStreamActive(true);
            setIsLoading(false);
          } catch (playErr) {
            console.warn('Video play error:', playErr);
            setIsLoading(false);
          }
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setIsLoading(false);
      setStreamActive(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Camera permission was denied. Please allow camera permissions in your browser or use the "Direct Device Camera" option below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMessage('No physical camera device was detected on your system.');
      } else {
        setErrorMessage(
          err.message || 'Unable to access live webcam. You can use the Native Device Camera instead.'
        );
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhotoUrl(null);
      setCapturedFile(null);
      startCamera();
    } else {
      stopStream();
    }

    return () => {
      stopStream();
    };
  }, [isOpen]);

  // Flip camera between front & rear
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  };

  // Change device from dropdown
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // Capture photo from video feed
  const handleTakePhoto = () => {
    if (!videoRef.current) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 14);
        const fileName = `Camera_UAE_Invoice_${timestamp}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        const previewUrl = URL.createObjectURL(blob);
        setCapturedPhotoUrl(previewUrl);
        setCapturedFile(file);

        video.pause();
      },
      'image/jpeg',
      0.95
    );
  };

  // Native device camera fallback input handler
  const handleNativeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCapturedPhotoUrl(previewUrl);
      setCapturedFile(file);
    }
  };

  // Retake photo
  const handleRetake = () => {
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Confirm photo
  const handleConfirm = (autoProcess: boolean) => {
    if (capturedFile) {
      onCapture(capturedFile, autoProcess);
      handleClose();
    }
  };

  const handleClose = () => {
    stopStream();
    if (capturedPhotoUrl) {
      URL.revokeObjectURL(capturedPhotoUrl);
    }
    setCapturedPhotoUrl(null);
    setCapturedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Hidden Native Camera Input (Guaranteed Fallback) */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeCapture}
        className="hidden"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col z-10 max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:px-5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {capturedPhotoUrl ? 'Review Captured Invoice' : 'Capture UAE Tax Invoice'}
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-400">
                {capturedPhotoUrl
                  ? 'Inspect photo before processing'
                  : 'Live scan or use native camera'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!capturedPhotoUrl && videoDevices.length > 1 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                className="bg-slate-800 text-slate-300 text-[11px] rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
              >
                {videoDevices.map((d, idx) => (
                  <option key={d.deviceId || idx} value={d.deviceId}>
                    {d.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            {!capturedPhotoUrl && videoDevices.length <= 1 && (
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer text-xs flex items-center gap-1"
                title="Toggle Front/Rear Camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flip</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder Body Area (Controlled Height) */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[260px] sm:min-h-[320px] max-h-[50vh]">
          {/* Flash Effect */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 transition-opacity duration-150" />
          )}

          {/* Error View or Fallback Prompt */}
          {errorMessage ? (
            <div className="p-6 text-center max-w-md space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-white font-bold text-sm sm:text-base">Camera Not Ready</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {errorMessage}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Use Device Camera (Native)</span>
                </button>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Live Stream</span>
                </button>
              </div>
            </div>
          ) : capturedPhotoUrl ? (
            /* Review Captured Photo */
            <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-2">
              <img
                src={capturedPhotoUrl}
                alt="Captured UAE Invoice"
                className="max-h-[44vh] w-auto object-contain rounded-lg shadow-lg"
              />
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700/60 text-xs text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Photo Ready</span>
              </div>
            </div>
          ) : (
            /* Live Camera Viewfinder */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover sm:object-contain max-h-[50vh]"
              />

              {/* Document Alignment Frame Overlay */}
              <div className="absolute inset-4 sm:inset-8 pointer-events-none flex flex-col justify-between border-2 border-dashed border-blue-400/50 rounded-2xl p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                  <div className="w-5 h-5 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                </div>

                <div className="text-center py-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-[10px] font-semibold text-blue-200 border border-blue-400/30 shadow-md">
                    Position UAE Tax Invoice within frame
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                  <div className="w-5 h-5 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                </div>
              </div>

              {isLoading && (
                <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-7 h-7 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400">Initializing camera...</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Action Bar (Fixed and Guaranteed Visible) */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800/80 shrink-0">
          {capturedPhotoUrl ? (
            /* Controls after photo captured */
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleRetake}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retake
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleConfirm(false)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-slate-700 hover:bg-slate-600 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Add to Queue
                </button>

                <button
                  type="button"
                  onClick={() => handleConfirm(true)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  Process with Gemini
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera Shutter Controls & Direct Camera Fallback */
            <div className="flex items-center justify-between gap-2">
              {/* Direct Native Camera Button */}
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition cursor-pointer shrink-0"
                title="Launch Native Phone/Device Camera"
              >
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Native Camera</span>
              </button>

              {/* Shutter Button */}
              <div className="flex justify-center flex-1">
                <button
                  type="button"
                  disabled={isLoading && !streamActive}
                  onClick={handleTakePhoto}
                  className={`w-14 h-14 rounded-full border-4 border-white flex items-center justify-center p-1 shadow-lg active:scale-90 transition cursor-pointer ${
                    isLoading && !streamActive
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105'
                  }`}
                  title="Snap Photo"
                >
                  <div className="w-full h-full bg-white hover:bg-blue-100 rounded-full transition" />
                </button>
              </div>

              {/* Right tip / reload button */}
              <button
                type="button"
                onClick={() => startCamera()}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="Reload camera feed"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
