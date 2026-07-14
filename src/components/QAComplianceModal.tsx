import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, Award, MapPin, X, ZoomIn, Info } from "lucide-react";
import { db, collection, getDocs } from "../lib/firebase";
import { Certificate } from "../types";

interface QAComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: Certificate[];
  isLoading: boolean;
}

export default function QAComplianceModal({
  isOpen,
  onClose,
  certificates,
  isLoading,
}: QAComplianceModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#040e1f]/90 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            className="relative w-full max-w-4xl bg-gradient-to-b from-[#11233e] to-[#061021] border border-[#00dbe7]/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-[#00dbe7]/5 text-white flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#00dbe7]/10 rounded-xl border border-[#00dbe7]/20">
                  <ShieldCheck className="w-6 h-6 text-[#00dbe7]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-space uppercase tracking-wider text-white flex items-center gap-2">
                    QA & Compliance Certificates <Award className="w-4 h-4 text-[#c3f400]" />
                  </h3>
                  <p className="text-[10px] text-[#d8e3fb]/50 font-mono">
                    BD ROBOTEC VALIDATION REGISTER
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-6">
              <div className="bg-[#081426]/80 border border-white/5 rounded-2xl p-4 flex gap-3 text-xs text-[#d8e3fb]/70 leading-relaxed">
                <Info className="w-5 h-5 text-[#00dbe7] shrink-0 mt-0.5" />
                <p>
                  BD RoboTec ensures 100% component fidelity and safety compliance. Below you can view our officially issued certificates, licenses, and laboratory testing QA protocols. Click on any certificate picture to zoom in.
                </p>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-[#112035]/40 border border-white/5 rounded-2xl p-4 animate-pulse space-y-3">
                      <div className="w-full h-48 bg-white/5 rounded-xl" />
                      <div className="h-4 bg-white/10 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-12 bg-[#081426]/40 border border-dashed border-white/5 rounded-2xl space-y-3">
                  <Award className="w-12 h-12 text-[#d8e3fb]/20 mx-auto" />
                  <p className="text-sm font-space text-[#d8e3fb]/50">No QA Certificates registered yet</p>
                  <p className="text-xs text-[#d8e3fb]/30">Admins can add new certificates from the Admin Panel.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <motion.div
                      key={cert.id}
                      className="group bg-[#081426]/50 hover:bg-[#0c1c34]/70 border border-[#00dbe7]/10 hover:border-[#00dbe7]/30 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between space-y-4"
                    >
                      {/* Image container */}
                      <div className="relative overflow-hidden rounded-xl bg-[#030a14] border border-white/5 aspect-[4/3] flex items-center justify-center">
                        <img
                          src={cert.pic}
                          alt={cert.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-[#040e1f]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <button
                            onClick={() => setSelectedImage(cert.pic)}
                            className="pointer-events-auto p-2.5 bg-[#00dbe7] text-black font-semibold rounded-xl flex items-center gap-1.5 text-xs shadow-lg shadow-[#00dbe7]/20 transition-all transform translate-y-2 group-hover:translate-y-0"
                          >
                            <ZoomIn className="w-4 h-4" /> Zoom View
                          </button>
                        </div>
                      </div>

                      {/* Info block */}
                      <div className="space-y-2">
                        <h4 className="font-space text-sm font-bold text-white tracking-wide leading-snug">
                          {cert.title}
                        </h4>
                        <div className="flex items-start gap-1.5 text-[11px] text-[#d8e3fb]/60 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-[#00dbe7] shrink-0 mt-0.5" />
                          <span className="leading-tight select-all">{cert.address}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/5 flex justify-end shrink-0">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-space font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer border border-white/5 transition-all text-center"
              >
                Close Window
              </button>
            </div>
          </motion.div>

          {/* Picture Zoom Lightbox */}
          {selectedImage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedImage(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative max-w-4xl max-h-[90vh] z-10 flex flex-col items-center"
              >
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={selectedImage}
                  alt="Certificate Enlargement"
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
                />
              </motion.div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
