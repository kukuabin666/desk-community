import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Image, List, NavBar, Swiper, Toast, Input } from 'antd-mobile';
import { api, setAuthHeader, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function PostDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { token } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [cmt, setCmt] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  const load = () => {
    api.get<ApiResp<any>>(`/posts/${id}`).then(r => {
      if (!r.data.success) throw new Error(r.data.message);
      setPost(r.data.data);
    });
    api.get<ApiResp<any[]>>(`/posts/${id}/comments`).then(r => r.data.success && setComments(r.data.data || []));
  };

  useEffect(() => {
    if (token) setAuthHeader(token);
    load();
  }, [id, token]);

  const like = async () => {
    if (!token) return nav('/login');
    const { data } = await api.post<ApiResp<any>>(`/posts/${id}/like`);
    if (!data.success) throw new Error(data.message);
    Toast.show({ content: data.data.liked ? '已点赞' : '已取消' });
    load();
  };

  const sendCmt = async () => {
    if (!token) return nav('/login');
    await api.post(`/posts/${id}/comments`, { body: cmt });
    setCmt('');
    load();
  };

  return (
    <div>
      <NavBar onBack={() => nav(-1)}>{post?.title?.slice(0, 12) || '帖子'}</NavBar>
      {post ? (
        <div>
          <Swiper>
            {(post.images || []).map((u: string) => (
              <Swiper.Item key={u}>
                <Image src={u} fit="contain" width="100%" className={styles.swiperImg} />
              </Swiper.Item>
            ))}
          </Swiper>
          <div className={styles.content}>{post.content}</div>
          <div className={styles.actions}>
            <Button
              size="small"
              color={post.like?.liked ? 'warning' : 'default'}
              onClick={() => void like().catch(e => Toast.show({ content: e.message }))}
            >
              赞 {post.like?.count ?? 0}
            </Button>
            <Button
              size="small"
              onClick={() => {
                if (!token) return void nav('/login');
                void api.post(`/posts/${id}/favorite`, {}).then(() => Toast.show({ content: '已收藏' }));
              }}
            >
              收藏
            </Button>
          </div>
          <List header="评论">
            {comments.map(c => (
              <List.Item key={c.id} description={c.body} title={c.author?.nickname} />
            ))}
          </List>
          <div className={styles.commentInputRow}>
            <Input placeholder="说点什么" value={cmt} onChange={setCmt} />
            <Button color="primary" onClick={() => void sendCmt().catch(e => Toast.show({ content: e.message }))}>
              发送
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
