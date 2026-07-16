import { buildInviteText, buildTwitterIntentUrl } from '../content/gameCopy';
import { sideLabel } from './format';

function inviteContext(turn) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const turnSide = sideLabel(turn);
  return { turnSide, url };
}

export function getInvitePayload(turn) {
  const { turnSide, url } = inviteContext(turn);
  return {
    turnSide,
    url,
    text: buildInviteText({ turnSide, url }),
    twitterUrl: buildTwitterIntentUrl({ turnSide, url }),
  };
}

export async function copyInvite(turn) {
  const payload = getInvitePayload(turn);

  try {
    await navigator.clipboard.writeText(payload.text);
    return { ok: true, ...payload };
  } catch {
    return { ok: false, ...payload };
  }
}
