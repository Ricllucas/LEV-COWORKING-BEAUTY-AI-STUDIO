/**
 * Utility to compress and resize images uploaded from desktop or mobile devices.
 * Ensures image base64 strings are small (~15-30KB) to fit safely in LocalStorage
 * and load instantly on mobile networks.
 */
export function compressImageToDataUrl(
  file: File,
  maxSize = 320,
  quality = 0.78
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Erro ao processar a imagem.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize maintaining aspect ratio
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG data URL
          const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedDataUrl);
        } catch (err) {
          // Fallback to reader result if canvas fails
          resolve(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
