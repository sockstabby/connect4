import MuiButton from "@mui/material/Button";

import { styled } from "@mui/material/styles";

const Button = styled(MuiButton)(() => ({
  borderRadius: 50,
  backgroundColor: "#5c2dd5",
  paddingInline: "2rem",
  color: "white",
  "&:disabled": {
    color: "gray",
  },
  "&:hover": {
    backgroundColor: "#fd6687",
    color: "black",
  },
  typography: {
    fontFamily: ['"Space Grotesk"'].join(","),
  },
}));

export default Button;
