import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Grid, NavBar, Toast } from 'antd-mobile';
import { MediaCard } from '../../components/MediaCard';
import { api, type ApiResp } from '../../api/client';
import styles from './index.module.less';

export function SeriesDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api
      .get<ApiResp<any>>(`/series/${id}`)
      .then(r => {
        if (!r.data.success) throw new Error(r.data.message);
        setData(r.data.data);
      })
      .catch(e => Toast.show(e.message));
  }, [id]);
  const s = data?.series;
  const posts = data?.posts || [];
  return (
    <div>
      <NavBar onBack={() => nav(-1)}>{s?.name || '系列'}</NavBar>
      {s?.coverUrl ? <img src={s.coverUrl} className={styles.hero} alt="" /> : null}
      <div className={styles.desc}>{s?.description}</div>
      <Grid columns={2} gap={8} className={styles.gridPad}>
        {posts.map((p: any) => (
          <Grid.Item key={p.id}>
            <MediaCard
              imageUrl={p.images?.[0]}
              aspect="3/4"
              title={p.title}
              onClick={() => nav(`/post/${p.id}`)}
            />
          </Grid.Item>
        ))}
      </Grid>
    </div>
  );
}
