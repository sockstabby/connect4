import "./App.css";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useFetch } from "./useFetch";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

import MailIcon from "@mui/icons-material/Mail";

import {
  Alert,
  Badge,
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  Rating,
} from "@mui/material";

const App: React.FC<{}> = ({}) => {
  const [url, setUrl] = useState("http://localhost:3000/users");

  const ref = useRef<HTMLInputElement | null>(null);

  const { isLoading, serverError, apiData } = useFetch(url);

  const myFunction = () => {
    if (url === "http://localhost:3000/users") {
      setUrl("http://localhost:3000/users2");
    } else {
      setUrl("http://localhost:3000/users");
    }
  };

  const getLabelText = "asfasdf";

  const value = 8;

  const labels = ["asdf", "asdfasd", "asdfasdf"];
  return (
    <>
      Some Text here
      <Button variant="contained" onClick={myFunction}>
        Fetch
      </Button>
      <ButtonGroup
        variant="contained"
        aria-label="outlined primary button group"
      >
        <Button>One</Button>
        <Button>Two</Button>
        <Button>Three</Button>
      </ButtonGroup>
      <FormGroup>
        <FormControlLabel control={<Checkbox defaultChecked />} label="Label" />
        <FormControlLabel required control={<Checkbox />} label="Required" />
        <FormControlLabel disabled control={<Checkbox />} label="Disabled" />
      </FormGroup>
      <RadioGroup
        aria-labelledby="demo-radio-buttons-group-label"
        defaultValue="female"
        name="radio-buttons-group"
      >
        <FormControlLabel value="female" control={<Radio />} label="Female" />
        <FormControlLabel value="male" control={<Radio />} label="Male" />
        <FormControlLabel value="other" control={<Radio />} label="Other" />
      </RadioGroup>
      <Badge badgeContent={4} color="primary">
        <MailIcon color="action" />
      </Badge>
      <Alert severity="error">This is an error alert — check it out!</Alert>
    </>
  );
};
export default App;
