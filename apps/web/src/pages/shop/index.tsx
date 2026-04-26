import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, ErrorBlock, Grid, NavBar, SearchBar } from 'antd-mobile';
import { api, type ApiResp } from '../../api/client';
import styles from './index.module.less';

type Product = { id: number; name: string; coverUrl: string; priceText: string };

export function ShopPage() {
  const nav = useNavigate();
  const [list, setList] = useState<Product[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    api
      .get<ApiResp<Product[]>>('/shop/products')
      .then(r => {
        if (!r.data.success) throw new Error(r.data.message);
        setList(r.data.data || []);
      })
      .catch(e => setErr(e.message));
  }, []);
  return (
    <div>
      <NavBar>小店</NavBar>
      <div className={styles.pad8}>
        <SearchBar placeholder="[搜索占位]" />
      </div>
      <div className={styles.pad8}>
        <div className={styles.placeholder}>[分类导航占位]</div>
        <div className={styles.placeholder}>[Banner 占位]</div>
      </div>
      {err ? <ErrorBlock title={err} /> : null}
      <Grid columns={2} gap={8}>
        {list.map(p => (
          <Grid.Item key={p.id} onClick={() => nav(`/product/${p.id}`)}>
            <Card title={p.name} className={styles.card}>
              {p.coverUrl ? <img src={p.coverUrl} className={styles.cover} alt="" /> : null}
              <div className={styles.price}>{p.priceText}</div>
            </Card>
          </Grid.Item>
        ))}
      </Grid>
    </div>
  );
}
