import { ThemeProviderContext } from "@/providers/theme.context";
import { useContext } from "react";

export const useTheme = () => useContext(ThemeProviderContext);
