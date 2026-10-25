"use client";

import { useEffect } from "react";
import type { FeaturedVideo } from "@/lib/video";
import { tiktokVideoId } from "@/lib/video";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
    tiktokEmbed?: { lib?: { render?: () => void } };
  }
}

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) return document.getElementById(id) as HTMLScriptElement;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.body.appendChild(script);
  return script;
}

export function SocialEmbed({ video }: { video: FeaturedVideo }) {
  useEffect(() => {
    if (video.platform === "instagram") {
      const script = loadScript("https://www.instagram.com/embed.js", "ig-embed-js");
      const run = () => window.instgrm?.Embeds.process();
      if (window.instgrm) run();
      else script.addEventListener("load", run);
      return () => script.removeEventListener("load", run);
    }
    const script = loadScript("https://www.tiktok.com/embed.js", "tt-embed-js");
    script.setAttribute("data-reload", Date.now().toString());
    return undefined;
  }, [video.platform, video.url]);

  const watchLabel = video.platform === "instagram" ? "到 Instagram 查看完整內容" : "到 抖音 查看完整內容";

  return (
    <figure className="reel-card">
      {video.platform === "instagram" ? (
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={video.url}
          data-instgrm-version="14"
        >
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            {watchLabel}
          </a>
        </blockquote>
      ) : (
        <blockquote className="tiktok-embed" cite={video.url} data-video-id={tiktokVideoId(video.url)}>
          <section>
            <a href={video.url} target="_blank" rel="noopener noreferrer">
              {watchLabel}
            </a>
          </section>
        </blockquote>
      )}
      {video.caption ? <figcaption className="reel-caption">{video.caption}</figcaption> : null}
      <a className="reel-more" href={video.url} target="_blank" rel="noopener noreferrer">
        {watchLabel} ↗
      </a>
    </figure>
  );
}
