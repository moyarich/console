/** Localizable chrome strings; message payloads are never translated. */
export interface ConsoleMessages {
  title: string;
  actions: string;
  copyObject: string;
  copyOutput: string;
  clear: string;
  consoleSubtitle: string;
  terminalSubtitle: string;
  emptyConsole: string;
  emptyTerminal: string;
}

export type ConsoleTranslations = Partial<ConsoleMessages>;
export const englishConsoleMessages: Readonly<ConsoleMessages> = Object.freeze({
  title: "Console",
  actions: "Console actions",
  copyObject: "Copy object",
  copyOutput: "Copy console output",
  clear: "Clear console",
  consoleSubtitle: "Runtime output from console.*()",
  terminalSubtitle: "ANSI-aware process output",
  emptyConsole: "No console output yet.",
  emptyTerminal: "No process output yet.",
});

export const consoleLocales: Readonly<Record<string, ConsoleTranslations>> = {
  en: englishConsoleMessages,
  es: {
    title: "Consola", actions: "Acciones de la consola",
    copyObject: "Copiar objeto", copyOutput: "Copiar salida de la consola",
    clear: "Limpiar consola", consoleSubtitle: "Salida de ejecución de console.*()",
    terminalSubtitle: "Salida de proceso compatible con ANSI",
    emptyConsole: "Aún no hay salida de la consola.",
    emptyTerminal: "Aún no hay salida del proceso.",
  },
  fr: {
    title: "Console", actions: "Actions de la console",
    copyObject: "Copier l'objet", copyOutput: "Copier la sortie de la console",
    clear: "Effacer la console", consoleSubtitle: "Sortie d'exécution de console.*()",
    terminalSubtitle: "Sortie de processus compatible ANSI",
    emptyConsole: "Aucune sortie de console pour le moment.",
    emptyTerminal: "Aucune sortie de processus pour le moment.",
  },
};

/** Prefer a full BCP 47 language tag, then its primary language, then English. */
export function resolveConsoleMessages(
  locale = "en",
  overrides?: ConsoleTranslations,
): ConsoleMessages {
  const normalized = locale.replace(/_/g, "-").toLowerCase();
  return {
    ...englishConsoleMessages,
    ...(consoleLocales[normalized] ?? consoleLocales[normalized.split("-")[0]!] ?? {}),
    ...overrides,
  };
}
