import { createTheme } from "@mui/material/styles";

export const tokens = {
  surface: "#FFFFFF",
  primary: "#15324B",
  accent: "#E69F00",
  text: "#1C2732",
  secondaryText: "#52616D",
  background: "#F7F8F5",
  border: "#D9DEE2",
  fieldBorder: "#7B8792",
  infoBackground: "#EEF3F7",
  success: "#1E6B3A",
};

const theme = createTheme({
  palette: {
    primary: { main: tokens.primary },
    secondary: { main: tokens.accent },
    success: { main: tokens.success },
    background: {
      default: tokens.background,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.text,
      secondary: tokens.secondaryText,
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: '"DM Sans", sans-serif',
    button: { textTransform: "none", fontWeight: 600 },
    h1: { fontFamily: '"Space Grotesk", sans-serif' },
    h2: { fontFamily: '"Space Grotesk", sans-serif' },
  },
});

export default theme;
