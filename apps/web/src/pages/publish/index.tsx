import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Image, Input, NavBar, Toast } from 'antd-mobile';
import { api, setAuthHeader, type ApiResp } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import styles from './index.module.less';

export function PublishPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const type = (sp.get('type') as 'share' | 'renovation') || 'share';
  const { token } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [urls, setUrls] = useState<string[]>([]);

  const kind = type === 'renovation' ? 'publish_renovation' : 'publish_share';

  useEffect(() => {
    if (!token) return;
    setAuthHeader(token);
    api.get<ApiResp<any>>(`/me/drafts/${encodeURIComponent(kind)}`).then(r => {
      const d = r.data.data;
      if (d) {
        setTitle(d.title || '');
        setContent(d.content || '');
        setUrls(d.imageUrls || []);
      }
    });
  }, [token, kind]);

  const saveDraft = async () => {
    await api.post(`/me/drafts/${encodeURIComponent(kind)}`, { title, content, imageUrls: urls });
    Toast.show({ content: '草稿已保存' });
  };

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (token && (title || content || urls.length))
        void api.post(`/me/drafts/${encodeURIComponent(kind)}`, { title, content, imageUrls: urls });
    }, 800);
    return () => window.clearTimeout(t);
  }, [title, content, urls, token, kind]);

  const pick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []);
      for (const f of files) {
        const fd = new FormData();
        fd.append('file', f);
        const { data } = await api.post<ApiResp<{ url: string }>>('/common/upload', fd);
        if (data.success && data.data?.url) setUrls(u => [...u, data.data!.url]);
      }
    };
    input.click();
  };

  const publish = async () => {
    const { data } = await api.post<ApiResp<any>>('/posts', {
      title,
      content,
      type,
      imageUrls: urls,
    });
    if (!data.success) throw new Error(data.message);
    Toast.show({ icon: 'success', content: '发布成功' });
    nav(`/post/${data.data.id}`, { replace: true });
  };

  return (
    <div>
      <NavBar
        onBack={() => nav(-1)}
        right={
          <Button size="small" onClick={() => void publish().catch(e => Toast.show({ content: e.message }))}>
            发布
          </Button>
        }
      >
        发布
      </NavBar>
      <div className={styles.body}>
        <div className={styles.typeRow}>
          <Button size="small" fill={type === 'share' ? 'solid' : 'outline'} onClick={() => nav('/publish?type=share')}>
            分享
          </Button>
          <Button size="small" fill={type === 'renovation' ? 'solid' : 'outline'} onClick={() => nav('/publish?type=renovation')}>
            求改造
          </Button>
        </div>
        <div className={styles.spacer12} />
        <Input placeholder="标题" value={title} onChange={setTitle} />
        <div className={styles.spacer12} />
        <Input placeholder="正文" value={content} onChange={setContent} />
        <div className={styles.spacer12} />
        <Button onClick={pick}>上传图片</Button>
        <div className={styles.thumbGrid}>
          {urls.map((u, i) => (
            <div key={u} className={styles.thumbWrap}>
              <Image src={u} width={80} height={80} fit="cover" className={styles.thumbImg} />
              <span
                className={styles.thumbRemove}
                onClick={() => setUrls(urls.filter((_, j) => j !== i))}
              >
                ×
              </span>
            </div>
          ))}
        </div>
        <div className={styles.spacer24} />
        <Button block fill="outline" onClick={() => void saveDraft().catch(e => Toast.show({ content: e.message }))}>
          手动保存草稿
        </Button>
      </div>
    </div>
  );
}
