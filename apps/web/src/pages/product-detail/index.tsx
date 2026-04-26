import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, NavBar, Toast } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import styles from './index.module.less';

export function ProductDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<any>(null);
  useEffect(() => {
    api
      .get<ApiResp<any>>(`/shop/products/${id}`)
      .then(r => {
        if (!r.data.success) throw new Error(r.data.message);
        setP(r.data.data);
      })
      .catch(e => Toast.show(e.message));
  }, [id]);
  return (
    <div>
      <NavBar onBack={() => nav(-1)}>商品详情</NavBar>
      {p ? (
        <div className={styles.body}>
          <div className={styles.title}>{p.name}</div>
          {p.coverUrl ? <img src={p.coverUrl} className={styles.cover} alt="" /> : null}
          <div className={styles.price}>{p.priceText}</div>
          <div className={styles.desc}>{p.description || '[商品详情描述占位]'}</div>
          <div className={styles.actions}>
            <Button disabled>[加入购物车占位]</Button>
            <Button disabled color="primary">
              [立即购买占位]
            </Button>
          </div>
          <div className={styles.placeholder}>[相关推荐占位]</div>
        </div>
      ) : null}
    </div>
  );
}
