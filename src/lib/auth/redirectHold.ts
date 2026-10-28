type Listener = () => void;

let depth = 0;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function isAuthRedirectHeld(): boolean {
  return depth > 0;
}

export function subscribeAuthRedirectHold(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Keep GuestGuard from navigating while sign-up is still sending email. */
export function holdAuthRedirect(): () => void {
  depth += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    depth = Math.max(0, depth - 1);
    notify();
  };
}
