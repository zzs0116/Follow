import { useTranslation } from "react-i18next"

import { useWhoami } from "~/atoms/user"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import type { TargetModel } from "~/models"
import { usePresentUserProfileModal } from "~/modules/profile/hooks"

export const FeedCertification = ({
  feed,
  className,
}: {
  feed: TargetModel
  className?: string
}) => {
  const me = useWhoami()
  const presentUserProfile = usePresentUserProfileModal("drawer")
  const { t } = useTranslation()

  return (
    feed.ownerUserId &&
    (feed.ownerUserId === me?.id ? (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <i className={cn("i-mgc-certificate-cute-fi ml-1.5 shrink-0 text-accent", className)} />
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent className="px-4 py-2">
            <div className="flex items-center text-base font-semibold">
              <i className="i-mgc-certificate-cute-fi mr-2 size-4 shrink-0 text-accent" />
              {t("feed_item.claimed_feed")}
            </div>
            <div>{t("feed_item.claimed_by_you")}</div>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    ) : (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <i
            className={cn(
              "i-mgc-certificate-cute-fi ml-1.5 size-4 shrink-0 text-amber-500",
              className,
            )}
          />
        </TooltipTrigger>

        <TooltipPortal>
          <TooltipContent className="px-4 py-2">
            <div className="flex items-center text-base font-semibold">
              <i className="i-mgc-certificate-cute-fi mr-2 shrink-0 text-amber-500" />
              {t("feed_item.claimed_feed")}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span>{t("feed_item.claimed_by_owner")}</span>
              {feed.owner ? (
                <Avatar
                  className="inline-flex aspect-square size-5 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    presentUserProfile(feed.owner!.id)
                  }}
                >
                  <AvatarImage src={feed.owner.image || undefined} />
                  <AvatarFallback>{feed.owner.name?.slice(0, 2)}</AvatarFallback>
                </Avatar>
              ) : (
                <span>{t("feed_item.claimed_by_unknown")}</span>
              )}
            </div>
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    ))
  )
}
