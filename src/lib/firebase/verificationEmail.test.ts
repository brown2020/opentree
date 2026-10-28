import { describe, expect, it, vi } from 'vitest';
import type { User } from 'firebase/auth';
import { deliverVerificationEmail } from './verificationEmail';

const user = { uid: 'user-1' } as User;
const preview = 'https://opentree-preview.vercel.app/verify-email';

describe('deliverVerificationEmail', () => {
  it('retries without a continue URL when the preview host is rejected', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce({ code: 'auth/unauthorized-continue-uri' })
      .mockResolvedValueOnce(undefined);

    await deliverVerificationEmail(user, preview, send);

    expect(send).toHaveBeenNthCalledWith(1, user, {
      url: preview,
      handleCodeInApp: false,
    });
    expect(send).toHaveBeenNthCalledWith(2, user);
  });

  it('sends once when the continue URL is accepted', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await deliverVerificationEmail(user, preview, send);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(user, { url: preview, handleCodeInApp: false });
  });

  it('surfaces a non-continue-url failure', async () => {
    const send = vi.fn().mockRejectedValue(new Error('Mailbox unavailable'));

    await expect(deliverVerificationEmail(user, preview, send)).rejects.toThrow(
      'Mailbox unavailable'
    );
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('sends without settings when there is no continue URL', async () => {
    const send = vi.fn().mockResolvedValue(undefined);

    await deliverVerificationEmail(user, null, send);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(user);
  });
});
