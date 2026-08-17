/**
 * @file imageUpload.js
 * @description ImgBB image uploading utility for product photos and assets using native fetch.
 * Automatically uses VITE_IMGBB_API_KEY from .env or localStorage.
 */
import toast from 'react-hot-toast';

export const getImgbbApiKey = () => {
  return (
    import.meta.env.VITE_IMGBB_API_KEY ||
    localStorage.getItem('shopo_imgbb_api_key') ||
    '6d469e38d1542692e49a89d09475979d'
  ).trim();
};

export const setImgbbApiKey = (key) => {
  if (key) {
    localStorage.setItem('shopo_imgbb_api_key', key.trim());
  } else {
    localStorage.removeItem('shopo_imgbb_api_key');
  }
};

/**
 * Uploads an image file to ImgBB and returns the hosted image URL.
 * @param {File} file - Image file from file input
 * @returns {Promise<{ url: string, thumbUrl: string, displayUrl: string }>}
 */
export const uploadImageToImgBB = async (file) => {
  if (!file) {
    throw new Error('No image file selected.');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image.');
  }

  // Validate size (ImgBB limit is 32MB, recommend < 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size must be less than 10MB.');
  }

  const apiKey = getImgbbApiKey();

  if (!apiKey) {
    toast.error('ImgBB API key is not configured yet. Please add VITE_IMGBB_API_KEY to your .env file.', {
      duration: 5000,
    });
    throw new Error('ImgBB API Key is missing. Add VITE_IMGBB_API_KEY in .env');
  }

  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body: formData,
    });

    const resJson = await response.json();

    if (response.ok && resJson && resJson.success && resJson.data) {
      const data = resJson.data;
      return {
        url: data.url || data.display_url,
        displayUrl: data.display_url || data.url,
        thumbUrl: data.thumb?.url || data.url,
        deleteUrl: data.delete_url || '',
      };
    } else {
      throw new Error(resJson?.error?.message || 'Failed to upload image to ImgBB.');
    }
  } catch (error) {
    const errorMsg = error.message || 'Failed to upload image to ImgBB.';
    throw new Error(errorMsg);
  }
};

export default {
  getImgbbApiKey,
  setImgbbApiKey,
  uploadImageToImgBB,
};
