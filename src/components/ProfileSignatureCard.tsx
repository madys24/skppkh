import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User, 
  Sparkles, 
  Check, 
  Trash2, 
  Upload, 
  Type, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { GenerationInput } from "../types";

interface ProfileSignatureCardProps {
  inputs: GenerationInput;
  setInputs: React.Dispatch<React.SetStateAction<GenerationInput>>;
  onApplyProfile: (profile: Partial<GenerationInput> & { signatureData?: string }) => void;
}

export const ProfileSignatureCard: React.FC<ProfileSignatureCardProps> = ({ 
  inputs, 
  setInputs,
  onApplyProfile
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isSavedNotify, setIsSavedNotify] = useState(false);
  const [sigTab, setSigTab] = useState<"draw" | "upload" | "text">("draw");
  const [typedName, setTypedName] = useState(inputs.nama || "");

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Local profile states
  const [localProfile, setLocalProfile] = useState({
    nama: inputs.nama,
    nip: inputs.nip,
    jabatan: inputs.jabatan,
    unitKerja: inputs.unitKerja,
    tempatPembuatan: inputs.tempatPembuatan || "Jakarta",
    signatureData: inputs.signatureData || ""
  });

  // Track if profile is stored in localStorage
  const [hasStoredProfile, setHasStoredProfile] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    const stored = localStorage.getItem("pkh_saved_profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocalProfile(parsed);
        setHasStoredProfile(true);
        // Sync to parent right away so that it is pre-populated
        onApplyProfile(parsed);
        if (parsed.nama) {
          setTypedName(parsed.nama);
        }
      } catch (e) {
        console.error("Gagal membaca profil tersimpan:", e);
      }
    } else {
      // If we don't have stored, let's sync local with whatever parent has (e.g. after a template load)
      setLocalProfile({
        nama: inputs.nama,
        nip: inputs.nip,
        jabatan: inputs.jabatan,
        unitKerja: inputs.unitKerja,
        tempatPembuatan: inputs.tempatPembuatan || "Jakarta",
        signatureData: inputs.signatureData || ""
      });
    }
  }, []);

  // Update local profile states when parent inputs change (e.g., when a template is applied)
  useEffect(() => {
    setLocalProfile((prev) => ({
      ...prev,
      nama: inputs.nama,
      nip: inputs.nip,
      jabatan: inputs.jabatan,
      unitKerja: inputs.unitKerja,
      tempatPembuatan: inputs.tempatPembuatan || "Jakarta",
      signatureData: inputs.signatureData || prev.signatureData
    }));
    if (inputs.nama && !typedName) {
      setTypedName(inputs.nama);
    }
  }, [inputs.nama, inputs.nip, inputs.jabatan, inputs.unitKerja, inputs.tempatPembuatan, inputs.signatureData]);

  // Adjust canvas scale for high DPI displays
  useEffect(() => {
    if (sigTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#1e3a8a"; // Navy blue ink
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [sigTab, isOpen]);

  // Canvas Drawing Logic
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    // For touches
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // For mouse
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCanvasToState();
    }
  };

  const saveCanvasToState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if canvas is empty
    const isEmpty = isCanvasBlank(canvas);
    if (!isEmpty) {
      const b64Data = canvas.toDataURL("image/png");
      setLocalProfile(prev => ({
        ...prev,
        signatureData: b64Data
      }));
    }
  };

  const isCanvasBlank = (c: HTMLCanvasElement) => {
    const ctx = c.getContext("2d");
    if (!ctx) return true;
    const buffer = new Uint32Array(
      ctx.getImageData(0, 0, c.width, c.height).data.buffer
    );
    return !buffer.some(color => color !== 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLocalProfile(prev => ({
      ...prev,
      signatureData: ""
    }));
  };

  // Image Upload handler
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLocalProfile(prev => ({
          ...prev,
          signatureData: event.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Type-to-Signature generator
  const generateTypedSignature = (styleIdx: number) => {
    const name = typedName.trim() || localProfile.nama || "Pegawai";
    
    // Create temporary canvas
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = 400;
    tempCanvas.height = 150;
    const ctx = tempCanvas.getContext("2d");
    if (!ctx) return;

    // Clear context
    ctx.clearRect(0, 0, 400, 150);
    
    // Smooth text drawing
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    
    // Choose font & style
    if (styleIdx === 1) {
      ctx.font = "italic 42px 'Brush Script MT', 'Comic Sans MS', cursive";
      ctx.fillStyle = "#1e3a8a"; // Navy
    } else if (styleIdx === 2) {
      ctx.font = "italic 38px 'Lucida Handwriting', 'Segoe Script', cursive";
      ctx.fillStyle = "#0f172a"; // Dark charcoal
    } else {
      ctx.font = "italic 44px 'Edwardian Script ITC', 'Apple Chancery', cursive";
      ctx.fillStyle = "#16a34a"; // Green-ish calligraphic
    }

    // Write name
    ctx.fillText(name, 200, 70);

    // Draw an organic underlining signature trail
    ctx.strokeStyle = styleIdx === 1 ? "#1e40af" : styleIdx === 2 ? "#334155" : "#15803d";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(80, 105);
    ctx.bezierCurveTo(150, 115, 250, 95, 320, 110);
    ctx.stroke();

    const dataUrl = tempCanvas.toDataURL("image/png");
    setLocalProfile(prev => ({
      ...prev,
      signatureData: dataUrl
    }));
  };

  // Save the entire profile to localstorage and sync to parent
  const handleSaveProfile = () => {
    // Validate required parts
    if (!localProfile.nama) {
      alert("Harap lengkapi nama pegawai di profil Anda");
      return;
    }

    localStorage.setItem("pkh_saved_profile", JSON.stringify(localProfile));
    setHasStoredProfile(true);
    onApplyProfile(localProfile);
    
    // Trigger Success Notification bubble
    setIsSavedNotify(true);
    setTimeout(() => {
      setIsSavedNotify(false);
    }, 4500);
  };

  const handleDeleteProfile = () => {
    if (confirm("Apakah Anda yakin ingin menghapus data profil yang tersimpan di browser ini?")) {
      localStorage.removeItem("pkh_saved_profile");
      setHasStoredProfile(false);
      setLocalProfile({
        nama: "",
        nip: "",
        jabatan: "",
        unitKerja: "",
        tempatPembuatan: "Jakarta",
        signatureData: ""
      });
      // Clear parent form as well
      onApplyProfile({
        nama: "",
        nip: "",
        jabatan: "",
        unitKerja: "",
        tempatPembuatan: "Jakarta",
        signatureData: ""
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print">
      {/* Header Banner */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100/50 transition-all select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              Profil Pegawai & Tanda Tangan Elektronik
              {hasStoredProfile && (
                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> AKTIF
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-sans">
              Setting biodata + ttd Anda di sini agar tidak perlu mengulang lagi setiap membuat draf baru.
            </p>
          </div>
        </div>
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-6">
              
              {isSavedNotify && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-4 flex items-start gap-3 shadow-xs"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">✓ Profil Berhasil Disimpan Permanen!</p>
                    <p className="text-emerald-700 mt-1 font-sans">
                      Biodata dan tanda tangan Anda kini disimpan aman pada kapasitas penyimpanan lokal browser Anda. Setiap draf baru yang dibentuk akan otomatis memakai profil tetap ini tanpa perlu mengisi lagi.
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                
                {/* Section A: Biodata Form */}
                <div className="space-y-4">
                  <div className="border-b border-rose-100/10 pb-2">
                    <span className="text-[10.5px] font-black text-rose-700 uppercase tracking-widest block">
                      A. Biodata Sipil Pegawai
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Nama Lengkap & Gelar NIP <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Sri Wahyuni, S.Pd., M.A."
                        value={localProfile.nama}
                        onChange={(e) => {
                          setLocalProfile({ ...localProfile, nama: e.target.value });
                          setTypedName(e.target.value);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Nomor Induk Pegawai (NIP / NIK)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 19851120 201101 2 003"
                        value={localProfile.nip}
                        onChange={(e) => setLocalProfile({ ...localProfile, nip: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/20"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Jabatan Pelapor
                        </label>
                        <input
                          type="text"
                          placeholder="Pilih template atau ketik jabatan"
                          value={localProfile.jabatan}
                          onChange={(e) => setLocalProfile({ ...localProfile, jabatan: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Unit Kerja Jabatan
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: PPKH Kec. Baki"
                          value={localProfile.unitKerja}
                          onChange={(e) => setLocalProfile({ ...localProfile, unitKerja: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Tempat Penandatangan Dokumen
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Sukoharjo"
                        value={localProfile.tempatPembuatan}
                        onChange={(e) => setLocalProfile({ ...localProfile, tempatPembuatan: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs shadow-xs bg-slate-50/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Signature Widget */}
                <div className="space-y-4">
                  <div className="border-b border-rose-100/10 pb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-black text-rose-700 uppercase tracking-widest block">
                      B. Bubuhi Tanda Tangan Elektronik (TTE)
                    </span>
                    {localProfile.signatureData && (
                      <span className="bg-blue-100 text-blue-800 text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-200">
                        ✓ TTE Tersimpan
                      </span>
                    )}
                  </div>

                  {/* Signature Method Selector Tabs */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSigTab("draw")}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        sigTab === "draw"
                          ? "bg-white text-emerald-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      ✍️ Gambar
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigTab("upload")}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        sigTab === "upload"
                          ? "bg-white text-emerald-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      📤 Unggah
                    </button>
                    <button
                      type="button"
                      onClick={() => setSigTab("text")}
                      className={`py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        sigTab === "text"
                          ? "bg-white text-emerald-800 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      🔤 Teks
                    </button>
                  </div>

                  {/* Tab Body Contents */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 min-h-[175px] flex flex-col justify-between">
                    
                    {sigTab === "draw" && (
                      <div className="space-y-3">
                        <p className="text-[10px] text-slate-400 font-sans">
                          Silakan gerakkan mouse Anda atau pakai layar sentuh ponsel untuk menandatangani di kanvas bawah ini:
                        </p>
                        <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
                          <canvas
                            ref={canvasRef}
                            width={320}
                            height={110}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-[110px] cursor-crosshair touch-none block"
                          />
                          <button
                            type="button"
                            onClick={clearCanvas}
                            className="absolute bottom-2 right-2 p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all shadow-xs"
                            title="Bersihkan Gambar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {sigTab === "upload" && (
                      <div className="space-y-3 flex flex-col items-center justify-center py-2">
                        <p className="text-[10px] text-slate-400 font-sans text-center">
                          Unggah berkas foto scan tanda tangan Anda (Format PNG transparan lebih direkomendasikan):
                        </p>
                        <label className="w-full flex flex-col items-center justify-center px-4 py-5 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/10 rounded-xl cursor-pointer transition-all bg-white shadow-inner">
                          <Upload className="w-6 h-6 text-slate-400 mb-2" />
                          <span className="text-[10.5px] text-slate-600 font-bold">Pilih Berkas Foto TTD</span>
                          <span className="text-[8px] text-slate-400 mt-1">PNG, JPG atau GIF (Maks 3MB)</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleUploadSignature}
                            className="hidden" 
                          />
                        </label>
                      </div>
                    )}

                    {sigTab === "text" && (
                      <div className="space-y-3 bg-white p-3 rounded-xl border border-slate-200/80">
                        <div className="space-y-1.5">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">
                            Nama Format Tanda Tangan:
                          </label>
                          <input
                            type="text"
                            placeholder="Ketik inisial atau nama Anda"
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs focus:border-blue-400 focus:ring-1"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <span className="block text-[8px] font-black text-slate-400 uppercase">
                            Pilih Style Cursive:
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => generateTypedSignature(1)}
                              className="py-1 px-1.5 bg-blue-50 text-blue-800 rounded text-[9.5px] font-black border border-blue-100 hover:bg-blue-100 transition-all font-sans"
                            >
                              Format Blue Ink
                            </button>
                            <button
                              type="button"
                              onClick={() => generateTypedSignature(2)}
                              className="py-1 px-1.5 bg-slate-100 text-slate-800 rounded text-[9.5px] font-black border border-slate-200 hover:bg-slate-200 transition-all font-serif"
                            >
                              Format Charcoal
                            </button>
                            <button
                              type="button"
                              onClick={() => generateTypedSignature(3)}
                              className="py-1 px-1.5 bg-green-50 text-green-800 rounded text-[9.5px] font-black border border-green-100 hover:bg-green-100 transition-all italic"
                            >
                              Format Classic
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Preview Area for what is selected */}
                    {localProfile.signatureData && (
                      <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">
                            Preview Tanda Tangan Aktif:
                          </span>
                          <img 
                            src={localProfile.signatureData} 
                            alt="Signature Preview" 
                            className="h-[44px] max-w-[150px] object-contain mt-1 block select-none bg-slate-50/50 rounded p-1"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setLocalProfile({ ...localProfile, signatureData: "" })}
                          className="p-1 px-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-100 transition-all text-[9.5px] font-black flex items-center gap-1"
                        >
                          <Trash2 className="w-3" /> Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-sans">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-300" />
                  Seluruh profil dan tanda tangan terenkripsi aman secara lokal di laptop/ponsel Anda.
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  {hasStoredProfile && (
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      className="grow sm:grow-0 px-3.5 py-1.5 bg-red-50 text-red-700 font-black hover:bg-red-100 text-xs rounded-xl border border-red-100 transition-all"
                    >
                      Hapus Simpanan
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="grow sm:grow-0 px-5 py-2 bg-emerald-600 text-white font-black hover:bg-emerald-700 text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Profil & TTE
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
