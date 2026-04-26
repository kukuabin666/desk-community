/**
 * 用户主页：并行拉 profile / stats / series / posts，避免串行瀑布；
 * uid 变化时用 cancelled 忽略过期响应；默认 Tab 在数据就绪后一次性 setTab（不用第二个 effect 推导）。
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorBlock, Grid, Image, NavBar, Tabs, Toast } from 'antd-mobile';
import { MediaCard } from '../../components/MediaCard';
import { api, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

type Profile = {
  id: number;
  nickname: string;
  avatar: string;
  bio: string;
  level: number;
  isSelf: boolean;
};

type Card = { id: number; title: string; images: string[] };

export function UserProfilePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { token } = useAuth();
  const uid = Number(id);
  const [p, setP] = useState<Profile | null>(null);
  const [stats, setStats] = useState<{ following: number; followers: number; likes: number } | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [posts, setPosts] = useState<Card[]>([]);
  const [tab, setTab] = useState<'series' | 'posts' | 'fav' | 'likes'>('series');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        // 四路并行；全部返回后再更新状态，保证 setTab 与 series 同步
        const [profRes, statsRes, seriesRes, postsRes] = await Promise.all([
          api.get<ApiResp<Profile>>(`/users/${uid}`),
          api.get<ApiResp<{ following: number; followers: number; likes: number }>>(`/users/${uid}/stats`),
          api.get<ApiResp<any[]>>(`/users/${uid}/series`),
          api.get<ApiResp<Card[]>>(`/users/${uid}/posts`),
        ]);
        if (cancelled) return;
        if (!profRes.data.success) {
          Toast.show({ content: profRes.data.message || '加载失败' });
          setP(null);
        } else {
          setP(profRes.data.data!);
        }
        if (statsRes.data.success && statsRes.data.data) setStats(statsRes.data.data);
        const seriesList = seriesRes.data.success ? seriesRes.data.data || [] : [];
        setSeries(seriesList);
        if (postsRes.data.success) setPosts(postsRes.data.data || []);
        else setPosts([]);
        // 有系列则默认「系列」Tab，否则「帖子」（会覆盖用户在上一个 uid 下的 Tab，符合换用户预期）
        setTab(seriesList.length ? 'series' : 'posts');
      } catch (e) {
        if (!cancelled) Toast.show({ content: String((e as Error).message) });
      }
    })();
    return () => {
      cancelled = true; // 快速切换路由时丢弃未完成请求的结果
    };
  }, [uid]);

  const follow = async () => {
    if (!token) return nav('/login');
    await api.post(`/users/${uid}/follow`);
    Toast.show({ content: '已关注' });
    const r = await api.get<ApiResp<any>>(`/users/${uid}/stats`);
    if (r.data.success) setStats(r.data.data);
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>主页</NavBar>
      {p ? (
        <div className={styles.profilePad}>
          <div className={styles.profileRow}>
            <Image src={p.avatar} width={72} height={72} className={styles.avatarHero} />
            <div className={styles.profileMain}>
              <div className={styles.nickname}>
                {p.nickname} <span className={styles.levelTag}>Lv.{p.level}</span>
              </div>
              <div className={styles.bio}>{p.bio || '暂无简介'}</div>
              <div className={styles.statsRow}>
                <span onClick={() => nav(`/user/${uid}/follow?tab=following`)}>关注 {stats?.following ?? 0}</span>
                <span onClick={() => nav(`/user/${uid}/follow?tab=followers`)}>粉丝 {stats?.followers ?? 0}</span>
                <span>获赞 {stats?.likes ?? 0}</span>
              </div>
              {!p.isSelf && token ? (
                <Button
                  size="small"
                  color="primary"
                  className={styles.btnFollow}
                  onClick={() => void follow().catch(e => Toast.show({ content: String(e.message) }))}
                >
                  关注
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <Tabs activeKey={tab} onChange={k => setTab(k as any)}>
        <Tabs.Tab title="系列" key="series">
          {series.length ? (
            <Grid columns={2} gap={8} className={styles.gridPad}>
              {series.map((s: any) => (
                <Grid.Item key={s.id}>
                  <MediaCard
                    imageUrl={s.coverUrl}
                    aspect="1"
                    title={s.name}
                    footer={`${s.postCount} 篇`}
                    onClick={() => nav(`/series/${s.id}`)}
                  />
                </Grid.Item>
              ))}
            </Grid>
          ) : (
            <ErrorBlock status="empty" title="暂无系列" />
          )}
        </Tabs.Tab>
        <Tabs.Tab title="帖子" key="posts">
          <Grid columns={2} gap={8} className={styles.gridPad}>
            {posts.map(x => (
              <Grid.Item key={x.id}>
                <MediaCard
                  imageUrl={x.images[0]}
                  aspect="3/4"
                  title={x.title}
                  onClick={() => nav(`/post/${x.id}`)}
                />
              </Grid.Item>
            ))}
          </Grid>
        </Tabs.Tab>
        <Tabs.Tab title="收藏" key="fav">
          {p?.isSelf ? <SelfFav /> : <ErrorBlock status="empty" title="访客可见（占位）" />}
        </Tabs.Tab>
        <Tabs.Tab title="喜欢" key="likes">
          {p?.isSelf ? <SelfLikes /> : <ErrorBlock status="empty" title="访客可见（占位）" />}
        </Tabs.Tab>
      </Tabs>
    </div>
  );
}

function SelfFav() {
  const nav = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api.get<ApiResp<any[]>>('/me/favorites').then(r => r.data.success && setRows(r.data.data || []));
  }, []);
  return (
    <Grid columns={2} gap={8} className={styles.gridPad}>
      {rows.map(r => (
        <Grid.Item key={r.favoriteId}>
          <MediaCard
            imageUrl={r.post?.images?.[0]}
            aspect="3/4"
            title={r.post?.title}
            titleSize="sm"
            onClick={() => r.post && nav(`/post/${r.post.id}`)}
          />
        </Grid.Item>
      ))}
    </Grid>
  );
}

function SelfLikes() {
  const nav = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api.get<ApiResp<any[]>>('/me/likes').then(r => r.data.success && setRows(r.data.data || []));
  }, []);
  return (
    <Grid columns={2} gap={8} className={styles.gridPad}>
      {rows.map(r => (
        <Grid.Item key={r.likeId}>
          <MediaCard
            imageUrl={r.post?.images?.[0]}
            aspect="3/4"
            title={r.post?.title}
            titleSize="sm"
            onClick={() => r.post && nav(`/post/${r.post.id}`)}
          />
        </Grid.Item>
      ))}
    </Grid>
  );
}
