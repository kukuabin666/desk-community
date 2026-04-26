/**
 * 首页 Feed：无限滚动 + 下拉刷新。
 * - 数据层用 useInfiniteQuery，queryKey 为 ['feed']；与 ShellLayout 派发的 desk:home-refresh 共用 resetQueries。
 * - 首屏失败用 fatalError 全页 ErrorBlock；加载更多失败则依赖 isFetchNextPageError 关闭 hasMore。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.module.less';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DotLoading, ErrorBlock, Image, InfiniteScroll, NavBar, PullToRefresh, Toast } from 'antd-mobile';
import { SearchOutline } from 'antd-mobile-icons';
import { api, type ApiResp } from '../../api/client';
import { useLongPress } from '../../hooks/useLongPress';

type FeedPost = {
  id: number;
  title: string;
  images: string[];
  author: { id: number; nickname: string; avatar: string; level?: number } | null;
};

const FEED_PAGE_SIZE = 20;
/** 与 queryClient.resetQueries / invalidate 等共用，勿随意改名 */
const FEED_QUERY_KEY = ['feed'] as const;

/** 单页拉取：cursor 为上一页最后一条 id；首屏不传 cursor */
async function fetchFeedPage(cursor: number | undefined): Promise<FeedPost[]> {
  const { data } = await api.get<ApiResp<{ list: FeedPost[] }>>('/feed', {
    params: cursor != null ? { cursor } : {},
  });
  if (!data.success || !data.data) throw new Error(data.message || '加载失败');
  return data.data.list;
}

export function HomePage() {
  const nav = useNavigate();
  const queryClient = useQueryClient();
  // 双列/单列偏好仅存浏览器，不参与服务端
  const [layout, setLayout] = useState<'double' | 'single'>(() =>
    (localStorage.getItem('feed_layout') as 'double' | 'single') || 'double'
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isPending,
    isFetchNextPageError,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: FEED_QUERY_KEY,
    initialPageParam: undefined as number | undefined,
    queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
    // 本页不足 FEED_PAGE_SIZE 条视为没有下一页（与后端约定一致时可调）
    getNextPageParam: lastPage =>
      lastPage.length >= FEED_PAGE_SIZE ? lastPage[lastPage.length - 1].id : undefined,
  });

  const list = useMemo(() => data?.pages.flatMap(p => p) ?? [], [data?.pages]);
  const hasMore = Boolean(hasNextPage && !isFetchNextPageError);
  // 仅「从未成功拿到第一页」时阻断主内容，避免分页失败后仍误用 fatalError 盖住已有列表
  const fatalError = isError && !data ? String((error as Error).message) : null;

  const refresh = useCallback(async () => {
    // 清空分页缓存并从第一页重拉（下拉刷新、Tab 重复点首页）
    await queryClient.resetQueries({ queryKey: FEED_QUERY_KEY });
  }, [queryClient]);

  useEffect(() => {
    const h = () => void queryClient.resetQueries({ queryKey: FEED_QUERY_KEY });
    window.addEventListener('desk:home-refresh', h);
    return () => window.removeEventListener('desk:home-refresh', h);
  }, [queryClient]);

  const brandLongPress = useLongPress(() => {
    const next = layout === 'double' ? 'single' : 'double';
    setLayout(next);
    localStorage.setItem('feed_layout', next);
    if (navigator.vibrate) navigator.vibrate(30);
    Toast.show({ content: next === 'double' ? '双列浏览' : '单列浏览', duration: 1000 });
  }, { ms: 500 });

  const feedGridClass =
    layout === 'double' ? `${styles.feedGrid} ${styles.feedGridDouble}` : `${styles.feedGrid} ${styles.feedGridSingle}`;

  return (
    <div>
      <NavBar backArrow={false} left={<span {...brandLongPress}>桌搭社区</span>} right={<SearchOutline fontSize={22} onClick={() => nav('/search')} />}>
        首页
      </NavBar>
      {fatalError ? (
        <ErrorBlock status="default" title={fatalError} description="" />
      ) : (
        <PullToRefresh onRefresh={refresh}>
          <div className={feedGridClass}>
            {list.map(p => (
              <div key={p.id} className={styles.postCard} onClick={() => nav(`/post/${p.id}`)}>
                <div className={styles.coverWrap}>
                  {p.images[0] ? (
                    <Image src={p.images[0]} fit="cover" width="100%" height="100%" lazy />
                  ) : null}
                </div>
                <div className={styles.title}>{p.title || '无标题'}</div>
                <div className={styles.metaRow}>
                  {p.author?.avatar ? (
                    <Image src={p.author.avatar} width={20} height={20} className={styles.avatarRound} />
                  ) : null}
                  <span className={styles.authorNick}>{p.author?.nickname}</span>
                </div>
              </div>
            ))}
          </div>
          <InfiniteScroll
            loadMore={async () => {
              if (!hasNextPage || isFetchingNextPage) return;
              try {
                await fetchNextPage();
              } catch {
                // isFetchNextPageError stops further loads via hasMore
              }
            }}
            hasMore={hasMore}
          >
            {isPending ? (
              <DotLoading />
            ) : hasMore ? (
              <DotLoading />
            ) : (
              <div className={styles.endHint}>已经到底啦~</div>
            )}
          </InfiniteScroll>
        </PullToRefresh>
      )}
    </div>
  );
}
