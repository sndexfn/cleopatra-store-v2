"use client";
import React from 'react';
import styles from './HeroCarousel.module.css';

interface Props { images: string[]; interval?: number; }

export default function HeroCarousel({ images = [], interval = 4000 }: Props) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!images || images.length <= 1) return;
    const id = setInterval(() => setIndex(i => (i + 1) % images.length), interval);
    return () => clearInterval(id);
  }, [images, interval]);

  if (!images || images.length === 0) return null;

  return (
    <div className={styles.carousel} aria-hidden={images.length === 1}>
      {images.map((src, i) => (
        <img key={i} src={src} className={`${styles.slide} ${i === index ? styles.active : ''}`} alt={`hero-${i}`} />
      ))}
      <div className={styles.dots}>
        {images.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className={i === index ? styles.dotActive : styles.dot} aria-label={`slide-${i}`} />
        ))}
      </div>
    </div>
  );
}
