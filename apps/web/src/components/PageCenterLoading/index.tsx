import { DotLoading } from 'antd-mobile';
import styles from './index.module.less';

/** 全屏居中 loading：路由懒加载 fallback、RequireAuth 校验中与业务无关的等待态 */
export function PageCenterLoading() {
  return (
    <div className={styles.wrap}>
      <DotLoading />
    </div>
  );
}
