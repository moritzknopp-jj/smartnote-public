'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, File, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize } from '@/lib/utils';

interface FileUploadProps {
  onFilesAccepted: (files: File[]) => void;
  isProcessing?: boolean;
  processingStatus?: string;
}

export default function FileUpload({ onFilesAccepted, isProcessing, processingStatus }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number; status: 'pending' | 'done' | 'error' }[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setUploadedFiles(acceptedFiles.map((f) => ({ name: f.name, size: f.size, status: 'pending' as const })));
      onFilesAccepted(acceptedFiles);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
    disabled: isProcessing,
  });

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf' || ext === 'txt' || ext === 'docx') return FileText;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return Image;
    return File;
  };

  return (
    <div className="space-y-4">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
          isDragActive
            ? 'border-brand-500 bg-brand-500/10 glow-purple'
            : 'border-gray-600 hover:border-brand-500/50 hover:bg-white/[0.02]',
          isProcessing && 'pointer-events-none opacity-60'
        )}
      >
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          <motion.div
            animate={isDragActive ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <Upload className="mx-auto h-12 w-12 text-brand-500 mb-4" />
            <p className="text-lg font-medium text-gray-200 mb-1">
              {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-gray-500">
              PDF, TXT, DOCX, ZIP, Images — or click to browse
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Processing indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 px-5 py-3 rounded-xl bg-brand-500/10 border border-brand-500/20"
          >
            <Loader2 className="h-5 w-5 text-brand-400 animate-spin" />
            <span className="text-sm text-brand-300">{processingStatus || 'Processing...'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            {uploadedFiles.map((file, i) => {
              const Icon = getFileIcon(file.name);
              return (
                <motion.div
                  key={file.name + i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <Icon className="h-5 w-5 text-brand-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  {file.status === 'pending' && isProcessing && (
                    <Loader2 className="h-4 w-4 text-brand-400 animate-spin" />
                  )}
                  {file.status === 'done' && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-400" />
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
