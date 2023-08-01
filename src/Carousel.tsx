import { useState } from "react";
import ButtonGroup from "@mui/material/ButtonGroup";
import { Button } from "@mui/material";

export type OrientationType = "vertical" | "horizontal";

interface CarouselProps {
  images: string[];
  renderItem: any;
  viewportClass?: string;
  viewPortStyle: any;
  itemHeight: number;
  itemWidth: number;
  orientation: OrientationType;
}

const getStyleForContainer = (
  i: number,
  height: number,
  count: number,
  width: number,
  orientation: OrientationType
) => {
  if (orientation === "vertical") {
    const ret: React.CSSProperties = {
      height: count * height,
      transition: "transform .5s",
      transform: `translate(0px, ${-1 * i * height}px)`,
      position: "relative",
    };

    return ret;
  }
  const ret: React.CSSProperties = {
    width: count * width,
    height: height,
    transition: "transform .5s",
    transform: `translate(${-1 * i * width}px, 0px)`,
    position: "relative",
    display: "flex",
  };

  return ret;
};

interface SlidingPanelProps {
  index: number;
  items: string[];
  renderItem: any;
  itemHeight: number;
  itemWidth: number;
  orientation: OrientationType;
}
const SlidingPanel: React.FC<SlidingPanelProps> = ({
  index,
  items,
  renderItem,
  itemHeight,
  itemWidth,
  orientation,
}) => {
  const itemsToPick = index === 0 ? [0, 1] : [index - 1, index, index + 1];

  const Items = items.map((_, idx: number) => {
    if (itemsToPick.includes(idx)) {
      return renderItem(idx, true);
    }

    return renderItem(idx, false);
  });

  return (
    <div
      style={getStyleForContainer(
        index,
        itemHeight,
        items.length,
        itemWidth,
        orientation
      )}
    >
      {Items}
    </div>
  );
};

const Carousel: React.FC<CarouselProps> = ({
  images,
  renderItem,
  viewportClass = "",
  viewPortStyle = {},
  itemHeight,
  itemWidth,
  orientation,
}) => {
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
      <div className={viewportClass} style={viewPortStyle}>
        <SlidingPanel
          index={index}
          items={images}
          itemHeight={itemHeight}
          itemWidth={itemWidth}
          renderItem={renderItem}
          orientation={orientation}
        />
      </div>
    </>
  );
};

export default Carousel;
