import { Bookmark, Heart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import arrowLeftIcon from '../assets/auth-figma/arrow-left.svg';
import menuIcon from '../assets/images/menu.svg';
import { ApiError, getNotifications, markNotificationRead, type NotificationItem } from '../lib/api';
import { resolveErrorMessage } from '../lib/resolve-error-message';
import { clearSession, getAccessToken } from '../lib/session';

type NotificationTab = 'all' | 'like' | 'bookmark';
type NotificationType = 'like' | 'bookmark';

type NotificationListItem = {
  id: number;
  type: NotificationType;
  message: string;
  ago: string;
  isRead: boolean;
  targetId: number;
};

function isAuthError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

function inferNotificationType(item: NotificationItem): NotificationType {
  if (item.type === 'EXPERIENCE_LIKE') {
    return 'like';
  }

  if (item.type === 'EXPERIENCE_BOOKMARK') {
    return 'bookmark';
  }

  return item.message.includes('북마크') ? 'bookmark' : 'like';
}

function parseUtcDateTime(value: string) {
  const matched = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/,
  );
  if (!matched) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }

  const [, year, month, day, hour, minute, second = '0', fraction = '0'] = matched;
  const milliseconds = Number(fraction.padEnd(3, '0').slice(0, 3));

  return new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    milliseconds,
  ));
}

function formatAgo(value: string) {
  const createdAt = parseUtcDateTime(value);
  if (!createdAt) {
    return '';
  }

  const diffMs = Date.now() - createdAt.getTime();
  const safeDiffMs = Math.max(0, diffMs);
  const diffMinutes = Math.floor(safeDiffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return '방금 전';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

function mapNotificationItem(item: NotificationItem): NotificationListItem {
  return {
    id: item.id,
    type: inferNotificationType(item),
    message: item.message,
    ago: formatAgo(item.createdAt),
    isRead: item.isRead,
    targetId: item.targetId,
  };
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-[64px] items-center justify-between bg-white px-[16px] py-[20px]">
      <button
        type="button"
        onClick={onBack}
        className="flex h-[24px] w-[24px] items-center justify-center"
        aria-label="뒤로 가기"
      >
        <img src={arrowLeftIcon} alt="" className="h-[24px] w-[24px]" />
      </button>
      <h1 className="font-['Pretendard'] text-[16px] font-[600] leading-[19.2px] text-black">알림</h1>
      <button
        type="button"
        className="flex h-[24px] w-[24px] items-center justify-center"
        aria-label="메뉴 열기"
      >
        <img src={menuIcon} alt="" className="h-[24px] w-[24px]" />
      </button>
    </div>
  );
}

function Tabs({
  activeTab,
  onChange,
}: {
  activeTab: NotificationTab;
  onChange: (tab: NotificationTab) => void;
}) {
  const tabs: Array<{ key: NotificationTab; label: string }> = [
    { key: 'all', label: '전체' },
    { key: 'like', label: '좋아요' },
    { key: 'bookmark', label: '북마크' },
  ];

  return (
    <div className="flex h-[25px] w-full border-b border-[#EEEEEE]">
      {tabs.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className="flex h-[25px] w-[125px] items-center justify-center border-b-[1.5px]"
            style={{ borderBottomColor: active ? '#5A876E' : 'transparent' }}
          >
            <span
              className={`font-['Pretendard'] text-[14px] leading-[16.8px] ${
                active ? 'font-[600] text-[#5A876E]' : 'font-[400] text-[#BABABA]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SummaryRow({
  unreadCount,
  onMarkAllRead,
}: {
  unreadCount: number;
  onMarkAllRead: () => void;
}) {
  return (
    <div className="flex h-[41px] items-center justify-between px-[16px]">
      <div className="flex items-center gap-[4px]">
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-black">읽지 않은 알림</span>
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#5A876E]">{unreadCount}</span>
      </div>
      <button
        type="button"
        onClick={onMarkAllRead}
        className={`font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] ${
          unreadCount > 0 ? 'text-[#5A876E]' : 'text-[#BABABA]'
        }`}
      >
        모두 읽음
      </button>
    </div>
  );
}

function NotificationRow({
  item,
  onClick,
}: {
  item: NotificationListItem;
  onClick: () => void;
}) {
  const messageColor = item.isRead ? '#D9D9D9' : '#494949';
  const timeColor = item.isRead ? '#EAEAEA' : '#BABABA';
  const iconColor = item.isRead ? '#D8FFF0' : '#5A876E';
  const icon =
    item.type === 'like' ? (
      <Heart size={18} strokeWidth={1.6} color={iconColor} />
    ) : (
      <Bookmark size={18} strokeWidth={1.6} color={iconColor} />
    );

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[68px] w-full items-start border-b border-[#F1F1F1] px-[16px] py-[16px] text-left"
    >
      <div className="mr-[8px] flex h-[20px] w-[20px] shrink-0 items-center justify-center">{icon}</div>
      <div className="flex flex-col gap-[2px]">
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px]" style={{ color: messageColor }}>
          {item.message}
        </span>
        <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px]" style={{ color: timeColor }}>
          {item.ago}
        </span>
      </div>
    </button>
  );
}

export default function NotificationPage() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      navigate('/auth?next=%2Fnotifications', { replace: true });
      return;
    }

    let cancelled = false;

    void getNotifications(token)
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setNotifications(payload.items.map(mapNotificationItem));
        setError('');
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }

        if (isAuthError(loadError)) {
          clearSession();
          navigate('/auth?next=%2Fnotifications', { replace: true });
          return;
        }

        setError(resolveErrorMessage(loadError, '알림을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, token]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') {
      return notifications;
    }

    return notifications.filter((item) => item.type === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);

  async function handleRowClick(item: NotificationListItem) {
    if (!token) {
      navigate('/auth?next=%2Fnotifications', { replace: true });
      return;
    }

    if (!item.isRead) {
      try {
        const updated = await markNotificationRead(token, item.id);
        setNotifications((current) =>
          current.map((entry) => (entry.id === updated.id ? mapNotificationItem(updated) : entry)),
        );
      } catch (markError) {
        if (isAuthError(markError)) {
          clearSession();
          navigate('/auth?next=%2Fnotifications', { replace: true });
          return;
        }
      }
    }

    if (item.targetId) {
      navigate(`/experiences/${item.targetId}`);
    }
  }

  async function handleMarkAllRead() {
    if (!token) {
      navigate('/auth?next=%2Fnotifications', { replace: true });
      return;
    }

    const unreadItems = notifications.filter((item) => !item.isRead);
    if (unreadItems.length === 0) {
      return;
    }

    try {
      const updatedItems = await Promise.all(unreadItems.map((item) => markNotificationRead(token, item.id)));
      const updatedMap = new Map(updatedItems.map((item) => [item.id, mapNotificationItem(item)]));
      setNotifications((current) => current.map((item) => updatedMap.get(item.id) ?? item));
    } catch (markError) {
      if (isAuthError(markError)) {
        clearSession();
        navigate('/auth?next=%2Fnotifications', { replace: true });
      }
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-[375px] bg-white">
      <header className="bg-white">
        <Header
          onBack={() => {
            if (window.history.length > 1) {
              navigate(-1);
              return;
            }
            navigate('/');
          }}
        />
      </header>

      <main className="bg-white">
        <Tabs activeTab={activeTab} onChange={setActiveTab} />
        <SummaryRow unreadCount={unreadCount} onMarkAllRead={handleMarkAllRead} />

        {loading ? (
          <div className="flex h-[651px] w-full items-start justify-center pt-[48px]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#757575]">
              알림을 불러오는 중입니다.
            </span>
          </div>
        ) : error ? (
          <div className="flex h-[651px] w-full items-start justify-center px-[24px] pt-[48px] text-center">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#757575]">{error}</span>
          </div>
        ) : filteredNotifications.length ? (
          <div className="w-full">
            {filteredNotifications.map((item) => (
              <NotificationRow key={item.id} item={item} onClick={() => void handleRowClick(item)} />
            ))}
          </div>
        ) : (
          <div className="flex h-[651px] w-full items-start justify-center pt-[48px]">
            <span className="font-['Pretendard'] text-[12px] font-[400] leading-[16.8px] text-[#757575]">
              아직 새로운 소식이 없어요.
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
