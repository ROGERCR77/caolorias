/**
 * Compress an image file before upload
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default 600px for mobile safety)
 * @param quality - JPEG quality 0-1 (default 0.7)
 * @returns Compressed file as Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 600,
  quality: number = 0.7
): Promise<Blob> {
  // Check file size limit (10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Arquivo muito grande (máximo 10MB)');
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let objectUrl: string | null = null;

    // Timeout de 30 segundos para evitar travamento
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timeout ao processar imagem'));
    }, 30000);

    const cleanup = () => {
      clearTimeout(timeout);
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };

    img.onload = () => {
      try {
        let { width, height } = img;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          cleanup();
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Falha ao carregar imagem'));
    };

    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (error) {
      cleanup();
      reject(new Error('Erro ao processar arquivo de imagem'));
    }
  });
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
