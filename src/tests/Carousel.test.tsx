import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Carousel from "../Carousel";

const CAROUSEL_ITEM_HEIGHT = 200;
const CAROUSEL_ITEM_WIDTH = 200;

const viewPortStyle: React.CSSProperties = {
  top: 0,
  left: "right/2",
  position: "absolute",
  height: CAROUSEL_ITEM_HEIGHT,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
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

describe("Carousel", () => {
  it("renders a carousel", () => {
    const items = ["A", "B", "C", "D", "E", "F", "G"];

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

    render(
      <Carousel
        images={items}
        renderItem={renderItem}
        itemHeight={CAROUSEL_ITEM_HEIGHT}
        viewPortStyle={viewPortStyle}
        orientation="vertical"
        itemWidth={CAROUSEL_ITEM_WIDTH}
      />
    );

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("a*")).toBeInTheDocument();
    expect(screen.getByText("b*")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("A")).toBeNull();
    expect(screen.queryByText("B")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("a*")).toBeInTheDocument();
    expect(screen.getByText("b*")).toBeInTheDocument();
    expect(screen.getByText("c*")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("A")).toBeNull();
    expect(screen.queryByText("B")).toBeNull();
    expect(screen.queryByText("C")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("b*")).toBeInTheDocument();
    expect(screen.getByText("c*")).toBeInTheDocument();
    expect(screen.getByText("d*")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("B")).toBeNull();
    expect(screen.queryByText("C")).toBeNull();
    expect(screen.queryByText("D")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("c*")).toBeInTheDocument();
    expect(screen.getByText("d*")).toBeInTheDocument();
    expect(screen.getByText("e*")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("C")).toBeNull();
    expect(screen.queryByText("D")).toBeNull();
    expect(screen.queryByText("E")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("d*")).toBeInTheDocument();
    expect(screen.getByText("e*")).toBeInTheDocument();
    expect(screen.getByText("f*")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("D")).toBeNull();
    expect(screen.queryByText("E")).toBeNull();
    expect(screen.queryByText("F")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("e*")).toBeInTheDocument();
    expect(screen.getByText("f*")).toBeInTheDocument();
    expect(screen.getByText("g*")).toBeInTheDocument();

    expect(screen.queryByText("E")).toBeNull();
    expect(screen.queryByText("F")).toBeNull();
    expect(screen.queryByText("G")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("f*")).toBeInTheDocument();
    expect(screen.getByText("g*")).toBeInTheDocument();

    expect(screen.queryByText("F")).toBeNull();
    expect(screen.queryByText("G")).toBeNull();

    fireEvent.click(screen.getByText(/next/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("f*")).toBeInTheDocument();
    expect(screen.getByText("g*")).toBeInTheDocument();

    expect(screen.queryByText("F")).toBeNull();
    expect(screen.queryByText("G")).toBeNull();

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("e*")).toBeInTheDocument();
    expect(screen.getByText("f*")).toBeInTheDocument();
    expect(screen.getByText("g*")).toBeInTheDocument();

    expect(screen.queryByText("E")).toBeNull();
    expect(screen.queryByText("F")).toBeNull();
    expect(screen.queryByText("G")).toBeNull();

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("d*")).toBeInTheDocument();
    expect(screen.getByText("e*")).toBeInTheDocument();
    expect(screen.getByText("f*")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("D")).toBeNull();
    expect(screen.queryByText("E")).toBeNull();
    expect(screen.queryByText("F")).toBeNull();

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("c*")).toBeInTheDocument();
    expect(screen.getByText("d*")).toBeInTheDocument();
    expect(screen.getByText("e*")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("C")).toBeNull();
    expect(screen.queryByText("D")).toBeNull();
    expect(screen.queryByText("E")).toBeNull();

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("b*")).toBeInTheDocument();
    expect(screen.getByText("c*")).toBeInTheDocument();
    expect(screen.getByText("d*")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("B")).toBeNull();
    expect(screen.queryByText("C")).toBeNull();
    expect(screen.queryByText("D")).toBeNull();

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("a*")).toBeInTheDocument();
    expect(screen.getByText("b*")).toBeInTheDocument();
    expect(screen.getByText("c*")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("A")).toBeNull();
    expect(screen.queryByText("B")).toBeNull();
    expect(screen.queryByText("C")).toBeNull();

    fireEvent.click(screen.getByText(/previous/i));

    expect(screen.getByText("a*")).toBeInTheDocument();
    expect(screen.getByText("b*")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
    expect(screen.getByText("D")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
    expect(screen.getByText("G")).toBeInTheDocument();

    expect(screen.queryByText("A")).toBeNull();
    expect(screen.queryByText("B")).toBeNull();
  });
});
