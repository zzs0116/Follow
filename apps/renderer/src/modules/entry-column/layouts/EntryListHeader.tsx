import type { FC } from "react"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { setGeneralSetting, useGeneralSettingKey } from "~/atoms/settings/general"
import { setUISetting, useUISettingKey } from "~/atoms/settings/ui"
import { useWhoami } from "~/atoms/user"
import { ImpressionView } from "~/components/common/ImpressionTracker"
import { ActionButton } from "~/components/ui/button"
import { DividerVertical } from "~/components/ui/divider"
import { RotatingRefreshIcon } from "~/components/ui/loading"
import { EllipsisHorizontalTextWithTooltip } from "~/components/ui/typography"
import { FEED_COLLECTION_LIST, ROUTE_ENTRY_PENDING, views } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useRouteParams } from "~/hooks/biz/useRouteParams"
import { useIsOnline } from "~/hooks/common"
import { stopPropagation } from "~/lib/dom"
import { FeedViewType } from "~/lib/enum"
import { cn, getOS, isBizId } from "~/lib/utils"
import { useAIDailyReportModal } from "~/modules/ai/ai-daily/hooks"
import { EntryHeader } from "~/modules/entry-content/header"
import { useRefreshFeedMutation } from "~/queries/feed"
import { useFeedById, useFeedHeaderTitle } from "~/store/feed"

import { MarkAllReadWithOverlay } from "../components/mark-all-button"

export const EntryListHeader: FC<{
  totalCount: number
  refetch: () => void
  isRefreshing: boolean
  hasUpdate: boolean
}> = ({ totalCount, refetch, isRefreshing, hasUpdate }) => {
  const routerParams = useRouteParams()
  const { t } = useTranslation()

  const unreadOnly = useGeneralSettingKey("unreadOnly")

  const { feedId, entryId, view } = routerParams

  const headerTitle = useFeedHeaderTitle()
  const os = getOS()

  const titleAtBottom = window.electron && os === "macOS"
  const isInCollectionList = feedId === FEED_COLLECTION_LIST

  const titleInfo = !!headerTitle && (
    <div className={!titleAtBottom ? "min-w-0 translate-y-1" : void 0}>
      <div className="min-w-0 break-all text-lg font-bold leading-none">
        <EllipsisHorizontalTextWithTooltip className="inline-block !w-auto max-w-full">
          {headerTitle}
        </EllipsisHorizontalTextWithTooltip>
      </div>
      <div className="text-xs font-medium text-zinc-400">
        {totalCount || 0} {t("quantifier.piece", { ns: "common" })}
        {unreadOnly && !isInCollectionList ? t("words.unread") : ""}
        {t("words.space", { ns: "common" })}
        {t("words.items", { ns: "common", count: totalCount })}
      </div>
    </div>
  )
  const { mutateAsync: refreshFeed, isPending } = useRefreshFeedMutation(routerParams.feedId)

  const user = useWhoami()
  const isOnline = useIsOnline()

  const feed = useFeedById(routerParams.feedId)

  const titleStyleBasedView = ["pl-12", "pl-7", "pl-7", "pl-7", "px-5", "pl-12"]

  const containerRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={containerRef}
      className={cn(
        "mb-2 flex w-full flex-col pr-4 pt-2.5 transition-[padding] duration-300 ease-in-out",
        titleStyleBasedView[view],
      )}
    >
      <div className={cn("flex w-full", titleAtBottom ? "justify-end" : "justify-between")}>
        {!titleAtBottom && titleInfo}

        <div
          className={cn(
            "relative z-[1] flex items-center gap-1 self-baseline text-zinc-500",
            (isInCollectionList || !headerTitle) && "pointer-events-none opacity-0",

            "translate-x-[6px]",
          )}
          onClick={stopPropagation}
        >
          {views[view].wideMode && entryId && entryId !== ROUTE_ENTRY_PENDING && (
            <>
              <EntryHeader view={view} entryId={entryId} />
              <DividerVertical className="mx-2 w-px" />
            </>
          )}

          <AppendTaildingDivider>
            {view === FeedViewType.SocialMedia && <DailyReportButton />}
            {view === FeedViewType.Pictures && <SwitchToMasonryButton />}
            {view === FeedViewType.Pictures && <FilterNoImageButton />}
          </AppendTaildingDivider>

          {isOnline ? (
            feed?.ownerUserId === user?.id && isBizId(routerParams.feedId!) ? (
              <ActionButton
                tooltip="Refresh"
                onClick={() => {
                  refreshFeed()
                }}
              >
                <RotatingRefreshIcon isRefreshing={isPending} />
              </ActionButton>
            ) : (
              <ActionButton
                tooltip={
                  hasUpdate
                    ? t("entry_list_header.new_entries_available")
                    : t("entry_list_header.refetch")
                }
                onClick={() => {
                  refetch()
                }}
              >
                <RotatingRefreshIcon
                  className={cn(hasUpdate && "text-accent")}
                  isRefreshing={isRefreshing}
                />
              </ActionButton>
            )
          ) : null}
          <ActionButton
            tooltip={
              !unreadOnly
                ? t("entry_list_header.show_unread_only")
                : t("entry_list_header.show_all")
            }
            shortcut={shortcuts.entries.toggleUnreadOnly.key}
            onClick={() => setGeneralSetting("unreadOnly", !unreadOnly)}
          >
            {unreadOnly ? (
              <i className="i-mgc-round-cute-fi" />
            ) : (
              <i className="i-mgc-round-cute-re" />
            )}
          </ActionButton>
          <MarkAllReadWithOverlay containerRef={containerRef} shortcut />
        </div>
      </div>
      {titleAtBottom && titleInfo}
    </div>
  )
}

const DailyReportButton: FC = () => {
  const present = useAIDailyReportModal()
  const { t } = useTranslation()

  return (
    <ImpressionView event="Daily Report Modal">
      <ActionButton
        onClick={() => {
          present()
          window.posthog?.capture("Daily Report Modal", {
            click: 1,
          })
        }}
        tooltip={t("entry_list_header.daily_report")}
      >
        <i className="i-mgc-magic-2-cute-re" />
      </ActionButton>
    </ImpressionView>
  )
}

const FilterNoImageButton = () => {
  const enabled = useUISettingKey("pictureViewFilterNoImage")
  const { t } = useTranslation()

  return (
    <ActionButton
      active={enabled}
      onClick={() => {
        setUISetting("pictureViewFilterNoImage", !enabled)
      }}
      tooltip={t(
        enabled ? "entry_list_header.show_all_items" : "entry_list_header.hide_no_image_items",
      )}
    >
      <i className={!enabled ? "i-mgc-photo-album-cute-re" : "i-mgc-photo-album-cute-fi"} />
    </ActionButton>
  )
}

const SwitchToMasonryButton = () => {
  const isMasonry = useUISettingKey("pictureViewMasonry")
  const { t } = useTranslation()

  return (
    <ImpressionView
      event="Switch to Masonry"
      properties={{
        masonry: isMasonry ? 1 : 0,
      }}
    >
      <ActionButton
        onClick={() => {
          setUISetting("pictureViewMasonry", !isMasonry)
          window.posthog?.capture("Switch to Masonry", {
            masonry: !isMasonry ? 1 : 0,
            click: 1,
          })
        }}
        tooltip={
          !isMasonry
            ? t("entry_list_header.switch_to_masonry")
            : t("entry_list_header.switch_to_grid")
        }
      >
        <i className={cn(!isMasonry ? "i-mgc-grid-cute-re" : "i-mgc-grid-2-cute-re")} />
      </ActionButton>
    </ImpressionView>
  )
}

const AppendTaildingDivider = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    {React.Children.toArray(children).filter(Boolean).length > 0 && (
      <DividerVertical className="mx-2 w-px" />
    )}
  </>
)