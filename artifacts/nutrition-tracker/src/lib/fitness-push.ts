type OneSignalClient = {
  init: (options: Record<string, unknown>) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  Notifications: { permission: boolean; requestPermission: () => Promise<void> };
  User: {
    PushSubscription: { id?: string; optedIn: boolean; optIn: () => Promise<void>; optOut: () => Promise<void> };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: ((client: OneSignalClient) => void)[];
  }
}

export function getPushSupport(): { supported: boolean; needsInstall: boolean; reason: string | null } {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (ios && !standalone) return {
    supported: false, needsInstall: true,
    reason: "Auf dem iPhone: In Safari öffnen → Teilen → Zum Home-Bildschirm. Danach die installierte App öffnen und Benachrichtigungen erlauben (iOS 16.4 oder neuer).",
  };
  if (window.self !== window.top) return {
    supported: false, needsInstall: false,
    reason: "Öffne die veröffentlichte App direkt im Browser. In der eingebetteten Vorschau sind Push-Benachrichtigungen nicht verfügbar.",
  };
  if (!window.isSecureContext || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { supported: false, needsInstall: false, reason: "Dieser Browser unterstützt keine Web-Push-Benachrichtigungen. Verwende einen aktuellen Browser mit HTTPS." };
  }
  return { supported: true, needsInstall: false, reason: null };
}

let clientPromise: Promise<OneSignalClient> | undefined;
function loadClient(appId: string) {
  if (clientPromise) return clientPromise;
  clientPromise = new Promise<OneSignalClient>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("OneSignal konnte nicht geladen werden. Bitte Internetverbindung und OneSignal-Web-Push-Einrichtung prüfen.")), 20_000);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async client => {
      try {
        await client.init({
          appId,
          serviceWorkerPath: `${import.meta.env.BASE_URL}OneSignalSDKWorker.js`,
          serviceWorkerParam: { scope: import.meta.env.BASE_URL },
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
          autoResubscribe: false,
          promptOptions: { slidedown: { prompts: [] } },
        });
        window.clearTimeout(timer);
        resolve(client);
      } catch {
        window.clearTimeout(timer);
        reject(new Error("OneSignal-Web-Push ist für diese Adresse noch nicht eingerichtet. Bitte in OneSignal die veröffentlichte App-Adresse unter Settings → Push & In-App → Web eintragen."));
      }
    });
    if (!document.querySelector("script[data-fitness-onesignal]")) {
      const script = document.createElement("script");
      script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
      script.defer = true;
      script.dataset.fitnessOnesignal = "true";
      script.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error("OneSignal konnte nicht geladen werden. Prüfe deine Internetverbindung."));
      };
      document.head.appendChild(script);
    }
  });
  return clientPromise;
}

export async function enableFitnessPush(config: { appId: string; externalId: string }): Promise<string> {
  const support = getPushSupport();
  if (!support.supported) throw new Error(support.reason ?? "Push ist nicht verfügbar.");
  // Ask from the explicit button gesture, before loading any remote scripts.
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Benachrichtigungen sind nicht erlaubt. Aktiviere sie in den Browser- bzw. iPhone-Einstellungen und versuche es erneut.");
  }
  const client = await loadClient(config.appId);
  await client.login(config.externalId);
  await client.User.PushSubscription.optIn();
  for (let attempt = 0; attempt < 30; attempt++) {
    const id = client.User.PushSubscription.id;
    if (id && client.User.PushSubscription.optedIn) return id;
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error("Das Gerät konnte noch nicht für Push angemeldet werden. Bitte gleich erneut versuchen.");
}

export async function disableFitnessPush(): Promise<void> {
  if (clientPromise) {
    const client = await clientPromise;
    await client.User.PushSubscription.optOut();
  }
}
