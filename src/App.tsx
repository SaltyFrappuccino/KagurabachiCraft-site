import { useEffect, useState } from "react";
import "./App.css";
import type {
  ApiErrorResponse,
  ModAsset,
  ReleaseEntry,
  ReleasesApiResponse,
} from "./shared/releases";

const DEFAULT_FALLBACK_URL = "https://github.com/SaltyFrappuccino/KagurabachiCraft/releases";
const INSTALL_TARGET = "NeoForge 1.21.1";

type RequestState = "idle" | "loading" | "ready" | "error";

const formatDate = (isoDate: string): string =>
  new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium" }).format(new Date(isoDate));

const formatSize = (size: number): string =>
  `${(size / 1024 / 1024).toFixed(size > 20 * 1024 * 1024 ? 0 : 1)} MB`;

const getPrimaryAsset = (release: ReleaseEntry | null): ModAsset | null => {
  if (!release) {
    return null;
  }

  return release.assets[0] ?? null;
};

const getReleaseNotes = (release: ReleaseEntry | null): string => {
  if (!release?.notes.trim()) {
    return "Для этой версии на GitHub нет отдельного описания. Ниже доступен сам файл релиза.";
  }

  return release.notes.trim();
};

function App() {
  const [releases, setReleases] = useState<ReleaseEntry[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState(DEFAULT_FALLBACK_URL);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<string | null>(null);

  const latestRelease = releases[0] ?? null;
  const selectedRelease =
    releases.find((release) => release.tag === selectedTag) ?? latestRelease ?? null;
  const latestAsset = getPrimaryAsset(latestRelease);
  const selectedAsset = getPrimaryAsset(selectedRelease);

  useEffect(() => {
    const root = document.documentElement;
    const handlePointerMove = (event: PointerEvent): void => {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      root.style.setProperty("--pointer-x", `${x}%`);
      root.style.setProperty("--pointer-y", `${y}%`);
    };

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();

    const loadReleases = async (): Promise<void> => {
      setRequestState("loading");
      setRequestError(null);
      setRequestDetails(null);

      try {
        const response = await fetch("/api/releases", {
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorPayload = (await response.json()) as ApiErrorResponse;
          setSourceUrl(errorPayload.fallbackUrl || DEFAULT_FALLBACK_URL);
          setRequestDetails(errorPayload.details ?? null);
          throw new Error(errorPayload.error);
        }

        const payload = (await response.json()) as ReleasesApiResponse;
        if (!isActive) {
          return;
        }

        setSourceUrl(payload.source.releasesUrl);
        setReleases(payload.releases);
        setSelectedTag((currentTag) => {
          if (currentTag && payload.releases.some((release) => release.tag === currentTag)) {
            return currentTag;
          }

          return payload.releases[0]?.tag ?? null;
        });
        setRequestState("ready");
      } catch (error) {
        if (!isActive || (error instanceof Error && error.name === "AbortError")) {
          return;
        }

        setRequestState("error");
        setRequestError(error instanceof Error ? error.message : "Не удалось загрузить релизы.");
        setRequestDetails((current) => current ?? null);
        setReleases([]);
        setSelectedTag(null);
      }
    };

    void loadReleases();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <div className="page-shell">
      <div className="background-noise" aria-hidden="true" />

      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Загрузки для {INSTALL_TARGET}</p>
          <h1 className="hero-title">
            <span>Kagurabachi</span>
            <span>Craft</span>
          </h1>
          <p className="hero-text">
            Здесь можно скачать последнюю или одну из прошлых версий мода. Список версий
            подтягивается из GitHub Releases.
          </p>

          <div className="hero-pills">
            <span>Актуальные релизы</span>
            <span>История версий</span>
            <span>{INSTALL_TARGET}</span>
          </div>

          <div className="hero-actions">
            <a className="button primary" href="/api/download/latest">
              Скачать последнюю версию
            </a>
            <a className="button ghost" href={sourceUrl} target="_blank" rel="noreferrer">
              GitHub Releases
            </a>
          </div>

          {latestRelease && latestAsset && (
            <div className="latest-strip">
              <span className="latest-label">Последний релиз</span>
              <strong>{latestRelease.title}</strong>
              <span>{latestRelease.tag}</span>
              <span>{formatDate(latestRelease.publishedAt)}</span>
              <span>{formatSize(latestAsset.size)}</span>
            </div>
          )}
        </div>

        <aside className="spotlight-card">
          <p className="spotlight-kicker">Коротко</p>
          <h2>Выбери версию и скачай нужный релиз.</h2>
          <p>
            Без лишних переключателей и лишних экранов. Открываешь сайт, видишь версии, выбираешь
            подходящую и скачиваешь `.jar`.
          </p>
          <div className="spotlight-points">
            <div className="spotlight-point">
              <strong>Источник</strong>
              <span>GitHub Releases</span>
            </div>
            <div className="spotlight-point">
              <strong>Поддержка</strong>
              <span>{INSTALL_TARGET}</span>
            </div>
            <div className="spotlight-point">
              <strong>Формат</strong>
              <span>`.jar` файл</span>
            </div>
          </div>
        </aside>
      </header>

      <main className="layout">
        <section className="panel version-panel" aria-live="polite">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Releases</p>
              <h2>Версии</h2>
            </div>
            <p className="section-copy">Нажми на релиз, чтобы открыть детали справа.</p>
          </div>

          {requestState === "loading" && (
            <div className="status-card">Загружаем список релизов...</div>
          )}

          {requestState === "error" && (
            <div className="status-card error">
              <p>{requestError ?? "Не удалось получить список версий."}</p>
              {requestDetails && <p className="status-details">{requestDetails}</p>}
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                Открыть страницу релизов
              </a>
            </div>
          )}

          {requestState === "ready" && releases.length === 0 && (
            <div className="status-card">
              <p>Подходящих релизов пока нет.</p>
              <a href={sourceUrl} target="_blank" rel="noreferrer">
                Проверить GitHub вручную
              </a>
            </div>
          )}

          {requestState === "ready" && releases.length > 0 && (
            <div className="release-list">
              {releases.map((release) => {
                const asset = getPrimaryAsset(release);
                if (!asset) {
                  return null;
                }

                const isActive = selectedRelease?.tag === release.tag;

                return (
                  <button
                    key={release.tag}
                    className={`release-tile${isActive ? " is-active" : ""}`}
                    type="button"
                    onClick={() => setSelectedTag(release.tag)}
                  >
                    <div className="release-topline">
                      <strong>{release.title}</strong>
                      {release.prerelease && <span className="badge">Preview</span>}
                    </div>
                    <p className="release-tag">{release.tag}</p>
                    <div className="release-meta">
                      <span>{formatDate(release.publishedAt)}</span>
                      <span>{formatSize(asset.size)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel detail-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Release detail</p>
              <h2>{selectedRelease?.title ?? "Детали релиза"}</h2>
            </div>
            {selectedRelease && (
              <a href={selectedRelease.htmlUrl} target="_blank" rel="noreferrer">
                Открыть на GitHub
              </a>
            )}
          </div>

          {selectedRelease && selectedAsset ? (
            <>
              <div className="detail-summary">
                <div className="summary-chip">
                  <span>Тег</span>
                  <strong>{selectedRelease.tag}</strong>
                </div>
                <div className="summary-chip">
                  <span>Версия игры</span>
                  <strong>{INSTALL_TARGET}</strong>
                </div>
                <div className="summary-chip">
                  <span>Размер</span>
                  <strong>{formatSize(selectedAsset.size)}</strong>
                </div>
                <div className="summary-chip">
                  <span>Дата</span>
                  <strong>{formatDate(selectedRelease.publishedAt)}</strong>
                </div>
              </div>

              <div className="download-bar">
                <div>
                  <p className="download-label">Файл релиза</p>
                  <p className="download-file">{selectedAsset.name}</p>
                </div>
                <a
                  className="button secondary"
                  href={`/api/download/${encodeURIComponent(selectedRelease.tag)}`}
                >
                  Скачать релиз
                </a>
              </div>

              <div className="notes-card">
                <p className="section-kicker">Описание</p>
                <p className="release-notes">{getReleaseNotes(selectedRelease)}</p>
              </div>
            </>
          ) : (
            <div className="status-card">Выбери релиз слева, чтобы увидеть описание и кнопку скачивания.</div>
          )}
        </section>

        <section className="panel info-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Install</p>
              <h2>Установка</h2>
            </div>
          </div>

          <ol className="steps">
            <li>Скачай нужную версию `.jar`.</li>
            <li>Запусти Minecraft на `NeoForge 1.21.1`.</li>
            <li>Перемести файл в папку `.minecraft/mods`.</li>
            <li>Проверь, что мод появился в игре.</li>
          </ol>
        </section>

        <section className="panel info-panel">
          <div className="panel-head">
            <div>
              <p className="section-kicker">Links</p>
              <h2>Ссылки</h2>
            </div>
          </div>

          <p className="section-copy">
            Все версии берутся из GitHub Releases. Если нужен исходный код или страница релизов,
            переходи по ссылкам ниже.
          </p>
          <div className="link-stack">
            <a href={sourceUrl} target="_blank" rel="noreferrer">
              GitHub Releases
            </a>
            <a href="https://github.com/SaltyFrappuccino" target="_blank" rel="noreferrer">
              GitHub автора
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
