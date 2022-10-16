import { style, globalStyle } from "@vanilla-extract/css";
import { vars } from "../../styles/theme/index.css";

export const AppLayout = style({
  position: "relative",

  width: "100vw",
  height: "100vh",
  pointerEvents: "auto",
  display: "grid",
  backgroundColor: vars.backgroundMain,
  gridTemplateColumns: "400px 1fr",
  gridTemplateRows: "70px 1fr 115px",
  gridTemplateAreas: `
    "header header header"
    "create display display"
    "create display display"
  `,


  // "@media": {
  //   "screen and (max-width: 800px)": {
  //     gridTemplateColumns: "1fr",
  //     gridTemplateRows: "100px 300px 1fr",
  //     gridTemplateAreas: `
  //       "header"
  //       "create"
  //       "display"
  //     `,
  //   },
  // },
});

export const HeaderLayout = style({
  gridArea: "header",
});

export const CreateLayout = style({
  gridArea: "create",
  position: "relative",
  display: "flex",
  flexDirection: "column",
});

export const DisplayLayout = style({
  gridArea: "display",
  overflow: "auto",
});

export const FooterLayout = style({
  gridArea: "footer",
  display: "flex",
  justifyContent: "center",
});
