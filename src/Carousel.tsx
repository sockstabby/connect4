import { useRef, useState } from "react";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Button } from "@mui/material";

const IMAGE_SIZE = 200;

interface CarouselProps {
  images: string[];
}

const getStyleForContainer = (i: number, imageSize: number, count: number) => {
  const ret = {
    height: count * imageSize,
    transition: "transform .5s",
    transform: `translate(0px, ${-1 * i * imageSize}px)`,
    position: "relative",
    width: 350,
  };

  return ret;
};

interface SlidingPanelProps {
  index: number;
  items: string[];
}
const SlidingPanel: React.FC<SlidingPanelProps> = ({ index, items }) => {
  const itemsToPick = index === 0 ? [0, 1] : [index - 1, index, index + 1];

  console.log(itemsToPick);

  const Items = items.map((i: string, idx: number) => {
    if (itemsToPick.includes(idx)) {
      // this is where you would want to show an image instead
      // For purposes of this example anything with a asterick could
      // be an image.
      return <div className="carousel-item">{i.toLowerCase() + "*"} </div>;
    }
    return <div className="carousel-item">{i} </div>;
  });

  return (
    <div style={getStyleForContainer(index, IMAGE_SIZE, items.length)}>
      {Items}
    </div>
  );
};

const Carousel: React.FC<CarouselProps> = ({ images }) => {
  const [index, setIndex] = useState<number>(0);

  const goBack = () =>
    setIndex((prev) => (prev + 1 < images.length ? prev + 1 : prev));
  const goForward = () => setIndex((prev) => (prev - 1 >= 0 ? prev - 1 : prev));

  return (
    <>
      <div className="controls">
        <ButtonGroup
          variant="contained"
          aria-label="outlined primary button group"
        >
          <Button onClick={goBack}>Next</Button>
          <Button onClick={goForward}>Previous</Button>
        </ButtonGroup>
      </div>
      <div className="viewport">
        <SlidingPanel index={index} items={images} />
      </div>
    </>
  );
};

export default Carousel;
