import type { ReactNode } from 'react';
import styles from './index.module.less';

type MediaCardProps = {
  imageUrl?: string | null;
  aspect: '1' | '3/4';
  title: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  titleSize?: 'sm' | 'md';
};

/**
 * 双列网格里的「封面图 + 标题 + 可选脚注」卡片，多处页面复用（个人主页 Tab、系列详情等）。
 */
export function MediaCard({ imageUrl, aspect, title, footer, onClick, titleSize = 'md' }: MediaCardProps) {
  const coverClass = aspect === '1' ? styles.cover1 : styles.cover34;
  const titleClass = titleSize === 'sm' ? styles.titleSm : styles.titleMd;
  return (
    <div className={styles.card} onClick={onClick}>
      {imageUrl ? <img src={imageUrl} alt="" className={coverClass} /> : null}
      <div className={titleClass}>{title}</div>
      {footer != null && footer !== '' ? <div className={styles.footer}>{footer}</div> : null}
    </div>
  );
}
