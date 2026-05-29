import { useEffect } from 'react';

const APP_NAME = 'FAQ Portal';
const DEFAULT_IMAGE = 'https://placehold.co/1200x630/3b82f6/fff?text=FAQ+Portal';

const getOrCreate = (name, attributes) => {
  let el = document.querySelector(`meta[name="${name}"]`) ||
           document.querySelector(`meta[property="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    const isProp = name.includes(':');
    if (isProp) el.setAttribute('property', name);
    else el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  attributes.forEach(([k, v]) => el.setAttribute(k, v));
};

const useDocumentMeta = ({ title, description, image } = {}) => {
  useEffect(() => {
    // Title
    if (title) {
      document.title = `${title} | ${APP_NAME}`;
    } else {
      document.title = APP_NAME;
    }

    // Description
    getOrCreate('description', [['content', description || '']]);

    // Open Graph
    getOrCreate('og:title',       [['content', title ? `${title} | ${APP_NAME}` : APP_NAME]]);
    getOrCreate('og:description', [['content', description || '']]);
    getOrCreate('og:image',       [['content', image || DEFAULT_IMAGE]]);
    getOrCreate('og:url',         [['content', window.location.href]]);

    // Twitter Card
    getOrCreate('twitter:card',        [['content', 'summary_large_image']]);
    getOrCreate('twitter:title',       [['content', title ? `${title} | ${APP_NAME}` : APP_NAME]]);
    getOrCreate('twitter:description', [['content', description || '']]);
    getOrCreate('twitter:image',       [['content', image || DEFAULT_IMAGE]]);

    // Cleanup: restore default on unmount
    return () => {
      document.title = APP_NAME;
    };
  }, [title, description, image]);
};

export default useDocumentMeta;