import { useEffect, useRef, useState } from "react";
import { Alert, Spin } from "antd";
import { useNavigate } from "react-router-dom";
import { axiosInstance } from "../../../../lib/axios";
import { endpoints } from "../../../../configs/endpoints.config";
import { paths } from "../../../../routes/paths.config";

/**
 * Sign-in.
 *
 * The browser talks to Google directly and comes back holding an ID token;
 * this page does nothing with that token but hand it to our API, which is the
 * only party that verifies it. Nothing here decides who may log in — a token
 * for an address that is not in `users` is refused by the server, and the
 * message it sends back is what gets shown.
 */

const GSI_SRC = "https://accounts.google.com/gsi/client";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** The slice of the Google Identity Services API this page uses. */
interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: string;
      size?: string;
      shape?: string;
      text?: string;
      locale?: string;
      width?: number;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/** Loads the Google script once, however many times this page is mounted. */
function loadGoogleScript(): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${GSI_SRC}"]`,
  );

  if (existing) {
    return existing.dataset.loaded === "true"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", () =>
            reject(new Error("google script failed to load")),
          );
        });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("google script failed to load"));
    document.head.appendChild(script);
  });
}

const LoginPage = () => {
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>();
  const [isReady, setIsReady] = useState(false);

  const handleCredential = async (response: GoogleCredentialResponse) => {
    setError(undefined);

    if (!response.credential) {
      setError("ไม่ได้รับข้อมูลการเข้าสู่ระบบจาก Google กรุณาลองใหม่อีกครั้ง");
      return;
    }

    try {
      await axiosInstance.post(endpoints.auth.google, {
        credential: response.credential,
      });

      // The session cookie is set; which home page to land on depends on the
      // roles, and the route at paths.root already reads them.
      navigate(paths.root, { replace: true });
    } catch (err: any) {
      // The API's own wording, because it is the API that knows why — an
      // unregistered address needs an administrator, a rejected token needs a
      // retry, and those are not the same instruction.
      setError(
        err?.response?.data?.message ??
          "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      );
    }
  };

  useEffect(() => {
    if (!CLIENT_ID) {
      // A build without a client id cannot show a button at all. Say so rather
      // than render an empty box someone spends an afternoon on.
      setError("ระบบยังไม่ได้ตั้งค่าการเข้าสู่ระบบด้วย Google กรุณาติดต่อผู้ดูแลระบบ");
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          locale: "th",
          width: 320,
        });

        setIsReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError("ไม่สามารถเชื่อมต่อกับ Google ได้ กรุณาลองใหม่อีกครั้ง");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5] p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-[420px] w-full text-center">
        <h1 className="text-2xl font-bold mb-2">DEEP Portfolio</h1>
        <p className="text-gray-600 mb-8">
          เข้าสู่ระบบด้วยบัญชี Google ของมหาวิทยาลัย
        </p>

        {error && (
          <Alert
            type="error"
            message={error}
            showIcon
            className="mb-6 text-left"
          />
        )}

        <div className="flex justify-center min-h-[44px]">
          <div ref={buttonRef} />
          {!isReady && !error && <Spin />}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
