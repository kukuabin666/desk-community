/**
 * TypeORM 实体聚合导出：供 `configuration` / `orm` 注册 `entities` 使用。
 *
 * 域划分（便于检索，非物理子目录）：
 * - 账号与身份：`UserEntity`、`UserProfileEntity`、`RefreshTokenEntity`、`UserDeviceEntity`、`LoginLogEntity`
 * - 内容与创作：`PostEntity`、`PostImageEntity`、`SeriesEntity`、`SeriesPostEntity`、`DraftEntity`
 * - 社交与互动：`FollowEntity`、`PostLikeEntity`、`FavoriteFolderEntity`、`FavoriteEntity`、`CommentEntity`
 * - 积分等级运营：`PointsLedgerEntity`、`ExpLedgerEntity`、`LevelConfigEntity`、`PointRuleEntity`、`BannerEntity`、`ProductEntity`
 */
import { UserEntity } from './user.entity';
import { UserProfileEntity } from './user-profile.entity';
import { RefreshTokenEntity } from './refresh-token.entity';
import { PostEntity } from './post.entity';
import { PostImageEntity } from './post-image.entity';
import { SeriesEntity } from './series.entity';
import { SeriesPostEntity } from './series-post.entity';
import { FollowEntity } from './follow.entity';
import { PostLikeEntity } from './post-like.entity';
import { FavoriteFolderEntity } from './favorite-folder.entity';
import { FavoriteEntity } from './favorite.entity';
import { CommentEntity } from './comment.entity';
import { PointsLedgerEntity } from './points-ledger.entity';
import { ExpLedgerEntity } from './exp-ledger.entity';
import { LevelConfigEntity } from './level-config.entity';
import { PointRuleEntity } from './point-rule.entity';
import { BannerEntity } from './banner.entity';
import { ProductEntity } from './product.entity';
import { DraftEntity } from './draft.entity';
import { LoginLogEntity } from './login-log.entity';
import { UserDeviceEntity } from './user-device.entity';

export const ormEntities = [
  UserEntity,
  UserProfileEntity,
  RefreshTokenEntity,
  PostEntity,
  PostImageEntity,
  SeriesEntity,
  SeriesPostEntity,
  FollowEntity,
  PostLikeEntity,
  FavoriteFolderEntity,
  FavoriteEntity,
  CommentEntity,
  PointsLedgerEntity,
  ExpLedgerEntity,
  LevelConfigEntity,
  PointRuleEntity,
  BannerEntity,
  ProductEntity,
  DraftEntity,
  LoginLogEntity,
  UserDeviceEntity,
];
