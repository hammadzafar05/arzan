import { useEffect } from "react";
import { appConfig } from "../../shared/config";

export function useTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${appConfig.name}` : appConfig.name;
  }, [title]);
}
