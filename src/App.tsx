import "./App.css";
import Carousel, { OrientationType } from "./Carousel";

const CAROUSEL_ITEM_HEIGHT = 200;
const CAROUSEL_ITEM_WIDTH = 200;

const viewPortVerticalStyle: React.CSSProperties = {
  top: 0,
  left: "right/2",
  position: "absolute",
  height: CAROUSEL_ITEM_HEIGHT,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const viewPortHorizontalStyle: React.CSSProperties = {
  top: 0,
  left: "right/2",
  position: "absolute",
  height: CAROUSEL_ITEM_HEIGHT,
  width: CAROUSEL_ITEM_WIDTH,
  overflow: "hidden",
  display: "flex",
  flexDirection: "row",
  justifyContent: "start",
};

const carouselItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  height: CAROUSEL_ITEM_HEIGHT,
  width: 200,
  alignContent: "center",
  alignItems: "center",
  fontSize: 100,
};

const carouselItemHStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  height: CAROUSEL_ITEM_HEIGHT,
  width: 200,
  alignContent: "center",
  alignItems: "center",
  fontSize: 100,
};

const App = () => {
  const items = ["A", "B", "C", "D", "E", "F", "G"];

  // caller will call even for items that should not be rendered.
  // in that case we just draw a div to make up the height and we uppercase
  // the text to show that this item is not loaded yet.
  const renderItem = (index: number, showImage: boolean) => {
    if (showImage) {
      return (
        <div key={`${items[index]}`} style={carouselItemStyle}>
          {items[index].toLowerCase() + "*"}{" "}
        </div>
      );
    }
    return (
      <div key={`${items[index]}`} style={carouselItemStyle}>
        {items[index]}{" "}
      </div>
    );
  };

  const orientation: OrientationType = "vertical";
  const viewPortStyle =
    // @ts-ignore
    orientation == "vertical" ? viewPortVerticalStyle : viewPortHorizontalStyle;
  return (
    <Carousel
      renderItem={renderItem}
      itemHeight={CAROUSEL_ITEM_HEIGHT}
      images={items}
      viewportClass="viewp"
      viewPortStyle={viewPortStyle}
      orientation={orientation}
      itemWidth={CAROUSEL_ITEM_WIDTH}
    />
  );
};
export default App;
