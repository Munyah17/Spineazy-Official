const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://spineasy.co.zw";

function layout(title: string, bodyHtml: string, ctaLabel?: string, ctaHref?: string) {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#0d0714;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d0714;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#18101f;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:20px;font-weight:800;color:#f2edf7;">SPIN<span style="color:#a855f7;">EAZY</span></span>
        </td></tr>
        <tr><td style="padding:28px;color:#f2edf7;">
          <h1 style="margin:0 0 12px;font-size:18px;color:#f2edf7;">${title}</h1>
          <div style="font-size:14px;line-height:1.6;color:#c9bcd6;">${bodyHtml}</div>
          ${
            ctaLabel && ctaHref
              ? `<a href="${ctaHref}" style="display:inline-block;margin-top:20px;background:#a855f7;color:#1a0a24;font-weight:700;font-size:14px;text-decoration:none;padding:12px 24px;border-radius:8px;">${ctaLabel}</a>`
              : ""
          }
        </td></tr>
        <tr><td style="padding:20px 28px;border-top:1px solid rgba(255,255,255,0.08);font-size:11px;color:#8a7a97;">
          You must be 18+ to play. Please play responsibly.<br />
          © ${new Date().getFullYear()} Spineazy. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function welcomeEmail(fullName: string) {
  return layout(
    `Welcome to Spineazy, ${fullName.split(" ")[0]}!`,
    `Your account is ready. Deposit, browse the game lobby, and spin whenever you're ready.`,
    "Go to Spineazy",
    APP_URL
  );
}

export function depositCompletedEmail(amount: string, method: string) {
  return layout(
    "Deposit received",
    `Your deposit of <strong style="color:#a855f7;">${amount}</strong> via ${method} has landed in your wallet and is ready to play with.`,
    "View Wallet",
    `${APP_URL}/wallet`
  );
}

export function withdrawalRequestedEmail(amount: string, method: string) {
  return layout(
    "Withdrawal requested",
    `We've received your withdrawal request for <strong style="color:#a855f7;">${amount}</strong> via ${method}. It's held pending review and typically processed within 1-2 hours.`,
    "View Wallet",
    `${APP_URL}/wallet`
  );
}

export function withdrawalDecisionEmail(amount: string, approved: boolean, reason?: string) {
  if (approved) {
    return layout(
      "Withdrawal approved",
      `Your withdrawal of <strong style="color:#a855f7;">${amount}</strong> has been approved and sent.`,
      "View Wallet",
      `${APP_URL}/wallet`
    );
  }
  return layout(
    "Withdrawal rejected",
    `Your withdrawal request for <strong>${amount}</strong> was not approved${reason ? `: <em>${reason}</em>` : "."} The funds have been returned to your wallet balance.`,
    "View Wallet",
    `${APP_URL}/wallet`
  );
}

export function gameWonEmail(payout: string, gameName: string) {
  return layout(
    "You won! 🎉",
    `Congratulations -- your round on ${gameName} paid out. <strong style="color:#a855f7;">${payout}</strong> has been credited to your wallet.`,
    "View My Bets",
    `${APP_URL}/my-bets`
  );
}
