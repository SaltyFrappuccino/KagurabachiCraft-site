import { HttpError } from "./errors.js";
import { isModLoader, type ModLoader, type ReleaseFilters } from "../shared/releases.js";

const MC_VERSION_REGEX = /^\d+\.\d+(?:\.\d+)?$/;

export const parseReleaseFilters = (
  searchParams: URLSearchParams,
  requireLoaderAndMc: boolean,
): ReleaseFilters => {
  const loaderValue = searchParams.get("loader");
  const mcValue = searchParams.get("mc");

  let loader: ModLoader | undefined;
  if (loaderValue) {
    if (!isModLoader(loaderValue)) {
      throw new HttpError(400, "Невалидный loader", "Разрешены: fabric, forge, neoforge.");
    }
    loader = loaderValue;
  }

  let mc: string | undefined;
  if (mcValue) {
    if (!MC_VERSION_REGEX.test(mcValue)) {
      throw new HttpError(400, "Невалидная версия Minecraft", "Ожидается формат x.y.z.");
    }
    mc = mcValue;
  }

  if (requireLoaderAndMc && (!loader || !mc)) {
    throw new HttpError(400, "Параметры обязательны", "Передайте и loader, и mc.");
  }

  return { loader, mc };
};
